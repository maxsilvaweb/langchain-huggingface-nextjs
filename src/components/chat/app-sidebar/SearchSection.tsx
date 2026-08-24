'use client';

import * as React from 'react';
import { SearchInput } from '@/components/ui/search-input';
import {
  SIDEBAR_LABEL_NO_SEARCH_RESULTS,
  getSidebarSearchResultsLabel,
} from '@/lib/locale';
import { SIDEBAR_SEARCH_PLACEHOLDER } from '@/lib/globals';

interface SearchSectionProps {
  value: string;
  onChange: (next: string) => void;
  onClear: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isSearching: boolean;
  isEmpty: boolean;
  totalMatches?: number | null;
}

export function SearchSection({
  value,
  onChange,
  onClear,
  inputRef,
  isSearching,
  isEmpty,
  totalMatches,
}: SearchSectionProps) {
  return (
    <div className="px-4 pb-2 pt-1">
      <SearchInput
        value={value}
        onChange={onChange}
        onClear={onClear}
        inputRef={inputRef}
        placeholder={SIDEBAR_SEARCH_PLACEHOLDER}
      />
      {isSearching ? (
        <div className="mt-1 px-1 text-[10px] font-medium uppercase tracking-wider text-white/35">
          {isEmpty
            ? SIDEBAR_LABEL_NO_SEARCH_RESULTS
            : getSidebarSearchResultsLabel(totalMatches ?? 0)}
        </div>
      ) : null}
    </div>
  );
}
