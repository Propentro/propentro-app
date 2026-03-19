'use client';

import { LoaderIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { CountryPicker } from '@/components/shared/country-picker';
import { CurrencyPicker } from '@/components/shared/currency-picker';
import { FormField } from '@/components/shared/form-field';
import { PhoneInput } from '@/components/shared/phone-input';
import { TimezonePicker } from '@/components/shared/timezone-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import type { AdminOrganization, UpdateOrganizationInput } from '../../types';
import { useUpdateOrganization } from '../hooks/use-admin-organizations';
import { updateOrganizationSchema } from '../validators/update-organization.schema';

interface OrganizationDetailsFormProps {
  organization: AdminOrganization;
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

interface FormInnerProps {
  methods: UseFormReturn<UpdateOrganizationInput>;
  isPending: boolean;
}

function OrganizationDetailsFormInner({ methods, isPending }: FormInnerProps) {
  const t = useTranslations('admin.organizations');
  useUnsavedChanges(methods.formState.isDirty);

  return (
    <div className="space-y-6">
      {/* Section: General */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
        <SectionHeader
          title={t('sectionGeneral')}
          description={t('sectionGeneralDescription')}
        />
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField<UpdateOrganizationInput>
                  label={t('labelName')}
                  name="name"
                  placeholder={t('placeholderName')}
                  methods={methods}
                />
              </div>
              <div className="sm:col-span-2">
                <FormField<UpdateOrganizationInput>
                  label={t('labelSlug')}
                  name="slug"
                  placeholder={t('placeholderSlug')}
                  methods={methods}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Section: Contact */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
        <SectionHeader
          title={t('sectionContact')}
          description={t('sectionContactDescription')}
        />
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField<UpdateOrganizationInput>
                  label={t('labelContactName')}
                  name="contactName"
                  placeholder={t('placeholderContactName')}
                  methods={methods}
                />
              </div>
              <FormField<UpdateOrganizationInput>
                label={t('labelContactEmail')}
                name="contactEmail"
                placeholder={t('placeholderContactEmail')}
                methods={methods}
                type="email"
              />
              <FormField<UpdateOrganizationInput>
                label={t('labelContactPhone')}
                name="contactPhone"
                methods={methods}
              >
                <PhoneInput
                  value={methods.watch('contactPhone') ?? ''}
                  onChange={(val) =>
                    methods.setValue('contactPhone', val, {
                      shouldDirty: true,
                    })
                  }
                />
              </FormField>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Section: Address */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
        <SectionHeader
          title={t('sectionAddress')}
          description={t('sectionAddressDescription')}
        />
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField<UpdateOrganizationInput>
                  label={t('labelAddressLine1')}
                  name="addressLine1"
                  placeholder={t('placeholderAddressLine1')}
                  methods={methods}
                />
              </div>
              <div className="sm:col-span-2">
                <FormField<UpdateOrganizationInput>
                  label={t('labelAddressLine2')}
                  name="addressLine2"
                  placeholder={t('placeholderAddressLine2')}
                  methods={methods}
                />
              </div>
              <FormField<UpdateOrganizationInput>
                label={t('labelCity')}
                name="city"
                methods={methods}
              />
              <FormField<UpdateOrganizationInput>
                label={t('labelRegion')}
                name="region"
                methods={methods}
              />
              <FormField<UpdateOrganizationInput>
                label={t('labelPostalCode')}
                name="postalCode"
                methods={methods}
              />
              <FormField<UpdateOrganizationInput>
                label={t('labelCountryCode')}
                name="countryCode"
                methods={methods}
              >
                <CountryPicker
                  value={methods.watch('countryCode') ?? ''}
                  onChange={(val) =>
                    methods.setValue('countryCode', val, {
                      shouldDirty: true,
                    })
                  }
                />
              </FormField>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Section: Regional Settings */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
        <SectionHeader
          title={t('sectionRegional')}
          description={t('sectionRegionalDescription')}
        />
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField<UpdateOrganizationInput>
                label={t('labelCurrency')}
                name="currencyCode"
                methods={methods}
              >
                <CurrencyPicker
                  value={methods.watch('currencyCode')}
                  onChange={(val) =>
                    methods.setValue('currencyCode', val, {
                      shouldDirty: true,
                    })
                  }
                />
              </FormField>
              <FormField<UpdateOrganizationInput>
                label={t('labelTimezone')}
                name="timezone"
                methods={methods}
              >
                <TimezonePicker
                  value={methods.watch('timezone')}
                  onChange={(val) =>
                    methods.setValue('timezone', val, {
                      shouldDirty: true,
                    })
                  }
                />
              </FormField>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Section: Legal & Tax */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
        <SectionHeader
          title={t('sectionLegalTax')}
          description={t('sectionLegalTaxDescription')}
        />
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField<UpdateOrganizationInput>
                  label={t('labelLegalName')}
                  name="legalName"
                  placeholder={t('placeholderLegalName')}
                  methods={methods}
                />
              </div>
              <FormField<UpdateOrganizationInput>
                label={t('labelTaxNumber')}
                name="taxNumber"
                placeholder={t('placeholderTaxNumber')}
                methods={methods}
              />
              <FormField<UpdateOrganizationInput>
                label={t('labelTaxCountry')}
                name="taxCountry"
                methods={methods}
              >
                <CountryPicker
                  value={methods.watch('taxCountry') ?? ''}
                  onChange={(val) =>
                    methods.setValue('taxCountry', val, {
                      shouldDirty: true,
                    })
                  }
                />
              </FormField>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <LoaderIcon className="animate-spin" />}
          {t('saveChanges')}
        </Button>
      </div>
    </div>
  );
}

export function OrganizationDetailsForm({
  organization,
}: OrganizationDetailsFormProps) {
  const t = useTranslations('admin.organizations');
  const updateOrg = useUpdateOrganization(organization.organizationId);

  function handleUpdate(values: UpdateOrganizationInput) {
    updateOrg.mutate(values, {
      onSuccess: () => {
        toast.success(t('updateSuccess'));
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('updateError')));
      },
    });
  }

  return (
    <div className="max-w-4xl">
      <Form<UpdateOrganizationInput>
        validationSchema={updateOrganizationSchema}
        onSubmit={handleUpdate}
        resetValues={{
          name: organization.name,
          slug: organization.slug,
          contactName: organization.contactName ?? '',
          contactEmail: organization.contactEmail ?? '',
          contactPhone: organization.contactPhone ?? '',
          currencyCode: organization.currencyCode,
          timezone: organization.timezone,
          addressLine1: organization.addressLine1 ?? '',
          addressLine2: organization.addressLine2 ?? '',
          city: organization.city ?? '',
          region: organization.region ?? '',
          postalCode: organization.postalCode ?? '',
          countryCode: organization.countryCode ?? '',
          legalName: organization.legalName ?? '',
          taxNumber: organization.taxNumber ?? '',
          taxCountry: organization.taxCountry ?? '',
        }}
      >
        {(methods) => (
          <OrganizationDetailsFormInner
            methods={methods}
            isPending={updateOrg.isPending}
          />
        )}
      </Form>
    </div>
  );
}
