/* V4 — cloned from V3 (MenuC in screens/menu.tsx) on 2026-09-24 so V4 can change without touching V3.
   Only V4 uses this file. */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useStore } from '@/data/store'
import { CATEGORIES, hasSub, HEADER_INHERIT, MENU_KIND_ICON, MENU_KIND_LABEL, MENU_LAYOUTS, MENU_MAX, MENU_TYPES, menuLabel, tokenByName, tokenHex, type Device, type MenuItem, type MenuLayout, type MenuLink } from '@/data/schema'
import { MascotImg } from './parts'
import { useUndoKeys, type Look } from './shared'

/* =====================================================================
   Menu (แถบเมนูบน Header) — V1 = 1f · V2 = 1g · V3 = 3b · flow 3u
   1 สร้างเมนู ▾ เลือก 1 ใน 10 ประเภท → ชิปใหม่โผล่ท้ายแถบ (กระพริบ)
   2 ลากชิปบน preview / แถวในต้นไม้: ซ้าย–ขวา (หรือบน–ล่าง) = เรียง · ลากไปซ้อนกลางชิปอื่น = เมนูย่อย
   3 เลือกเมนู → ชื่อ 4 ภาษา · ลิงก์ · Menu Type Normal / Column 1–3 (V1: Dropdown / Mega menu / ไม่มี)
   4 Menu Collection: ช่องลิงก์ + Banner ตาม layout — preview กางให้ดู   5 เช็กมือถือ (☰) · ผู้ช่วยเสนอ "ลองในฉบับร่าง"
   6 บันทึกอัตโนมัติทุกการแก้ (ลงฉบับร่าง · undo ได้) — Header ทุกหน้าใช้เมนูนี้
   ===================================================================== */

const uid = () => Math.random().toString(36).slice(2, 8)
type Where = 'before' | 'after' | 'into'
type Found = { item: MenuItem; arr: MenuItem[]; index: number; parent: MenuItem | null }
function find(menu: MenuItem[], id: string, parent: MenuItem | null = null): Found | null {
  for (let i = 0; i < menu.length; i++) {
    if (menu[i].id === id) return { item: menu[i], arr: menu, index: i, parent }
    const f = find(menu[i].children, id, menu[i]); if (f) return f
  }
  return null
}
const layoutName = (m: MenuItem) => m.layout.startsWith('col') ? `Column ${m.layout.slice(3)}` : null
const badge = (m: MenuItem) => layoutName(m) ?? MENU_KIND_LABEL[m.kind] ?? m.kind
const offEverywhere = (m: MenuItem) => !m.showOn.desktop && !m.showOn.tablet && !m.showOn.mobile

/* what is being dragged: an existing menu item, or a new item from the type palette (1g) */
let dragging: { id?: string; kind?: string } | null = null

