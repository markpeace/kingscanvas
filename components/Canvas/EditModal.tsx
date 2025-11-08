'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialTitle: string;
  initialDescription?: string;
  onSave: (t: string, d?: string) => void;
}

export function EditModal({
  isOpen,
  onClose,
  title,
  initialTitle,
  initialDescription,
  onSave,
}: EditModalProps) {
  const [newTitle, setNewTitle] = useState(initialTitle);
  const [newDesc, setNewDesc] = useState(initialDescription || '');

  useEffect(() => {
    if (isOpen) {
      setNewTitle(initialTitle);
      setNewDesc(initialDescription || '');
    }
  }, [isOpen, initialTitle, initialDescription]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(newTitle.trim(), newDesc.trim());
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[400px]">
        <h2 className="text-lg font-semibold text-kings-red mb-4">{title}</h2>
        <form onSubmit={submit} className="space-y-4">
          <input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Title"
            className="w-full border border-kings-grey-light rounded-md p-2 text-sm"
          />
          {typeof initialDescription === 'string' && (
            <textarea
              value={newDesc}
              onChange={(event) => setNewDesc(event.target.value)}
              placeholder="Description"
              className="w-full border border-kings-grey-light rounded-md p-2 text-sm"
              rows={3}
            />
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-kings-grey-dark px-3 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-kings-red text-white px-4 py-2 text-sm rounded-md hover:bg-kings-red/90"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default EditModal;
