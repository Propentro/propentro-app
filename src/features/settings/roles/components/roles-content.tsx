'use client';

import { LoaderIcon, PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import { useDeleteRole, useRoles } from '../hooks/use-roles';
import type { OrgRoleItem } from '../types';
import { RoleCard } from './role-card';
import { RoleFormSheet } from './role-form-sheet';
import { RolesEmptyState } from './roles-empty-state';
import { RolesSkeleton } from './roles-skeleton';
import { ViewPermissionsSheet } from './view-permissions-sheet';

interface RolesContentProps {
  canManage: boolean;
}

export function RolesContent({ canManage }: RolesContentProps) {
  const t = useTranslations('roles');

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<OrgRoleItem | null>(null);
  const [deletingRole, setDeletingRole] = useState<OrgRoleItem | null>(null);
  const [viewingRole, setViewingRole] = useState<OrgRoleItem | null>(null);

  // ---------------------------------------------------------------------------
  // Queries & mutations
  // ---------------------------------------------------------------------------
  const { data: roles, isPending } = useRoles();
  const deleteRole = useDeleteRole();

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  function handleCreate() {
    setEditingRole(null);
    setFormOpen(true);
  }

  function handleEdit(role: OrgRoleItem) {
    setEditingRole(role);
    setFormOpen(true);
  }

  function handleDelete() {
    if (!deletingRole) return;
    deleteRole.mutate(deletingRole.roleId, {
      onSuccess: () => {
        toast.success(t('deleteSuccess'));
        setDeletingRole(null);
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('deleteError')));
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (isPending) {
    return <RolesSkeleton />;
  }

  const hasCustomRoles = roles?.some((r) => !r.isSystem);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {t('pageDescription')}
        </p>
        {canManage && (
          <Button size="sm" onClick={handleCreate}>
            <PlusIcon />
            {t('addRole')}
          </Button>
        )}
      </div>

      {/* Role cards grid */}
      {roles && roles.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {roles.map((role) => (
            <RoleCard
              key={role.roleId}
              role={role}
              canManage={canManage}
              onEdit={handleEdit}
              onDelete={setDeletingRole}
              onView={setViewingRole}
            />
          ))}
        </div>
      )}

      {/* Empty state for custom roles */}
      {!hasCustomRoles && (
        <RolesEmptyState canManage={canManage} onCreate={handleCreate} />
      )}

      {/* Form sheet */}
      <RoleFormSheet
        role={editingRole}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deletingRole}
        onOpenChange={(open) => {
          if (deleteRole.isPending) return;
          if (!open) setDeletingRole(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteTitle')}</DialogTitle>
            <DialogDescription>{t('deleteDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingRole(null)}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteRole.isPending}
            >
              {deleteRole.isPending && (
                <LoaderIcon className="animate-spin" />
              )}
              {t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View permissions sheet (system roles) */}
      <ViewPermissionsSheet
        role={viewingRole}
        open={!!viewingRole}
        onOpenChange={(open) => {
          if (!open) setViewingRole(null);
        }}
      />
    </div>
  );
}
