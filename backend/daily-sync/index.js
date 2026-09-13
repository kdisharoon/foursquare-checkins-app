import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import axios from 'axios';

const REGION = process.env.AWS_REGION || 'us-east-1';
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'FoursquareCheckins';

const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});
const ssmClient = new SSMClient({ region: REGION });

async function getFoursquareToken() {
  const ssmResponse = await ssmClient.send(
    new GetParameterCommand({
      Name: '/foursquare/oauth_token',
      WithDecryption: true,
    })
  );
  return ssmResponse.Parameter?.Value;
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

export const handler = async (event) => {
  console.log('Starting Foursquare daily sync...');
  const token = await getFoursquareToken();
  if (!token) {
    throw new Error('Foursquare OAuth token not found in SSM');
  }

  // Calculate timestamp for 48 hours ago
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const afterTimestamp = nowInSeconds - (48 * 60 * 60);
  const fortyEightHoursDate = new Date(afterTimestamp * 1000).toISOString();
  console.log(`Fetching check-ins created after ${fortyEightHoursDate} (last 48 hours)...`);

  // Fetch check-ins from the last 48 hours (newest first)
  const url = `https://api.foursquare.com/v2/users/self/checkins?oauth_token=${token}&v=20231201&afterTimestamp=${afterTimestamp}&limit=250&sort=newestfirst`;
  const res = await axios.get(url);
  const checkins = res.data?.response?.checkins?.items || [];

  console.log(`Fetched ${checkins.length} check-ins from the last 48 hours.`);
  let newCount = 0;

  for (const checkin of checkins) {
    const item = formatCheckinItem(checkin);
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );
    newCount++;
  }

  console.log(`Successfully synced ${newCount} check-ins into ${TABLE_NAME}.`);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Synced ${newCount} check-ins from the last 48 hours`,
      count: newCount,
    }),
  };
};
