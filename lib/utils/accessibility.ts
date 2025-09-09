// Enhanced accessibility utilities and helpers

export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };
  
  element.addEventListener('keydown', handleTabKey);
  firstElement.focus();
  
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}

export function getAriaLabel(achievement: any): string {
  const status = achievement.isCompleted ? 'completed' : 'incomplete';
  const obtainable = achievement.isObtainable ? 'obtainable' : 'unobtainable';
  
  return `${achievement.name}, ${achievement.points} points, ${status}, ${obtainable}, difficulty tier ${achievement.tsrg?.tier || 'unknown'}`;
}

// Enhanced keyboard navigation
export function addKeyboardNavigation(container: HTMLElement) {
  const handleKeyDown = (e: KeyboardEvent) => {
    const focusableElements = Array.from(
      container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ) as HTMLElement[];
    
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % focusableElements.length;
        focusableElements[nextIndex]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
        focusableElements[prevIndex]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        focusableElements[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        focusableElements[focusableElements.length - 1]?.focus();
        break;
    }
  };
  
  container.addEventListener('keydown', handleKeyDown);
  return () => container.removeEventListener('keydown', handleKeyDown);
}

// Skip link component for screen readers
export function createSkipLink(targetId: string, text: string = 'Skip to main content') {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-gold-500 focus:text-compass-900 focus:rounded-md focus:font-medium';
  
  document.body.insertBefore(skipLink, document.body.firstChild);
  return skipLink;
}

// High contrast mode detection
export function detectHighContrastMode(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-contrast: high)').matches ||
         window.matchMedia('(-ms-high-contrast: active)').matches;
}

// Reduced motion detection
export function detectReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Focus management for modals and overlays
export class FocusManager {
  private previousFocus: HTMLElement | null = null;
  private focusTrap: (() => void) | null = null;
  
  capture() {
    this.previousFocus = document.activeElement as HTMLElement;
  }
  
  restore() {
    if (this.previousFocus && typeof this.previousFocus.focus === 'function') {
      this.previousFocus.focus();
    }
    this.previousFocus = null;
  }
  
  trap(element: HTMLElement) {
    this.focusTrap = trapFocus(element);
  }
  
  release() {
    if (this.focusTrap) {
      this.focusTrap();
      this.focusTrap = null;
    }
  }
}

// Color contrast checker
export function checkColorContrast(foreground: string, background: string): {
  ratio: number;
  isAACompliant: boolean;
  isAAACompliant: boolean;
} {
  // Simplified contrast calculation - in production, use a proper library
  const getLuminance = (color: string): number => {
    // This is a simplified version - implement proper luminance calculation
    return 0.5; // Placeholder
  };
  
  const fgLuminance = getLuminance(foreground);
  const bgLuminance = getLuminance(background);
  
  const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05);
  
  return {
    ratio,
    isAACompliant: ratio >= 4.5,
    isAAACompliant: ratio >= 7,
  };
}