'use client';

import { useDraggable } from '@dnd-kit/core';
import { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';

import { DeleteModal } from '@/components/Canvas/DeleteModal';
import { EditModal } from '@/components/Canvas/EditModal';
import type { Step } from '@/types/canvas';

export function StepCard({
  step,
  onDelete
}: {
  step: Step;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: step.id,
    data: { step },
  });
  const [data, setData] = useState(step);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSave = (title: string) => {
    setData((prev) => ({
      ...prev,
      title,
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
        className="relative bg-white border border-kings-grey-light rounded-md p-3 shadow-sm text-sm cursor-grab hover:shadow-md active:cursor-grabbing hover:border-kings-red focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 group"
        onDoubleClick={() => setOpen(true)}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {data.title || 'New Step'}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setConfirmOpen(true);
          }}
          className="absolute top-2 right-2 text-kings-grey-dark opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Delete Step"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      <DeleteModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => onDelete(step.id)}
        targetLabel={`the step "${data.title || 'New Step'}"`}
      />

      <EditModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Edit Step"
        initialTitle={data.title}
        onSave={handleSave}
      />
    </>
  );
}

export default StepCard;
