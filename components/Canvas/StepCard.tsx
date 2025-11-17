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
import { useOpportunities } from '@/hooks/useOpportunities'
import { debug } from '@/lib/debug'
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

type StepOpportunitiesSectionProps = {
  stepId: string
  stepTitle: string
}

function StepOpportunitiesSection({ stepId, stepTitle }: StepOpportunitiesSectionProps) {
  const [opportunitiesOpen, setOpportunitiesOpen] = useState(false)
  const opportunitiesTriggerRef = useRef<HTMLButtonElement | null>(null)
  const {
    opportunities,
    isLoading: opportunitiesLoading,
    error: opportunitiesError,
    refetch
  } = useOpportunities(stepId)

  const opportunitiesCount = opportunities.length
  const isBusy = opportunitiesLoading
  const badgeContent = isBusy ? '…' : opportunitiesError ? '!' : opportunitiesCount.toString()
  const badgeLabel = isBusy
    ? 'Loading opportunities'
    : opportunitiesError
    ? 'Could not load opportunities'
    : `${opportunitiesCount} opportunit${opportunitiesCount === 1 ? 'y' : 'ies'}`
  const badgeAriaLabel = `${badgeLabel} for ${stepTitle}`

  const handleOpenOpportunities = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setOpportunitiesOpen(true)
  }

  const handleCloseOpportunities = () => {
    setOpportunitiesOpen(false)
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        opportunitiesTriggerRef.current?.focus()
      })
    } else {
      opportunitiesTriggerRef.current?.focus()
    }
  }

  return (
    <>
      <div className="absolute right-1.5 top-1.5 z-10">
        <button
          ref={opportunitiesTriggerRef}
          type="button"
          className={`inline-flex h-7 min-w-[2rem] items-center justify-center rounded-full border px-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
            opportunitiesError
              ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
              : 'border-kings-grey-light bg-kings-grey-light/30 text-kings-grey-dark hover:bg-kings-grey-light/50'
          }`}
          aria-label={badgeAriaLabel}
          aria-haspopup="dialog"
          aria-expanded={opportunitiesOpen}
          aria-busy={isBusy || undefined}
          title={badgeLabel}
          onClick={handleOpenOpportunities}
          onMouseDown={blockDrag}
          onTouchStart={blockDrag}
          onPointerDown={blockDrag}
        >
          {badgeContent}
        </button>
      </div>

      <StepOpportunitiesModal
        stepId={stepId}
        stepTitle={stepTitle}
        isOpen={opportunitiesOpen}
        onClose={handleCloseOpportunities}
        opportunities={opportunities}
        isLoading={opportunitiesLoading}
        error={opportunitiesError}
        refetch={refetch}
      />
    </>
  )
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
  const trimmedStepId = typeof step.id === 'string' ? step.id.trim() : '';
  const hasStepId = trimmedStepId.length > 0;
  const shouldShowOpportunities = !isGhost && !isSuggested;
  const shouldRenderOpportunities = shouldShowOpportunities && hasStepId;

  debug.trace('StepCard: render', {
    stepId: trimmedStepId,
    clientId: step.clientId,
    status: step.status,
    source: step.source,
    isGhost,
    isSuggested,
  });

  debug.trace('StepCard: opportunities eligibility', {
    stepId: trimmedStepId,
    clientId: step.clientId,
    isGhost,
    isSuggested,
    hasStepId,
    shouldShowOpportunities,
    shouldRenderOpportunities,
  });
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: step.clientId,
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

  const isDragging = active?.id === step.clientId;
  const displayText = data.title || data.text || step.title || step.text || 'New Step';
  const baseClasses =
    'step-card relative flex flex-col rounded-xl border border-kings-grey-light bg-white shadow-sm text-sm leading-relaxed focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white'
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
            setOpen(true);
          }
        }}
      >
        {shouldRenderOpportunities && (
          <StepOpportunitiesSection stepId={trimmedStepId} stepTitle={displayText} />
        )}

        <div className="flex flex-col gap-3 px-3 py-3 text-left">
          {isSuggested && (
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase leading-none text-amber-800">
                Suggested
              </span>
            </div>
          )}

          <p className="max-w-prose text-sm font-medium leading-relaxed text-slate-900">{displayText}</p>

          {showActions && (
            <div
              className="accept-reject-zone flex flex-wrap items-center gap-3 pt-2"
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
