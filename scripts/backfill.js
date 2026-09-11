import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('backfill.env')) {
  dotenv.config({ path: 'backfill.env' });
} else {
  dotenv.config();
}

const REGION = process.env.AWS_REGION || 'us-east-1';
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'FoursquareCheckins';

const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
const ssmClient = new SSMClient({ region: REGION });

async function getFoursquareToken() {
  if (process.env.FOURSQUARE_OAUTH_TOKEN) {
    console.log('Using Foursquare OAuth token from environment variables.');
    return process.env.FOURSQUARE_OAUTH_TOKEN;
  }
  console.log('Fetching Foursquare OAuth token from SSM Parameter Store (/foursquare/oauth_token)...');
  try {
    const ssmResponse = await ssmClient.send(
      new GetParameterCommand({
        Name: '/foursquare/oauth_token',
        WithDecryption: true,
      })
    );
    return ssmResponse.Parameter?.Value;
  } catch (err) {
    console.error('Could not retrieve token from SSM. Please ensure either AWS credentials are configured or FOURSQUARE_OAUTH_TOKEN is in .env');
    throw err;
  }
}

function formatCheckinItem(checkin) {
  const venue = checkin.venue || {};
  const location = venue.location || {};
  const categories = venue.categories || [];
  const primaryCategory = categories.find((c) => c.primary) || categories[0] || {};

  return {
    PK: `CHECKIN#${checkin.id}`,
    SK: `TIMESTAMP#${checkin.createdAt}`,
    GSI1PK: venue.id ? `VENUE#${venue.id}` : 'VENUE#NONE',
    GSI1SK: `TIMESTAMP#${checkin.createdAt}`,
    id: checkin.id,
    createdAt: checkin.createdAt,
    venueId: venue.id || null,
    venueName: venue.name || 'Unknown Venue',
    city: location.city || location.state || null,
    country: location.country || null,
    category: primaryCategory.name || null,
    categoryId: primaryCategory.id || null,
    lat: location.lat || (checkin.location ? checkin.location.lat : null),
    lng: location.lng || (checkin.location ? checkin.location.lng : null),
    shout: checkin.shout || null,
    hasPhotos: Boolean(checkin.photos && checkin.photos.count > 0),
    // CRITICAL: Full raw Foursquare API payload preserved intact
    raw_data: checkin,
  };
}

async function batchWriteItems(items) {
  const chunkSize = 25; // DynamoDB limit per BatchWriteItem
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const putRequests = chunk.map((item) => ({
      PutRequest: { Item: item },
    }));

    let params = {
      RequestItems: {
        [TABLE_NAME]: putRequests,
      },
    };

    let retries = 0;
    while (params.RequestItems && Object.keys(params.RequestItems).length > 0) {
      const response = await docClient.send(new BatchWriteCommand(params));
      const unprocessed = response.UnprocessedItems;
      if (unprocessed && unprocessed[TABLE_NAME] && unprocessed[TABLE_NAME].length > 0) {
        retries++;
        console.log(`  [Batch Retry] Retrying ${unprocessed[TABLE_NAME].length} unprocessed items (attempt #${retries})...`);
        await new Promise((r) => setTimeout(r, Math.min(1000 * Math.pow(2, retries), 8000)));
        params = { RequestItems: unprocessed };
      } else {
        break;
      }
    }
  }
}

async function runBackfill() {
  console.log('=== Starting Full Foursquare Check-in Backfill ===');
  const token = await getFoursquareToken();
  if (!token) {
    throw new Error('Foursquare OAuth token is missing.');
  }

  const limit = 250;
  let beforeTimestamp = undefined;
  let totalSaved = 0;
  let totalAvailable = null;
  const seenIds = new Set();

  while (true) {
    let url = `https://api.foursquare.com/v2/users/self/checkins?oauth_token=${token}&v=20231201&limit=${limit}&sort=newestfirst`;
    if (beforeTimestamp) {
      url += `&beforeTimestamp=${beforeTimestamp}`;
    }

    try {
      const res = await axios.get(url);
      const data = res.data?.response?.checkins;
      if (!data) {
        console.error('Unexpected response structure:', res.data);
        break;
      }

      if (totalAvailable === null) {
        totalAvailable = data.count || 0;
        console.log(`Total check-ins reported by Foursquare: ${totalAvailable.toLocaleString()}`);
      }

      const items = data.items || [];
      if (items.length === 0) {
        console.log('No more check-ins returned by API.');
        break;
      }

      const newItems = items.filter((item) => !seenIds.has(item.id));
      newItems.forEach((item) => seenIds.add(item.id));

      if (newItems.length > 0) {
        const formatted = newItems.map(formatCheckinItem);
        await batchWriteItems(formatted);
        totalSaved += formatted.length;
      }

      const oldestInBatch = items[items.length - 1];
      const oldestDate = new Date(oldestInBatch.createdAt * 1000).toISOString().split('T')[0];
      const pct = totalAvailable > 0 ? ((totalSaved / totalAvailable) * 100).toFixed(1) : '100';

      console.log(`  [Batch] Saved ${totalSaved.toLocaleString()}/${totalAvailable.toLocaleString()} (${pct}%) — Reached date: ${oldestDate}`);

      // Update beforeTimestamp to oldest item in batch for the next page
      beforeTimestamp = oldestInBatch.createdAt;

      if (items.length < limit) {
        console.log('Reached the earliest check-in in history!');
        break;
      }

      // 80ms pause to respect API rate limits
      await new Promise((r) => setTimeout(r, 80));
    } catch (err) {
      console.error(`Error during fetch at beforeTimestamp ${beforeTimestamp}:`, err.response?.data || err.message);
      throw err;
    }
  }

  console.log(`\n=== Backfill Complete: ${totalSaved.toLocaleString()} total check-ins written to DynamoDB! ===`);
}

runBackfill().catch((err) => {
  console.error('Fatal backfill error:', err);
  process.exit(1);
});
