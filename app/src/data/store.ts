import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { HOME_ID, INITIAL_SITE, type Device, type FooterRow, type PageDoc, type Section, type SectionStyle, type SiteDoc, type Zone } from './schema'

/* =====================================================================
   One shared store for every version (V1/V2/V3) — Blueprint D1: all editing modes write to the same draft.
   draft = ฉบับร่าง (every edit lands here) · published = ฉบับเผยแพร่ (changes only when a person presses publish)
   Every edit is a commit: undo / redo + a history log that records who (คุณ / ผู้ช่วย Ket) changed what.
   Persisted to localStorage; "รีเซ็ตข้อมูล" restores the mockup state.
   ===================================================================== */

export type { Device }
export type DiffState = 'ok' | 'no' | null
export type Actor = 'คุณ' | 'ผู้ช่วย Ket'

export interface LogEntry { id: string; at: number; actor: Actor; label: string; pageId: string; snapshot: SiteDoc; kind?: 'publish' }
export interface Placing { kind: 'section' | 'element'; key: string; label: string; icon: string }
export interface DropTarget { zone: string; index: number }

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
const uid = () => Math.random().toString(36).slice(2, 9)
const HERO_ID = 's-hero'
const AI_PRODUCT_ID = 's-ai-products'

export const pageOf = (site: SiteDoc, id: string) => site.pages.find(p => p.id === id)
/* full render order of a page: header · zones (in order) · footer */
export function orderedBlocks(site: SiteDoc, page: PageDoc): { s: Section; zone: Zone | null; index: number }[] {
  const out: { s: Section; zone: Zone | null; index: number }[] = [{ s: site.header, zone: null, index: 0 }]
  for (const z of page.zones ?? []) (page.sections ?? []).filter(s => s.zone === z.id).forEach((s, i) => out.push({ s, zone: z, index: i }))
  out.push({ s: site.footer, zone: null, index: 0 })
  return out
}
export function findSection(site: SiteDoc, pageId: string, id: string): Section | undefined {
  if (id === site.header.id) return site.header
  if (id === site.footer.id) return site.footer
  return pageOf(site, pageId)?.sections?.find(s => s.id === id)
}

interface Store {
  published: SiteDoc
  draft: SiteDoc
  diff: Record<string, DiffState>
  log: LogEntry[]
  past: SiteDoc[]
  future: SiteDoc[]
  // UI (not persisted)
  pageId: string
  selected: string
  device: Device
  compare: 'before' | 'after'
  preview: boolean
  panel: Record<string, string>
  toast: string | null
  placing: Placing | null
  libraryOpen: boolean
  publishOpen: boolean
  editing: string | null          // "sectionId:field" while editing text in place
  // ui actions
  openPage: (id: string) => void
  select: (id: string) => void
  setDevice: (d: Device) => void
  setCompare: (c: 'before' | 'after') => void
  setPreview: (v: boolean) => void
  setPanel: (key: string, val: string) => void
  showToast: (msg: string) => void
  setLibrary: (v: boolean) => void
  startPlacing: (p: Placing | null) => void
  setPublishOpen: (v: boolean) => void
  setEditing: (v: string | null) => void
  // edits (all go through commit)
  move: (id: string, to: DropTarget) => void
  nudge: (id: string, dir: -1 | 1) => void
  duplicate: (id: string) => void
  toggleHidden: (id: string) => void
  remove: (id: string) => void
  place: (to: DropTarget) => void
  setField: (id: string, field: string, value: string) => void
  setStyle: (id: string, patch: Partial<SectionStyle>, label: string) => void
  setGlobal: (which: 'header' | 'footer', patch: { data?: Record<string, string>; style?: Partial<SectionStyle> }, label: string, actor?: Actor) => boolean
  editFooter: (lang: string, fn: (rows: FooterRow[], all: Record<string, FooterRow[]>) => void | false, label: string, actor?: Actor) => boolean
  createPage: () => string
  undo: () => void
  redo: () => void
  restore: (entryId: string) => void
  publish: () => void
  resolveDiff: (id: string, state: DiffState) => void
  acceptAll: () => void
  resetAll: () => void
}

