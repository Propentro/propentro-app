'use client';

import { LoaderIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ApiError } from '@/types/api.types';

import { useRoles } from '../../roles/hooks/use-roles';
import { useUpdateMemberRoles } from '../hooks/use-members';
import type { OrgMember } from '../types';
import {
  type UpdateMemberRolesInput,
  updateMemberRolesSchema,
} from '../validators/create-user.schema';

interface EditMemberRolesSheetProps {
  member: OrgMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMemberRolesSheet({
  member,
  open,
  onOpenChange,
}: EditMemberRolesSheetProps) {
  const t = useTranslations('members');
  const { data: roles } = useRoles();
  const updateRoles = useUpdateMemberRoles();

  const resetValues = useMemo<UpdateMemberRolesInput>(
    () => ({
      roleIds: member?.roles.map((r) => r.id) ?? [],
    }),
    [member]
  );

  function handleSubmit(values: UpdateMemberRolesInput) {
    if (!member) return;

    updateRoles.mutate(
      { userId: member.userId, ...values },
      {
        onSuccess: () => {
          toast.success(t('rolesUpdateSuccess'));
          onOpenChange(false);
        },
        onError: (error: ApiError) => {
          toast.error(error.detail ?? t('rolesUpdateError'));
        },
      }
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('editRolesTitle')}</SheetTitle>
        </SheetHeader>

        <Form<UpdateMemberRolesInput>
          validationSchema={updateMemberRolesSchema}
          resetValues={resetValues}
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col"
        >
          {({ setValue, watch, formState: { errors } }) => {
            const selectedRoleIds = watch('roleIds');

            function toggleRole(roleId: string, checked: boolean) {
              const current = selectedRoleIds ?? [];
              const next = checked
                ? [...current, roleId]
                : current.filter((id) => id !== roleId);
              setValue('roleIds', next, { shouldValidate: true });
            }

            return (
              <>
                <div className="flex-1 space-y-3 px-4">
                  {roles?.map((role) => (
                    <div key={role.roleId} className="flex items-center gap-3">
                      <Checkbox
                        id={`role-${role.roleId}`}
                        checked={selectedRoleIds?.includes(role.roleId)}
                        onCheckedChange={(checked) =>
                          toggleRole(role.roleId, !!checked)
                        }
                      />
                      <Label htmlFor={`role-${role.roleId}`}>
                        {role.name}
                      </Label>
                    </div>
                  ))}
                  {errors.roleIds && (
                    <p className="text-destructive mt-1 text-xs">
                      {errors.roleIds.message}
                    </p>
                  )}
                </div>

                <SheetFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    {t('cancel')}
                  </Button>
                  <Button type="submit" disabled={updateRoles.isPending}>
                    {updateRoles.isPending && (
                      <LoaderIcon className="animate-spin" />
                    )}
                    {t('saveRoles')}
                  </Button>
                </SheetFooter>
              </>
            );
          }}
        </Form>
      </SheetContent>
    </Sheet>
  );
}
