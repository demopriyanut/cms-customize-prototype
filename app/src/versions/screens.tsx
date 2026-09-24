import type { ComponentType } from 'react'
import { byId, type ScreenId, type VersionId } from './registry'
import { EntryA, EntryB, EntryC } from '@/screens/entry'
import { PageEditorA, PageEditorB, PageEditorC } from '@/screens/page-editor'
import { HeaderA, HeaderB, HeaderC } from '@/screens/header'
import { FooterA, FooterB, FooterC } from '@/screens/footer'
import { MenuA, MenuB, MenuC } from '@/screens/menu'
import { EntryV4 } from './v4/entry'
import { PageEditorV4 } from './v4/page-editor'
import { HeaderV4 } from './v4/header'
import { FooterV4 } from './v4/footer'
import { MenuV4 } from './v4/menu'
import { SidebarV4 } from './v4/sidebar'

/* which component each version shows per screen.
   A sub version lists only the screens it changes — the rest come from its parent. */
type ScreenProps = { collapsed: boolean }
type Map = Partial<Record<ScreenId, ComponentType<ScreenProps>>>

export const SCREEN_MAP: Record<VersionId, Map> = {
  v1: { entry: EntryA, page: PageEditorA, header: HeaderA, footer: FooterA, menu: MenuA },
  v2: { entry: EntryB, page: PageEditorB, header: HeaderB, footer: FooterB, menu: MenuB },
  v3: { entry: EntryC, page: PageEditorC, header: HeaderC, footer: FooterC, menu: MenuC },
  v4: { entry: EntryV4, page: PageEditorV4, header: HeaderV4, footer: FooterV4, menu: MenuV4 },   // cloned from V3 → versions/v4/
}

export function screenOf(v: VersionId, s: ScreenId): ComponentType<ScreenProps> | null {
  const own = SCREEN_MAP[v]?.[s]; if (own) return own
  const parent = byId(v)?.parent
  return parent ? screenOf(parent, s) : null
}
export const isReady = (v: VersionId, s: ScreenId) => !!screenOf(v, s)

/* a version may bring its own sidebar (otherwise App picks by VersionDef.sidebar); sub versions inherit the parent's */
export const SIDEBAR_MAP: Record<VersionId, ComponentType> = { v4: SidebarV4 }
export function sidebarOf(v: VersionId): ComponentType | null {
  return SIDEBAR_MAP[v] ?? (byId(v)?.parent ? sidebarOf(byId(v)!.parent!) : null)
}
