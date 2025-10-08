"use client";

import { useEffect, useRef } from "react";

interface InfiniteScrollSentinelProps {
  onLoadMore: () => void;
  rootMargin?: string;
}

export function InfiniteScrollSentinel({
  onLoadMore,
  rootMargin = "100px",
}: InfiniteScrollSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [onLoadMore, rootMargin]);

  return <div ref={sentinelRef} className="h-px" aria-hidden="true" />;
}
