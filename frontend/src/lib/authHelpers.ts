/**
 * Detects iOS Safari. signInWithRedirect is broken on iOS Safari due to
 * third-party storage blocking; use signInWithPopup instead.
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/**
 * Detects if we should use signInWithRedirect for Google Sign-In.
 * - iOS: use popup (redirect broken on Safari)
 * - Android: use redirect (popup often blocked)
 * - Desktop/narrow viewport: use popup
 */
export function isMobileAuth(): boolean {
  if (typeof window === 'undefined') return false
  if (isIOS()) return false
  return /Android/i.test(navigator.userAgent) || window.innerWidth < 768
}
