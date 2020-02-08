import * as t from 'io-ts';
import { isLeft } from 'fp-ts/lib/Either';
import * as express from 'express';
import * as log4js from "log4js";
import {renderToString} from 'react-dom/server';

import {GitHubApiService} from './domain/GitHubApiService';
import {generateSvg} from './svg-generator';


const repoWithExtType = t.type({
  ownerName: t.string,
  shortRepoName: t.string,
  extension: t.string
});
type RepoWithExt = t.TypeOf<typeof repoWithExtType>;

const repoRequestQueryType = t.type({
  fullname: t.union([t.string, t.undefined]),
  link_target: t.union([t.string, t.undefined]),
});

export function createServer({logger, gitHubApiService}: {logger: log4js.Logger, gitHubApiService: GitHubApiService}) {
  const app = express();

  app.get('/', (req, res) => {
    res.send("e.g. /repos/rust-lang/rust.svg");
  });

  app.get('/repos/:ownerName/:shortRepoName.:extension', async (req, res) => {
    const repoWithExtEither = repoWithExtType.decode(req.params);
    if (isLeft(repoWithExtEither)) {
      res.status(400);
      res.send('invalid request');
      return;
    }
    const repoWithExt = repoWithExtEither.right;
    logger.info(`valid request: ${JSON.stringify(repoWithExt)}`);
    const {ownerName, shortRepoName, extension} = repoWithExt;

    // Validate query
    const repoRequestQueryEither = repoRequestQueryType.decode(req.query);
    if (isLeft(repoRequestQueryEither)) {
      res.status(400);
      res.send('invalid query parameter');
      return;
    }
    const repoRequestQuery = repoRequestQueryEither.right;
    const usesFullName: boolean = repoRequestQuery.fullname !== undefined;
    const linkTarget: string = repoRequestQuery.link_target ?? "";

    const repoResult = await gitHubApiService.getRepository(`${ownerName}/${shortRepoName}`);

    if ("status" in repoResult) {
      if (repoResult.status === 404) {
        res.status(404);
        res.send(`${ownerName}/${shortRepoName} not found\n`);
        return;
      }
      res.status(400);
      res.send("Error in GitHub API\n");
      return;
    }
    // TODO: cache
    const githubRepoJson = repoResult.repo;

    // TODO: handle .png
    const svg = generateSvg({
      ownerName,
      shortRepoName,
      usesFullName,
      linkTarget,
      language: githubRepoJson.language,
      description: githubRepoJson.description ?? "",
      nStars: githubRepoJson.stargazers_count,
      nForks: githubRepoJson.forks_count,
    });

    const svgString: string = renderToString(svg);

    res.header({
      'Content-Type': 'image/svg+xml',
    });
    res.send(svgString);
  });

  return app;
}
