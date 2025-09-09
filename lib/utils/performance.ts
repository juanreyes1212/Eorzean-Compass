// Performance utilities for optimization and monitoring

import { useEffect, useRef, useState } from 'react';

// Lazy image loading hook with intersection observer
export function useLazyImage(src: string, fallbackSrc: string = "/placeholder.svg") {
  const [imageSrc, setImageSrc] = useState<string>(fallbackSrc);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !src) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image();
          img.onload = () => {
            setImageSrc(src);
            setIsLoaded(true);
            setIsError(false);
          };
          img.onerror = () => {
            setImageSrc(fallbackSrc);
            setIsLoaded(true);
            setIsError(true);
          };
          img.src = src;
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [src, fallbackSrc]);

  return { imageSrc, isLoaded, isError, ref };
}

// Virtual scrolling hook for large lists
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  console.log(`[Virtual Scrolling] items=${items.length}, itemHeight=${itemHeight}, containerHeight=${containerHeight}, scrollTop=${scrollTop}`);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  console.log(`[Virtual Scrolling] startIndex=${startIndex}, endIndex=${endIndex}, visibleItems=${visibleItems.length}`);
  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    setScrollTop,
  };
}

// Debounce hook for performance optimization
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Performance monitoring utilities
export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memory usage monitoring
export function getMemoryUsage() {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }
  return null;
}

// Bundle size analysis helper
export function analyzeBundleSize() {
  if (typeof window !== 'undefined') {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    
    return {
      scriptCount: scripts.length,
      styleCount: styles.length,
      scripts: scripts.map(s => (s as HTMLScriptElement).src),
      styles: styles.map(s => (s as HTMLLinkElement).href),
    };
  }
  return null;
}