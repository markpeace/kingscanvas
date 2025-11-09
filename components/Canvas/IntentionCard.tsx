'use client';

import { useDraggable, useDndContext } from '@dnd-kit/core';
import { useState, type KeyboardEvent } from 'react';
import toast from 'react-hot-toast';

import { EditModal } from '@/components/Canvas/EditModal';
import type { Intention } from '@/types/canvas';

type IntentionCardProps = {
  intention: Intention;
  onDelete: () => void;
  onMoveForward: () => void;
  onMoveBackward: () => void;
};

export function IntentionCard({ intention, onDelete, onMoveForward, onMoveBackward }: IntentionCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: intention.id,
    data: { type: 'intention', intention },
  });
  const { active } = useDndContext();
  const [data, setData] = useState(intention);
  const [open, setOpen] = useState(false);

  const handleSave = (title: string, description?: string) => {
    setData((prev) => ({
      ...prev,
      title,
      description,
    }));
    toast('Changes saved', { icon: '💾' });
  };

  const style =
    transform != null
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
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

  const isDragging = active?.id === intention.id;

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
        aria-label={`Intention: ${data.title || 'Untitled Intention'}. Press Enter to edit, Delete to remove, Arrow keys to move.`}
        onKeyDown={handleKeyDown}
        className="relative border-2 border-kings-red/70 bg-kings-red/5 rounded-lg p-5 shadow-sm hover:border-kings-red transition-colors flex flex-col gap-2 min-h-[130px] focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        onClick={() => setOpen(true)}
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
