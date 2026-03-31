import { useEffect, useState, useRef } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: ReactNode
}

const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    // Clear any pending operations
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    if (location.pathname !== displayLocation.pathname) {
      // Start transition out immediately
      setIsTransitioning(true)
      
      // Very short delay before swapping content
      timeoutRef.current = setTimeout(() => {
        // Update content first
        setDisplayChildren(children)
        setDisplayLocation(location)
        
        // Then fade in using RAF to ensure DOM has updated
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = requestAnimationFrame(() => {
            setIsTransitioning(false)
          })
        })
      }, 30) // Even shorter for snappier feel
    } else {
      // Same route, update children immediately without transition
      setDisplayChildren(children)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [location.pathname, displayLocation.pathname, children])

  return (
    <div
      key={`transition-${displayLocation.pathname}`}
      style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? 'translateY(3px)' : 'translateY(0)',
        transition: isTransitioning 
          ? 'opacity 0.08s ease-out, transform 0.08s ease-out' 
          : 'opacity 0.15s ease-in, transform 0.15s ease-in',
        width: '100%',
        minHeight: '100%',
        position: 'relative',
        pointerEvents: isTransitioning ? 'none' : 'auto'
      }}
    >
      {displayChildren}
    </div>
  )
}

export default PageTransition

