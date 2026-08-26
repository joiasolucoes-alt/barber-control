import * as React from 'react'

export function useMediaQuery(query: string): boolean {
  const [corresponde, setCorresponde] = React.useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  React.useEffect(() => {
    const media = window.matchMedia(query)
    const atualizar = () => setCorresponde(media.matches)
    atualizar()
    media.addEventListener('change', atualizar)
    return () => media.removeEventListener('change', atualizar)
  }, [query])

  return corresponde
}
