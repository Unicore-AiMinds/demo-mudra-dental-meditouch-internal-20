import * as React from "react"

// Phone and tablet layouts are used below this width; laptops and desktops keep the
// normal layout. Separate from useIsMobile (768px), which drives the sidebar.
export const COMPACT_BREAKPOINT = 1024

const isCompactWidth = () =>
  typeof window !== "undefined" && window.innerWidth < COMPACT_BREAKPOINT

export function useIsCompact() {
  // Read the width synchronously so phones never flash the desktop layout first
  const [isCompact, setIsCompact] = React.useState<boolean>(isCompactWidth)

  React.useEffect(() => {
    const handleResize = () => setIsCompact(isCompactWidth())

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return isCompact
}
