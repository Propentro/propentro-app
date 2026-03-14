'use client';

import { useFormatter } from 'next-intl';

interface FormattedDateProps {
  value: string;
}

export function FormattedDate({ value }: FormattedDateProps) {
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
