"use client";

import { useState } from "react";

/**
 * Continuous marquee ticker inspired by Shopify's marquee-track pattern.
 * All announcement messages scroll right-to-left in a seamless infinite loop.
 * The strip is duplicated so the second copy slides in as the first slides out.
 * Pauses on hover or keyboard focus.
 */
export function AnnouncementBar({ messages }: { messages: string[] }) {
  const [paused, setPaused] = useState(false);

  if (!messages.length) return null;

  // Scale duration to content length so short/long lists both feel readable.
  const duration = Math.max(16, messages.length * 4);

  const separator = (
    <span aria-hidden="true" className="mx-4 text-[10px] opacity-60">
      ✦
    </span>
  );

  const strip = messages.map((msg, i) => (
    <span key={i} className="inline-flex items-center whitespace-nowrap">
      {i > 0 && separator}
      {msg}
    </span>
  ));

  const playState = paused ? "paused" : "running";

  return (
    <div
      className="overflow-hidden bg-brand text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="marquee-track relative flex py-2.5" aria-live="polite">
        <div
          className="marquee-track--element flex shrink-0 animate-marquee items-center text-xs font-medium uppercase tracking-widest"
          style={{ animationDuration: `${duration}s`, animationPlayState: playState }}
        >
          {strip}
          {separator}
        </div>
        {/* Duplicate for seamless loop */}
        <div
          aria-hidden="true"
          className="marquee-track--element flex shrink-0 animate-marquee items-center text-xs font-medium uppercase tracking-widest"
          style={{ animationDuration: `${duration}s`, animationPlayState: playState }}
        >
          {strip}
          {separator}
        </div>
      </div>
    </div>
  );
}
