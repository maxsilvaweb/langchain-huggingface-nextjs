'use client';

import * as React from 'react';
import {
  defaultMatchStrategy,
  SearchIndex,
  type IMatchStrategy,
  type ISearchable,
  type SearchResult,
} from '@/lib/search';
import { debounce } from '@/lib/utils';

interface UseSearchableListOptions<T> {
  items: T[] | undefined;
  adapter: (item: T) => ISearchable<T>;
  debounceMs?: number;
  maxVisibleResults?: number;
  minQueryLength?: number;
  matcher?: IMatchStrategy;
}

interface UseSearchableListState<T> {
  rawQuery: string;
  query: string;
  results: SearchResult<T>[] | undefined;
  displayItems: T[] | undefined;
  totalMatches: number | undefined;
  isSearching: boolean;
  isEmpty: boolean;
  setQuery: (next: string) => void;
  reset: () => void;
}

export function useSearchableList<T>({
  items,
  adapter,
  debounceMs = 120,
  maxVisibleResults = Number.POSITIVE_INFINITY,
  minQueryLength = 1,
  matcher = defaultMatchStrategy,
}: UseSearchableListOptions<T>): UseSearchableListState<T> {
  const [rawQuery, setRawQuery] = React.useState('');
  const [query, setQueryInner] = React.useState('');

  const scheduleQuery = React.useMemo(
    () => debounce((next: string) => setQueryInner(next), debounceMs),
    [debounceMs],
  );

  const setQuery = React.useCallback(
    (next: string) => {
      setRawQuery(next);
      scheduleQuery(next);
    },
    [scheduleQuery],
  );

  const reset = React.useCallback(() => {
    setRawQuery('');
    setQueryInner('');
  }, []);

  const index = React.useMemo(() => {
    if (!items) return undefined;
    return SearchIndex.fromItems(items, adapter, matcher);
  }, [adapter, items, matcher]);

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length >= minQueryLength;

  const searchResponse = React.useMemo(() => {
    if (!index || !isSearching) return undefined;
    return index.search(trimmedQuery, maxVisibleResults);
  }, [index, isSearching, maxVisibleResults, trimmedQuery]);

  const results = searchResponse?.results;
  const totalMatches = searchResponse?.totalMatches;

  const displayItems = React.useMemo(() => {
    if (!items) return undefined;
    if (!isSearching) return items;
    return results?.map((result) => result.item) ?? [];
  }, [isSearching, items, results]);

  return {
    rawQuery,
    query,
    results,
    displayItems,
    totalMatches,
    isSearching,
    isEmpty: isSearching && totalMatches === 0,
    setQuery,
    reset,
  };
}
