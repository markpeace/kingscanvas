'use client';

import { useDraggable } from '@dnd-kit/core';

import { useEditableText } from '@/hooks/useEditableText';
import type { Step } from '@/types/canvas';

export function StepCard({ step }: { step: Step }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: step.id,
    data: { step },
  });
  const titleEdit = useEditableText(step.title);

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white border border-kings-grey-light rounded-md p-3 shadow-sm text-sm cursor-grab hover:shadow-md active:cursor-grabbing"
    >
      {titleEdit.editing ? (
        <input
          value={titleEdit.value}
          onChange={(e) => titleEdit.setValue(e.target.value)}
          onBlur={() => titleEdit.commit()}
          onKeyDown={(e) => e.key === 'Enter' && titleEdit.commit()}
          className="w-full border border-kings-grey-light rounded-md px-3 py-1.5 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-kings-red/30"
          autoFocus
        />
      ) : (
        <span
          onDoubleClick={titleEdit.startEditing}
          className="cursor-text text-kings-black hover:text-kings-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/30 rounded"
          tabIndex={0}
          onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && titleEdit.startEditing()}
        >
          {titleEdit.value || 'New Step'}
        </span>
      )}
    </div>
  );
}

export default StepCard;
