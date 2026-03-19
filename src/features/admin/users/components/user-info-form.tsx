'use client';

import { LoaderIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { FormField } from '@/components/shared/form-field';
import { RelativeTime } from '@/components/shared/relative-time';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import type { AdminUser } from '../../types';
import { useUpdateUser } from '../hooks/use-admin-users';
import {
  type UpdateUserInput,
  updateUserSchema,
} from '../validators/update-user.schema';

// ---------------------------------------------------------------------------
// Fields (extracted so useUnsavedChanges is called at component top level)
// ---------------------------------------------------------------------------

interface UserInfoFormFieldsProps {
  user: AdminUser;
  methods: UseFormReturn<UpdateUserInput>;
  isPending: boolean;
  t: ReturnType<typeof useTranslations<'admin.users'>>;
}

function UserInfoFormFields({
  user,
  methods,
  isPending,
  t,
}: UserInfoFormFieldsProps) {
  useUnsavedChanges(methods.formState.isDirty);

  return (
    <>
      <FormField<UpdateUserInput>
        label={t('labelFirstName')}
        name="firstName"
        methods={methods}
      />
      <FormField<UpdateUserInput>
        label={t('labelLastName')}
        name="lastName"
        methods={methods}
      />

      {/* Read-only fields */}
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground text-sm">{t('labelEmail')}</dt>
          <dd className="mt-1 font-medium">{user.email}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm">{t('labelStatus')}</dt>
          <dd className="mt-1">
            <Badge variant={user.isActive ? 'default' : 'destructive'}>
              {user.isActive ? t('statusActive') : t('statusInactive')}
            </Badge>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-sm">
            {t('labelCreated')}
          </dt>
          <dd className="mt-1">
            <RelativeTime date={user.createdAt} />
          </dd>
        </div>
      </dl>

      <Button
        type="submit"
        disabled={!methods.formState.isDirty || isPending}
      >
        {isPending && <LoaderIcon className="animate-spin" />}
        {t('saveChanges')}
      </Button>
    </>
  );
}

// ---------------------------------------------------------------------------
// Form wrapper
// ---------------------------------------------------------------------------

interface UserInfoFormProps {
  user: AdminUser;
}

export function UserInfoForm({ user }: UserInfoFormProps) {
  const t = useTranslations('admin.users');
  const updateUser = useUpdateUser(user.userId);

  function handleUpdate(values: Record<string, unknown>) {
    updateUser.mutate(values as unknown as UpdateUserInput, {
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
        <Form<UpdateUserInput>
          validationSchema={updateUserSchema}
          onSubmit={handleUpdate as (values: UpdateUserInput) => void}
          resetValues={{
            firstName: user.firstName ?? '',
            lastName: user.lastName ?? '',
          }}
          className="space-y-4"
        >
          {(methods) => (
            <UserInfoFormFields
              user={user}
              methods={methods}
              isPending={updateUser.isPending}
              t={t}
            />
          )}
        </Form>
      </CardContent>
    </Card>
  );
}
