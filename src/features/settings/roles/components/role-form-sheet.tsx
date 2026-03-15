'use client';

import { LoaderIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import { useCreateRole, usePermissions, useUpdateRole } from '../hooks/use-roles';
import type { OrgRoleItem } from '../types';
import {
  createRoleDefaults,
  type CreateRoleInput,
  createRoleSchema,
} from '../validators/role.schema';

interface RoleFormSheetProps {
  role: OrgRoleItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleFormSheet({ role, open, onOpenChange }: RoleFormSheetProps) {
  const t = useTranslations('roles');
  const { data: permissionGroups } = usePermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const isEditing = !!role;
  const isPending = createRole.isPending || updateRole.isPending;

  const resetValues = useMemo<CreateRoleInput>(
    () =>
      role
        ? {
            name: role.name,
            description: role.description ?? '',
            permissionCodes: role.permissionCodes,
          }
        : createRoleDefaults,
    [role]
  );

  function handleSubmit(values: CreateRoleInput) {
    const payload = createRoleSchema.parse(values);
    if (isEditing) {
      updateRole.mutate(
        { roleId: role.roleId, ...payload },
        {
          onSuccess: () => {
            toast.success(t('updateSuccess'));
            onOpenChange(false);
          },
          onError: (error: ApiError) => {
            toast.error(getErrorMessage(error, t('updateError')));
          },
        }
      );
    } else {
      createRole.mutate(payload, {
        onSuccess: () => {
          toast.success(t('createSuccess'));
          onOpenChange(false);
        },
        onError: (error: ApiError) => {
          toast.error(getErrorMessage(error, t('createError')));
        },
      });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] overflow-y-auto sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? t('editTitle') : t('createTitle')}
          </SheetTitle>
          <SheetDescription>
            {isEditing ? t('editDescription') : t('createDescription')}
          </SheetDescription>
        </SheetHeader>

        <Form<CreateRoleInput>
          key={role?.roleId ?? 'create'}
          validationSchema={createRoleSchema}
          resetValues={resetValues}
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col"
        >
          {({ register, formState: { errors }, setValue, watch }) => {
            const selectedPermissions = watch('permissionCodes') ?? [];

            function togglePermission(code: string) {
              const current = selectedPermissions;
              if (current.includes(code)) {
                setValue(
                  'permissionCodes',
                  current.filter((c: string) => c !== code),
                  { shouldValidate: true }
                );
              } else {
                setValue('permissionCodes', [...current, code], {
                  shouldValidate: true,
                });
              }
            }

            function toggleGroup(groupCodes: string[]) {
              const allSelected = groupCodes.every((c) =>
                selectedPermissions.includes(c)
              );
              if (allSelected) {
                setValue(
                  'permissionCodes',
                  selectedPermissions.filter(
                    (c: string) => !groupCodes.includes(c)
                  ),
                  { shouldValidate: true }
                );
              } else {
                const merged = [
                  ...new Set([...selectedPermissions, ...groupCodes]),
                ];
                setValue('permissionCodes', merged, { shouldValidate: true });
              }
            }

            return (
              <>
                <div className="flex-1 space-y-4 px-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('labelName')}</Label>
                    <Input
                      id="name"
                      placeholder={t('placeholderName')}
                      {...register('name')}
                    />
                    {errors.name && (
                      <p className="text-destructive mt-1 text-xs">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      {t('labelDescription')}
                    </Label>
                    <Textarea
                      id="description"
                      placeholder={t('placeholderDescription')}
                      {...register('description')}
                    />
                    {errors.description && (
                      <p className="text-destructive mt-1 text-xs">
                        {errors.description.message}
                      </p>
                    )}
                  </div>

                  {/* Permissions */}
                  <div className="space-y-3">
                    <Label>{t('labelPermissions')}</Label>
                    {errors.permissionCodes && (
                      <p className="text-destructive text-xs">
                        {errors.permissionCodes.message}
                      </p>
                    )}

                    {permissionGroups?.map((group) => {
                      const groupCodes = group.permissions.map((p) => p.code);
                      const allSelected = groupCodes.every((c) =>
                        selectedPermissions.includes(c)
                      );

                      return (
                        <div key={group.group} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">
                              {group.group}
                            </span>
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs"
                              onClick={() => toggleGroup(groupCodes)}
                            >
                              {allSelected
                                ? t('deselectAll')
                                : t('selectAll')}
                            </Button>
                          </div>

                          <div className="space-y-2 pl-1">
                            {group.permissions.map((permission) => (
                              <label
                                key={permission.code}
                                className="flex items-start gap-2"
                              >
                                <Checkbox
                                  checked={selectedPermissions.includes(
                                    permission.code
                                  )}
                                  onCheckedChange={() =>
                                    togglePermission(permission.code)
                                  }
                                  className="mt-0.5"
                                />
                                <div className="min-w-0">
                                  <div className="text-sm">
                                    {permission.code}
                                  </div>
                                  {permission.description && (
                                    <div className="text-muted-foreground text-xs">
                                      {permission.description}
                                    </div>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
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
                  <Button type="submit" disabled={isPending}>
                    {isPending && <LoaderIcon className="animate-spin" />}
                    {isEditing ? t('saveButton') : t('createButton')}
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
