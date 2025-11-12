'use client';

import { useDraggable, useDndContext } from '@dnd-kit/core';
import { useState, type KeyboardEvent } from 'react';
import toast from 'react-hot-toast';

import { EditModal } from '@/components/Canvas/EditModal';
import type { Step } from '@/types/canvas';

type StepCardProps = {
  step: Step;
  onDelete: () => void;
  onMoveForward: () => void;
  onMoveBackward: () => void;
};

export function StepCard({ step, onDelete, onMoveForward, onMoveBackward }: StepCardProps) {
  const isGhost = step.status === 'ghost';
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: step.id,
    data: { type: 'step', step },
    disabled: isGhost,
  });
  const { active } = useDndContext();
  const [data, setData] = useState(step);
  const [open, setOpen] = useState(false);

  const handleSave = (title: string) => {
    setData((prev) => ({
      ...prev,
      title,
    }));
    toast('Changes saved', { icon: '💾' });
  };

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isGhost) {
      return;
    }
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
  const displayText = data.title || data.text || step.title || step.text || 'New Step';
  const baseClasses =
    'bg-white border border-kings-grey-light rounded-lg p-3 shadow-sm text-sm leading-snug focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white';
  const interactiveClasses =
    'cursor-pointer hover:border-kings-grey transition-colors';
  const ghostClasses =
    'border-dashed border-kings-grey-light/80 text-kings-grey-dark/70 animate-pulse cursor-default pointer-events-none select-none';

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...(isGhost ? {} : listeners)}
        {...(isGhost ? {} : attributes)}
        role="listitem"
        aria-grabbed={isGhost ? undefined : isDragging}
        aria-dropeffect={isGhost ? undefined : 'move'}
        tabIndex={isGhost ? -1 : 0}
        aria-busy={isGhost ? true : undefined}
        aria-label={
          isGhost
            ? `AI suggestion generating for ${step.bucket}`
            : `Step: ${displayText}. Press Enter to edit, Delete to remove, Arrow keys to move.`
        }
        onKeyDown={handleKeyDown}
        className={`${baseClasses} ${isGhost ? ghostClasses : interactiveClasses}`}
        onDoubleClick={() => {
          if (!isGhost) {
            setOpen(true);
          }
        }}
      >
        {displayText}
      </div>

      {!isGhost && (
        <EditModal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Edit Step"
          initialTitle={data.title ?? data.text ?? ''}
          onSave={handleSave}
        />
      )}
    </>
  );
}

export default StepCard;