let toastTimer: ReturnType<typeof setTimeout> | undefined

export const useStore = create<Store>()(persist((set, get) => {
  /* apply a change to a copy of the draft, record undo + history */
  const commit = (label: string, fn: (d: SiteDoc) => void | false, actor: Actor = 'คุณ') => {
    const s = get()
    const next = clone(s.draft)
    if (fn(next) === false) return false
    const entry: LogEntry = { id: uid(), at: Date.now(), actor, label, pageId: s.pageId, snapshot: next }
    set({ draft: next, past: [...s.past.slice(-49), s.draft], future: [], log: [entry, ...s.log].slice(0, 60), compare: 'after' })
    return true
  }
  const secsOf = (d: SiteDoc) => pageOf(d, get().pageId)?.sections ?? []
  const zoneOf = (d: SiteDoc, zid: string) => pageOf(d, get().pageId)?.zones?.find(z => z.id === zid)
  const canMove = (sec: Section | undefined) => !!sec && sec.role === 'free'
  /* index inside a zone → index inside page.sections */
  const insertAt = (arr: Section[], zone: string, index: number, sec: Section) => {
    const inZone = arr.filter(s => s.zone === zone)
    const anchor = inZone[index]
    sec.zone = zone
    if (anchor) arr.splice(arr.indexOf(anchor), 0, sec)
    else { const last = inZone[inZone.length - 1]; arr.splice(last ? arr.indexOf(last) + 1 : arr.length, 0, sec) }
  }

  return {
    published: clone(INITIAL_SITE),
    draft: clone(INITIAL_SITE),
    diff: { hero: null, prod: null },
    log: [],
    past: [],
    future: [],
    pageId: HOME_ID,
    selected: HERO_ID,
    device: 'desktop',
    compare: 'after',
    preview: false,
    panel: {},
    toast: null,
    placing: null,
    libraryOpen: false,
    publishOpen: false,
    editing: null,

    openPage: id => {
      const page = pageOf(get().draft, id)
      set({ pageId: id, selected: page?.sections?.[0]?.id ?? '', placing: null, libraryOpen: false, compare: 'after', editing: null })
    },
    select: id => set({ selected: id }),
    setDevice: device => set({ device }),
    setCompare: compare => set({ compare }),
    setPreview: preview => set({ preview, placing: null }),
    setPanel: (key, val) => set(s => ({ panel: { ...s.panel, [key]: val } })),
    showToast: msg => { clearTimeout(toastTimer); set({ toast: msg }); toastTimer = setTimeout(() => set({ toast: null }), 2800) },
    setLibrary: v => set({ libraryOpen: v }),
    startPlacing: p => set({ placing: p, libraryOpen: false, preview: false }),
    setPublishOpen: v => set({ publishOpen: v }),
    setEditing: v => set({ editing: v }),

    move: (id, to) => {
      commit('ย้าย Section', d => {
        const arr = secsOf(d); const sec = arr.find(s => s.id === id)
        if (!canMove(sec) || !zoneOf(d, to.zone)?.insert) return false
        // compute the target position before removing, relative to the zone
        const inZone = arr.filter(s => s.zone === to.zone)
        const from = inZone.indexOf(sec!)
        let idx = to.index
        if (from !== -1 && from < idx) idx -= 1
        if (from === idx && sec!.zone === to.zone) return false
        arr.splice(arr.indexOf(sec!), 1)
        insertAt(arr, to.zone, idx, sec!)
      })
    },
    nudge: (id, dir) => {
      const d = get().draft; const arr = pageOf(d, get().pageId)?.sections ?? []
      const sec = arr.find(s => s.id === id)
      if (!canMove(sec)) { get().showToast('บล็อกนี้ย้ายไม่ได้ — ' + (sec?.role === 'system' ? 'บล็อกของระบบ ปรับค่าได้แต่ย้ายไม่ได้' : 'ใช้ร่วมทุกหน้า')); return }
      const zones = (pageOf(d, get().pageId)?.zones ?? []).filter(z => z.insert)
      const inZone = arr.filter(s => s.zone === sec!.zone); const i = inZone.indexOf(sec!)
      const zi = zones.findIndex(z => z.id === sec!.zone)
      if (dir < 0 && i === 0) {
        const prev = zones[zi - 1]
        if (!prev) return get().showToast('อยู่บนสุดแล้ว — เหนือขึ้นไปเป็น ' + (zi === 0 && (pageOf(d, get().pageId)?.zones?.[0]?.id !== sec!.zone) ? 'บล็อกของระบบ' : 'Header ที่ใช้ร่วมทุกหน้า'))
        return get().move(id, { zone: prev.id, index: arr.filter(s => s.zone === prev.id).length })
      }
      if (dir > 0 && i === inZone.length - 1) {
        const nextZ = zones[zi + 1]
        if (!nextZ) return get().showToast('อยู่ล่างสุดแล้ว — ถัดลงไปเป็น Footer ที่ใช้ร่วมทุกหน้า')
        return get().move(id, { zone: nextZ.id, index: 0 })
      }
      get().move(id, { zone: sec!.zone, index: dir < 0 ? i - 1 : i + 2 })
    },
    duplicate: id => {
      commit('ทำซ้ำ Section', d => {
        const arr = secsOf(d); const sec = arr.find(s => s.id === id)
        if (!canMove(sec)) return false
        const copy = { ...clone(sec!), id: 's-' + uid(), name: sec!.name + ' (สำเนา)', origin: undefined }
        arr.splice(arr.indexOf(sec!) + 1, 0, copy)
        set({ selected: copy.id })
      })
    },
    toggleHidden: id => {
      const sec = findSection(get().draft, get().pageId, id)
      commit(sec?.hidden ? 'แสดง Section' : 'ซ่อน Section', d => {
        const s = secsOf(d).find(x => x.id === id)
        if (!s || s.role !== 'free') return false
        s.hidden = !s.hidden
      })
    },
    remove: id => {
      const sec = findSection(get().draft, get().pageId, id)
      if (!canMove(sec)) { get().showToast('ลบไม่ได้ — ' + (sec?.role === 'system' ? 'บล็อกหลักของระบบ' : 'ใช้ร่วมทุกหน้า แก้ที่ตั้งค่ากลาง')); return }
      const ok = commit('ลบ Section · ' + sec!.name, d => { const arr = secsOf(d); arr.splice(arr.findIndex(s => s.id === id), 1) })
      if (ok) get().showToast(`ลบ “${sec!.name}” แล้ว · กด Ctrl+Z เพื่อย้อน`)
    },
    place: to => {
      const p = get().placing; if (!p) return
      const id = 's-' + uid()
      const ok = commit('เพิ่ม Section · ' + p.label, d => {
        if (!zoneOf(d, to.zone)?.insert) return false
        insertAt(secsOf(d), to.zone, to.index, { id, type: 'library', role: 'free', zone: to.zone, name: p.label, meta: p.kind === 'section' ? 'Section จากคลัง' : 'Element จากคลัง', data: { key: p.key, icon: p.icon, kind: p.kind } })
      })
      if (ok) set({ placing: null, selected: id })
    },
    setField: (id, field, value) => {
      const sec = findSection(get().draft, get().pageId, id)
      if (!sec || sec.data[field] === value) return
      commit(`แก้ ${sec.name}`, d => { const s = findSection(d, get().pageId, id); if (!s || s.role === 'global') return false; s.data[field] = value })
    },
    setStyle: (id, patch, label) => {
      commit(label, d => { const s = findSection(d, get().pageId, id); if (!s || s.role === 'global') return false; s.style = { ...s.style, ...patch } })
    },
    /* Header / Footer are site-level (ใช้ร่วมทุกหน้า): edited only from their own screens */
    setGlobal: (which, patch, label, actor = 'คุณ') => commit(label, d => {
      const s = d[which]
      const nextData = { ...s.data, ...patch.data }
      const nextStyle = { ...s.style, ...patch.style }
      if (JSON.stringify(nextData) === JSON.stringify(s.data) && JSON.stringify(nextStyle) === JSON.stringify(s.style ?? {})) return false
      s.data = nextData; s.style = nextStyle
    }, actor),
    /* Footer rows of one language (clone a language = all[lang] = copy of TH) */
    editFooter: (lang, fn, label, actor = 'คุณ') => commit(label, d => {
      const all = (d.footer.rows ??= {})
      const rows = (all[lang] ??= [])
      return fn(rows, all)
    }, actor),
    createPage: () => {
      const n = get().draft.pages.filter(p => p.id.startsWith('new-')).length + 1
      const id = 'new-' + uid()
      commit('สร้างหน้าใหม่', d => { d.pages.push({ id, name: `หน้าใหม่ ${n}`, path: `/new-page-${n}`, lock: 'L0', group: 'off', when: 'เพิ่งสร้าง', thumb: '#f7f8fa', zones: [{ id: 'main', label: 'เนื้อหาของหน้า', insert: true }], sections: [] }) })
      return id
    },
    undo: () => {
      const s = get(); const prev = s.past[s.past.length - 1]
      if (!prev) return s.showToast('ไม่มีอะไรให้ย้อนแล้ว')
      set({ draft: prev, past: s.past.slice(0, -1), future: [s.draft, ...s.future] })
    },
    redo: () => {
      const s = get(); const next = s.future[0]
      if (!next) return s.showToast('ไม่มีอะไรให้ทำซ้ำ')
      set({ draft: next, future: s.future.slice(1), past: [...s.past, s.draft] })
    },
    restore: entryId => {
      const e = get().log.find(x => x.id === entryId); if (!e) return
      const t = new Date(e.at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      commit(`ย้อนกลับไปจุด ${t}`, d => { Object.assign(d, clone(e.snapshot)) })
      get().showToast('ย้อนฉบับร่างกลับไปจุดที่เลือกแล้ว — เว็บจริงยังไม่เปลี่ยน')
    },
    publish: () => {
      const s = get()
      const entry: LogEntry = { id: uid(), at: Date.now(), actor: 'คุณ', label: 'เผยแพร่ขึ้นเว็บจริง', pageId: s.pageId, snapshot: clone(s.draft), kind: 'publish' }
      set({ published: clone(s.draft), publishOpen: false, log: [entry, ...s.log].slice(0, 60) })
      s.showToast('เผยแพร่แล้ว — เว็บจริงอัปเดตตามฉบับร่าง')
    },
    resolveDiff: (id, state) => {
      const cur = get().diff[id]
      const nextState = cur === state ? null : state
      const d = get().draft
      const home = pageOf(d, HOME_ID)?.sections ?? []
      const wantOn = nextState === 'ok', isOn = id === 'hero' ? home.find(s => s.id === HERO_ID)?.data.title === 'AUTUMN EDIT 2026' : home.some(s => s.id === AI_PRODUCT_ID)
      if (wantOn !== isOn) {
        commit(wantOn ? `ยอมรับข้อเสนอ · ${id === 'hero' ? 'Hero Banner' : 'เพิ่ม Product แนะนำ'}` : `ยกเลิกข้อเสนอ · ${id === 'hero' ? 'Hero Banner' : 'Product แนะนำ'}`, dd => {
          const arr = pageOf(dd, HOME_ID)!.sections!
          if (id === 'hero') {
            const hero = arr.find(s => s.id === HERO_ID); if (!hero) return false
            if (wantOn) { hero.data.title = 'AUTUMN EDIT 2026'; hero.data.panelBg = '#B07A55' }
            else { const orig = pageOf(get().published, HOME_ID)!.sections!.find(s => s.id === HERO_ID)!; hero.data.title = orig.data.title; hero.data.panelBg = orig.data.panelBg }
          } else if (wantOn) {
            const i = arr.findIndex(s => s.id === HERO_ID)
            arr.splice(i + 1, 0, { id: AI_PRODUCT_ID, type: 'products', role: 'free', zone: 'main', name: 'Product · แนะนำ', meta: 'เพิ่มโดยผู้ช่วย Ket · T0', origin: 'ai', data: { title: 'RECOMMENDED FOR YOU', badge: 'NEW' } })
          } else {
            const i = arr.findIndex(s => s.id === AI_PRODUCT_ID); if (i < 0) return false; arr.splice(i, 1)
          }
        }, wantOn ? 'ผู้ช่วย Ket' : 'คุณ')
      }
      set({ diff: { ...get().diff, [id]: nextState } })
    },
    acceptAll: () => { if (get().diff.hero !== 'ok') get().resolveDiff('hero', 'ok'); if (get().diff.prod !== 'ok') get().resolveDiff('prod', 'ok') },
    resetAll: () => set({ published: clone(INITIAL_SITE), draft: clone(INITIAL_SITE), diff: { hero: null, prod: null }, log: [], past: [], future: [], pageId: HOME_ID, selected: HERO_ID, compare: 'after', placing: null, editing: null }),
  }
}, {
  name: 'ketshopweb-cms-customize-prototype',
  version: 4,
  migrate: () => ({ published: clone(INITIAL_SITE), draft: clone(INITIAL_SITE), diff: { hero: null, prod: null }, log: [] }) as unknown as Store,
  partialize: s => ({ published: s.published, draft: s.draft, diff: s.diff, log: s.log.map(e => ({ ...e })) }),
}))

/* ---------- selectors ---------- */
export function useSite() { return useStore(s => (s.compare === 'before' ? s.published : s.draft)) }
export function usePage() {
  const site = useSite(); const pageId = useStore(s => s.pageId)
  return { site, page: pageOf(site, pageId) ?? pageOf(site, HOME_ID)! }
}

/* page-level differences between draft and published (used by the draft counter and the publish dialog) */
export interface Change { pageName: string; label: string; kind: 'add' | 'edit' | 'remove' | 'move' }
export function diffSites(pub: SiteDoc, draft: SiteDoc): Change[] {
  const out: Change[] = []
  for (const k of ['header', 'footer'] as const)
    if (JSON.stringify(pub[k]) !== JSON.stringify(draft[k])) out.push({ pageName: 'ทุกหน้า', label: `แก้ ${draft[k].name} (ใช้ร่วมทุกหน้า)`, kind: 'edit' })
  for (const dp of draft.pages) {
    const pp = pub.pages.find(p => p.id === dp.id)
    if (!pp) { out.push({ pageName: dp.name, label: 'สร้างหน้าใหม่', kind: 'add' }); continue }
    const a = dp.sections ?? [], b = pp.sections ?? []
    for (const s of a) {
      const o = b.find(x => x.id === s.id)
      if (!o) out.push({ pageName: dp.name, label: `เพิ่ม ${s.name}`, kind: 'add' })
      else if (JSON.stringify({ ...o, zone: 0 }) !== JSON.stringify({ ...s, zone: 0 })) out.push({ pageName: dp.name, label: s.hidden && !o.hidden ? `ซ่อน ${s.name}` : `แก้ ${s.name}`, kind: 'edit' })
    }
    for (const o of b) if (!a.some(x => x.id === o.id)) out.push({ pageName: dp.name, label: `ลบ ${o.name}`, kind: 'remove' })
    const orderA = a.filter(s => b.some(x => x.id === s.id)).map(s => s.zone + s.id).join(), orderB = b.filter(s => a.some(x => x.id === s.id)).map(s => s.zone + s.id).join()
    if (orderA !== orderB) out.push({ pageName: dp.name, label: 'เปลี่ยนลำดับ Section', kind: 'move' })
  }
  return out
}
export function useChanges() {
  const pub = useStore(s => s.published); const draft = useStore(s => s.draft)
  return diffSites(pub, draft)
}
