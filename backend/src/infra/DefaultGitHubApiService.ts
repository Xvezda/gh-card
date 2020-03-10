import * as log4js from 'log4js';
import fetch from 'node-fetch';
import { Readable } from 'stream';
import * as getStream from 'get-stream';
import * as FirstChunkStream from 'first-chunk-stream';
import { imageSize as sizeOf } from 'image-size';
const resizeImg = require('resize-img');
import { partialParse } from 'partial-json-parser';
import { isLeft } from 'fp-ts/lib/Either';

import { GitHubApiService } from '../domain/GitHubApiService';
import { GitHubRepositoryJsonCacheRepository } from '../domain/GitHubRepositoryJsonCacheRepository';
import { GitHubGistJsonCacheRepository } from '../domain/GitHubGistJsonCacheRepository';
import { GithubGistJson, githubGistJsonType, GithubRepoJson, githubRepoJsonType, GithubCredentialType } from '../types';

export class DefaultGitHubApiService implements GitHubApiService {
  constructor (
    private readonly logger: log4js.Logger,
    private readonly githubCredential: GithubCredentialType | undefined,
    private readonly gitHubRepositoryJsonCacheRepository: GitHubRepositoryJsonCacheRepository) {}

  async getRepository (repoName: string): Promise<{repo: GithubRepoJson} | {status: number, resText: string}> {
    let jsonStr: string | undefined = await this.gitHubRepositoryJsonCacheRepository.get(repoName);
    if (jsonStr === undefined) {
      this.logger.info(`Repository JSON ${repoName} is not cached`);

      let query = '';
      const headers = (() => {
        if (this.githubCredential === undefined) {
          return {};
        } else {
          if (this.githubCredential.githubOauthToken) {
            const { githubOauthToken } = this.githubCredential;
            const h: {[key: string]: string} = {
              'Authorization': `token ${githubOauthToken}`
            };
            return h;
          } else {
            const { githubClientId, githubClientSecret } = this.githubCredential;
            const h: {[key: string]: string} = {
              // Basic Auth
              'Authorization': `Basic: ${Buffer.from(`${githubClientId}:${githubClientSecret}`).toString('base64')}`
            };
            query = `?client_id=${githubClientId}&client_secret=${githubClientSecret}`;
            return h;
          }
        }
      })();

      const githubRes = await fetch(`https://api.github.com/repos/${repoName}${query}`, {
        headers
      });
      if (githubRes.status !== 200) {
        return {
          status: githubRes.status,
          resText: await githubRes.text()
        };
      }
      jsonStr = await githubRes.text();
      // Cache
      this.gitHubRepositoryJsonCacheRepository.cache(repoName, jsonStr);
    }

    const githubRepoJsonEither = githubRepoJsonType.decode(JSON.parse(jsonStr));
    if (isLeft(githubRepoJsonEither)) {
      throw githubRepoJsonEither.left;
    }
    const githubRepoJson = githubRepoJsonEither.right;
    return {
      repo: githubRepoJson
    };
  }

  async getGist (gistId: string): Promise<{gist: GithubGistJson} | {status: number, resText: string}> {
    let jsonStr: string | undefined = await this.gitHubRepositoryJsonCacheRepository.get(gistId);
    if (jsonStr === undefined) {
      this.logger.info(`Gist JSON ${gistId} is not cached`);

      let query = '';
      const headers = (() => {
        if (this.githubCredential === undefined) {
          return {};
        } else {
          if (this.githubCredential.githubOauthToken) {
            const { githubOauthToken } = this.githubCredential;
            const h: {[key: string]: string} = {
              'Authorization': `token ${githubOauthToken}`
            };
            return h;
          } else {
            const { githubClientId, githubClientSecret } = this.githubCredential;
            const h: {[key: string]: string} = {
              // Basic Auth
              'Authorization': `Basic: ${Buffer.from(`${githubClientId}:${githubClientSecret}`).toString('base64')}`
            };
            query = `?client_id=${githubClientId}&client_secret=${githubClientSecret}`;
            return h;
          }
        }
      })();

      // Prevent content from escaping
      headers['Accept'] = 'application/vnd.github.v3.base64+json';

      const githubRes = await fetch(`https://api.github.com/gists/${gistId}${query}`, {
        headers,
      });

      if (githubRes.status !== 200) {
        return {
          status: githubRes.status,
          resText: await githubRes.text()
        };
      }

      const jsonStream = githubRes.body
        .pipe(new FirstChunkStream({
          chunkSize: 1024 /* 1KB */
        }, async (chunk, encoding) => {
          return chunk.toString();
        }));

      // const jsonRes = await githubRes.text();
      const jsonRes = await getStream(jsonStream);
      const jsonData = partialParse(jsonRes);
      let fileData = jsonData.files[(Object.keys(jsonData.files).shift() as string)];
      fileData.image = false;

      if (fileData.type === 'image/gif') {
        return {
          status: 400,
          resText: 'Sorry, GIF image is not supported'
        };
      }

      jsonStr = await (async () => {
        // Set image binary content to undefined when stringify
        // Also, set dimensions which needed by IE, Firefox environment.
        if (fileData.type.startsWith('image')) {

          const imageRes = await fetch(fileData.raw_url);
          const imageBuffer = await imageRes.buffer();

          fileData.image = true;

          // TODO: hardcoded
          const imageMaxHeight = 100;
          const imageMaxWidth = 390;

          const calcWidthRatio = (height: number) => {
            return ((height - (height-imageMaxHeight)) / height);
          };

          const imageDimensions = sizeOf(imageBuffer);
          if (imageDimensions.height !== undefined && imageDimensions.width !== undefined) {
            const overflow = imageDimensions.height > imageMaxHeight;
            fileData.image_height = overflow ? imageMaxHeight : imageDimensions.height;
            fileData.image_width = overflow
              ? imageDimensions.width * calcWidthRatio(imageDimensions.height)
              : imageDimensions.width;
            const resizedImage = await resizeImg(imageBuffer, {
              width: fileData.image_width,
              height: fileData.image_height
            });
            fileData.content = `data:${fileData.type};base64,${resizedImage.toString('base64')}`;
          }

          /*
          if (fileData.type === 'image/gif') {
            return {
              status: 400,
              resText: 'Sorry, GIF image is not supported'
            };
            const frameData = await gifFrames({
              url: 'data:image/gif;base64,'.concat(fileData.content.replace(/\n/g, '')),
              frames: 0
            })
            fileData.content = Buffer.from(frameData[0].getImage(), 'utf8').toString('base64');
          } else {
            fileData.content = undefined;
          }
          */
         // fileData.content = undefined;
        }
        return JSON.stringify(fileData);
      })();
      // Cache
      this.gitHubRepositoryJsonCacheRepository.cache(gistId, jsonStr);
    }

    const githubGistJsonEither = githubGistJsonType.decode(JSON.parse(jsonStr));
    if (isLeft(githubGistJsonEither)) {
      throw githubGistJsonEither.left;
    }
    const githubGistJson = githubGistJsonEither.right;
    return {
      gist: githubGistJson
    };
  }
}
