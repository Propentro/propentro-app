'use client';

import { useFormatter } from 'next-intl';

interface AdminFormattedDateProps {
  value: string;
}

export function AdminFormattedDate({ value }: AdminFormattedDateProps) {
  const format = useFormatter();

  return (
    <time dateTime={value}>
      {format.dateTime(new Date(value), {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })}
    </time>
  );
}
