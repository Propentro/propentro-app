'use client';

import { useFormatter, useNow } from 'next-intl';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DATE_PRESETS } from '@/lib/format-date';

interface RelativeTimeProps {
  date: string; // ISO date string
  tooltipPreset?: keyof typeof DATE_PRESETS;
}

export function RelativeTime({
  date,
  tooltipPreset = 'dateTime',
}: RelativeTimeProps) {
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 }); // update every minute
  const dateObj = new Date(date);

  const relative = format.relativeTime(dateObj, now);
  const absolute = format.dateTime(dateObj, DATE_PRESETS[tooltipPreset]);

  return (
    <Tooltip>
      <TooltipTrigger
        render={<time dateTime={date} className="cursor-default" />}
      >
        {relative}
      </TooltipTrigger>
      <TooltipContent>{absolute}</TooltipContent>
    </Tooltip>
  );
}
