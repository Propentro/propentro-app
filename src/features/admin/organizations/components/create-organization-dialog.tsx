'use client';

import { LoaderIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CurrencyPicker } from '@/components/shared/currency-picker';
import { FormField } from '@/components/shared/form-field';
import { TimezonePicker } from '@/components/shared/timezone-picker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { CreateOrganizationInput } from '../../types';
import {
  createOrganizationDefaults,
  createOrganizationSchema,
  type CreateOrganizationFormValues,
} from '../validators/create-organization.schema';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateOrganizationInput) => void;
  isPending: boolean;
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: CreateOrganizationDialogProps) {
  const t = useTranslations('admin.organizations');

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('createTitle')}</DialogTitle>
          <DialogDescription>{t('createDescription')}</DialogDescription>
        </DialogHeader>
        <Form<CreateOrganizationFormValues>
          validationSchema={createOrganizationSchema}
          useFormProps={{ defaultValues: createOrganizationDefaults }}
          onSubmit={(values) => onSubmit(values as unknown as CreateOrganizationInput)}
          className="space-y-4"
        >
          {(methods) => (
            <>
              <FormField<CreateOrganizationFormValues>
                label={t('labelName')}
                name="name"
                placeholder={t('placeholderName')}
                methods={methods}
              />
              <FormField<CreateOrganizationFormValues>
                label={t('labelSlug')}
                name="slug"
                placeholder={t('placeholderSlug')}
                methods={methods}
              >
                <Input
                  id="slug"
                  placeholder={t('placeholderSlug')}
                  {...methods.register('slug')}
                  onFocus={() => {
                    const name = methods.getValues('name');
                    const slug = methods.getValues('slug');
                    if (name && !slug) {
                      methods.setValue('slug', slugify(name));
                    }
                  }}
                />
              </FormField>
              <FormField<CreateOrganizationFormValues>
                label={t('labelCurrency')}
                name="currencyCode"
                methods={methods}
              >
                <CurrencyPicker
                  value={methods.watch('currencyCode')}
                  onChange={(val) => methods.setValue('currencyCode', val)}
                />
              </FormField>
              <FormField<CreateOrganizationFormValues>
                label={t('labelTimezone')}
                name="timezone"
                methods={methods}
              >
                <TimezonePicker
                  value={methods.watch('timezone')}
                  onChange={(val) => methods.setValue('timezone', val)}
                />
              </FormField>
              <FormField<CreateOrganizationFormValues>
                label={t('labelPlan')}
                name="subscriptionPlan"
                methods={methods}
              >
                <Select
                  value={methods.watch('subscriptionPlan')}
                  onValueChange={(val) =>
                    methods.setValue(
                      'subscriptionPlan',
                      (val ?? 'starter') as CreateOrganizationFormValues['subscriptionPlan'],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">{t('planStarter')}</SelectItem>
                    <SelectItem value="pro">{t('planPro')}</SelectItem>
                    <SelectItem value="enterprise">{t('planEnterprise')}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {t('cancelInvite')}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <LoaderIcon className="animate-spin" />}
                  {t('createButton')}
                </Button>
              </DialogFooter>
            </>
          )}
        </Form>
      </DialogContent>
    </Dialog>
  );
}
