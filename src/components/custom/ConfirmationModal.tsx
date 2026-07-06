'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'default',
}: ConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl max-w-sm border border-border/40 p-6 select-none bg-card shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center space-y-3">
          <div className={`p-3 rounded-2xl ${variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-lg font-bold tracking-tight">{title}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-normal">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="grid grid-cols-2 gap-2 mt-4 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-2xl border-border h-11 text-xs font-semibold cursor-pointer"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-2xl h-11 text-xs font-semibold cursor-pointer"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
