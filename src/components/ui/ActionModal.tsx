"use client";

import React from "react";
import Modal from "./Modal"; // <-- Düzeltildi
import Button from "./Button"; // <-- Düzeltildi
import { Loader2 } from "lucide-react";

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  action?: "delete" | "approve" | "reject" | "ban" | "unban" | string;
  isSubmitting?: boolean;
}

export const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  action,
  isSubmitting,
}) => {
  const getButtonVariant = () => {
    switch (action) {
      case "delete":
      case "ban":
      case "reject":
        return "danger";
      case "approve":
        return "primary";
      default:
        return "secondary";
    }
  };

  const getButtonText = () => {
      if (isSubmitting) {
          return (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                İşleniyor...
              </>
          )
      }
    switch (action) {
      case "delete":
        return "Evet, Sil";
      case "approve":
        return "Evet, Onayla";
      case "reject":
        return "Evet, Reddet";
      case "ban":
        return "Evet, Engelle";
      case "unban":
        return "Evet, Engeli Kaldır";
      default:
        return "Onayla";
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {description}
        </p>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            İptal
          </Button>
          <Button
            variant={getButtonVariant()}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {getButtonText()}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
