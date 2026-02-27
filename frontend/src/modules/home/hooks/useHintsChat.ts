import { useState, useCallback } from 'react';

import api from '@/core/services/api';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type Phase = 'idle' | 'chatting' | 'done';

export function useHintsChat() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hintCount, setHintCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());

  const initChat = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.post('/chat', { sessionId });
      const { messages: existingMessages, hintCount: count, done } = res.data;

      setMessages(
        existingMessages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      );
      setHintCount(count);
      setPhase(done ? 'done' : 'chatting');
    } catch {
      // If init fails, still show chat with a fallback message
      setMessages([
        {
          role: 'assistant',
          content: '¡Hola! Tengo pistas sobre tu llamamiento. Pregúntame algo.',
        },
      ]);
      setPhase('chatting');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (phase === 'done' || isLoading) return;

      const userMsg: ChatMessage = { role: 'user', content: text };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const res = await api.post('/chat', {
          sessionId,
          message: text,
        });
        const { reply, hintCount: count, done } = res.data;

        const aiMsg: ChatMessage = { role: 'assistant', content: reply };
        setMessages((prev) => [...prev, aiMsg]);
        setHintCount(count);
        if (done) setPhase('done');
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Hmm, algo salió mal. Intenta de nuevo.' },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, phase, isLoading],
  );

  const resetChat = useCallback(async () => {
    try {
      await api.delete('/chat', { data: { sessionId } });
    } catch {
      // KV cleanup failed, not critical
    }
    const newId = crypto.randomUUID();
    setSessionId(newId);
    setMessages([]);
    setHintCount(0);
    setPhase('idle');
  }, [sessionId]);

  return {
    phase,
    messages,
    hintCount,
    isLoading,
    initChat,
    sendMessage,
    resetChat,
  };
}
