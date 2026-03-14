'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  toOrgSettingsInput,
  useOrgSettings,
  useUpdateOrgSettings,
} from '@/features/settings/organization/hooks/use-org-settings';
import {
  orgSettingsDefaults,
  type OrgSettingsInput,
  orgSettingsSchema,
} from '@/features/settings/organization/validators/org-settings.schema';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import type { ApiError } from '@/types/api.types';

import { OrgSettingsSkeleton } from './org-settings-skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OrgSettingsFormProps = {
  canEdit: boolean;
};

type OrgSettingsFormFieldsProps = {
  methods: UseFormReturn<OrgSettingsInput>;
  canEdit: boolean;
  isPending: boolean;
  t: ReturnType<typeof useTranslations<'settings.organization'>>;
};

// ---------------------------------------------------------------------------
// Field helper
// ---------------------------------------------------------------------------

function FormField({
  label,
  name,
  placeholder,
  methods,
  disabled,
  type = 'text',
}: {
  label: string;
  name: keyof OrgSettingsInput;
  placeholder: string;
  methods: UseFormReturn<OrgSettingsInput>;
  disabled: boolean;
  type?: string;
}) {
  const error = methods.formState.errors[name];

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        {...methods.register(name)}
      />
      {error?.message && (
        <p className="text-destructive mt-1 text-xs">{error.message}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inner component — safe for hooks
// ---------------------------------------------------------------------------

function OrgSettingsFormFields({
  methods,
  canEdit,
  isPending,
  t,
}: OrgSettingsFormFieldsProps) {
  const disabled = !canEdit || isPending;

  useUnsavedChanges(methods.formState.isDirty);

  return (
    <>
      {/* Read-only notice */}
      {!canEdit && (
        <p className="text-muted-foreground text-sm">{t('readOnlyNotice')}</p>
      )}

      {/* Section 1: Profile */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sectionProfile')}</CardTitle>
          <CardDescription>{t('sectionProfileDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              label={t('name')}
              name="name"
              placeholder={t('namePlaceholder')}
              methods={methods}
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Contact */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sectionContact')}</CardTitle>
          <CardDescription>{t('sectionContactDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label={t('contactName')}
              name="contactName"
              placeholder={t('contactNamePlaceholder')}
              methods={methods}
              disabled={disabled}
            />
            <FormField
              label={t('contactEmail')}
              name="contactEmail"
              placeholder={t('contactEmailPlaceholder')}
              methods={methods}
              disabled={disabled}
              type="email"
            />
            <FormField
              label={t('contactPhone')}
              name="contactPhone"
              placeholder={t('contactPhonePlaceholder')}
              methods={methods}
              disabled={disabled}
              type="tel"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Address */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sectionAddress')}</CardTitle>
          <CardDescription>{t('sectionAddressDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField
                label={t('addressLine1')}
                name="addressLine1"
                placeholder={t('addressLine1Placeholder')}
                methods={methods}
                disabled={disabled}
              />
            </div>
            <div className="sm:col-span-2">
              <FormField
                label={t('addressLine2')}
                name="addressLine2"
                placeholder={t('addressLine2Placeholder')}
                methods={methods}
                disabled={disabled}
              />
            </div>
            <FormField
              label={t('city')}
              name="city"
              placeholder={t('cityPlaceholder')}
              methods={methods}
              disabled={disabled}
            />
            <FormField
              label={t('region')}
              name="region"
              placeholder={t('regionPlaceholder')}
              methods={methods}
              disabled={disabled}
            />
            <FormField
              label={t('postalCode')}
              name="postalCode"
              placeholder={t('postalCodePlaceholder')}
              methods={methods}
              disabled={disabled}
            />
            <FormField
              label={t('countryCode')}
              name="countryCode"
              placeholder={t('countryCodePlaceholder')}
              methods={methods}
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Legal & Tax */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sectionLegal')}</CardTitle>
          <CardDescription>{t('sectionLegalDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label={t('legalName')}
              name="legalName"
              placeholder={t('legalNamePlaceholder')}
              methods={methods}
              disabled={disabled}
            />
            <FormField
              label={t('taxNumber')}
              name="taxNumber"
              placeholder={t('taxNumberPlaceholder')}
              methods={methods}
              disabled={disabled}
            />
            <FormField
              label={t('taxCountry')}
              name="taxCountry"
              placeholder={t('taxCountryPlaceholder')}
              methods={methods}
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sectionRegional')}</CardTitle>
          <CardDescription>{t('sectionRegionalDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label={t('currencyCode')}
              name="currencyCode"
              placeholder={t('currencyCodePlaceholder')}
              methods={methods}
              disabled={disabled}
            />
            <FormField
              label={t('timezone')}
              name="timezone"
              placeholder={t('timezonePlaceholder')}
              methods={methods}
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {canEdit && (
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isPending || !methods.formState.isDirty}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('save')}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending || !methods.formState.isDirty}
            onClick={() => methods.reset()}
          >
            {t('cancel')}
          </Button>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function OrgSettingsForm({ canEdit }: OrgSettingsFormProps) {
  const t = useTranslations('settings.organization');
  const { data, isLoading } = useOrgSettings();
  const { mutate, isPending } = useUpdateOrgSettings();

  if (isLoading) {
    return <OrgSettingsSkeleton />;
  }

  const resetValues = data ? toOrgSettingsInput(data) : orgSettingsDefaults;

  function handleSubmit(values: OrgSettingsInput) {
    const parsed = orgSettingsSchema.parse(values);
    mutate(parsed, {
      onSuccess: () => {
        toast.success(t('saveSuccess'));
      },
      onError: (error: ApiError) => {
        toast.error(error.detail ?? t('saveError'));
      },
    });
  }

  return (
    <Form<OrgSettingsInput>
      validationSchema={orgSettingsSchema}
      resetValues={resetValues}
      onSubmit={handleSubmit}
      className="max-w-3xl space-y-4"
    >
      {(methods) => (
        <OrgSettingsFormFields
          methods={methods}
          canEdit={canEdit}
          isPending={isPending}
          t={t}
        />
      )}
    </Form>
  );
}
