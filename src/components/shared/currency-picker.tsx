'use client';

import { ChevronsUpDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

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
import { currencies } from '@/lib/data/currencies';
import { cn } from '@/lib/utils';

interface CurrencyPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export function CurrencyPicker({
  value,
  onChange,
  placeholder,
  disabled,
  id,
}: CurrencyPickerProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('common');

  const selected = currencies.find((c) => c.code === value);
  const placeholderText = placeholder ?? t('selectCurrency');

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
          {selected
            ? `${selected.name} (${selected.symbol})`
            : placeholderText}
        </span>
        <ChevronsUpDownIcon className="text-muted-foreground ml-auto size-4 shrink-0" />
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" initialFocus={false}>
        <Command>
          <CommandInput placeholder={t('searchCurrency')} />
          <CommandList>
            <CommandEmpty>{t('noResultFound')}</CommandEmpty>
            <CommandGroup>
              {currencies.map((currency) => (
                <CommandItem
                  key={currency.code}
                  value={`${currency.name} ${currency.symbol}`}
                  data-checked={value === currency.code}
                  onSelect={() => {
                    onChange(currency.code);
                    setOpen(false);
                  }}
                >
                  <span>
                    {currency.name} ({currency.symbol})
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
