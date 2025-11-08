'use client';

import { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';

import { DeleteModal } from '@/components/Canvas/DeleteModal';
import { EditModal } from '@/components/Canvas/EditModal';
import type { Intention } from '@/types/canvas';

export function IntentionCard({
  intention,
  onDelete
}: {
  intention: Intention;
  onDelete: (id: string) => void;
}) {
  const [data, setData] = useState(intention);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSave = (title: string, description?: string) => {
    setData((prev) => ({
      ...prev,
      title,
      description,
    }));
  };

  return (
    <>
      <div
        className="relative bg-white border border-kings-grey-light rounded-lg p-4 shadow-sm cursor-pointer hover:border-kings-red focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 group"
        onClick={() => setOpen(true)}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setConfirmOpen(true);
          }}
          className="absolute top-2 right-2 text-kings-grey-dark opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Delete Intention"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
        <h3 className="font-semibold text-kings-black">{data.title || 'Untitled Intention'}</h3>
        {data.description && (
          <p className="text-sm text-kings-grey-dark mt-1">{data.description}</p>
        )}
      </div>

      <DeleteModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => onDelete(intention.id)}
        targetLabel={`the intention "${data.title || 'Untitled Intention'}"`}
      />

      <EditModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Edit Intention"
        initialTitle={data.title}
        initialDescription={data.description}
        onSave={handleSave}
      />
    </>
  );
}

export default IntentionCard;
