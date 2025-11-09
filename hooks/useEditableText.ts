import { useState } from 'react';

export function useEditableText(initial: string, onCommit?: (val: string) => void) {
  const [value, setValue] = useState(initial);
  const [editing, setEditing] = useState(false);

  const startEditing = () => setEditing(true);
  const stopEditing = () => setEditing(false);

  const commit = (newVal?: string) => {
    const next = (newVal ?? value).trim();
    setValue(next);
    if (onCommit) onCommit(next);
    setEditing(false);
  };

  return { value, setValue, editing, startEditing, stopEditing, commit };
}
