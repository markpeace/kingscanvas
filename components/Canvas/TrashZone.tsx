'use client';

import { useDroppable } from '@dnd-kit/core';
import { TrashIcon } from '@heroicons/react/24/solid';

export function TrashZone({ intentionId }: { intentionId: string }) {
  const { isOver, setNodeRef } = useDroppable({ id: `trash-${intentionId}` });

  return (
    <div
      ref={setNodeRef}
      className={[
        'flex items-center justify-center h-full w-[80px] rounded-md transition-all duration-200',
        isOver ? 'bg-kings-red/20 border-2 border-kings-red' : 'bg-transparent'
      ].join(' ')}
    >
      <TrashIcon
        className={`w-6 h-6 ${
          isOver ? 'text-kings-red' : 'text-kings-grey-dark/40'
        }`}
      />
    </div>
  );
}

export default TrashZone;
