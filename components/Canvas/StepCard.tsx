'use client';

import { useDraggable, useDndContext } from '@dnd-kit/core';
import { useState, type KeyboardEvent } from 'react';

import { EditModal } from '@/components/Canvas/EditModal';
import type { Step } from '@/types/canvas';

type StepCardProps = {
  step: Step;
  onDelete: () => void;
  onMoveForward: () => void;
  onMoveBackward: () => void;
};

export function StepCard({ step, onDelete, onMoveForward, onMoveBackward }: StepCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: step.id,
    data: { type: 'step', step },
  });
  const { active } = useDndContext();
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

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
      return;
    }

    if (event.key === 'Delete') {
      event.preventDefault();
      onDelete();
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onMoveForward();
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onMoveBackward();
    }
  };

  const isDragging = active?.id === step.id;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        role="listitem"
        aria-grabbed={isDragging}
        aria-dropeffect="move"
        tabIndex={0}
        aria-label={`Step: ${data.title || 'New Step'}. Press Enter to edit, Delete to remove, Arrow keys to move.`}
        onKeyDown={handleKeyDown}
        className="bg-white border border-kings-grey-light rounded-lg p-3 shadow-sm text-sm leading-snug cursor-pointer hover:border-kings-grey transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        onDoubleClick={() => setOpen(true)}
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
