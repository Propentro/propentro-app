'use client';

import { ArrowLeft, LoaderIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';

interface EntityHeaderProps {
  name: string;
  isActive: boolean;
  activeLabel: string;
  inactiveLabel: string;
  identifiers: string[];
  backHref: string;
  backLabel: string;
  quickAction: {
    label: string;
    onClick: () => void;
    isPending: boolean;
    variant: 'default' | 'destructive';
  };
  children?: ReactNode;
}

export function EntityHeader({
  name,
  isActive,
  activeLabel,
  inactiveLabel,
  identifiers,
  backHref,
  backLabel,
  quickAction,
  children,
}: EntityHeaderProps) {
  return (
    <div className="space-y-4">
      <Link
        href={backHref}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        {backLabel}
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-semibold">{name}</h1>
            <Badge variant={isActive ? 'default' : 'outline'}>
              {isActive ? activeLabel : inactiveLabel}
            </Badge>
          </div>
          {identifiers.length > 0 && (
            <p className="text-muted-foreground truncate text-sm">
              {identifiers.join(' · ')}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {children}
          <Button
            variant={quickAction.variant}
            size="sm"
            onClick={quickAction.onClick}
            disabled={quickAction.isPending}
          >
            {quickAction.isPending && (
              <LoaderIcon className="animate-spin" />
            )}
            {quickAction.label}
          </Button>
        </div>
      </div>
    </div>
  );
}