function useMenu() {
  const draft = useStore(s => s.draft)
  const menu = draft.menu ?? []
  const editMenu = useStore(s => s.editMenu); const showToast = useStore(s => s.showToast)
  const selId = useStore(s => s.panel['menu-sel'] ?? 'm-collection'); const setPanel = useStore(s => s.setPanel)
  const device = useStore(s => s.device); const setDevice = useStore(s => s.setDevice)
  const [flash, setFlash] = useState<string | null>(null)
  const sel = find(menu, selId)?.item ?? menu[0]
  const select = (id: string) => setPanel('menu-sel', id)
  const onItem = (id: string, label: string, fn: (m: MenuItem) => void | false) => editMenu(ms => { const f = find(ms, id); if (!f) return false; return fn(f.item) }, label)

  const api = {
    select,
    add: (kind: string, at?: { id: string; where: Where }) => {
      if (menu.length >= MENU_MAX && at?.where !== 'into') return showToast(`เมนูหลักเต็มแล้ว (${MENU_MAX} รายการ) — ลบหรือย้ายเป็นเมนูย่อยก่อน`)
      const t = MENU_TYPES.find(x => x.key === kind)!
      const id = 'm-' + uid()
      const item: MenuItem = { id, kind, i18n: { TH: '', EN: 'เมนูใหม่', JP: '', CN: '' }, target: kind === 'heading' ? 'ไม่มีลิงก์ (หัวข้อ)' : `${t.name}: [รอข้อมูล]`, layout: 'normal', children: [], cols: [], showOn: { desktop: true, tablet: true, mobile: true } }
      const ok = editMenu(ms => {
        if (!at) { ms.push(item); return }
        const f = find(ms, at.id); if (!f) { ms.push(item); return }
        if (at.where === 'into') { if (f.item.layout.startsWith('col') || f.parent) return false; f.item.children.push(item); if (f.item.layout === 'none') f.item.layout = 'normal'; return }
        f.arr.splice(f.index + (at.where === 'after' ? 1 : 0), 0, item)
      }, `สร้างเมนู · ${t.name}`)
      if (ok) { select(id); setFlash(id); setTimeout(() => setFlash(null), 1600); showToast(`สร้างเมนู “${t.name}” แล้ว — ตั้งชื่อและลิงก์ได้ที่รายละเอียดเมนู`) }
    },
    move: (dragId: string, targetId: string, where: Where) => {
      if (dragId === targetId) return
      const d = find(menu, dragId), t = find(menu, targetId); if (!d || !t) return
      if (where === 'into') {
        if (t.item.layout.startsWith('col')) return showToast('Column menu ไม่มีเมนูย่อย — รายการอยู่ใน Menu Collection ด้านขวา')
        if (t.parent) return showToast('เมนูย่อยซ้อนได้ 1 ชั้น')
        if (d.item.children.length) return showToast(`“${menuLabel(d.item)}” มีเมนูย่อยอยู่ — ย้ายเมนูย่อยออกก่อน`)
      }
      if (!t.parent && where !== 'into' && d.parent && menu.length >= MENU_MAX) return showToast(`เมนูหลักเต็มแล้ว (${MENU_MAX} รายการ)`)
      const label = where === 'into' ? `${menuLabel(d.item)} เป็นเมนูย่อยของ ${menuLabel(t.item)}` : `ย้าย ${menuLabel(d.item)}`
      editMenu(ms => {
        const dd = find(ms, dragId)!; dd.arr.splice(dd.index, 1)
        const tt = find(ms, targetId)!
        if (where === 'into') { tt.item.children.push(dd.item); if (tt.item.layout === 'none') tt.item.layout = 'normal' }
        else tt.arr.splice(tt.index + (where === 'after' ? 1 : 0), 0, dd.item)
      }, label)
    },
    remove: (id: string) => {
      const f = find(menu, id); if (!f) return
      if (editMenu(ms => { const x = find(ms, id)!; x.arr.splice(x.index, 1) }, `ลบเมนู ${menuLabel(f.item)}`)) {
        select((f.arr[f.index + 1] ?? f.arr[f.index - 1] ?? f.parent ?? menu[0]).id); showToast(`ลบเมนู “${menuLabel(f.item)}” แล้ว · Ctrl+Z เพื่อย้อน`)
      }
    },
    rename: (id: string, lang: string, v: string) => onItem(id, `ชื่อเมนู ${lang}`, m => { if ((m.i18n[lang] ?? '') === v) return false; m.i18n[lang] = v }),
    setTarget: (id: string, v: string) => onItem(id, 'ลิงก์ไปที่', m => { if (m.target === v) return false; m.target = v }),
    setLayout: (id: string, layout: MenuLayout) => onItem(id, `Menu Type ${MENU_LAYOUTS.find(l => l.key === layout)?.name ?? (layout === 'none' ? 'ไม่มีเมนูย่อย' : layout)}`, m => {
      if (m.layout === layout) return false
      const n = layout.startsWith('col') ? Number(layout.slice(3)) : 0
      if (n) {
        if (!m.cols.length && m.children.length) m.cols = [{ head: 'คอลัมน์ 1', links: m.children.map(c => ({ name: menuLabel(c), url: c.target })) }]
        while (m.cols.length < n) m.cols.push({ head: `คอลัมน์ ${m.cols.length + 1}`, links: [] })
        m.banner ??= { url: '' }
      }
      m.layout = layout
    }),
    setShow: (id: string, d: Device, v: boolean) => onItem(id, `${v ? 'แสดง' : 'ซ่อน'}บน ${d === 'desktop' ? 'Desktop' : d === 'tablet' ? 'Tablet' : 'Mobile'}`, m => { m.showOn[d] = v }),
    toggleAll: (id: string) => onItem(id, 'แสดง/ซ่อนเมนู', m => { const on = offEverywhere(m); m.showOn = { desktop: on, tablet: on, mobile: on } }),
    setNewTab: (id: string, v: boolean) => onItem(id, v ? 'เปิดในแท็บใหม่' : 'เปิดในแท็บเดิม', m => { m.newTab = v }),
    setHead: (ci: number, v: string) => onItem(sel.id, 'หัวคอลัมน์', m => { if (m.cols[ci].head === v) return false; m.cols[ci].head = v }),
    addLink: (ci: number, l: MenuLink) => onItem(sel.id, `เพิ่มลิงก์ ${l.name}`, m => { m.cols[ci].links.push(l) }),
    editLink: (ci: number, li: number, p: Partial<MenuLink>) => onItem(sel.id, 'แก้ลิงก์', m => { const l = m.cols[ci].links[li]; if (Object.entries(p).every(([k, v]) => l[k as keyof MenuLink] === v)) return false; Object.assign(l, p) }),
    removeLink: (ci: number, li: number) => onItem(sel.id, 'ลบลิงก์', m => { m.cols[ci].links.splice(li, 1) }),
    moveLink: (ci: number, from: number, toCi: number, to: number) => onItem(sel.id, 'ย้ายลิงก์', m => { const [l] = m.cols[ci].links.splice(from, 1); m.cols[toCi].links.splice(to, 0, l) }),
    setBanner: (url: string) => onItem(sel.id, 'ลิงก์ Banner', m => { if (m.banner?.url === url) return false; m.banner = { url } }),
    addChild: (l: MenuLink) => onItem(sel.id, `เพิ่มเมนูย่อย ${l.name}`, m => { m.children.push({ id: 'm-' + uid(), kind: 'category', i18n: { TH: '', EN: l.name, JP: '', CN: '' }, target: `หมวดหมู่: ${l.name} · ${l.url}`, layout: 'normal', children: [], cols: [], showOn: { desktop: true, tablet: true, mobile: true } }); if (m.layout === 'none') m.layout = 'normal' }),
    /* 1g — ผู้ช่วย Ket: ยุบ AI SEARCH เป็นไอคอน + ย้าย CONTACT ไป Footer (บนมือถือ) */
    aiMobile: () => {
      const ok = editMenu((ms, d) => {
        const ai = ms.find(m => m.kind === 'system'), contact = ms.find(m => menuLabel(m) === 'CONTACT')
        if (ai) { ai.iconOnly = true; ai.showOn.mobile = true }
        if (contact) contact.showOn.mobile = false
        const help = d.footer.rows?.TH?.flatMap(r => r.cols).find(c => c.kind === 'links' && c.title === 'Help')
        if (help && contact && !help.links?.some(l => l.href === '/contact')) (help.links ??= []).push({ label: 'CONTACT', href: '/contact' })
      }, 'ยุบ AI SEARCH เป็นไอคอน · ย้าย CONTACT ไป Footer บนมือถือ (ผู้ช่วย Ket)')
      showToast(ok ? 'ผู้ช่วยปรับเมนูในฉบับร่างแล้ว — AI SEARCH เป็นไอคอน 🔍 · CONTACT ซ่อนบนมือถือและเพิ่มไว้ใน Footer · Ctrl+Z เพื่อย้อน' : 'ปรับไว้แล้ว')
    },
    /* 3b — ผู้ช่วย Ket: เติมหมวด "ลดราคา" (ระบบจำลองไม่มีข้อมูลหมวด → ใส่ช่อง [รอข้อมูล]) */
    aiFill: (ci: number) => {
      const ok = editMenu(ms => { const f = find(ms, sel.id); if (!f) return false; for (let i = 0; i < 3; i++) f.item.cols[ci].links.push({ name: '[รอข้อมูล]', url: '' }) }, `เติมหมวดลดราคาในช่อง ${sel.cols[ci]?.head} (ผู้ช่วย Ket)`, 'ผู้ช่วย Ket')
      if (ok) showToast('ระบบจำลองยังไม่มีข้อมูลหมวด “ลดราคา” — ผู้ช่วยใส่ช่อง [รอข้อมูล] 3 ช่องไว้ในฉบับร่าง · Ctrl+Z เพื่อย้อน')
    },
  }
  return { draft, menu, sel, device, setDevice, flash, api, showToast }
}
type M = ReturnType<typeof useMenu>

