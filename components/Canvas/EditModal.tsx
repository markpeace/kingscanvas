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
      <div className="bg-white border-2 border-kings-red rounded-lg shadow-xl p-6 w-[400px] text-kings-black">
        <h2 className="text-lg font-semibold text-kings-red mb-4">{title}</h2>
        <form onSubmit={submit} className="space-y-4">
          <input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Title"
            className="w-full border border-kings-grey-light rounded-md p-2 text-sm text-kings-black placeholder-kings-grey-dark bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:border-kings-red"
          />
          {typeof initialDescription === 'string' && (
            <textarea
              value={newDesc}
              onChange={(event) => setNewDesc(event.target.value)}
              placeholder="Description"
              className="w-full border border-kings-grey-light rounded-md p-2 text-sm text-kings-black placeholder-kings-grey-dark bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:border-kings-red"
              rows={3}
            />
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-kings-grey-dark px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="border border-kings-red text-kings-red px-4 py-2 text-sm rounded-md hover:bg-kings-red hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2"
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
