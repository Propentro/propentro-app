'use client';

import { ChevronsUpDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { usePreserveScroll } from '@/hooks/use-scroll-lock';
import { cn } from '@/lib/utils';

interface TimezonePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

function formatTimezone(tz: string): string {
  return tz.replace(/_/g, ' ');
}

export function TimezonePicker({
  value,
  onChange,
  placeholder,
  disabled,
  id,
}: TimezonePickerProps) {
  const [open, setOpen] = useState(false);
  const handleOpenChange = usePreserveScroll(setOpen);
  const t = useTranslations('common');

  const timezones = useMemo(() => {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch {
      return Intl.DateTimeFormat().resolvedOptions().timeZone
        ? [Intl.DateTimeFormat().resolvedOptions().timeZone]
        : ['UTC'];
    }
  }, []);

  const placeholderText = placeholder ?? t('selectTimezone');

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            id={id}
            className="w-full justify-between font-normal"
          />
        }
      >
        <span
          className={cn(
            'truncate',
            !value && 'text-muted-foreground'
          )}
        >
          {value ? formatTimezone(value) : placeholderText}
        </span>
        <ChevronsUpDownIcon className="text-muted-foreground ml-auto size-4 shrink-0" />
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder={t('searchTimezone')} />
          <CommandList>
            <CommandEmpty>{t('noResultFound')}</CommandEmpty>
            <CommandGroup>
              {timezones.map((tz) => (
                <CommandItem
                  key={tz}
                  value={formatTimezone(tz)}
                  data-checked={value === tz}
                  onSelect={() => {
                    onChange(tz);
                    setOpen(false);
                  }}
                >
                  {formatTimezone(tz)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
