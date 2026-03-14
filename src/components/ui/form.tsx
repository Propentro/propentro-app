'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import {
  type FieldValues,
  type Resolver,
  type SubmitHandler,
  useForm,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form';
import type { z } from 'zod';

type FormProps<TFormValues extends FieldValues> = {
  onSubmit: SubmitHandler<TFormValues>;
  children: (methods: UseFormReturn<TFormValues>) => React.ReactNode;
  useFormProps?: UseFormProps<TFormValues>;
  validationSchema?: z.ZodType;
  resetValues?: TFormValues | null;
  className?: string;
};

export function Form<
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>({
  onSubmit,
  children,
  useFormProps,
  validationSchema,
  resetValues,
  className,
  ...formProps
}: FormProps<TFormValues>) {
  const methods = useForm<TFormValues>({
    ...useFormProps,

    ...(validationSchema && {
      resolver: zodResolver(validationSchema as any) as Resolver<TFormValues>,
    }),
  });

  const prevResetValues = useRef<TFormValues | null>(null);

  useEffect(() => {
    if (!resetValues) return;
    if (
      prevResetValues.current !== null &&
      JSON.stringify(prevResetValues.current) === JSON.stringify(resetValues)
    ) {
      return;
    }
    prevResetValues.current = resetValues;
    methods.reset(resetValues);
  }, [resetValues, methods]);

  return (
    <form
      noValidate
      onSubmit={methods.handleSubmit(onSubmit)}
      {...formProps}
      className={className}
    >
      {children(methods)}
    </form>
  );
}
