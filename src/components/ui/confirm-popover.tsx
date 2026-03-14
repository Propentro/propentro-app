'use client';

import { Trash2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';

type ConfirmPopoverProps = {
  title: string;
  description: string;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'default';
  trigger?: React.ReactElement;
};

export function ConfirmPopover({
  title,
  description,
  onConfirm,
  confirmLabel,
  cancelLabel,
  variant = 'destructive',
  trigger,
}: ConfirmPopoverProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('common');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          trigger ?? (
            <Button variant="ghost" size="icon-sm" aria-label={t('delete')}>
              <Trash2Icon className="size-4" />
            </Button>
          )
        }
      />
      <PopoverContent side="left" className="w-56">
        <PopoverHeader>
          <PopoverTitle className="flex items-center gap-1.5">
            {variant === 'destructive' && (
              <Trash2Icon className="text-destructive size-4" />
            )}
            {title}
          </PopoverTitle>
          <PopoverDescription>{description}</PopoverDescription>
        </PopoverHeader>
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            {confirmLabel ?? t('yes')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
            {cancelLabel ?? t('no')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
