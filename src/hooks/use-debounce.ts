import * as React from 'react'

/** Adia a propagação de um valor — usado nos campos de busca. */
export function useDebounce<T>(valor: T, atraso = 300): T {
  const [debounced, setDebounced] = React.useState(valor)

  React.useEffect(() => {
    const temporizador = setTimeout(() => setDebounced(valor), atraso)
    return () => clearTimeout(temporizador)
  }, [valor, atraso])

  return debounced
}
