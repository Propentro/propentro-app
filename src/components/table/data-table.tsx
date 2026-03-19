'use client';

import {
  flexRender,
  type Row,
  type Table as ReactTableType,
} from '@tanstack/react-table';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface DataTableProps<TData> {
  table: ReactTableType<TData>;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: Row<TData>) => void;
}

export function DataTable<TData>({
  table,
  isLoading = false,
  emptyMessage,
  className,
  onRowClick,
}: DataTableProps<TData>) {
  const t = useTranslations('common');

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="border-primary size-6 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  const rows = table.getRowModel().rows;

  return (
    <Table className={className}>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                style={{ width: header.getSize() }}
                className={cn(
                  header.column.getCanSort() && 'cursor-pointer select-none'
                )}
                onClick={header.column.getToggleSortingHandler()}
              >
                {header.isPlaceholder ? null : (
                  <div className="flex items-center gap-1">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getCanSort() && (
                      <span className="text-muted-foreground ml-0.5">
                        {{
                          asc: <ArrowUpIcon className="size-3.5" />,
                          desc: <ArrowDownIcon className="size-3.5" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </span>
                    )}
                  </div>
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {rows.length > 0 ? (
          rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() ? 'selected' : undefined}
              onClick={() => onRowClick?.(row)}
              className={cn(onRowClick && 'cursor-pointer')}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={table.getAllColumns().length}
              className="h-24 text-center"
            >
              {emptyMessage ?? t('noResultFound')}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
