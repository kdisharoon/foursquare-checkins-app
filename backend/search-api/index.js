import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION || 'us-east-1';
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'FoursquareCheckins';

const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});

export const handler = async (event) => {
  // Lambda Function URL already handles CORS headers if configured in AWS console.
  // We only set Content-Type here to avoid duplicate headers error in browsers.
  const headers = {
    'Content-Type': 'application/json',
  };

  if (event.requestContext?.http?.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const queryParams = event.queryStringParameters || {};
    const {
      q,           // free text search across venue name, shout, city, category
      venueId,     // search specifically by venueId (uses GSI1)
      category,    // filter by category
      city,        // filter by city
      startDate,   // filter by unix timestamp
      endDate,     // filter by unix timestamp
      limit = '50',
      nextToken,
    } = queryParams;

    const limitNum = Math.min(parseInt(limit, 10) || 50, 250);

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
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          items: result.Items || [],
          nextToken: result.LastEvaluatedKey
            ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
            : null,
          count: (result.Items || []).length,
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        items: result.Items || [],
        nextToken: result.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
          : null,
        count: (result.Items || []).length,
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
