import * as React from 'react'

/** Mantém a interface sincronizada com o estado de conectividade do navegador. */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = React.useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )

  React.useEffect(() => {
    const ficarOnline = () => setOnline(true)
    const ficarOffline = () => setOnline(false)

    window.addEventListener('online', ficarOnline)
    window.addEventListener('offline', ficarOffline)
    return () => {
      window.removeEventListener('online', ficarOnline)
      window.removeEventListener('offline', ficarOffline)
    }
  }, [])

  return online
}
