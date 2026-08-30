"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { Spinner } from "@/components/ui";

/** 删除确认对话框 */
export default function ConfirmDialog({
  open,
  title = "确认删除",
  message,
  confirmText = "删除",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [localBusy, setLocalBusy] = useState(false);
  const isBusy = busy || localBusy;

  return (
    <Modal open={open} onClose={onCancel} title={title} maxWidth="max-w-sm">
      <p className="text-sm text-muted">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={isBusy}>
          取消
        </button>
        <button
          type="button"
          className="btn-danger"
          disabled={isBusy}
          onClick={async () => {
            setLocalBusy(true);
            try {
              await onConfirm();
            } finally {
              setLocalBusy(false);
            }
          }}
        >
          {isBusy ? <Spinner className="h-4 w-4" /> : confirmText}
        </button>
      </div>
    </Modal>
  );
}
