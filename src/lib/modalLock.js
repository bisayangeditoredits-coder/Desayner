let lockCount = 0;
let previousOverflow = '';

/** Lock body scroll — safe for nested modals via ref counting. */
export function lockBodyScroll() {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount += 1;
}

/** Release one scroll lock; restore scroll only when all modals are closed. */
export function unlockBodyScroll() {
  if (lockCount <= 0) return;
  lockCount -= 1;
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow || '';
  }
}
