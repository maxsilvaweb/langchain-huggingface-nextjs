'use client';

import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

type AppPaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** Shown next to the controls, e.g. "12 documents" */
  summary?: string;
};

function getVisiblePages(page: number, pageCount: number): (number | 'ellipsis')[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];

  if (page > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);

  for (let p = start; p <= end; p += 1) {
    pages.push(p);
  }

  if (page < pageCount - 2) {
    pages.push('ellipsis');
  }

  pages.push(pageCount);
  return pages;
}

/**
 * Controlled pagination built on shadcn Pagination primitives.
 * Uses buttons (not links) so it works for client-side list paging.
 */
export function AppPagination({
  page,
  pageCount,
  onPageChange,
  className,
  summary,
}: AppPaginationProps) {
  if (pageCount <= 1) return null;

  const visible = getVisiblePages(page, pageCount);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-3 sm:flex-row',
        className,
      )}
    >
      {summary ? (
        <p className="text-xs text-white/40 order-2 sm:order-1">{summary}</p>
      ) : (
        <span className="order-2 sm:order-1" />
      )}

      <Pagination className="mx-0 w-auto order-1 sm:order-2">
        <PaginationContent>
          <PaginationItem>
            <Button
              type="button"
              variant="ghost"
              size="default"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="gap-1 px-2.5 cursor-pointer text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-40"
              aria-label="Go to previous page"
            >
              <ChevronLeftIcon className="size-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
          </PaginationItem>

          {visible.map((item, index) =>
            item === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis className="text-white/40" />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <Button
                  type="button"
                  variant={item === page ? 'outline' : 'ghost'}
                  size="icon"
                  onClick={() => onPageChange(item)}
                  aria-current={item === page ? 'page' : undefined}
                  className={cn(
                    'cursor-pointer',
                    item === page
                      ? 'border-emerald-700/50 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/50 hover:text-emerald-100'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                  )}
                >
                  {item}
                </Button>
              </PaginationItem>
            ),
          )}

          <PaginationItem>
            <Button
              type="button"
              variant="ghost"
              size="default"
              disabled={page >= pageCount}
              onClick={() => onPageChange(page + 1)}
              className="gap-1 px-2.5 cursor-pointer text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-40"
              aria-label="Go to next page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRightIcon className="size-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
