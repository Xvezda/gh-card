import * as redis from 'redis';

import { GitHubRepositoryJsonCacheRepository } from '../domain/GitHubRepositoryJsonCacheRepository';
import { RedisGitHubRepositoryJsonCacheRepository } from './RedisGitHubRepositoryJsonCacheRepository';

export class RedisGitHubGistJsonCacheRepository
    extends RedisGitHubRepositoryJsonCacheRepository
    implements GitHubRepositoryJsonCacheRepository {
  constructor (protected readonly redisClient: redis.RedisClient, protected readonly ttlSec: number) {
    super(redisClient, ttlSec);
  }

  cache (gistId: string, json: string): void {
    super.cache(gistId, json);
  }

  async get (gistId: string): Promise<string | undefined> {
    return super.get(gistId);
  }
}
