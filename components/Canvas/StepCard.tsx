'use client'

import { useDraggable, useDndContext } from '@dnd-kit/core'
import {
  useMemo,
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

const PERSISTED_ID_PATTERN = /^[a-fA-F0-9]{24}$/

function isLikelyPersistedId(value: string): boolean {
  return PERSISTED_ID_PATTERN.test(value)
}

function normaliseId(candidate: unknown): string | null {
  if (!candidate) {
    return null
  }

  if (typeof candidate === 'string') {
    return candidate
  }

  if (typeof candidate === 'object') {
    const asRecord = candidate as { $oid?: unknown; toHexString?: () => unknown; toString?: () => string }

    if (typeof asRecord.$oid === 'string' && asRecord.$oid) {
      return asRecord.$oid
    }

    if (typeof asRecord.toHexString === 'function') {
      const hex = asRecord.toHexString()
      if (typeof hex === 'string' && hex) {
        return hex
      }
    }

    if (typeof asRecord.toString === 'function') {
      const coerced = asRecord.toString()
      if (typeof coerced === 'string' && isLikelyPersistedId(coerced)) {
        return coerced
      }
    }
  }

  return null
}

function resolveCanonicalStepId(step: Step): string | null {
  const persisted = normaliseId(step._id)
  if (persisted) {
    return persisted
  }

  const fallback = normaliseId(step.id)

  if (fallback && isLikelyPersistedId(fallback)) {
    return fallback
  }

  return null
}

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
  const normalizedStatus = typeof step.status === 'string' ? step.status.toLowerCase() : undefined;
  const isGhost = normalizedStatus === 'ghost';
  const isSuggested = normalizedStatus === 'suggested';
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: step.id,
    data: { type: 'step', step },
    disabled: isGhost,
  });
  const { active } = useDndContext();
  const [data, setData] = useState(step);
  const [open, setOpen] = useState(false);
  const [opportunitiesOpen, setOpportunitiesOpen] = useState(false);
  const opportunitiesTriggerRef = useRef<HTMLButtonElement | null>(null);
  const canonicalStepId = useMemo(() => resolveCanonicalStepId(step), [step]);
  const shouldShowOpportunities = Boolean(canonicalStepId) && !isGhost && !isSuggested;
  const {
    opportunities,
    isLoading: opportunitiesLoading,
    error: opportunitiesError,
  } = useOpportunities(shouldShowOpportunities ? canonicalStepId : null);

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
  const opportunitiesCount = opportunities.length;
  const badgeContent = opportunitiesLoading ? '…' : opportunitiesError ? '!' : opportunitiesCount.toString();
  const badgeLabel = opportunitiesLoading
    ? 'Loading opportunities'
    : opportunitiesError
    ? 'Could not load opportunities'
    : `${opportunitiesCount} opportunit${opportunitiesCount === 1 ? 'y' : 'ies'}`;
  const badgeAriaLabel = `${badgeLabel} for ${displayText}`;
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
        {shouldShowOpportunities && (
          <div className="absolute right-3 top-3">
            <button
              ref={opportunitiesTriggerRef}
              type="button"
              className={`inline-flex min-w-[2.25rem] items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                opportunitiesError
                  ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                  : 'border-kings-grey-light bg-kings-grey-light/30 text-kings-grey-dark hover:bg-kings-grey-light/50'
              }`}
              aria-label={badgeAriaLabel}
              aria-haspopup="dialog"
              aria-expanded={opportunitiesOpen}
              aria-busy={opportunitiesLoading || undefined}
              title={badgeLabel}
              onClick={handleOpenOpportunities}
              onMouseDown={blockDrag}
              onTouchStart={blockDrag}
              onPointerDown={blockDrag}
            >
              {badgeContent}
            </button>
          </div>
        )}

        {isSuggested && (
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase leading-none text-amber-800">
              Suggested
            </span>
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
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Edit Step"
          initialTitle={data.title ?? data.text ?? ''}
          onSave={handleSave}
        />
      )}
      {shouldShowOpportunities && canonicalStepId && (
        <StepOpportunitiesModal
          stepId={canonicalStepId}
          stepTitle={displayText}
          isOpen={opportunitiesOpen}
          onClose={handleCloseOpportunities}
          opportunities={opportunities}
          isLoading={opportunitiesLoading}
          error={opportunitiesError}
        />
      )}
    </>
  );
}

export default StepCard;
