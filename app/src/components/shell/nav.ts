import { create } from 'zustand'
import { useNavigate, useParams } from 'react-router-dom'
import { SCREENS, VERSIONS, type ScreenId, type VersionId } from '@/versions/registry'

/* UI-only state for the shell (not persisted) */
interface Ui {
  tab: 'front' | 'back'
  v2Collapsed: boolean | null   // null = follow the mockup (collapsed on หน้าเลือก / แต่งหน้าเว็บ)
  dockMini: boolean
  dockPop: boolean
  set: (p: Partial<Omit<Ui, 'set'>>) => void
}
export const useUi = create<Ui>(set => ({ tab: 'front', v2Collapsed: null, dockMini: false, dockPop: false, set: p => set(p) }))

/* current route: /:v/:screen   (screen "x:<label>" = a sidebar item that has no mockup) */
export function useRoute() {
  const { v, screen } = useParams()
  const version = VERSIONS.find(x => x.id === v) ?? null
  const missing = screen?.startsWith('x:') ? decodeURIComponent(screen.slice(2)) : null
  const scr = missing ? null : (SCREENS.find(x => x.id === screen) ?? (version ? SCREENS[0] : null))
  return { version, screen: scr, missing }
}

export function useGo() {
  const navigate = useNavigate()
  return {
    index: () => navigate('/'),
    to: (v: VersionId, s: ScreenId | string) => navigate(`/${v}/${s}`),
  }
}
