'use client'

import { useDraggable } from '@dnd-kit/core'

import type { Step } from '@/types/canvas'

export type StepCardProps = {
  step: Step
}

export function StepCard({ step }: StepCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: step.id,
    data: { step }
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

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
