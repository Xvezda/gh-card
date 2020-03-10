import * as dotenv from 'dotenv';
import * as yargs from 'yargs';
import * as log4js from 'log4js';
import * as redis from 'redis';

import { RedisGitHubGistJsonCacheRepository } from './infra/RedisGitHubGistJsonCacheRepository';
// import { RedisGitHubRepositoryJsonCacheRepository } from './infra/RedisGitHubRepositoryJsonCacheRepository';
import { DefaultGitHubApiService } from './infra/DefaultGitHubApiService';
import { RedisGitHubRepositoryPngCardCacheRepository } from './infra/RedisGitHubRepositoryPngCardCacheRepository';
import { createServer } from './route';
import { GithubCredentialType } from './types';


// Load configuration
dotenv.config();

// Create option parser
const parser = yargs
  .option('redis-host', {
    describe: 'Redis host',
    default: 'localhost'
  })
  .option('github-client-id', {
    describe: 'GitHub Client ID',
    type: 'string'
  })
  .option('github-client-secret', {
    describe: 'GitHub Client Secret',
    type: 'string'
  })
  .option('github-oauth-token', {
    describe: 'Github OAuth Token',
    type: 'string'
  });

// Create a logger
const logger = log4js.getLogger();
logger.level = 'info';

// Parse arguments
const args = parser.parse(process.argv);
const redisHost: string = args['redis-host'];
const githubClientId: string | undefined = process.env.GITHUB_CLIENT_ID || args['github-client-id'];
const githubClientSecret: string | undefined = process.env.GITHUB_CLIENT_SECRET || args['github-client-secret'];
const githubOauthToken: string | undefined = process.env.GITHUB_OAUTH_TOKEN || args['github-oauth-token'];
let githubCredential: GithubCredentialType | undefined;

if (githubClientId !== undefined && githubClientSecret !== undefined) {
  githubCredential = {
    githubClientId,
    githubClientSecret
  };
} else if (githubOauthToken !== undefined) {
  githubCredential = {
    githubOauthToken
  };
} else {
  logger.info('GitHub credentials art not set');
}

const redisClient = redis.createClient({
  host: redisHost
});

const gitHubRepositoryJsonCacheRepository = new RedisGitHubGistJsonCacheRepository(
  redisClient,
  // 20 min
  // TODO: Hard code
  20 * 60
);
const gitHubRepositoryPngCardCacheRepository = new RedisGitHubRepositoryPngCardCacheRepository(
  redisClient,
  // 20 min
  // TODO: Hard code
  20 * 60
);
const gitHubApiService = new DefaultGitHubApiService(
  logger,
  githubCredential,
  gitHubRepositoryJsonCacheRepository
);
const server = createServer({
  logger,
  gitHubApiService,
  gitHubRepositoryPngCardCacheRepository
});

// TODO: hard code
const httpPort = 8080;
server.listen(httpPort, () => {
  logger.info(`Listening on ${httpPort}...`);
});
