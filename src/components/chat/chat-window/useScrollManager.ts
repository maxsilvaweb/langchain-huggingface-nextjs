'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  CHAT_SCROLL_BOTTOM_THRESHOLD_PX,
  CHAT_SCROLL_OVERFLOW_THRESHOLD_PX,
} from '@/lib/globals';

export interface ScrollMetrics {
  isAtBottom: boolean;
  hasOverflow: boolean;
}

export interface UseScrollManagerReturn extends ScrollMetrics {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  handleScroll: () => void;
  measureMetrics: () => void;
}

function normalizeScrollBehavior(
  behavior?: ScrollBehavior,
): ScrollBehavior {
  return behavior === 'auto' || behavior === 'smooth' ? behavior : 'smooth';
}

/**
 * Custom hook for managing scroll behavior in chat windows.
 * 
 * This follows the Single Responsibility Principle by isolating all scroll-related
 * logic (overflow detection, scroll-to-bottom, position tracking) into a single hook.
 */
export function useScrollManager(): UseScrollManagerReturn {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasOverflow, setHasOverflow] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const measureMetrics = useCallback(() => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setIsAtBottom(distanceFromBottom < CHAT_SCROLL_BOTTOM_THRESHOLD_PX);
    
    const overflowAmount = scrollHeight - clientHeight;
    setHasOverflow(overflowAmount > CHAT_SCROLL_OVERFLOW_THRESHOLD_PX);
  }, []);

  const scrollToBottom = useCallback((behavior?: ScrollBehavior) => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: normalizeScrollBehavior(behavior),
    });
  }, []);

  const handleScroll = useCallback(() => {
    measureMetrics();
  }, [measureMetrics]);

  // Auto-measure on mount and window resize
  useEffect(() => {
    measureMetrics();
    
    const handleResize = () => {
      requestAnimationFrame(measureMetrics);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [measureMetrics]);

  return {
    scrollRef,
    isAtBottom,
    hasOverflow,
    scrollToBottom,
    handleScroll,
    measureMetrics,
  };
}
