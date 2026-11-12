import { useCallback, useEffect, useState } from 'react';

export type DraftPhase = 'idle' | 'prompt' | 'active';

interface UseEntityDraftOptions<T> {
  storageKey: string;
  isNew: boolean;
  isOpen: boolean;
  hasDraftContent: (saved: Partial<T>) => boolean;
  isDirty: boolean;
  serialize: () => Partial<T>;
  onRestore: (saved: Partial<T>) => void;
}

/** Explicit draft recovery state machine (`idle -> prompt -> active`) shared across entity modals. */
export function useEntityDraft<T>({
  storageKey,
  isNew,
  isOpen,
  hasDraftContent,
  isDirty,
  serialize,
  onRestore,
}: UseEntityDraftOptions<T>) {
  const [phase, setPhase] = useState<DraftPhase>('idle');

  useEffect(() => {
    if (!isOpen || !isNew) {
      setPhase('idle');
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<T>;
        if (parsed && hasDraftContent(parsed) && !isDirty) {
          setPhase('prompt');
          return;
        }
      }
    } catch {
      // Ignore malformed draft JSON
    }
    setPhase('active');
  }, [isOpen, isNew, storageKey]);

  useEffect(() => {
    if (!isOpen || !isNew || !isDirty) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(serialize()));
    } catch {
      // Ignore storage quota errors
    }
  }, [isOpen, isNew, isDirty, serialize, storageKey]);

  const restoreDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        onRestore(JSON.parse(raw) as Partial<T>);
      }
    } catch {
      // Ignore malformed draft JSON
    }
    setPhase('active');
  }, [onRestore, storageKey]);

  const discardDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setPhase('active');
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    hasDraft: phase === 'prompt',
    draftPhase: phase,
    restoreDraft,
    discardDraft,
    clearDraft,
  };
}