/* drop position inside an element: first 30% = before · middle = into · last 30% = after (along the list direction) */
function dropWhere(e: React.DragEvent, axis: 'x' | 'y', allowInto: boolean): Where {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const p = axis === 'x' ? (e.clientX - r.left) / r.width : (e.clientY - r.top) / r.height
  if (!allowInto) return p < 0.5 ? 'before' : 'after'
  return p < 0.3 ? 'before' : p > 0.7 ? 'after' : 'into'
}
function useDnd(m: M, axis: 'x' | 'y') {
  const [over, setOver] = useState<{ id: string; where: Where } | null>(null)
  const props = (item: MenuItem, depth: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => { dragging = { id: item.id }; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', item.id) },
    onDragEnd: () => { dragging = null; setOver(null) },
    onDragOver: (e: React.DragEvent) => { if (!dragging) return; e.preventDefault(); e.stopPropagation(); const w = dropWhere(e, axis, depth === 0 && !item.layout.startsWith('col')); if (over?.id !== item.id || over.where !== w) setOver({ id: item.id, where: w }) },
    onDragLeave: () => setOver(o => (o?.id === item.id ? null : o)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault(); e.stopPropagation()
      const w = dropWhere(e, axis, depth === 0 && !item.layout.startsWith('col'))
      if (dragging?.id) m.api.move(dragging.id, item.id, w)
      else if (dragging?.kind) m.api.add(dragging.kind, { id: item.id, where: w })
      dragging = null; setOver(null)
    },
  })
  const mark = (id: string): React.CSSProperties => {
    if (over?.id !== id) return {}
    const c = 'var(--info-500)'
    if (over.where === 'into') return { boxShadow: `0 0 0 2px ${c}`, background: 'var(--info-50)' }
    return axis === 'x' ? { boxShadow: `${over.where === 'before' ? '-3px' : '3px'} 0 0 0 ${c}` } : { boxShadow: `0 ${over.where === 'before' ? '-3px' : '3px'} 0 0 ${c}` }
  }
  return { props, mark }
}

