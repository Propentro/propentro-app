'use client';

import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormFieldProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  placeholder?: string;
  methods: UseFormReturn<T>;
  disabled?: boolean;
  type?: string;
  children?: React.ReactNode;
}

export function FormField<T extends FieldValues>({
  label,
  name,
  placeholder,
  methods,
  disabled,
  type = 'text',
  children,
}: FormFieldProps<T>) {
  const error = methods.formState.errors[name];

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      {children ?? (
        <Input
          id={name}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          {...methods.register(name)}
        />
      )}
      {error?.message && (
        <p className="text-destructive mt-1 text-xs">{String(error.message)}</p>
      )}
    </div>
  );
}
