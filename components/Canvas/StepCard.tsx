'use client'

import { useDraggable, useDndContext } from '@dnd-kit/core'
import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type TouchEvent
} from 'react'
import toast from 'react-hot-toast'

import { EditModal } from '@/components/Canvas/EditModal'
import { StepOpportunitiesModal } from '@/components/Canvas/StepOpportunitiesModal'
import { useFakeOpportunities } from '@/hooks/useFakeOpportunities'
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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isOpportunitiesOpen, setIsOpportunitiesOpen] = useState(false);
  const opportunitiesTriggerRef = useRef<HTMLButtonElement>(null);
  const { opportunities, count: opportunitiesCount } = useFakeOpportunities(step.id);

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
      setIsEditOpen(true);
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
    'step-card relative flex flex-col gap-3 rounded-xl border border-kings-grey-light bg-white px-4 py-3 shadow-sm text-sm leading-relaxed focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white'
  const interactiveClasses = 'cursor-pointer transition-colors hover:border-kings-grey'
  const ghostClasses = 'cursor-default select-none'
  const suggestedClasses =
    'border-amber-200 bg-amber-50'
  const cardClasses = [
    isSuggested ? 'suggested' : '',
    baseClasses,
    isGhost ? ghostClasses : interactiveClasses,
    isSuggested ? suggestedClasses : ''
  ]
    .filter(Boolean)
    .join(' ')

  const suggestedAccent = isSuggested
    ? { boxShadow: 'inset 3px 0 0 0 rgba(217, 119, 6, 0.6)' }
    : {}

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
            setIsEditOpen(true);
          }
        }}
      >
        {(isSuggested || !isGhost) && (
          <div className="flex items-start justify-between gap-3">
            {isSuggested && (
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase leading-none text-amber-800">
                  Suggested
                </span>
              </div>
            )}

            {!isGhost && (
              <button
                type="button"
                ref={opportunitiesTriggerRef}
                onClick={(event) => {
                  blockDrag(event);
                  setIsOpportunitiesOpen(true);
                }}
                onMouseDown={blockDrag}
                onTouchStart={blockDrag}
                onPointerDown={blockDrag}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                  opportunitiesCount > 0
                    ? 'border-kings-red/40 bg-kings-red/10 text-kings-red hover:bg-kings-red/20'
                    : 'border-kings-grey-light bg-kings-grey-light/40 text-kings-grey-dark hover:bg-kings-grey-light/60'
                }`}
                aria-label={
                  opportunitiesCount === 1
                    ? 'View 1 opportunity for this step'
                    : `View ${opportunitiesCount} opportunities for this step`
                }
              >
                {opportunitiesCount === 1
                  ? '1 opportunity'
                  : `${opportunitiesCount} opportunities`}
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 text-left">
          <p className="max-w-prose text-sm font-medium leading-relaxed text-slate-900">{displayText}</p>
        </div>

        {showActions && (
          <div
            className="accept-reject-zone mt-4 flex flex-wrap items-center gap-3"
            style={{ pointerEvents: 'auto' }}
          >
            {onAccept && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-green-600 px-3 py-1 text-xs font-semibold text-green-700 transition-colors hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600/40"
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
                className="text-xs font-medium text-red-600 underline-offset-2 hover:underline"
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
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title="Edit Step"
          initialTitle={data.title ?? data.text ?? ''}
          onSave={handleSave}
        />
      )}

      {!isGhost && (
        <StepOpportunitiesModal
          isOpen={isOpportunitiesOpen}
          onClose={() => {
            setIsOpportunitiesOpen(false);
            opportunitiesTriggerRef.current?.focus();
          }}
          stepTitle={displayText}
          opportunities={opportunities}
        />
      )}
    </>
  );
}

export default StepCard;
