'use client'

import { useDraggable, useDndContext } from '@dnd-kit/core'
import {
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type TouchEvent
} from 'react'
import toast from 'react-hot-toast'

import { EditModal } from '@/components/Canvas/EditModal'
import type { Step } from '@/types/canvas'

type StepCardProps = {
  step: Step
  onDelete: () => void
  onMoveForward: () => void
  onMoveBackward: () => void
  onAccept?: (step: Step) => void
  onReject?: (step: Step) => void
  ghostStyle?: CSSProperties
}

type DragBlockEvent = MouseEvent<HTMLElement> | TouchEvent<HTMLElement> | PointerEvent<HTMLElement>

function blockDrag(event: DragBlockEvent) {
  event.stopPropagation()
  event.preventDefault()
}

export function StepCard({
  step,
  onDelete,
  onMoveForward,
  onMoveBackward,
  onAccept,
  onReject,
  ghostStyle
}: StepCardProps) {
  const isGhost = step.status === 'ghost';
  const isSuggested = step.status === 'suggested';
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

  const transformStyle = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {}

  const defaultGhostStyle: CSSProperties = {
    pointerEvents: 'none',
    opacity: 0.6
  }

  const suggestedAnimation: CSSProperties = isSuggested
    ? { opacity: 0, animation: 'fadeInStep 0.35s ease forwards' }
    : {}

  const cardStyle: CSSProperties = {
    ...transformStyle,
    touchAction: 'manipulation',
    overflow: 'hidden',
    position: 'relative',
    ...suggestedAnimation,
    ...(isGhost
      ? { ...defaultGhostStyle, ...(ghostStyle ?? {}) }
      : {})
  }

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
    'relative bg-white border border-kings-grey-light rounded-lg p-3 shadow-sm text-sm leading-snug focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white'
  const interactiveClasses = 'cursor-pointer hover:border-kings-grey transition-colors'
  const ghostClasses = 'cursor-default select-none'
  const suggestedClasses = 'border-dashed border-kings-grey-light bg-kings-grey-light/10'
  const cardClasses = [
    'step-card',
    isSuggested ? 'suggested' : '',
    baseClasses,
    isGhost ? ghostClasses : interactiveClasses,
    isSuggested ? suggestedClasses : ''
  ]
    .filter(Boolean)
    .join(' ')

  const suggestedAccent = isSuggested ? { borderLeft: '4px solid #f0b76e' } : {}

  const showActions = isSuggested && (onAccept || onReject)

  const handleAcceptClick = (event: MouseEvent<HTMLButtonElement>) => {
    blockDrag(event)
    if (onAccept) {
      void onAccept(step)
    }
  }

  const handleRejectClick = (event: MouseEvent<HTMLButtonElement>) => {
    blockDrag(event)
    if (onReject) {
      void onReject(step)
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={{ ...cardStyle, ...suggestedAccent }}
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
        className={cardClasses}
        onDoubleClick={() => {
          if (!isGhost) {
            setOpen(true);
          }
        }}
      >
        {displayText}

        {showActions && (
          <div
            className="flex flex-row gap-4 mt-2 accept-reject-zone"
            style={{ pointerEvents: 'auto' }}
          >
            {onAccept && (
              <button
                type="button"
                className="text-green-700 underline text-sm"
                style={{ padding: '6px 4px' }}
                onClick={handleAcceptClick}
                onMouseDown={blockDrag}
                onTouchStart={blockDrag}
                onPointerDown={blockDrag}
              >
                Accept
              </button>
            )}

            {onReject && (
              <button
                type="button"
                className="text-red-600 underline text-sm"
                style={{ padding: '6px 4px' }}
                onClick={handleRejectClick}
                onMouseDown={blockDrag}
                onTouchStart={blockDrag}
                onPointerDown={blockDrag}
              >
                Reject
              </button>
            )}
          </div>
        )}
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
