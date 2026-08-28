import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

export interface UsageStatsStore {
  increment(): Promise<number>;
}

let cachedStore: { tableName: string; store: UsageStatsStore } | undefined;

/**
 * Creates the anonymous, aggregate-only command counter used by !통계.
 * The single DynamoDB item contains no room, sender, or message data.
 */
export function createDynamoUsageStatsStore(
  tableName: string | undefined,
  region = 'ap-northeast-1',
): UsageStatsStore | undefined {
  const normalizedTableName = tableName?.trim();
  if (!normalizedTableName) return undefined;
  if (cachedStore?.tableName === normalizedTableName) return cachedStore.store;

  const client = new DynamoDBClient({ region });
  const store: UsageStatsStore = {
    async increment(): Promise<number> {
      const result = await client.send(
        new UpdateItemCommand({
          TableName: normalizedTableName,
          Key: { id: { S: 'TOTAL' } },
          UpdateExpression: 'ADD #total :one SET #updatedAt = :now',
          ExpressionAttributeNames: {
            '#total': 'total',
            '#updatedAt': 'updatedAt',
          },
          ExpressionAttributeValues: {
            ':one': { N: '1' },
            ':now': { S: new Date().toISOString() },
          },
          ReturnValues: 'UPDATED_NEW',
        }),
      );
      const total = Number(result.Attributes?.total?.N ?? NaN);
      if (!Number.isSafeInteger(total) || total < 1) throw new Error('USAGE_STATS_INVALID');
      return total;
    },
  };
  cachedStore = { tableName: normalizedTableName, store };
  return store;
}
