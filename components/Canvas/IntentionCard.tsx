'use client';

import { useState } from 'react';

import { EditModal } from '@/components/Canvas/EditModal';
import type { Intention } from '@/types/canvas';

export function IntentionCard({ intention }: { intention: Intention }) {
  const [data, setData] = useState(intention);
  const [open, setOpen] = useState(false);

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
        className="bg-white border border-kings-grey-light rounded-lg p-4 shadow-sm cursor-pointer hover:border-kings-red focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40"
        onClick={() => setOpen(true)}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <h3 className="font-semibold text-kings-black">{data.title || 'Untitled Intention'}</h3>
        {data.description && (
          <p className="text-sm text-kings-grey-dark mt-1">{data.description}</p>
        )}
      </div>

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
