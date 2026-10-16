"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface AnnouncementBarProps {
  messages: string[];
}

export function AnnouncementBar({ messages }: AnnouncementBarProps) {
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  const advance = useCallback(() => {
    if (paused.current) return;
    setIndex((i) => (i + 1) % messages.length);
  }, [messages.length]);

  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(advance, 4000);
    return () => clearInterval(id);
  }, [advance, messages.length]);

  if (messages.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Announcements"
      className="bg-brand text-white"
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
      onFocus={() => { paused.current = true; }}
      onBlur={() => { paused.current = false; }}
    >
      <p className="px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-widest">
        {messages[index]}
      </p>
    </div>
  );
}
