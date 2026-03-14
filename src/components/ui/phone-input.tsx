'use client';

import {
  type CountryCode as LibCountryCode,
  getCountryCallingCode,
  parsePhoneNumber,
} from 'libphonenumber-js/min';
import { useTranslations } from 'next-intl';
import { forwardRef, useCallback, useMemo, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const COMMON_COUNTRIES: LibCountryCode[] = [
  'GB',
  'US',
  'TR',
  'DE',
  'FR',
  'NL',
  'IE',
  'AU',
  'CA',
];

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  defaultCountry?: LibCountryCode;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  function PhoneInput(
    {
      value = '',
      onChange,
      defaultCountry = 'GB',
      label,
      error,
      helperText,
      disabled = false,
      className,
      id,
    },
    ref
  ) {
    const t = useTranslations('common');
    const [country, setCountry] = useState<LibCountryCode>(() => {
      if (value) {
        try {
          const parsed = parsePhoneNumber(value);
          if (parsed?.country) return parsed.country;
        } catch {
          // ignore
        }
      }
      return defaultCountry;
    });

    const callingCode = useMemo(
      () => `+${getCountryCallingCode(country)}`,
      [country]
    );

    const nationalNumber = useMemo(() => {
      if (!value) return '';
      try {
        const parsed = parsePhoneNumber(value);
        return parsed?.nationalNumber ?? value.replace(/^\+\d+/, '');
      } catch {
        return value.replace(/^\+\d+/, '');
      }
    }, [value]);

    const handleCountryChange = useCallback(
      (newCountry: LibCountryCode) => {
        setCountry(newCountry);
        const newCallingCode = `+${getCountryCallingCode(newCountry)}`;
        onChange?.(nationalNumber ? `${newCallingCode}${nationalNumber}` : '');
      },
      [nationalNumber, onChange]
    );

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, '');
        onChange?.(digits ? `${callingCode}${digits}` : '');
      },
      [callingCode, onChange]
    );

    const inputId = id ?? 'phone-input';

    return (
      <div className={cn('space-y-1.5', className)}>
        {label && <Label htmlFor={inputId}>{label}</Label>}
        <div className="flex gap-1.5">
          <Select
            value={country}
            onValueChange={(v) => handleCountryChange(v as LibCountryCode)}
            disabled={disabled}
          >
            <SelectTrigger size="sm" className="w-20 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {COMMON_COUNTRIES.map((code) => (
                <SelectItem key={code} value={code}>
                  {code} +{getCountryCallingCode(code)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            ref={ref}
            id={inputId}
            type="tel"
            inputMode="tel"
            value={nationalNumber}
            onChange={handleInputChange}
            disabled={disabled}
            aria-invalid={!!error}
            placeholder={t('phoneNumber')}
          />
        </div>
        {!error && helperText && (
          <p className="text-muted-foreground text-xs">{helperText}</p>
        )}
        {error && <p className="text-destructive text-xs">{error}</p>}
      </div>
    );
  }
);
