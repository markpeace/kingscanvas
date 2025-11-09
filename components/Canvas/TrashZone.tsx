'use client';

import { useDroppable } from '@dnd-kit/core';
import { CheckIcon, TrashIcon } from '@heroicons/react/24/solid';
import { memo, useEffect, useState } from 'react';

const MemoTrashIcon = memo(TrashIcon);
const MemoCheckIcon = memo(CheckIcon);

type TrashZoneProps = {
  intentionId: string;
  didDrop?: 'step' | 'intention' | null;
};

export function TrashZone({ intentionId, didDrop = null }: TrashZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id: `trash-${intentionId}` });
  const [dropped, setDropped] = useState<'step' | 'intention' | null>(null);

  useEffect(() => {
    if (didDrop) {
      setDropped(didDrop);
    }
  }, [didDrop]);

  useEffect(() => {
    if (!dropped) {
      return;
    }

    const duration = dropped === 'intention' ? 600 : 500;
    const timeout = window.setTimeout(() => setDropped(null), duration);

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
          'relative w-14 h-14 rounded-full border-2 flex items-center justify-center',
          'shadow-sm backdrop-blur-md transition-all duration-200',
          isOver
            ? 'bg-kings-red/20 border-kings-red scale-110'
            : 'bg-white/80 border-kings-red/60'
        ].join(' ')}
      >
        {dropped === 'intention' ? (
          <div className="absolute inset-0 bg-kings-red/20 rounded-full animate-pulse" />
        ) : null}
        <div className="relative z-10 flex items-center justify-center">
          {dropped ? (
            <MemoCheckIcon className="w-6 h-6 text-kings-red" />
          ) : (
            <MemoTrashIcon
              className={`w-6 h-6 ${
                isOver ? 'text-kings-red' : 'text-kings-red/70'
              }`}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default TrashZone;
