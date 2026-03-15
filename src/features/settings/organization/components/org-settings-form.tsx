'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { CountryPicker } from '@/components/shared/country-picker';
import { CurrencyPicker } from '@/components/shared/currency-picker';
import { FormField } from '@/components/shared/form-field';
import { PhoneInput } from '@/components/shared/phone-input';
import { TimezonePicker } from '@/components/shared/timezone-picker';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import {
  toOrgSettingsInput,
  useOrgSettings,
  useUpdateOrgSettings,
} from '@/features/settings/organization/hooks/use-org-settings';
import {
  type OrgSettingsInput,
  type OrgSettingsOutput,
  orgSettingsSchema,
} from '@/features/settings/organization/validators/org-settings.schema';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { getErrorMessage } from '@/lib/parse-api-error';
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
              methods={methods}
              disabled={disabled}
            >
              <PhoneInput
                id="contactPhone"
                value={methods.watch('contactPhone')}
                onChange={(val) =>
                  methods.setValue('contactPhone', val, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                placeholder={t('contactPhonePlaceholder')}
                disabled={disabled}
              />
            </FormField>
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
              methods={methods}
              disabled={disabled}
            >
              <CountryPicker
                id="countryCode"
                value={methods.watch('countryCode')}
                onChange={(val) =>
                  methods.setValue('countryCode', val, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                placeholder={t('countryCodePlaceholder')}
                disabled={disabled}
              />
            </FormField>
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
              methods={methods}
              disabled={disabled}
            >
              <CountryPicker
                id="taxCountry"
                value={methods.watch('taxCountry')}
                onChange={(val) =>
                  methods.setValue('taxCountry', val, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                placeholder={t('taxCountryPlaceholder')}
                disabled={disabled}
              />
            </FormField>
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
              methods={methods}
              disabled={disabled}
            >
              <CurrencyPicker
                id="currencyCode"
                value={methods.watch('currencyCode')}
                onChange={(val) =>
                  methods.setValue('currencyCode', val, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                placeholder={t('currencyCodePlaceholder')}
                disabled={disabled}
              />
            </FormField>
            <FormField
              label={t('timezone')}
              name="timezone"
              methods={methods}
              disabled={disabled}
            >
              <TimezonePicker
                id="timezone"
                value={methods.watch('timezone')}
                onChange={(val) =>
                  methods.setValue('timezone', val, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                placeholder={t('timezonePlaceholder')}
                disabled={disabled}
              />
            </FormField>
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
  const { data, isPending: isQueryPending, isError } = useOrgSettings();
  const { mutate, isPending } = useUpdateOrgSettings();

  if (isQueryPending) {
    return <OrgSettingsSkeleton />;
  }

  if (isError || !data) {
    return <p className="text-destructive text-sm">{t('loadError')}</p>;
  }

  const resetValues = toOrgSettingsInput(data);

  function handleSubmit(values: OrgSettingsInput) {
    // zodResolver already ran transforms; cast to the output type
    mutate(values as unknown as OrgSettingsOutput, {
      onSuccess: () => {
        toast.success(t('saveSuccess'));
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('saveError')));
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
