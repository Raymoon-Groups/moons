'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  editableToStored,
  filterMentionCandidates,
  getActiveMention,
  insertMentionText,
  type MentionRef,
} from '@moons/shared';
import { fetchConnections, type ConnectionListItem } from '@/lib/network';

export type MentionPerson = {
  userId: string;
  fullName: string;
  headline: string | null;
  avatarUrl: string | null;
};

let cachedConnections: MentionPerson[] | null = null;
let cachePromise: Promise<MentionPerson[]> | null = null;

async function loadMentionPeople(): Promise<MentionPerson[]> {
  if (cachedConnections) return cachedConnections;
  if (cachePromise) return cachePromise;
  cachePromise = fetchConnections(1, 100)
    .then((data) => {
      const people = data.items
        .map((item: ConnectionListItem) => ({
          userId: item.user.userId,
          fullName: (item.user.fullName || '').trim(),
          headline: item.user.headline ?? null,
          avatarUrl: item.user.avatarUrl ?? null,
        }))
        .filter((p) => p.fullName.length > 0);
      cachedConnections = people;
      return people;
    })
    .finally(() => {
      cachePromise = null;
    });
  return cachePromise;
}

export function useMentionComposer(initialMentions: MentionRef[] = []) {
  const [mentions, setMentions] = useState<MentionRef[]>(initialMentions);
  const mentionsRef = useRef<MentionRef[]>(initialMentions);
  const [people, setPeople] = useState<MentionPerson[]>(cachedConnections ?? []);
  const [caret, setCaret] = useState(0);
  const [loaded, setLoaded] = useState(Boolean(cachedConnections));
  const loadingRef = useRef(false);

  const writeMentions = useCallback((next: MentionRef[]) => {
    mentionsRef.current = next;
    setMentions(next);
  }, []);

  const ensureLoaded = useCallback(() => {
    if (loaded || loadingRef.current) return;
    loadingRef.current = true;
    void loadMentionPeople()
      .then((list) => {
        setPeople(list);
        setLoaded(true);
      })
      .catch(() => setLoaded(true))
      .finally(() => {
        loadingRef.current = false;
      });
  }, [loaded]);

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  const suggestionsFor = useCallback(
    (text: string, nextCaret = caret) => {
      const current = getActiveMention(text, nextCaret);
      if (!current) return [] as MentionPerson[];
      ensureLoaded();
      return filterMentionCandidates(people, current.query, 8);
    },
    [caret, ensureLoaded, people],
  );

  const pickMention = useCallback(
    (text: string, person: MentionPerson, nextCaret = caret) => {
      const current = getActiveMention(text, nextCaret);
      if (!current) return { text, caret: nextCaret };
      const result = insertMentionText(text, nextCaret, current.start, person.fullName);
      const without = mentionsRef.current.filter((m) => m.userId !== person.userId);
      writeMentions([...without, { userId: person.userId, displayName: person.fullName }]);
      setCaret(result.caret);
      return { text: result.text, caret: result.caret };
    },
    [caret, writeMentions],
  );

  const toStored = useCallback((text: string) => editableToStored(text, mentionsRef.current), []);

  const resetMentions = useCallback(
    (next: MentionRef[] = []) => {
      writeMentions(next);
    },
    [writeMentions],
  );

  const syncMentionsFromText = useCallback(
    (text: string) => {
      writeMentions(mentionsRef.current.filter((m) => text.includes(`@${m.displayName}`)));
    },
    [writeMentions],
  );

  return {
    mentions,
    caret,
    setCaret,
    people,
    loaded,
    suggestionsFor,
    pickMention,
    toStored,
    resetMentions,
    syncMentionsFromText,
    ensureLoaded,
  };
}
