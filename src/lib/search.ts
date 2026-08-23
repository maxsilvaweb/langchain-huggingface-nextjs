'use client';

export interface ISearchable<T> {
  readonly id: string;
  readonly item: T;
  getHaystack(): string;
}

export interface IMatchStrategy {
  match(haystackTokens: readonly string[], queryTokens: readonly string[]): number;
}

export interface SearchResult<T> {
  readonly id: string;
  readonly item: T;
  readonly score: number;
}

export interface SearchResponse<T> {
  readonly results: SearchResult<T>[];
  readonly totalMatches: number;
}

const TOKEN_SPLIT = /[\s_\-./\\:;!?()[\]{}|@#$%^&*+=`~"'<>,]+/u;
const DIACRITIC_STRIP = /[\u0300-\u036f]/g;

export function tokenizeSearchText(value: string): string[] {
  if (!value) return [];

  const normalized = value
    .normalize('NFD')
    .replace(DIACRITIC_STRIP, '')
    .toLowerCase()
    .trim();

  if (!normalized) return [];

  return Array.from(new Set(normalized.split(TOKEN_SPLIT).filter(Boolean)));
}

class TokenMatchStrategy implements IMatchStrategy {
  match(
    haystackTokens: readonly string[],
    queryTokens: readonly string[],
  ): number {
    if (!haystackTokens.length || !queryTokens.length) return 0;

    let matchedTokens = 0;
    let score = 0;

    for (const queryToken of queryTokens) {
      let bestTokenScore = 0;

      for (const haystackToken of haystackTokens) {
        if (haystackToken === queryToken) {
          bestTokenScore = 1;
          break;
        }

        if (haystackToken.startsWith(queryToken)) {
          bestTokenScore = Math.max(bestTokenScore, 0.75);
          continue;
        }

        if (haystackToken.includes(queryToken)) {
          bestTokenScore = Math.max(bestTokenScore, 0.4);
        }
      }

      if (bestTokenScore > 0) {
        matchedTokens += 1;
        score += bestTokenScore;
      }
    }

    if (!matchedTokens) return 0;

    return score * (matchedTokens / queryTokens.length);
  }
}

export const defaultMatchStrategy: IMatchStrategy = new TokenMatchStrategy();

export class SearchIndex<T> {
  private readonly entries: ReadonlyArray<{
    readonly searchable: ISearchable<T>;
    readonly tokens: readonly string[];
  }>;

  constructor(
    searchables: ReadonlyArray<ISearchable<T>>,
    private readonly matcher: IMatchStrategy = defaultMatchStrategy,
  ) {
    this.entries = searchables.map((searchable) => ({
      searchable,
      tokens: tokenizeSearchText(searchable.getHaystack()),
    }));
  }

  static fromItems<T>(
    items: ReadonlyArray<T>,
    adapter: (item: T) => ISearchable<T>,
    matcher?: IMatchStrategy,
  ): SearchIndex<T> {
    return new SearchIndex(items.map(adapter), matcher);
  }

  get size(): number {
    return this.entries.length;
  }

  search(query: string, limit = Number.POSITIVE_INFINITY): SearchResponse<T> {
    const queryTokens = tokenizeSearchText(query);

    if (!queryTokens.length) {
      return {
        results: this.entries.slice(0, limit).map(({ searchable }) => ({
          id: searchable.id,
          item: searchable.item,
          score: 1,
        })),
        totalMatches: this.entries.length,
      };
    }

    const matches: SearchResult<T>[] = [];

    for (const entry of this.entries) {
      const score = this.matcher.match(entry.tokens, queryTokens);

      if (score > 0) {
        matches.push({
          id: entry.searchable.id,
          item: entry.searchable.item,
          score,
        });
      }
    }

    matches.sort((a, b) => b.score - a.score);

    return {
      results: matches.slice(0, limit),
      totalMatches: matches.length,
    };
  }
}