/* ---------- "สร้างเมนู ▾" — the 10 types ---------- */
function CreateMenu({ m, look }: { m: M; look: Look }) {
  const [open, setOpen] = useState(false)
  const full = m.menu.length >= MENU_MAX
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} aria-expanded={open} disabled={full} title={full ? `เมนูหลักเต็ม ${MENU_MAX} รายการ` : undefined}
        className={`flex items-center gap-2 font-semibold text-white disabled:opacity-40 ${look === 'b' ? 'h-[38px] bg-ink-900 rounded-full px-4 shadow-md' : 'h-9 bg-red-600 hover:bg-red-700 rounded-lg px-3.5'}`}>
        <i className="fas fa-plus text-[11px]" />สร้างเมนู{look !== 'b' && <i className="fas fa-chevron-down text-[10px] opacity-70" />}
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-[300px] bg-white border border-ink-150 rounded-xl shadow-xl p-1.5 grid grid-cols-2 gap-1">
          {MENU_TYPES.map(t => (
            <button key={t.key} onClick={() => { setOpen(false); m.api.add(t.key) }} className="flex items-center gap-2 text-left px-2 py-1.5 rounded-lg hover:bg-ink-50">
              <span className="w-7 h-7 rounded-lg bg-ink-100 grid place-items-center text-ink-700 flex-none"><i className={`${t.icon} text-[11px]`} /></span>
              <span className="min-w-0"><span className="block font-semibold text-meta truncate">{t.name}</span><span className="block text-caption text-ink-500 truncate">{t.desc}</span></span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
const Saved = () => <span className="flex items-center gap-1.5 text-meta text-ink-500 whitespace-nowrap" title="ทุกการแก้บันทึกลงฉบับร่างทันที — เว็บจริงเปลี่ยนเมื่อกดเผยแพร่"><i className="fas fa-check-circle text-success-500" />บันทึกอัตโนมัติแล้ว</span>

function DevSwitch({ m, look, labels }: { m: M; look: Look; labels?: boolean }) {
  const mobile = m.device === 'mobile'
  const opts: [Device, string, string][] = [['desktop', 'fas fa-desktop', 'Desktop'], ['mobile', 'fas fa-mobile-alt', 'Mobile']]
  return (
    <span role="radiogroup" aria-label="ขนาดจอ" className={`flex gap-0.5 p-[3px] text-meta font-semibold ${look === 'b' ? 'bg-ink-900/6 rounded-full' : 'bg-ink-100 rounded-lg'}`}>
      {opts.map(([d, ic, l]) => { const on = (d === 'mobile') === mobile; return (
        <button key={d} role="radio" aria-checked={on} title={l} onClick={() => m.setDevice(d)} className={`px-3 py-1 flex items-center gap-1.5 ${look === 'b' ? 'rounded-full' : 'rounded-md'} ${on ? 'bg-white shadow-xs text-ink-900' : 'text-ink-500'}`}>{look !== 'b' && <i className={ic} />}{(labels || look === 'b') && l}</button>
      ) })}
    </span>
  )
}

/* ---------- preview: the header's menu bar with draggable chips (1g / 3b) or plain text (1f) ---------- */
function MenuBar({ m, look }: { m: M; look: Look }) {
  const bg = tokenHex(m.draft, m.draft.header.style?.bg) ?? tokenByName(m.draft, HEADER_INHERIT.bg)
  const dnd = useDnd(m, 'x')
  const [addOpen, setAddOpen] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  const [left, setLeft] = useState(0)
  const selTop = m.menu.find(x => x.id === m.sel?.id || x.children.some(c => c.id === m.sel?.id))
  useLayoutEffect(() => {
    const bar = barRef.current, chip = bar?.querySelector(`[data-mchip="${selTop?.id}"]`) as HTMLElement | null
    if (bar && chip) setLeft(Math.max(0, Math.min(chip.offsetLeft - 40, bar.clientWidth - 520)))
  })
  if (m.device === 'mobile') return <MobileMenu m={m} bg={bg} />
  const items = m.menu.filter(x => x.showOn.desktop || look !== 'a')
  return (
    <div>
      <div ref={barRef} className={`flex justify-between items-center gap-3 px-6 relative ${look === 'a' ? 'py-3.5 rounded-lg' : 'py-4'}`} style={{ background: bg }}>
        <div className="font-bold text-display tracking-[.06em] text-[#222] whitespace-nowrap" style={{ fontFamily: 'Georgia,serif' }}>{m.draft.header.data.logo}</div>
        {look === 'a' ? (
          <div className="flex gap-4 text-caption uppercase tracking-[.02em] text-[#333] items-center flex-wrap justify-end">
            {items.map(x => <button key={x.id} onClick={() => m.api.select(x.id)} className={`uppercase ${selTop?.id === x.id ? 'font-semibold rounded-sm' : 'hover:text-ink-900'}`} style={selTop?.id === x.id ? { background: 'rgba(177,38,41,.12)', outline: '2px solid var(--red-600)', outlineOffset: 4 } : undefined}>{x.iconOnly ? <i className="fas fa-search" /> : <>{menuLabel(x)}{hasSub(x) ? ' ▾' : ''}</>}</button>)}
            <span className="inline-flex gap-1 items-center"><i className="fas fa-shopping-bag" />(0)</span>
          </div>
        ) : (
          <div className="flex gap-1.5 items-center flex-wrap justify-end">
            {items.map(x => {
              const on = selTop?.id === x.id, dim = !x.showOn.desktop
              return (
                <span key={x.id} data-mchip={x.id} {...dnd.props(x, 0)} onClick={() => m.api.select(x.id)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && m.api.select(x.id)}
                  title={dim ? 'ซ่อนบน Desktop' : 'ลากเพื่อเรียง · ลากซ้อนกลางชิปอื่น = เมนูย่อย'}
                  className={`inline-flex items-center gap-1.5 px-3 py-[7px] rounded-[10px] text-caption font-semibold uppercase tracking-[.02em] cursor-grab select-none ${m.flash === x.id ? 'animate-pulse' : ''} ${dim ? 'opacity-45' : ''}`}
                  style={{ background: on ? 'var(--ink-900)' : 'rgba(255,255,255,.7)', color: on ? '#fff' : '#222', border: `1.5px solid ${on ? 'var(--ink-900)' : m.flash === x.id ? 'var(--red-600)' : 'transparent'}`, ...dnd.mark(x.id) }}>
                  <i className="fas fa-grip-vertical text-[9px] opacity-50" />{x.iconOnly ? <i className="fas fa-search" /> : menuLabel(x)}{hasSub(x) && <i className="fas fa-caret-down text-[10px] opacity-60" />}
                </span>
              )
            })}
            <span className="relative">
              <button onClick={() => setAddOpen(!addOpen)} aria-label="สร้างเมนู" title="สร้างเมนู / วางเมนูใหม่ที่นี่" onDragOver={e => { if (dragging?.kind) e.preventDefault() }} onDrop={e => { e.preventDefault(); if (dragging?.kind) m.api.add(dragging.kind); dragging = null }}
                className="w-[34px] h-[34px] rounded-[10px] border-[1.5px] border-dashed border-ink-500 grid place-items-center text-ink-600 hover:border-ink-900 hover:text-ink-900"><i className="fas fa-plus text-[10px]" /></button>
              {addOpen && <div className="absolute right-0 top-10 z-30 w-[260px] bg-white border border-ink-150 rounded-xl shadow-xl p-1.5 flex flex-col">{MENU_TYPES.map(t => <button key={t.key} onClick={() => { setAddOpen(false); m.api.add(t.key) }} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-ink-50 text-meta text-left"><i className={`${t.icon} w-4 text-ink-500`} />{t.name}<span className="ml-auto text-caption text-ink-500">{t.desc}</span></button>)}</div>}
            </span>
          </div>
        )}
      </div>
      {look !== 'a' && selTop && hasSub(selTop) && <div style={{ marginLeft: left }} className="relative z-10 -mt-px"><SubPanel m={m} item={selTop} editable={look === 'b'} /></div>}
    </div>
  )
}

/* the open submenu under the bar: Column layout = mega menu (columns + banner) · Normal = dropdown of children */
function SubPanel({ m, item, editable }: { m: M; item: MenuItem; editable: boolean }) {
  const [edit, setEdit] = useState<string | null>(null)
  const n = item.layout.startsWith('col') ? Number(item.layout.slice(3)) : 0
  if (!n) return (
    <div className="w-[220px] bg-white border border-ink-150 shadow-xl rounded-b-xl p-2.5 flex flex-col gap-1 text-meta">
      {item.children.map(c => <button key={c.id} onClick={() => m.api.select(c.id)} className={`text-left px-2 py-1 rounded-md ${m.sel?.id === c.id ? 'bg-ink-900 text-white' : 'hover:bg-ink-50'}`}>{menuLabel(c)}</button>)}
      <div className="text-caption text-ink-500 border-t border-ink-100 pt-1.5 mt-0.5"><i className="fas fa-caret-down text-orange-600 mr-1" />Dropdown · {menuLabel(item)}</div>
    </div>
  )
  const inline = (key: string, value: string, onSave: (v: string) => void, cls: string) => edit === key && editable
    ? <input autoFocus defaultValue={value} onBlur={e => { setEdit(null); onSave(e.target.value) }} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEdit(null) }} className={`${cls} border border-orange-500 rounded px-1 bg-white outline-none w-full`} />
    : <span onDoubleClick={() => editable && setEdit(key)} title={editable ? 'ดับเบิลคลิกเพื่อแก้' : undefined} className={`${cls} ${editable ? 'cursor-text' : ''}`}>{value}</span>
  return (
    <div className="w-[520px] bg-white border border-ink-150 shadow-xl rounded-b-[14px] px-4 pt-3.5 pb-3 grid gap-3.5 text-meta" style={{ gridTemplateColumns: MENU_LAYOUTS.find(l => l.key === item.layout)!.cols.map(c => `${c}fr`).join(' ') }}>
      {item.cols.slice(0, n).map((c, ci) => (
        <div key={ci} className="min-w-0">
          {inline(`h${ci}`, c.head, v => m.api.setHead(ci, v), 'block font-bold mb-1.5 text-caption text-ink-500 tracking-[.06em] uppercase')}
          <div className="flex flex-col gap-1">
            {c.links.map((l, li) => <div key={li} className="truncate">{inline(`l${ci}-${li}`, l.name, v => m.api.editLink(ci, li, { name: v }), 'block truncate')}</div>)}
            {editable && <button onClick={() => { m.api.addLink(ci, { name: 'ลิงก์ใหม่', url: '' }); setEdit(`l${ci}-${c.links.length}`) }} className="text-left text-red-600"><i className="fas fa-plus text-[9px]" /> เพิ่ม</button>}
          </div>
        </div>
      ))}
      <div className="h-[92px] rounded-lg grid place-items-center text-white/75" style={{ background: 'linear-gradient(160deg,#d9b493,#5e3b28)' }}><i className="far fa-image text-xl" /></div>
      <div className="col-span-full text-caption text-ink-500 border-t border-ink-100 pt-2 flex gap-1.5 items-center"><i className="fas fa-th text-red-600" />Mega menu · {menuLabel(item)}{editable ? ' — ดับเบิลคลิกเพื่อแก้ชื่อ' : ' — แก้ที่ Menu Collection ด้านล่าง'}</div>
    </div>
  )
}

/* mobile preview: ☰ drawer (items shown on mobile) — drag to reorder here too */
function MobileMenu({ m, bg }: { m: M; bg: string }) {
  const dnd = useDnd(m, 'y')
  const items = m.menu.filter(x => x.showOn.mobile)
  const hiddenN = m.menu.length - items.length
  return (
    <div className="py-4 grid place-items-center bg-ink-50">
      <div className="w-[340px] rounded-[22px] border-[6px] border-ink-900 bg-white overflow-hidden shadow-lg">
        <div className="flex items-center justify-between px-4 py-3" style={{ background: bg }}><i className="fas fa-bars text-lg" /><span className="font-bold tracking-[.06em]" style={{ fontFamily: 'Georgia,serif' }}>{m.draft.header.data.logo}</span><i className="fas fa-shopping-bag" /></div>
        <div className="px-2 py-2 flex flex-col gap-0.5 text-body max-h-[300px] overflow-auto">
          {items.map(x => (
            <div key={x.id}>
              <div {...dnd.props(x, 0)} onClick={() => m.api.select(x.id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab font-semibold uppercase ${m.sel?.id === x.id ? 'bg-ink-900 text-white' : 'hover:bg-ink-50'}`} style={dnd.mark(x.id)}>
                <i className="fas fa-grip-vertical text-[10px] opacity-40" />{x.iconOnly ? <><i className="fas fa-search" /> <span className="normal-case font-normal opacity-60">(ไอคอน)</span></> : menuLabel(x)}{hasSub(x) && <i className="fas fa-chevron-down ml-auto text-[10px] opacity-60" />}
              </div>
              {x.children.filter(c => c.showOn.mobile).map(c => <div key={c.id} onClick={() => m.api.select(c.id)} className={`ml-7 px-3 py-1.5 rounded-lg cursor-pointer ${m.sel?.id === c.id ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-50'}`}>{menuLabel(c)}</div>)}
            </div>
          ))}
        </div>
      </div>
      <div className="text-caption text-ink-500 mt-2">☰ drawer บนมือถือ · {items.length} เมนู{hiddenN ? ` · ซ่อนบนมือถือ ${hiddenN}` : ''}</div>
    </div>
  )
}

/* ---------- menu tree (1f / 3b) ---------- */
function Tree({ m, look }: { m: M; look: 'a' | 'c' }) {
  const dnd = useDnd(m, 'y')
  const row = (x: MenuItem, depth: number): ReactNode => {
    const on = m.sel?.id === x.id, off = offEverywhere(x)
    return (
      <div key={x.id}>
        <div {...dnd.props(x, depth)} onClick={() => m.api.select(x.id)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && m.api.select(x.id)} aria-current={on}
          className={`group flex items-center gap-2 px-2.5 rounded-[9px] border cursor-pointer ${look === 'a' ? 'py-2' : 'py-[7px]'} ${on ? 'bg-red-50 border-red-300' : 'border-transparent hover:bg-ink-50'} ${off ? 'opacity-50' : ''} ${m.flash === x.id ? 'animate-pulse' : ''}`}
          style={{ marginLeft: depth * 26, ...dnd.mark(x.id) }}>
          <i className="fas fa-grip-vertical text-ink-300 text-[11px] cursor-grab" />
          <i className={`${x.layout.startsWith('col') ? 'fas fa-columns' : MENU_KIND_ICON[x.kind] ?? 'fas fa-link'} w-3.5 text-center text-ink-500 text-[11px]`} />
          <span className="flex-1 font-semibold text-body truncate">{menuLabel(x)}</span>
          <span className="text-caption px-1.5 py-0.5 rounded-[5px] bg-ink-100 text-ink-600 whitespace-nowrap">{badge(x)}</span>
          {look === 'a' && <span className="flex gap-1 text-caption" title="แสดงบน Desktop / Mobile"><i className="fas fa-desktop" style={{ color: x.showOn.desktop ? 'var(--ink-400)' : 'var(--ink-200)' }} /><i className="fas fa-mobile-alt" style={{ color: x.showOn.mobile ? 'var(--ink-400)' : 'var(--ink-200)' }} /></span>}
          <MoveBtns m={m} x={x} />
          <button onClick={e => { e.stopPropagation(); m.api.toggleAll(x.id) }} aria-label={off ? 'แสดงเมนู' : 'ซ่อนเมนู'} title={off ? 'แสดงเมนู' : 'ซ่อนเมนูทุกจอ'} className="w-6 h-6 grid place-items-center rounded text-ink-500 hover:text-ink-800"><i className={off ? 'far fa-eye-slash' : 'far fa-eye'} /></button>
        </div>
        {x.children.map(c => row(c, depth + 1))}
      </div>
    )
  }
  return (
    <div className="bg-white border border-ink-150 rounded-xl flex flex-col overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-ink-100 flex items-center gap-2 text-meta text-ink-500">
        {look === 'a' ? <><i className="fas fa-info-circle" />ลาก <i className="fas fa-grip-vertical" /> เพื่อย้าย · ลากเข้ากลางแถวเพื่อทำเมนูย่อย</>
          : <><i className="fas fa-stream" /><span className="whitespace-nowrap">โครงสร้างเมนู</span> <span className="text-caption text-ink-500 truncate">· Column menu ไม่มีลูก — รายการอยู่ใน Menu Collection ขวา</span></>}
        <span className="ml-auto font-display whitespace-nowrap">{m.menu.length} / {MENU_MAX}</span>
      </div>
      <div className="p-2 flex flex-col gap-[3px]">{m.menu.map(x => row(x, 0))}</div>
    </div>
  )
}

/* no-drag alternative for the tree (WCAG 2.5.7): ↑ ↓ reorder · → make it a submenu of the item above · ← back to the top level */
function MoveBtns({ m, x }: { m: M; x: MenuItem }) {
  const f = find(m.menu, x.id); if (!f) return null
  const prev = f.arr[f.index - 1], next = f.arr[f.index + 1]
  const b = (icon: string, label: string, on: boolean, run: () => void) => (
    <button aria-label={`${label} · ${menuLabel(x)}`} title={label} disabled={!on} onClick={e => { e.stopPropagation(); run() }}
      className="w-6 h-6 grid place-items-center rounded text-ink-500 hover:text-ink-900 hover:bg-ink-100 disabled:hidden"><i className={`${icon} text-[10px]`} /></button>
  )
  return (
    <span className="flex opacity-0 group-hover:opacity-100 focus-within:opacity-100">
      {b('fas fa-arrow-up', 'ย้ายขึ้น', !!prev, () => m.api.move(x.id, prev.id, 'before'))}
      {b('fas fa-arrow-down', 'ย้ายลง', !!next, () => m.api.move(x.id, next.id, 'after'))}
      {b('fas fa-level-down-alt', 'เป็นเมนูย่อยของตัวบน', !f.parent && !!prev && !prev.layout.startsWith('col') && !x.children.length, () => m.api.move(x.id, prev.id, 'into'))}
      {b('fas fa-level-up-alt', 'ออกจากเมนูย่อย', !!f.parent, () => m.api.move(x.id, f.parent!.id, 'after'))}
    </span>
  )
}

/* ---------- shared detail fields ---------- */
const LANGS = ['TH', 'EN', 'JP', 'CN']
function Names({ m, it }: { m: M; it: MenuItem }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {LANGS.map(l => (
        <label key={l} className="border border-ink-400 rounded-lg px-2.5 flex gap-2 items-center focus-within:border-red-300 focus-within:ring-2 focus-within:ring-red-100 bg-white">
          <span className="text-caption font-bold text-ink-500">{l}</span>
          <input key={it.id + l + (it.i18n[l] ?? '')} defaultValue={it.i18n[l] ?? ''} placeholder="—" aria-label={`ชื่อเมนู ${l}`} onBlur={e => m.api.rename(it.id, l, e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className="flex-1 min-w-0 h-9 bg-transparent outline-none text-body" />
        </label>
      ))}
    </div>
  )
}
function TargetPick({ m, it }: { m: M; it: MenuItem }) {
  const pages = m.draft.pages.filter(p => p.group === 'on')
  const opts = [...pages.map(p => `หน้าเพจ: ${p.name} · ${p.path}`), 'หมวดหมู่: Collection (ทั้งหมด)', ...CATEGORIES.map(c => `หมวดหมู่: ${c.name} · ${c.url}`), 'หน้าระบบ: AI Search', 'ไม่มีลิงก์ (หัวข้อ)']
  if (!opts.includes(it.target)) opts.unshift(it.target)
  return (
    <label className="relative block">
      <span className="sr-only">ลิงก์ไปที่</span>
      <i className={`${MENU_KIND_ICON[it.kind] ?? 'fas fa-link'} absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 text-[11px] pointer-events-none`} />
      <select value={it.target} onChange={e => m.api.setTarget(it.id, e.target.value)} className="w-full h-9 appearance-none border border-ink-400 rounded-lg pl-8 pr-7 bg-white text-body">{opts.map(o => <option key={o}>{o}</option>)}</select>
      <i className="fas fa-chevron-down text-[10px] text-ink-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </label>
  )
}
function PickLink({ label, onPick, cats }: { label: string; onPick: (l: MenuLink) => void; cats?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="text-meta text-red-600 font-semibold"><i className="fas fa-plus text-[10px]" /> {label}</button>
      {open && (
        <div className="absolute right-0 top-6 z-30 w-[240px] bg-white border border-ink-150 rounded-xl shadow-xl p-1.5 flex flex-col">
          {cats !== false && <div className="text-caption font-semibold text-ink-500 px-2 pt-1 pb-1">หมวดหมู่สินค้า</div>}
          {CATEGORIES.map(c => <button key={c.url} onClick={() => { setOpen(false); onPick(c) }} className="flex justify-between px-2 py-1.5 rounded-md hover:bg-ink-50 text-meta"><span>{c.name}</span><span className="text-ink-500 text-caption">{c.url}</span></button>)}
          <button onClick={() => { setOpen(false); onPick({ name: 'ลิงก์ใหม่', url: '' }) }} className="text-left px-2 py-1.5 mt-1 border-t border-ink-100 rounded-md hover:bg-ink-50 text-meta text-ink-600"><i className="fas fa-link text-[11px] mr-1.5" />ลิงก์เอง (ใส่ URL ทีหลัง)</button>
        </div>
      )}
    </span>
  )
}

/* 3b — 2. Menu Collection: slots follow the chosen layout (Column N = N link columns + 1 banner) */
function Collection({ m, it }: { m: M; it: MenuItem }) {
  const n = Number(it.layout.slice(3))
  const [drag, setDrag] = useState<{ ci: number; li: number } | null>(null)
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: MENU_LAYOUTS.find(l => l.key === it.layout)!.cols.map(c => `${c}fr`).join(' ') }}>
      {it.cols.slice(0, n).map((c, ci) => (
        <div key={ci} className="border border-ink-150 rounded-[10px] p-2 flex flex-col gap-1.5 bg-ink-50 min-w-0" onDragOver={e => drag && e.preventDefault()} onDrop={() => { if (drag) m.api.moveLink(drag.ci, drag.li, ci, c.links.length); setDrag(null) }}>
          <label className="flex items-center gap-1.5 text-caption font-bold text-ink-500 tracking-[.04em]">
            <span className="whitespace-nowrap">คอลัมน์ {ci + 1} ·</span>
            <input key={c.head} defaultValue={c.head} aria-label={`หัวคอลัมน์ ${ci + 1}`} onBlur={e => m.api.setHead(ci, e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className="flex-1 min-w-0 bg-transparent outline-none uppercase focus:bg-white rounded px-0.5" />
            <i className="fas fa-pen text-[9px] text-ink-400" />
          </label>
          {c.links.map((l, li) => (
            <div key={li} draggable onDragStart={() => setDrag({ ci, li })} onDragOver={e => e.preventDefault()} onDrop={e => { e.stopPropagation(); if (drag) m.api.moveLink(drag.ci, drag.li, ci, li); setDrag(null) }}
              className="group bg-white border border-ink-150 rounded-md px-1.5 py-1 flex flex-col text-caption cursor-grab">
              <input key={l.name + li} defaultValue={l.name} aria-label="ชื่อลิงก์" onBlur={e => m.api.editLink(ci, li, { name: e.target.value })} onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className="font-semibold bg-transparent outline-none min-w-0 focus:bg-ink-50 rounded px-0.5" />
              <span className="flex items-center gap-1">
                <input key={l.url + li} defaultValue={l.url} placeholder="URL" aria-label="URL" onBlur={e => m.api.editLink(ci, li, { url: e.target.value })} onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className="flex-1 text-caption text-ink-500 bg-transparent outline-none min-w-0 focus:bg-ink-50 rounded px-0.5" />
                <button aria-label={`ย้าย ${l.name} ขึ้น`} disabled={li === 0} onClick={() => m.api.moveLink(ci, li, ci, li - 1)} className="text-ink-500 hover:text-ink-900 opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:hidden"><i className="fas fa-arrow-up text-[10px]" /></button>
                <button aria-label={`ย้าย ${l.name} ลง`} disabled={li === c.links.length - 1} onClick={() => m.api.moveLink(ci, li, ci, li + 1)} className="text-ink-500 hover:text-ink-900 opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:hidden"><i className="fas fa-arrow-down text-[10px]" /></button>
                <button aria-label="ลบลิงก์" onClick={() => m.api.removeLink(ci, li)} className="text-ink-500 hover:text-red-600 opacity-0 group-hover:opacity-100 focus:opacity-100"><i className="fas fa-times text-[10px]" /></button>
              </span>
            </div>
          ))}
          <PickLinkSlot onPick={l => m.api.addLink(ci, l)} />
        </div>
      ))}
      <div className="border border-ink-150 rounded-[10px] p-2 flex flex-col gap-1.5 bg-ink-50">
        <div className="text-caption font-bold text-ink-500 tracking-[.04em]">BANNER</div>
        <div className="flex-1 min-h-[64px] rounded-md relative" style={{ background: 'linear-gradient(160deg,#d9b493,#5e3b28)' }}>
          <button onClick={() => m.showToast('อัปโหลดรูป Banner ยังไม่รองรับใน prototype (ยังไม่มีคลังรูป)')} className="absolute right-1.5 bottom-1.5 bg-white rounded-[5px] px-1.5 py-0.5 text-caption font-semibold"><i className="far fa-image text-[9px]" /> เปลี่ยนรูป</button>
        </div>
        <label className="bg-white border border-ink-400 rounded-md px-1.5 py-1 text-caption text-ink-500 flex gap-1.5 items-center"><i className="fas fa-link text-[9px]" /><input key={it.banner?.url} defaultValue={it.banner?.url ?? ''} placeholder="ลิงก์ของ Banner" aria-label="ลิงก์ของ Banner" onBlur={e => m.api.setBanner(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className="flex-1 min-w-0 bg-transparent outline-none" /></label>
      </div>
    </div>
  )
}
function PickLinkSlot({ onPick }: { onPick: (l: MenuLink) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="w-full border border-dashed border-ink-500 rounded-md py-1 text-center text-caption text-ink-500 hover:border-ink-500"><i className="fas fa-plus text-[9px]" /> เพิ่มลิงก์</button>
      {open && <div className="absolute left-0 top-8 z-30 w-[220px] bg-white border border-ink-150 rounded-xl shadow-xl p-1.5 flex flex-col">
        {CATEGORIES.map(c => <button key={c.url} onClick={() => { setOpen(false); onPick(c) }} className="flex justify-between px-2 py-1.5 rounded-md hover:bg-ink-50 text-meta"><span>{c.name}</span><span className="text-ink-500 text-caption">{c.url}</span></button>)}
        <button onClick={() => { setOpen(false); onPick({ name: 'ลิงก์ใหม่', url: '' }) }} className="text-left px-2 py-1.5 mt-1 border-t border-ink-100 rounded-md hover:bg-ink-50 text-meta text-ink-600"><i className="fas fa-link text-[11px] mr-1.5" />ลิงก์เอง</button>
      </div>}
    </div>
  )
}

function DetailHead({ m, it, look }: { m: M; it: MenuItem; look: 'a' | 'c' }) {
  return (
    <div className={`px-[18px] border-b border-ink-100 flex items-center gap-2.5 ${look === 'a' ? 'py-3.5' : 'py-3'}`}>
      <i className={`${MENU_KIND_ICON[it.kind] ?? 'fas fa-link'} text-ink-500`} />
      <h2 className="font-bold text-heading uppercase truncate">{menuLabel(it)}</h2>
      <span className="text-caption px-1.5 py-0.5 rounded-[5px] bg-ink-100 text-ink-600 whitespace-nowrap">{look === 'c' ? (layoutName(it) ? `Menu Type · ${layoutName(it)}` : MENU_KIND_LABEL[it.kind]) : MENU_KIND_LABEL[it.kind]}</span>
      <button onClick={() => m.api.remove(it.id)} className="ml-auto text-red-600 text-meta flex gap-1.5 items-center whitespace-nowrap hover:text-red-700"><i className="far fa-trash-alt" />{look === 'a' ? 'ลบเมนู' : 'ลบ'}</button>
    </div>
  )
}

/* ---------- V4 (โคลนจาก V3) · 3b — preview ลากได้จริง + ต้นไม้ซ้าย · panel ขวา: 1. Menu Type → 2. Menu Collection ---------- */
export function MenuV4(_: { collapsed?: boolean }) {
  useUndoKeys()
  const m = useMenu()
  const it = m.sel
  const isChild = !!(it && find(m.menu, it.id)?.parent)
  const n = it?.layout.startsWith('col') ? Number(it.layout.slice(3)) : 0
  const thin = it && n ? it.cols.slice(0, n).findIndex(c => c.head.toUpperCase() === 'SALE' && c.links.length === 1) : -1
  return (
    <div className="text-body flex-1 flex flex-col min-w-0 min-h-0 bg-cream">
      <div className="h-14 bg-white border-b border-ink-150 flex items-center px-6 gap-3 flex-none">
        <h1 className="font-bold text-title">Menu</h1><span className="text-ink-500">/</span><span className="text-ink-600">Menu display · แถบเมนูบน Header</span>
        <div className="flex-1" />
        <Saved />
        <DevSwitch m={m} look="c" labels />
        <CreateMenu m={m} look="c" />
      </div>
      <div tabIndex={0} aria-label="พื้นที่ Menu" className="outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-600 flex-1 overflow-auto px-6 pt-5 pb-28 flex flex-col gap-4">
        <div className="bg-white rounded-[14px] shadow-md border border-black/5">
          <div className="flex items-center gap-2 text-caption text-ink-500 px-3 py-2 border-b border-ink-100"><span className="font-semibold text-ink-700">พรีวิว Header จริง</span>· ลากชิปเพื่อเรียง · ลากซ้อนบนชิปอื่น = ทำเมนูย่อย · คลิกเพื่อแก้<span className="ml-auto flex gap-1.5 items-center text-ink-600"><i className="fas fa-magic text-red-600" />วางเมนูใหม่ที่ปุ่ม +</span></div>
          <div className="rounded-b-[14px] overflow-visible"><MenuBar m={m} look="c" /></div>
        </div>
        <div className="flex gap-4 items-start">
          <div className="w-[400px] flex-none"><Tree m={m} look="c" /></div>
          {it && (
            <div className="flex-1 min-w-0 bg-white border border-ink-150 rounded-xl overflow-hidden">
              <DetailHead m={m} it={it} look="c" />
              <div className="px-[18px] py-3.5 flex flex-col gap-3.5">
                <div><div className="font-semibold mb-1.5">ชื่อเมนู <span className="text-ink-500 font-normal">· 4 ภาษา</span></div><Names m={m} it={it} /></div>
                <div className="max-w-[50%]"><div className="font-semibold mb-1.5">ลิงก์ไปที่</div><TargetPick m={m} it={it} /></div>
                {isChild ? <div className="text-meta text-ink-500 rounded-lg bg-ink-50 border border-ink-150 p-2.5">เมนูย่อย — Menu Type ตั้งได้ที่เมนูแม่</div> : <>
                  <div>
                    <div className="font-semibold mb-1.5 flex items-center gap-2">1. Menu Type <span className="text-caption font-normal text-ink-500">· เลือก layout ก่อน ช่องด้านล่างจะเปลี่ยนตาม (เหมือนเดิม)</span></div>
                    <div role="radiogroup" className="flex gap-2">
                      {MENU_LAYOUTS.map(t => {
                        const on = it.layout === t.key
                        return (
                          <button key={t.key} role="radio" aria-checked={on} onClick={() => m.api.setLayout(it.id, t.key)} className={`flex-1 rounded-[10px] p-2 text-center ${on ? 'bg-red-50' : 'bg-white hover:border-ink-400'}`} style={{ border: `2px solid ${on ? 'var(--red-600)' : 'var(--ink-400)'}` }}>
                            <div className="h-8 bg-white border border-ink-150 rounded-[5px] p-1 grid gap-[3px]" style={{ gridTemplateColumns: t.cols.map(c => `${c}fr`).join(' ') }}>{t.cols.map((_, i) => <span key={i} className="rounded-sm" style={{ background: t.key !== 'normal' && i === t.cols.length - 1 ? 'var(--orange-100)' : 'var(--ink-200)' }} />)}</div>
                            <div className="text-caption font-semibold mt-1.5">{t.name}</div><div className="text-caption text-ink-500">{t.desc}</div>
                          </button>
                        )
                      })}
                    </div>
                    {it.layout === 'none' && <div className="text-caption text-ink-500 mt-1.5">ตอนนี้ไม่มีเมนูย่อย — เลือก layout เพื่อเริ่ม</div>}
                  </div>
                  <div>
                    <div className="font-semibold mb-1.5 flex items-center gap-2">2. Menu Collection <span className="text-caption font-normal text-ink-500 truncate">· {n ? `ช่องตาม layout Column ${n} — คลิกช่องเพื่อใส่ URL / Banner` : 'Normal = รายการ dropdown'}</span>{n > 0 && <span className="ml-auto text-caption text-ink-600 whitespace-nowrap"><i className="fas fa-eye text-[10px]" /> ตรงกับ preview ด้านบน</span>}</div>
                    {n ? <Collection m={m} it={it} /> : it.layout === 'normal' ? (
                      <div className="flex flex-wrap gap-2 items-center">
                        {it.children.map(c => <button key={c.id} onClick={() => m.api.select(c.id)} className="border border-ink-400 rounded-lg px-2.5 py-1.5 text-meta hover:border-ink-400">{menuLabel(c)}</button>)}
                        {!it.children.length && <span className="text-meta text-ink-500">ยังไม่มีรายการ · ลากเมนูอื่นมาวางกลางชิปนี้</span>}
                        <PickLink label="เพิ่มรายการ" onPick={l => m.api.addChild(l)} />
                      </div>
                    ) : null}
                  </div>
                  {thin >= 0 && (
                    <div className="bg-ink-50 border border-ink-150 rounded-xl px-3 py-2.5 flex gap-3 items-center">
                      <MascotImg src="mascot-idea.png" size={40} pos="center 15%" className="rounded-lg" />
                      <div className="flex-1 text-meta leading-normal text-ink-700"><b>ผู้ช่วย Ket:</b> ช่อง {it.cols[thin].head} ยังมีลิงก์เดียว — ดึงหมวด “ลดราคา” 3 หมวดมาเติมให้ไหมครับ?</div>
                      <button onClick={() => m.api.aiFill(thin)} className="h-[30px] px-3 rounded-lg bg-ink-900 text-white font-semibold text-meta whitespace-nowrap">ลองในฉบับร่าง</button>
                    </div>
                  )}
                </>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
