// Accessibility utilities and helpers

export function announceToScreenReader(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
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
