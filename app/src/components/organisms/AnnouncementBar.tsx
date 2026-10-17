"use client";

import { useEffect, useState } from "react";

export function AnnouncementBar({ messages }: { messages: string[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (messages.length < 2 || paused) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), 4000);
    return () => window.clearInterval(id);
  }, [messages.length, paused]);

  if (!messages.length) return null;

  return (
    <div
      className="bg-brand text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <p className="mx-auto max-w-7xl px-4 py-2 text-center text-xs font-medium uppercase tracking-widest" aria-live="polite">
        {messages[index]}
      </p>
    </div>
  );
}
