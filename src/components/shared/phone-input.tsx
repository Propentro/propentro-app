'use client';

import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { ChevronsUpDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { usePreserveScroll } from '@/hooks/use-scroll-lock';
import { phoneCountries } from '@/lib/data/phone-codes';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

const DEFAULT_COUNTRY = 'GB';

export function PhoneInput({
  value,
  onChange,
  placeholder,
  disabled,
  id,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const handleOpenChange = usePreserveScroll(setOpen);
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY);
  const [nationalNumber, setNationalNumber] = useState('');
  const lastEmittedRef = useRef<string>('');
  const t = useTranslations('common');

  const selectedCountry = useMemo(
    () => phoneCountries.find((c) => c.code === countryCode),
    [countryCode]
  );

  // Sync internal state from value prop (mount + external changes like form reset)
  useEffect(() => {
    // Skip if value was just emitted by this component
    if (value === lastEmittedRef.current) return;

    if (!value) {
      setNationalNumber('');
      setCountryCode(DEFAULT_COUNTRY);
      return;
    }

    const parsed = parsePhoneNumberFromString(value);
    if (parsed) {
      const matchedCountry = phoneCountries.find(
        (c) => c.code === parsed.country
      );
      if (matchedCountry) {
        setCountryCode(matchedCountry.code);
      }
      setNationalNumber(parsed.nationalNumber);
    }
  }, [value]);

  const buildE164 = useCallback(
    (dialCode: string, number: string) => {
      const cleaned = number.replace(/\D/g, '').replace(/^0+/, '');
      if (!cleaned) {
        lastEmittedRef.current = '';
        onChange('');
        return;
      }
      const e164 = `${dialCode}${cleaned}`;
      lastEmittedRef.current = e164;
      onChange(e164);
    },
    [onChange]
  );

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    setOpen(false);
    const country = phoneCountries.find((c) => c.code === code);
    if (country) {
      buildE164(country.dialCode, nationalNumber);
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value;
    setNationalNumber(num);
    if (selectedCountry) {
      buildE164(selectedCountry.dialCode, num);
    }
  };

  return (
    <div className="flex gap-1.5">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="w-[100px] shrink-0 justify-between px-2 font-normal"
            />
          }
        >
          <span className="truncate">
            {selectedCountry
              ? `${selectedCountry.flag} ${selectedCountry.dialCode}`
              : DEFAULT_COUNTRY}
          </span>
          <ChevronsUpDownIcon className="text-muted-foreground size-3.5 shrink-0" />
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder={t('searchCountry')} />
            <CommandList>
              <CommandEmpty>{t('noResultFound')}</CommandEmpty>
              <CommandGroup>
                {phoneCountries.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={`${country.name} ${country.code} ${country.dialCode}`}
                    data-checked={countryCode === country.code}
                    onSelect={() => handleCountryChange(country.code)}
                  >
                    <span>{country.flag}</span>
                    <span className="flex-1 truncate">{country.name}</span>
                    <span className={cn('text-muted-foreground text-xs')}>
                      {country.dialCode}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        id={id}
        type="tel"
        value={nationalNumber}
        onChange={handleNumberChange}
        placeholder={placeholder ?? t('phoneNumber')}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  );
}
