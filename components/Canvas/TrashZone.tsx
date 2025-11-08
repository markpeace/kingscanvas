'use client';

import { useDroppable } from '@dnd-kit/core';
import { CheckIcon, TrashIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';

type TrashZoneProps = {
  intentionId: string;
  didDrop?: boolean;
};

export function TrashZone({ intentionId, didDrop = false }: TrashZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id: `trash-${intentionId}` });
  const [dropped, setDropped] = useState(false);

  useEffect(() => {
    if (didDrop) {
      setDropped(true);
    }
  }, [didDrop]);

  useEffect(() => {
    if (!dropped) {
      return;
    }

    const timeout = window.setTimeout(() => setDropped(false), 500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [dropped]);

  return (
    <div
      ref={setNodeRef}
      className={[
        'transition-all duration-200 ease-in-out flex items-center justify-center',
        'pointer-events-none group-[.dragging]:pointer-events-auto',
        'opacity-0 group-[.dragging]:opacity-100'
      ].join(' ')}
    >
      <div
        className={[
          'w-14 h-14 rounded-full border-2 flex items-center justify-center',
          'shadow-sm backdrop-blur-md transition-all duration-200',
          isOver
            ? 'bg-kings-red/20 border-kings-red scale-110'
            : 'bg-white/80 border-kings-red/60'
        ].join(' ')}
      >
        {dropped ? (
          <CheckIcon className="w-6 h-6 text-kings-red" />
        ) : (
          <TrashIcon
            className={`w-6 h-6 ${
              isOver ? 'text-kings-red' : 'text-kings-red/70'
            }`}
          />
        )}
      </div>
    </div>
  );
}

export default TrashZone;
