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
          className="w-full border border-kings-grey-light rounded-md p-2 text-sm mb-2"
          value={titleEdit.value}
          onChange={(e) => titleEdit.setValue(e.target.value)}
          onBlur={() => titleEdit.commit()}
          onKeyDown={(e) => e.key === 'Enter' && titleEdit.commit()}
          autoFocus
        />
      ) : (
        <h3
          className="font-semibold text-kings-black cursor-pointer hover:text-kings-red"
          onClick={titleEdit.startEditing}
        >
          {titleEdit.value || 'Untitled Intention'}
        </h3>
      )}

      {descEdit.editing ? (
        <textarea
          className="w-full border border-kings-grey-light rounded-md p-2 text-sm mt-2"
          value={descEdit.value}
          onChange={(e) => descEdit.setValue(e.target.value)}
          onBlur={() => descEdit.commit()}
          onKeyDown={(e) => e.key === 'Enter' && descEdit.commit()}
          rows={2}
          autoFocus
        />
      ) : (
        <p
          className="text-sm text-kings-grey-dark cursor-pointer mt-1 hover:text-kings-red/80"
          onClick={descEdit.startEditing}
        >
          {descEdit.value || 'Add a description'}
        </p>
      )}
    </div>
  );
}

export default IntentionCard;
