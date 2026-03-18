'use client';

import { LoaderIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { CurrencyPicker } from '@/components/shared/currency-picker';
import { FormField } from '@/components/shared/form-field';
import { TimezonePicker } from '@/components/shared/timezone-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import type { AdminOrganization, UpdateOrganizationInput } from '../../types';
import { useUpdateOrganization } from '../hooks/use-admin-organizations';
import { updateOrganizationSchema } from '../validators/update-organization.schema';

interface OrganizationInfoFormProps {
  organization: AdminOrganization;
}

export function OrganizationInfoForm({
  organization,
}: OrganizationInfoFormProps) {
  const t = useTranslations('admin.organizations');
  const updateOrg = useUpdateOrganization(organization.organizationId);

  function handleUpdate(values: Record<string, unknown>) {
    updateOrg.mutate(values as unknown as UpdateOrganizationInput, {
      onSuccess: () => {
        toast.success(t('updateSuccess'));
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('updateError')));
      },
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form<UpdateOrganizationInput>
          validationSchema={updateOrganizationSchema}
          onSubmit={handleUpdate as (values: UpdateOrganizationInput) => void}
          resetValues={{
            name: organization.name,
            contactName: organization.contactName ?? '',
            contactEmail: organization.contactEmail ?? '',
            contactPhone: organization.contactPhone ?? '',
            currencyCode: organization.currencyCode,
            timezone: organization.timezone,
          }}
          className="space-y-4"
        >
          {(methods) => (
            <>
              <FormField<UpdateOrganizationInput>
                label={t('labelName')}
                name="name"
                placeholder={t('placeholderName')}
                methods={methods}
              />
              <FormField<UpdateOrganizationInput>
                label={t('labelContactName')}
                name="contactName"
                placeholder={t('placeholderContactName')}
                methods={methods}
              />
              <FormField<UpdateOrganizationInput>
                label={t('labelContactEmail')}
                name="contactEmail"
                placeholder={t('placeholderContactEmail')}
                methods={methods}
              />
              <FormField<UpdateOrganizationInput>
                label={t('labelContactPhone')}
                name="contactPhone"
                placeholder={t('placeholderContactPhone')}
                methods={methods}
              />
              <FormField<UpdateOrganizationInput>
                label={t('labelCurrency')}
                name="currencyCode"
                methods={methods}
              >
                <CurrencyPicker
                  value={methods.watch('currencyCode')}
                  onChange={(val) => methods.setValue('currencyCode', val)}
                />
              </FormField>
              <FormField<UpdateOrganizationInput>
                label={t('labelTimezone')}
                name="timezone"
                methods={methods}
              >
                <TimezonePicker
                  value={methods.watch('timezone')}
                  onChange={(val) => methods.setValue('timezone', val)}
                />
              </FormField>
              <Button type="submit" disabled={updateOrg.isPending}>
                {updateOrg.isPending && <LoaderIcon className="animate-spin" />}
                {t('saveChanges')}
              </Button>
            </>
          )}
        </Form>
      </CardContent>
    </Card>
  );
}
