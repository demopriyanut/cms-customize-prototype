import { create } from 'zustand'
import { useNavigate, useParams } from 'react-router-dom'
import { SCREENS, VERSIONS, type ScreenId, type VersionId } from '@/versions/registry'

/* UI-only state for the shell (not persisted) */
interface Ui {
  tab: 'front' | 'back'
  v2Collapsed: boolean | null   // null = follow the mockup (collapsed on หน้าเลือก / แต่งหน้าเว็บ)
  dockMini: boolean
  dockPop: boolean
  rail: boolean                 // a version's own sidebar folded to icons (V4) — remembered per browser
  set: (p: Partial<Omit<Ui, 'set'>>) => void
}
const RAIL_KEY = 'cms-proto-sidebar-rail'
const readRail = () => { try { return localStorage.getItem(RAIL_KEY) === '1' } catch { return false } }
export const useUi = create<Ui>(set => ({ tab: 'front', v2Collapsed: null, dockMini: false, dockPop: false, rail: readRail(), set: p => {
  if ('rail' in p) { try { localStorage.setItem(RAIL_KEY, p.rail ? '1' : '0') } catch { /* private window: not remembered */ } }
  set(p)
} }))

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
