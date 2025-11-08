'use client';

import { useDraggable } from '@dnd-kit/core';
import { useState } from 'react';

import { EditModal } from '@/components/Canvas/EditModal';
import type { Intention } from '@/types/canvas';

export function IntentionCard({ intention }: { intention: Intention }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `intention-${intention.id}`,
    data: { intention },
  });
  const [data, setData] = useState(intention);
  const [open, setOpen] = useState(false);

  const handleSave = (title: string, description?: string) => {
    setData((prev) => ({
      ...prev,
      title,
      description,
    }));
  };

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className="relative border-2 border-kings-red/60 bg-kings-red/5 rounded-lg p-5 shadow-sm hover:border-kings-red transition-colors flex flex-col gap-2 min-h-[130px] focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40"
        onClick={() => setOpen(true)}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <h3 className="font-semibold text-kings-red text-base leading-snug">
          {data.title || 'Untitled Intention'}
        </h3>
        {data.description && (
          <p className="text-sm text-kings-grey-dark leading-snug">{data.description}</p>
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
