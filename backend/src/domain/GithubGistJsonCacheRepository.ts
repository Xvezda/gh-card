export interface GitHubGistJsonCacheRepository {
  cache (gistId: string, jsonString: string): void;
  get (gistId: string): Promise<string | undefined>;
}
