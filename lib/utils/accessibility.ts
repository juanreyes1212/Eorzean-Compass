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

export function getAriaLabel(achievement: any): string {
  const status = achievement.isCompleted ? 'completed' : 'incomplete';
  const obtainable = achievement.isObtainable ? 'obtainable' : 'unobtainable';

  return `${achievement.name}, ${achievement.points} points, ${status}, ${obtainable}, difficulty tier ${achievement.tsrg?.tier || 'unknown'}`;
}
