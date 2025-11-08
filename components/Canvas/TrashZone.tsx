'use client';

import { useDroppable } from '@dnd-kit/core';
import { TrashIcon } from '@heroicons/react/24/solid';

export function TrashZone({ intentionId }: { intentionId: string }) {
  const { isOver, setNodeRef } = useDroppable({ id: `trash-${intentionId}` });

  return (
    <div
      ref={setNodeRef}
      className={[
        'TrashZone flex items-center justify-center self-stretch h-fit min-h-[110px] w-[64px]',
        'transition-all duration-200 ease-in-out rounded-md',
        isOver
          ? 'bg-kings-red/15 border-2 border-kings-red shadow-inner'
          : 'border border-kings-red/40 bg-transparent opacity-60'
      ].join(' ')}
    >
      <TrashIcon
        className={`w-5 h-5 transition-colors ${
          isOver ? 'text-kings-red' : 'text-kings-red/60'
        }`}
      />
    </div>
  );
}

export default TrashZone;
