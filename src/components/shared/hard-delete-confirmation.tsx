'use client';

import { useTranslations } from 'next-intl';
import { type ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type HardDeleteConfirmationProps = {
  entityName: string;
  warningTitle: string;
  warningDescription: string;
  confirmTitle: string;
  confirmDescription: string;
  confirmButtonLabel: string;
  onConfirm: () => void;
  isPending: boolean;
  trigger: ReactNode;
  loadingLabel: string;
};

export function HardDeleteConfirmation({
  entityName,
  warningTitle,
  warningDescription,
  confirmTitle,
  confirmDescription,
  confirmButtonLabel,
  onConfirm,
  isPending,
  trigger,
  loadingLabel,
}: HardDeleteConfirmationProps) {
  const t = useTranslations('common.hardDelete');
  const [stage, setStage] = useState<'warning' | 'confirm'>('warning');
  const [open, setOpen] = useState(false);
  const [typedName, setTypedName] = useState('');

  const isMatch = typedName === entityName;

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    setOpen(nextOpen);
    if (!nextOpen) {
      setStage('warning');
      setTypedName('');
    }
  }

  function handleContinue() {
    setStage('confirm');
  }

  function handleConfirm() {
    if (!isMatch) return;
    onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent>
        {stage === 'warning' ? (
          <>
            <DialogHeader>
              <DialogTitle>{warningTitle}</DialogTitle>
              <DialogDescription>{warningDescription}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t('cancelButton')}
              </Button>
              <Button variant="destructive" onClick={handleContinue}>
                {t('continueButton')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{confirmTitle}</DialogTitle>
              <DialogDescription>{confirmDescription}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <Label>{t('confirmLabel', { name: entityName })}</Label>
              <Input
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder={t('inputPlaceholder')}
                autoComplete="off"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t('cancelButton')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={!isMatch || isPending}
              >
                {isPending ? loadingLabel : confirmButtonLabel}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
