import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Loader from '../components/Loader'

const MIN_LOADER_MS = 400

interface NavigationContextValue {
  isNavigating: boolean
  setNavigating: (v: boolean) => void
}

const NavigationContext = createContext<NavigationContextValue | null>(null)

export function useNavigation() {
  const ctx = useContext(NavigationContext)
  return ctx ?? { isNavigating: false, setNavigating: () => {} }
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isNavigating, setNavigating] = useState(false)
  const location = useLocation()
  const navigatingSinceRef = useRef<number | null>(null)

  // Clear navigating when we've arrived (with minimum display time so loader is visible)
  useEffect(() => {
    const elapsed = navigatingSinceRef.current ? Date.now() - navigatingSinceRef.current : MIN_LOADER_MS
    const remaining = Math.max(0, MIN_LOADER_MS - elapsed)
    const t = setTimeout(() => {
      navigatingSinceRef.current = null
      setNavigating(false)
    }, remaining)
    return () => clearTimeout(t)
  }, [location.pathname, location.search])

  // Intercept clicks on internal links to show loader when leaving
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element
      const link = target.closest('a[href^="/"]')
      if (!link) return
      const href = link.getAttribute('href')
      if (!href || href.startsWith('//')) return
      const path = href.split('?')[0]
      if (path === location.pathname) return
      navigatingSinceRef.current = Date.now()
      setNavigating(true)
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [location.pathname])

  const setNavigatingStable = useCallback((v: boolean) => {
    if (v) navigatingSinceRef.current = Date.now()
    else navigatingSinceRef.current = null
    setNavigating(v)
  }, [])

  return (
    <NavigationContext.Provider value={{ isNavigating, setNavigating: setNavigatingStable }}>
      {isNavigating && <Loader />}
      {children}
    </NavigationContext.Provider>
  )
}
