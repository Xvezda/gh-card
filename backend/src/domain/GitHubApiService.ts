import { GithubGistJson, GithubRepoJson } from '../types';

export interface GitHubApiService {
  /**
   * Get GitHub repository JSON via GitHub API
   * @param repoName owner/repo
   */
  getRepository (repoName: string): Promise<{repo: GithubRepoJson} | {status: number, resText: string}>;
  getGist (gistId: string): Promise<{gist: GithubGistJson} | {status: number, resText: string}>;
}
