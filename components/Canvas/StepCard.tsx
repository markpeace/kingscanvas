'use client';

import { useDraggable, useDndContext } from '@dnd-kit/core';
import {
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type SyntheticEvent,
} from 'react';
import toast from 'react-hot-toast';

import { EditModal } from '@/components/Canvas/EditModal';
import type { Step } from '@/types/canvas';

type StepCardProps = {
  step: Step;
  onDelete: () => void;
  onMoveForward: () => void;
  onMoveBackward: () => void;
  onAccept?: (step: Step) => void;
  onReject?: (step: Step) => void;
};

export function StepCard({ step, onDelete, onMoveForward, onMoveBackward, onAccept, onReject }: StepCardProps) {
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
    : {};
  const cardStyle: CSSProperties = {
    ...transformStyle,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 50,
    pointerEvents: isGhost ? 'none' : 'auto',
    touchAction: 'manipulation',
  };

  const sanitizedListeners = useMemo(() => {
    if (!listeners) {
      return listeners;
    }

    const originalPointerDown = listeners.onPointerDown;

    return {
      ...listeners,
      onPointerDown(event: PointerEvent) {
        const target = event.target as HTMLElement | null;

        if (target?.closest('.accept-reject-zone')) {
          event.stopPropagation();
          event.preventDefault();
          return;
        }

        originalPointerDown?.(event);
      },
    };
  }, [listeners]);

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
    'mb-2 rounded-md border border-kings-grey-light p-3 shadow-sm text-sm leading-snug focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white';
  const interactiveClasses =
    'cursor-pointer hover:border-kings-grey transition-colors';
  const ghostClasses =
    'bg-white border-dashed border-kings-grey-light/80 text-kings-grey-dark/70 animate-pulse cursor-default pointer-events-none select-none';
  const suggestedClasses =
    'border-dashed border-kings-grey-light bg-kings-grey-light/20 text-kings-grey-dark';
  const defaultBackground = 'bg-white';

  const blockDrag = useCallback((event: SyntheticEvent<HTMLElement>) => {
    event.stopPropagation();
    event.preventDefault();
  }, []);

  const handleDecision = useCallback(
    (handler?: (step: Step) => void) =>
      (event: MouseEvent<HTMLButtonElement>) => {
        blockDrag(event);
        handler?.(step);
      },
    [blockDrag, step]
  );

  return (
    <>
      <div
        ref={setNodeRef}
        style={cardStyle}
        {...(isGhost ? {} : sanitizedListeners ?? {})}
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
        className={`${baseClasses} relative overflow-hidden ${
          isGhost
            ? ghostClasses
            : `${interactiveClasses} ${isSuggested ? suggestedClasses : defaultBackground}`
        }`}
        onDoubleClick={() => {
          if (!isGhost) {
            setOpen(true);
          }
        }}
      >
        <div className="flex flex-col gap-2">
          <div className="text-sm leading-snug">{displayText}</div>

          {isSuggested && (
            <div className="mt-1 flex flex-row items-center gap-3 text-xs pointer-events-auto accept-reject-zone">
              <button
                type="button"
                onClick={handleDecision(onAccept)}
                onTouchStart={blockDrag}
                onMouseDown={blockDrag}
                className="text-green-700 underline hover:text-green-900"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={handleDecision(onReject)}
                onTouchStart={blockDrag}
                onMouseDown={blockDrag}
                className="text-red-600 underline hover:text-red-800"
              >
                Reject
              </button>
            </div>
          )}
        </div>
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
