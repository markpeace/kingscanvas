'use client';

import { createPortal } from 'react-dom';

export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  targetLabel
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetLabel: string;
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white border-2 border-kings-red rounded-lg shadow-xl p-6 w-[360px] text-kings-black">
        <h2 className="text-lg font-semibold text-kings-red mb-3">Confirm Delete</h2>
        <p className="text-sm mb-5">
          Are you sure you want to delete <strong>{targetLabel}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-kings-grey-dark px-3 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="bg-kings-red text-white px-4 py-2 text-sm rounded-md hover:bg-kings-red/90"
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default DeleteModal;
