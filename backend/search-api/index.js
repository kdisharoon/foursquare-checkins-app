import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import zlib from 'zlib';

const REGION = process.env.AWS_REGION || 'us-east-1';
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'FoursquareCheckins';

const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (event.requestContext?.http?.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const queryParams = event.queryStringParameters || {};
    const {
      id,          // fetch single checkin with full raw_data
      all,         // if 'true', scan all items in database (parallel segment scan + gzip)
      q,           // free text search across venue name, shout, city, category
      venueId,     // search specifically by venueId (uses GSI1)
      category,    // filter by category
      city,        // filter by city
      startDate,   // filter by unix timestamp
      endDate,     // filter by unix timestamp
      limit = '250',
      nextToken,
    } = queryParams;

    // Single item lookup with full raw_data (e.g. for modal details and photos)
    if (id) {
      const cleanId = id.replace(/^CHECKIN#/, '');
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'PK = :pk',
          ExpressionAttributeValues: {
            ':pk': `CHECKIN#${cleanId}`,
          },
        })
      );

      const item = result.Items?.[0];
      if (!item) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Check-in not found' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(item),
      };
    }

    // Fast parallel scan: fetch all items with lightweight projection and gzip compression
    if (all === 'true') {
      const totalSegments = 4;
      const scanSegment = async (segment) => {
        let items = [];
        let lastKey = undefined;
        do {
          const res = await docClient.send(
            new ScanCommand({
              TableName: TABLE_NAME,
              TotalSegments: totalSegments,
              Segment: segment,
              ExclusiveStartKey: lastKey,
              ProjectionExpression:
                'id, PK, SK, venueName, venueId, city, country, category, categoryId, createdAt, lat, lng, hasPhotos, shout',
            })
          );
          if (res.Items) items.push(...res.Items);
          lastKey = res.LastEvaluatedKey;
        } while (lastKey);
        return items;
      };

      const results = await Promise.all([0, 1, 2, 3].map(scanSegment));
      const allItems = results.flat();

      // Sort newest first (reverse chronological order)
      allItems.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));

      const payload = JSON.stringify({
        items: allItems,
        total: allItems.length,
      });

      const gzipped = zlib.gzipSync(Buffer.from(payload, 'utf8'));

      return {
        statusCode: 200,
        isBase64Encoded: true,
        headers: {
          'Content-Type': 'application/json',
          'Content-Encoding': 'gzip',
        },
        body: gzipped.toString('base64'),
      };
    }

    const limitNum = Math.min(parseInt(limit, 10) || 50, 1000);

    // If querying by specific venueId, use fast GSI1 query
    if (venueId) {
      const queryParams = {
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :gsi1pk',
        ExpressionAttributeValues: {
          ':gsi1pk': `VENUE#${venueId}`,
        },
        ScanIndexForward: false, // Newest first
        Limit: limitNum,
      };

      if (nextToken) {
        queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString('utf8'));
      }

      const result = await docClient.send(new QueryCommand(queryParams));
      const sorted = (result.Items || []).sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          items: sorted,
          nextToken: result.LastEvaluatedKey
            ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
            : null,
          count: sorted.length,
        }),
      };
    }

    // Otherwise, perform scan with filter expressions
    let filterExpressions = [];
    let expressionAttributeValues = {};
    let expressionAttributeNames = {};

    if (category) {
      filterExpressions.push('#cat = :category');
      expressionAttributeNames['#cat'] = 'category';
      expressionAttributeValues[':category'] = category;
    }

    if (city) {
      filterExpressions.push('#city = :city');
      expressionAttributeNames['#city'] = 'city';
      expressionAttributeValues[':city'] = city;
    }

    if (startDate) {
      filterExpressions.push('#createdAt >= :startDate');
      expressionAttributeNames['#createdAt'] = 'createdAt';
      expressionAttributeValues[':startDate'] = parseInt(startDate, 10);
    }

    if (endDate) {
      filterExpressions.push('#createdAt <= :endDate');
      expressionAttributeNames['#createdAt'] = 'createdAt';
      expressionAttributeValues[':endDate'] = parseInt(endDate, 10);
    }

    if (q) {
      filterExpressions.push(
        '(contains(#venueName, :q) OR contains(#shout, :q) OR contains(#city, :q) OR contains(#cat, :q))'
      );
      expressionAttributeNames['#venueName'] = 'venueName';
      expressionAttributeNames['#shout'] = 'shout';
      expressionAttributeNames['#city'] = 'city';
      expressionAttributeNames['#cat'] = 'category';
      expressionAttributeValues[':q'] = q;
    }

    const scanParams = {
      TableName: TABLE_NAME,
      Limit: limitNum,
    };

    if (filterExpressions.length > 0) {
      scanParams.FilterExpression = filterExpressions.join(' AND ');
      scanParams.ExpressionAttributeValues = expressionAttributeValues;
      scanParams.ExpressionAttributeNames = expressionAttributeNames;
    }

    if (nextToken) {
      scanParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString('utf8'));
    }

    const result = await docClient.send(new ScanCommand(scanParams));
    const sorted = (result.Items || []).sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        items: sorted,
        nextToken: result.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
          : null,
        count: sorted.length,
      }),
    };
  } catch (err) {
    console.error('Search API Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal Server Error' }),
    };
  }
};
