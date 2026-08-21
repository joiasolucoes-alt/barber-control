import * as React from 'react'

type Tema = 'claro' | 'escuro'

const CHAVE_TEMA = 'barber-control:tema'

interface ContextoTema {
  tema: Tema
  alternarTema: () => void
}

const TemaContext = React.createContext<ContextoTema | null>(null)

function temaInicial(): Tema {
  if (typeof window === 'undefined') return 'escuro'
  const salvo = window.localStorage.getItem(CHAVE_TEMA)
  if (salvo === 'claro' || salvo === 'escuro') return salvo
  return 'escuro'
}

export function TemaProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = React.useState<Tema>(temaInicial)

  React.useEffect(() => {
    const raiz = document.documentElement
    raiz.classList.toggle('dark', tema === 'escuro')
    window.localStorage.setItem(CHAVE_TEMA, tema)
  }, [tema])

  const valor = React.useMemo<ContextoTema>(
    () => ({
      tema,
      alternarTema: () => setTema((atual) => (atual === 'escuro' ? 'claro' : 'escuro')),
    }),
    [tema],
  )

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>
}

export function useTema(): ContextoTema {
  const contexto = React.useContext(TemaContext)
  if (!contexto) throw new Error('useTema precisa estar dentro de <TemaProvider>.')
  return contexto
}
