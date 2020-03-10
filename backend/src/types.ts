import * as t from 'io-ts';

export interface GithubCredentialType {
  githubClientId?: string;
  githubClientSecret?: string;
  githubOauthToken?: string;
}

export const githubGistJsonType = t.type({
  filename: t.string,
  language: t.union([t.string, t.null]),
  type: t.string,
  content: t.string,
  image: t.boolean,
  image_width: t.union([t.number, t.undefined]),
  image_height: t.union([t.number, t.undefined])
});
export type GithubGistJson = t.TypeOf<typeof githubGistJsonType>;

// NOTE: You can define fields more if need
//       (see: https://developer.github.com/v3/repos/#response-5)
export const githubRepoJsonType = t.type({
  description: t.union([t.string, t.undefined]),
  language: t.union([t.string, t.undefined]),
  stargazers_count: t.number,
  forks_count: t.number,
  fork: t.boolean
});
export type GithubRepoJson = t.TypeOf<typeof githubRepoJsonType>;
