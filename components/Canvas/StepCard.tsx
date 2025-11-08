'use client';

import { useDraggable } from '@dnd-kit/core';
import { useState } from 'react';

import { EditModal } from '@/components/Canvas/EditModal';
import type { Step } from '@/types/canvas';

type StepCardProps = {
  step: Step;
  onDelete: () => void;
};

export function StepCard({ step, onDelete }: StepCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: step.id,
    data: { type: 'step', step },
  });
  const [data, setData] = useState(step);
  const [open, setOpen] = useState(false);

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
        className="bg-white border border-kings-grey-light rounded-lg p-3 shadow-sm text-sm leading-snug cursor-pointer hover:border-kings-grey transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40"
        onDoubleClick={() => setOpen(true)}
        tabIndex={0}
        aria-label={`Step: ${data.title || 'New Step'}. Press Enter to edit or Delete to remove.`}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(true);
          } else if (event.key === 'Delete') {
            event.preventDefault();
            onDelete();
          }
        }}
      >
        {data.title || 'New Step'}
      </div>

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
