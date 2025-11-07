'use client'

import { useDraggable } from '@dnd-kit/core'

import type { Step } from '@/types/canvas'

export function StepCard({ step }: { step: Step }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `${step.intentionId}:${step.id}`
  })

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white border border-kings-grey-light rounded-md p-3 shadow-sm text-sm cursor-grab hover:shadow-md active:cursor-grabbing"
    >
      {step.title}
    </div>
  )
}

export default StepCard
