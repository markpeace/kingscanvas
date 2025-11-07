'use client';

import { useEditableText } from '@/hooks/useEditableText';
import type { Intention } from '@/types/canvas';

export function IntentionCard({ intention }: { intention: Intention }) {
  const titleEdit = useEditableText(intention.title);
  const descEdit = useEditableText(intention.description || '');

  return (
    <div className="bg-white border border-kings-grey-light rounded-lg p-4 shadow-sm">
      {titleEdit.editing ? (
        <input
          className="w-full border border-kings-grey-light rounded-md px-3 py-2 text-base font-semibold mb-2 leading-6 focus:outline-none focus:ring-2 focus:ring-kings-red/40"
          value={titleEdit.value}
          onChange={(e) => titleEdit.setValue(e.target.value)}
          onBlur={() => titleEdit.commit()}
          onKeyDown={(e) => e.key === 'Enter' && titleEdit.commit()}
          autoFocus
        />
      ) : (
        <h3
          className="font-semibold text-lg text-kings-black cursor-pointer hover:text-kings-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/40"
          tabIndex={0}
          onClick={titleEdit.startEditing}
          onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && titleEdit.startEditing()}
        >
          {titleEdit.value || 'Untitled Intention'}
        </h3>
      )}

      {descEdit.editing ? (
        <textarea
          className="w-full border border-kings-grey-light rounded-md px-3 py-2 text-sm leading-5 mt-2 focus:outline-none focus:ring-2 focus:ring-kings-red/30"
          value={descEdit.value}
          onChange={(e) => descEdit.setValue(e.target.value)}
          onBlur={() => descEdit.commit()}
          onKeyDown={(e) => e.key === 'Enter' && descEdit.commit()}
          rows={2}
          autoFocus
        />
      ) : (
        <p
          className="text-sm text-kings-grey-dark cursor-pointer mt-1 leading-5 hover:text-kings-red/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kings-red/30"
          tabIndex={0}
          onClick={descEdit.startEditing}
          onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && descEdit.startEditing()}
        >
          {descEdit.value || 'Add a description'}
        </p>
      )}
    </div>
  );
}

export default IntentionCard;
