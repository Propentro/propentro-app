'use client';

import { LoaderIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import { useRoles } from '../../roles/hooks/use-roles';
import { useInviteMember } from '../hooks/use-members';
import {
  inviteMemberDefaults,
  type InviteMemberInput,
  inviteMemberSchema,
} from '../validators/create-user.schema';

interface InviteMemberSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberSheet({
  open,
  onOpenChange,
}: InviteMemberSheetProps) {
  const t = useTranslations('members');
  const { data: rolesData } = useRoles();
  const roles = rolesData?.items;
  const inviteMember = useInviteMember();

  function handleSubmit(values: InviteMemberInput) {
    inviteMember.mutate(values, {
      onSuccess: () => {
        toast.success(t('inviteSuccess'));
        onOpenChange(false);
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('inviteError')));
      },
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('inviteTitle')}</SheetTitle>
          <SheetDescription>{t('inviteDescription')}</SheetDescription>
        </SheetHeader>

        <Form<InviteMemberInput>
          key={String(open)}
          validationSchema={inviteMemberSchema}
          resetValues={inviteMemberDefaults}
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col"
        >
          {({ register, formState: { errors }, setValue, watch }) => (
            <>
              <div className="flex-1 space-y-4 px-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('labelEmail')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('placeholderEmail')}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-destructive mt-1 text-xs">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roleId">{t('labelRole')}</Label>
                  <Select
                    value={watch('roleId') ?? ''}
                    onValueChange={(value) =>
                      setValue('roleId', value ?? '', { shouldValidate: true })
                    }
                  >
                    <SelectTrigger id="roleId" className="w-full">
                      <SelectValue placeholder={t('labelRole')}>
                        {roles?.find((r) => r.roleId === watch('roleId'))?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {roles?.map((role) => (
                        <SelectItem key={role.roleId} value={role.roleId}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.roleId && (
                    <p className="text-destructive mt-1 text-xs">
                      {errors.roleId.message}
                    </p>
                  )}
                </div>
              </div>

              <SheetFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={inviteMember.isPending}>
                  {inviteMember.isPending && (
                    <LoaderIcon className="animate-spin" />
                  )}
                  {t('sendInvitation')}
                </Button>
              </SheetFooter>
            </>
          )}
        </Form>
      </SheetContent>
    </Sheet>
  );
}
