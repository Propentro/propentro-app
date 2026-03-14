'use client';

import { type Table as ReactTableType } from '@tanstack/react-table';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROW_PER_PAGE_OPTIONS } from '@/config/constants';
import { cn } from '@/lib/utils';

interface DataTablePaginationProps<TData> {
  table: ReactTableType<TData>;
  showSelectedCount?: boolean;
  className?: string;
}

export function DataTablePagination<TData>({
  table,
  showSelectedCount = false,
  className,
}: DataTablePaginationProps<TData>) {
  const t = useTranslations('common.table');

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground hidden text-sm sm:block">
          {t('rowsPerPage')}
        </span>
        <Select
          value={table.getState().pagination.pageSize}
          onValueChange={(value) => table.setPageSize(Number(value))}
        >
          <SelectTrigger size="sm" className="w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start" alignItemWithTrigger={false}>
            {ROW_PER_PAGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showSelectedCount && (
        <span className="text-muted-foreground hidden text-sm lg:block">
          {t('selectedCount', {
            selected: table.getFilteredSelectedRowModel().rows.length,
            total: table.getFilteredRowModel().rows.length,
          })}
        </span>
      )}

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground hidden text-sm xl:block">
          {t('pageOf', {
            page: table.getState().pagination.pageIndex + 1,
            total: table.getPageCount(),
          })}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label={t('firstPage')}
          >
            <ChevronsLeftIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label={t('previousPage')}
          >
            <ChevronLeftIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label={t('nextPage')}
          >
            <ChevronRightIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.lastPage()}
            disabled={!table.getCanNextPage()}
            aria-label={t('lastPage')}
          >
            <ChevronsRightIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
