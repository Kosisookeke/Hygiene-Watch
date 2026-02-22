/**
 * Detects if the app is running in a mobile context where signInWithPopup
 * is unreliable (blocked or broken). Use signInWithRedirect instead.
 */
export function isMobileAuth(): boolean {
  if (typeof window === 'undefined') return false
  return (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    window.innerWidth < 768
  )
}
