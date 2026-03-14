'use client';

import { ChevronsUpDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { usePreserveScroll } from '@/hooks/use-scroll-lock';
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
import { countries } from '@/lib/data/countries';
import { cn } from '@/lib/utils';

interface CountryPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export function CountryPicker({
  value,
  onChange,
  placeholder,
  disabled,
  id,
}: CountryPickerProps) {
  const [open, setOpen] = useState(false);
  const handleOpenChange = usePreserveScroll(setOpen);
  const t = useTranslations('common');

  const selected = countries.find((c) => c.code === value);
  const placeholderText = placeholder ?? t('selectCountry');

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
            !selected && 'text-muted-foreground'
          )}
        >
          {selected ? `${selected.flag} ${selected.name}` : placeholderText}
        </span>
        <ChevronsUpDownIcon className="text-muted-foreground ml-auto size-4 shrink-0" />
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder={t('searchCountry')} />
          <CommandList>
            <CommandEmpty>{t('noResultFound')}</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} ${country.code}`}
                  data-checked={value === country.code}
                  onSelect={() => {
                    onChange(country.code);
                    setOpen(false);
                  }}
                >
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
