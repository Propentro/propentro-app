'use client';

import {
  type ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Building2,
  LoaderIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CurrencyPicker } from '@/components/shared/currency-picker';
import { FormField } from '@/components/shared/form-field';
import { TimezonePicker } from '@/components/shared/timezone-picker';
import { DataTable } from '@/components/table/data-table';
import { DataTablePagination } from '@/components/table/data-table-pagination';
import { Badge } from '@/components/ui/badge';
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
import { paths } from '@/config/routes';
import { useDebounce } from '@/hooks/use-debounce';
import { Link } from '@/i18n/routing';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import {
  useAdminOrganizations,
  useCreateOrganization,
} from '../hooks/use-admin-organizations';
import type {
  AdminOrganizationListItem,
  CreateOrganizationInput,
} from '../types';
import { AdminFormattedDate } from './admin-formatted-date';

const columnHelper = createColumnHelper<AdminOrganizationListItem>();

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function OrganizationsList() {
  const t = useTranslations('admin.organizations');

  // ---------------------------------------------------------------------------
  // Filter state
  // ---------------------------------------------------------------------------
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, pageSize]);

  // ---------------------------------------------------------------------------
  // Queries & mutations
  // ---------------------------------------------------------------------------
  const { data, isPending } = useAdminOrganizations({
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
    page,
    pageSize,
  });

  const createOrganization = useCreateOrganization();

  // ---------------------------------------------------------------------------
  // Create handler
  // ---------------------------------------------------------------------------
  function handleCreate(values: Record<string, unknown>) {
    createOrganization.mutate(values as unknown as CreateOrganizationInput, {
      onSuccess: () => {
        toast.success(t('createSuccess'));
        setCreateOpen(false);
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('createError')));
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Columns
  // ---------------------------------------------------------------------------
  const columns = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cols: ColumnDef<AdminOrganizationListItem, any>[] = [
      columnHelper.accessor('name', {
        header: t('columnName'),
        cell: ({ row }) => {
          const { name, organizationId } = row.original;
          return (
            <Link
              href={`${paths.admin.organizations}/${organizationId}`}
              className="font-medium hover:underline"
            >
              {name}
            </Link>
          );
        },
      }),
      columnHelper.accessor('slug', {
        header: t('columnSlug'),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground font-mono text-xs">
            {getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('subscriptionPlan', {
        header: t('columnPlan'),
        cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>,
      }),
      columnHelper.accessor('memberCount', {
        header: t('columnMembers'),
        cell: ({ getValue }) => getValue(),
      }),
      columnHelper.accessor('isActive', {
        header: t('columnStatus'),
        cell: ({ getValue }) => (
          <Badge variant={getValue() ? 'default' : 'destructive'}>
            {getValue() ? t('statusActive') : t('statusInactive')}
          </Badge>
        ),
      }),
      columnHelper.accessor('createdAt', {
        header: t('columnCreated'),
        cell: ({ getValue }) => <AdminFormattedDate value={getValue()} />,
      }),
    ];

    return cols;
  }, [t]);

  // ---------------------------------------------------------------------------
  // Table
  // ---------------------------------------------------------------------------
  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.totalPages ?? -1,
    state: { pagination: { pageIndex: page - 1, pageSize } },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex: page - 1, pageSize })
          : updater;
      setPage(next.pageIndex + 1);
      setPageSize(next.pageSize);
    },
  });

  const hasFilters = search !== '' || status !== 'all';

  const isEmpty = !data?.items.length && !debouncedSearch && status === 'all';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-56 pl-8"
            />
          </div>

          <Select
            value={status}
            onValueChange={(value) => setStatus(value ?? 'all')}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder={t('filterStatus')}>
                {status === 'all'
                  ? t('allStatuses')
                  : status === 'active'
                    ? t('statusActive')
                    : t('statusInactive')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatuses')}</SelectItem>
              <SelectItem value="active">{t('statusActive')}</SelectItem>
              <SelectItem value="inactive">{t('statusInactive')}</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatus('all');
              }}
            >
              <XIcon />
              {t('allStatuses')}
            </Button>
          )}

          <Button className="ml-auto" onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            {t('createOrganization')}
          </Button>
        </div>

        {/* Content */}
        {isPending ? (
          <div className="flex h-32 items-center justify-center">
            <div className="border-primary size-6 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted mb-4 flex size-12 items-center justify-center rounded-full">
              <Building2 className="text-muted-foreground size-6" />
            </div>
            <h3 className="text-lg font-medium">{t('emptyTitle')}</h3>
            <p className="text-muted-foreground mt-1 max-w-sm text-sm">
              {t('emptyDescription')}
            </p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              {t('createOrganization')}
            </Button>
          </div>
        ) : (
          <>
            <DataTable table={table} />
            <DataTablePagination table={table} />
          </>
        )}
      </div>

      {/* Create Organization Dialog */}
      <CreateOrganizationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isPending={createOrganization.isPending}
      />
    </div>
  );

  function onSearchChange(value: string) {
    setSearch(value);
  }
}

// ---------------------------------------------------------------------------
// Create Organization Dialog
// ---------------------------------------------------------------------------

function CreateOrganizationDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Record<string, unknown>) => void;
  isPending: boolean;
}) {
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
        <Form<CreateOrganizationInput>
          onSubmit={onSubmit as (values: CreateOrganizationInput) => void}
          useFormProps={{
            defaultValues: {
              name: '',
              slug: '',
              contactName: '',
              contactEmail: '',
              currencyCode: 'GBP',
              timezone: 'Europe/London',
              subscriptionPlan: 'free',
            },
          }}
          className="space-y-4"
        >
          {(methods) => (
            <>
              <FormField<CreateOrganizationInput>
                label={t('labelName')}
                name="name"
                placeholder={t('placeholderName')}
                methods={methods}
              />
              <FormField<CreateOrganizationInput>
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
              <FormField<CreateOrganizationInput>
                label={t('labelCurrency')}
                name="currencyCode"
                methods={methods}
              >
                <CurrencyPicker
                  value={methods.watch('currencyCode')}
                  onChange={(val) => methods.setValue('currencyCode', val)}
                />
              </FormField>
              <FormField<CreateOrganizationInput>
                label={t('labelTimezone')}
                name="timezone"
                methods={methods}
              >
                <TimezonePicker
                  value={methods.watch('timezone')}
                  onChange={(val) => methods.setValue('timezone', val)}
                />
              </FormField>
              <FormField<CreateOrganizationInput>
                label={t('labelPlan')}
                name="subscriptionPlan"
                methods={methods}
              >
                <Select
                  value={methods.watch('subscriptionPlan')}
                  onValueChange={(val) =>
                    methods.setValue('subscriptionPlan', val ?? 'free')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">{t('planFree')}</SelectItem>
                    <SelectItem value="starter">{t('planStarter')}</SelectItem>
                    <SelectItem value="professional">
                      {t('planProfessional')}
                    </SelectItem>
                    <SelectItem value="enterprise">
                      {t('planEnterprise')}
                    </SelectItem>
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
