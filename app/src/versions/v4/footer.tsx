/* V4 — cloned from V3 (FooterC in screens/footer.tsx) on 2026-09-24 so V4 can change without touching V3.
   Only V4 uses this file. */
import { useState } from 'react'
import { diffSites, useStore, type Actor } from '@/data/store'
import { colSummary, FOOTER_LANGS, FOOTER_TEXT, rowMeta, type Device, type FooterCol, type FooterRow } from '@/data/schema'
import { FooterPreview } from '@/components/storefront/Canvas'
import { PublishDialog } from './panels'
import { ColorField, PublishBtn, useUndoKeys, useWidth, type Look } from './shared'

/* =====================================================================
   Footer (ใช้ร่วมทุกหน้า) — V1 = 1j · V2 = 1k · V3 = 3d · flow 3w
   1 เลือกภาษา (TH หลัก / EN / JP / CN · ภาษาที่ยังว่างเป็นสีเทา · โคลนจาก TH)
   2 คลิกคอลัมน์บน footer → กรอบ + toolbar (✦ ⚙ ลบ) · panel = คุณสมบัติคอลัมน์   (V1: การ์ดแถว + คุณสมบัติแถว)
   3 แก้ลิงก์: เพิ่ม / ลาก / ลบ · "เลือกจากเมนู" ดึงหน้าจากเมนูเว็บ ไม่ต้องพิมพ์ URL
   4 ปรับแถว: ลากเรียงแถว · จำนวนคอลัมน์ 1/2/3/4 · (V2) ลากเส้นกริดปรับความกว้าง
   5 สร้างจากข้อมูลร้าน (ผู้ช่วย Ket) → ฉบับร่าง   6 เผยแพร่ครั้งเดียว · ภาษาที่ยังว่าง fallback เป็น TH
   Every change is a commit to the draft (undo / history).
   ===================================================================== */

const uid = () => Math.random().toString(36).slice(2, 8)
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
const WIDTHS: Record<number, number[]> = { 1: [1], 2: [1, 1], 3: [1, 1, 1], 4: [1.4, 1, 1, 1] }
const SOCIALS: [string, string][] = [['facebook', 'Facebook'], ['instagram', 'Instagram'], ['line', 'LINE'], ['tiktok', 'TikTok']]

function useFooter() {
  const draft = useStore(s => s.draft); const published = useStore(s => s.published)
  const editFooter = useStore(s => s.editFooter); const showToast = useStore(s => s.showToast)
  const lang = useStore(s => s.panel['ftr-lang'] ?? 'TH')
  const selKey = useStore(s => s.panel['ftr-sel'] ?? 'fr-1:1')
  const setPanel = useStore(s => s.setPanel)
  const all = draft.footer.rows ?? {}
  const rows = all[lang]
  const [selRowId, selColStr] = selKey.split(':')
  const list = rows ?? []
  const rowIdx = Math.max(0, list.findIndex(r => r.id === selRowId))
  const row = list[rowIdx] as FooterRow | undefined
  const colIdx = Math.min(Number(selColStr) || 0, (row?.cols.length ?? 1) - 1)
  const col = row?.cols[colIdx]
  const dirty = diffSites(published, draft).some(c => c.label.includes('Footer'))
  const has = (l: string) => !!all[l]?.length

  const edit = (label: string, fn: (rows: FooterRow[], all: Record<string, FooterRow[]>) => void | false, actor?: Actor) =>
    editFooter(lang, fn, `Footer${lang === 'TH' ? '' : ' ' + lang} · ${label}`, actor)
  const onRow = (id: string, fn: (r: FooterRow) => void | false) => (rs: FooterRow[]) => { const r = rs.find(x => x.id === id); if (!r) return false; return fn(r) }
  const select = (rowId: string, c = 0) => setPanel('ftr-sel', `${rowId}:${c}`)

  const api = {
    select,
    setLang: (l: string) => setPanel('ftr-lang', l),
    addRow: () => { const id = 'fr-' + uid(); if (edit('เพิ่มแถว', rs => { rs.push({ id, widths: [1], padY: 24, cols: [{ id: 'fc-' + uid(), kind: 'empty', title: '' }] }) })) select(id) },
    moveRow: (from: number, to: number) => edit('เรียงลำดับแถว', rs => { if (from === to || to < 0 || to >= rs.length) return false; const [r] = rs.splice(from, 1); rs.splice(to, 0, r) }),
    dupRow: (id: string) => { const nid = 'fr-' + uid(); if (edit('คัดลอกแถว', rs => { const i = rs.findIndex(r => r.id === id); if (i < 0) return false; const c = clone(rs[i]); c.id = nid; c.cols.forEach(x => (x.id = 'fc-' + uid())); rs.splice(i + 1, 0, c) })) select(nid) },
    toggleRow: (id: string) => edit(list.find(r => r.id === id)?.hidden ? 'แสดงแถว' : 'ซ่อนแถว', onRow(id, r => { r.hidden = !r.hidden })),
    deleteRow: (id: string) => {
      if (list.length <= 1) return showToast('Footer ต้องมีอย่างน้อย 1 แถว')
      const i = list.findIndex(r => r.id === id)
      if (edit(`ลบแถว ${i + 1}`, rs => { rs.splice(i, 1) })) { select(list[i === 0 ? 1 : i - 1].id); showToast(`ลบแถว ${i + 1} แล้ว · Ctrl+Z เพื่อย้อน`) }
    },
    setCols: (id: string, n: number) => edit(`แถวเป็น ${n} คอลัมน์`, onRow(id, r => {
      if (r.cols.length === n) return false
      while (r.cols.length < n) r.cols.push({ id: 'fc-' + uid(), kind: 'empty', title: '' })
      r.cols = r.cols.slice(0, n)
      r.widths = n === 4 && r.cols[0].kind === 'brand' ? [...WIDTHS[4]] : Array(n).fill(1)
    })),
    setWidths: (id: string, w: number[]) => edit('ปรับความกว้างคอลัมน์', onRow(id, r => { r.widths = w })),
    setBg: (id: string, bg: FooterRow['bg']) => edit(bg ? 'ตั้งสีพื้นแถวเฉพาะจุด' : 'พื้นแถวกลับไปใช้ Token', onRow(id, r => { r.bg = bg })),
    setPad: (id: string, v: number) => edit(`ระยะห่างบน–ล่าง ${v} px`, onRow(id, r => { if (r.padY === v) return false; r.padY = v })),
    toggleDevice: (id: string, d: Device) => edit('แสดงบนจอ', onRow(id, r => { const cur = r.hideOn ?? []; r.hideOn = cur.includes(d) ? cur.filter(x => x !== d) : [...cur, d] })),
    editCol: (label: string, fn: (c: FooterCol) => void | false) => row && col && edit(label, rs => { const c = rs.find(r => r.id === row.id)?.cols[colIdx]; if (!c) return false; return fn(c) }),
    deleteCol: (rowId: string, ci: number) => {
      const r = list.find(x => x.id === rowId); if (!r) return
      if (r.cols.length <= 1) return showToast('แถวต้องมีอย่างน้อย 1 คอลัมน์ — ลบทั้งแถวได้ที่รายการแถว')
      const name = colSummary(r.cols[ci])
      if (edit(`ลบคอลัมน์ ${name}`, onRow(rowId, rr => { rr.cols.splice(ci, 1); rr.widths.splice(ci, 1) }))) { select(rowId, Math.max(0, ci - 1)); showToast(`ลบคอลัมน์ “${name}” แล้ว · Ctrl+Z เพื่อย้อน`) }
    },
    /* clone TH into the current language, or into every empty language when TH is open (text stays Thai — not translated) */
    cloneFromTh: (targets?: string[]) => {
      const to = targets ?? (lang === 'TH' ? FOOTER_LANGS.filter(l => l !== 'TH' && !has(l)) : [lang])
      if (!to.length) return showToast('ทุกภาษามี Footer แล้ว')
      const ok = editFooter('TH', (_rs, a) => { for (const l of to) a[l] = clone(a.TH ?? []) }, `Footer · โคลนจาก TH → ${to.join(' · ')}`)
      if (ok) showToast(`โคลน Footer ไป ${to.join(' · ')} แล้ว — ข้อความยังเป็นภาษาไทย รอแปล (prototype ไม่แปลให้จริง)`)
    },
    /* "สร้าง Footer จากข้อมูลร้าน" — shop data the prototype has (mockup): name · about · phone · email · social · payments; address is not in the data */
    buildFromShop: () => {
      const d = draft.footer.data
      const ok = editFooter('TH', rs => {
        const keepLinks = rs.flatMap(r => r.cols).filter(c => c.kind === 'links')
        const shop = keepLinks[0] ?? { id: 'fc-' + uid(), kind: 'links' as const, title: 'Shop', links: [] }
        const help = keepLinks[1] ?? { id: 'fc-' + uid(), kind: 'links' as const, title: 'Help', links: [] }
        rs.splice(0, rs.length,
          { id: 'fr-1', widths: [...WIDTHS[4]], padY: 40, cols: [
            { id: 'fc-brand', kind: 'brand', title: d.brand, text: `${d.about}\n${d.contact}\nที่อยู่ [รอข้อมูล]` }, shop, help,
            { id: 'fc-follow', kind: 'social', title: 'Follow', items: ['facebook', 'instagram', 'line'] }] },
          { id: 'fr-2', widths: [1], padY: 12, bar: true, bg: { hex: '#242220' }, cols: [{ id: 'fc-pay', kind: 'payments', title: 'ชำระเงิน', items: ['VISA', 'Mastercard', 'PromptPay', 'COD'] }] },
          { id: 'fr-3', widths: [1], padY: 12, bar: true, bg: { hex: '#242220' }, cols: [{ id: 'fc-copy', kind: 'copyright', title: '', text: '© 2026 Girly Closet · Powered by Ketshopweb' }] })
      }, 'Footer · สร้างจากข้อมูลร้าน (ผู้ช่วย Ket)', 'ผู้ช่วย Ket')
      showToast(ok ? 'ผู้ช่วยจัด Footer จากข้อมูลร้านลงฉบับร่างแล้ว — ที่อยู่ร้านยังไม่มีในข้อมูล ใส่ [รอข้อมูล] ไว้' : 'Footer ตรงกับข้อมูลร้านอยู่แล้ว')
      setPanel('ftr-lang', 'TH'); select('fr-1', 0)
    },
    askAi: (name: string) => showToast(`ส่งคอลัมน์ “${name}” ให้ผู้ช่วย Ket เป็นบริบทแล้ว — บทตั้งไว้ของ prototype ยังไม่มีคำสั่งสำหรับ Footer`),
  }
  return { draft, lang, rows, list, row, rowIdx, col, colIdx, dirty, has, api }
}
type F = ReturnType<typeof useFooter>

/* ---------- language segmented (ภาษาที่ยังว่าง = เทา) ---------- */
function LangSwitch({ f, pill }: { f: F; pill?: boolean }) {
  return (
    <span role="radiogroup" aria-label="ภาษา" className={`flex gap-0.5 p-[3px] text-meta font-semibold ${pill ? 'bg-ink-900/6 rounded-full' : 'bg-ink-100 rounded-lg'}`}>
      {FOOTER_LANGS.map(l => {
        const on = f.lang === l
        return <button key={l} role="radio" aria-checked={on} title={f.has(l) ? `Footer ภาษา ${l}` : `ภาษา ${l} ยังไม่มี Footer`} onClick={() => f.api.setLang(l)}
          className={`px-3 py-1 ${pill ? 'rounded-full' : 'rounded-md'} ${on ? 'bg-white shadow-xs text-ink-900' : f.has(l) ? 'text-ink-600' : 'text-ink-400'}`}>{l === 'TH' && !pill ? 'TH หลัก' : l}</button>
      })}
    </span>
  )
}
function CloneBtn({ f, long }: { f: F; long?: boolean }) {
  const [ask, setAsk] = useState(false)
  const target = f.lang !== 'TH' && f.has(f.lang)
  if (ask) return <button onClick={() => { setAsk(false); f.api.cloneFromTh() }} onBlur={() => setAsk(false)} className="h-9 px-3 rounded-lg bg-red-600 text-white font-semibold text-meta whitespace-nowrap">ยืนยันโคลนทับ {f.lang}</button>
  return <button onClick={() => target ? setAsk(true) : f.api.cloneFromTh()} className="h-9 flex items-center gap-2 px-2 rounded-lg text-ink-600 text-body hover:bg-ink-50 whitespace-nowrap"><i className="far fa-clone" />{long ? 'โคลนจากภาษาหลัก (TH)' : 'โคลนจาก TH'}</button>
}
function AddRow({ f, pill }: { f: F; pill?: boolean }) {
  return <button onClick={f.api.addRow} disabled={!f.rows} className={`flex items-center gap-2 font-semibold disabled:opacity-40 ${pill ? 'h-[38px] bg-white rounded-full px-3.5 shadow-sm' : 'h-9 border border-ink-200 rounded-lg bg-white px-3 hover:border-ink-400'}`}><i className="fas fa-plus text-[11px]" />เพิ่มแถว</button>
}
function EmptyLang({ f }: { f: F }) {
  return (
    <div className="bg-white border border-dashed border-ink-300 rounded-xl p-8 text-center text-ink-600 leading-relaxed">
      <i className="fas fa-language text-2xl text-ink-300" /><br /><b className="text-ink-900">ภาษา {f.lang} ยังไม่มี Footer</b><br />หน้าเว็บภาษานี้จะแสดง Footer ภาษา TH แทนจนกว่าจะสร้าง
      <div className="mt-3"><button onClick={() => f.api.cloneFromTh()} className="h-9 px-3.5 rounded-lg bg-ink-900 text-white font-semibold"><i className="far fa-clone mr-1.5" />โคลนจาก TH มาแก้ต่อ</button></div>
    </div>
  )
}

/* ---------- column-count picker (1 / 2 / 3 / 4 · 4 = แบรนด์กว้างกว่า) ---------- */
function ColCount({ f, h = 40 }: { f: F; h?: number }) {
  const n = f.row?.cols.length
  return (
    <div role="radiogroup" aria-label="จำนวนคอลัมน์" className="flex gap-1.5">
      {[1, 2, 3, 4].map(k => {
        const on = n === k
        return (
          <button key={k} role="radio" aria-checked={on} title={`${k} คอลัมน์`} onClick={() => f.row && f.api.setCols(f.row.id, k)} className={`flex-1 rounded-lg flex items-center gap-0.5 px-2 ${on ? 'bg-red-50' : 'bg-white hover:border-ink-400'}`} style={{ height: h, border: on ? '2px solid var(--red-600)' : '1px solid var(--ink-200)' }}>
            {WIDTHS[k].map((w, i) => <span key={i} className="rounded-sm" style={{ flex: w, height: h > 36 ? 14 : 12, background: on ? 'var(--red-600)' : 'var(--ink-300)' }} />)}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- links in a column: drag to reorder · rename · remove · add from the site menu ---------- */
function LinksEditor({ f }: { f: F }) {
  const pages = useStore(s => s.draft.pages).filter(p => p.group === 'on')
  const [pick, setPick] = useState(false)
  const [drag, setDrag] = useState<number | null>(null)
  const links = f.col?.links ?? []
  return (
    <div className="flex flex-col gap-1.5 text-body">
      {links.map((l, i) => (
        <div key={i} draggable onDragStart={() => setDrag(i)} onDragOver={e => e.preventDefault()} onDrop={() => { if (drag !== null && drag !== i) f.api.editCol('เรียงลิงก์', c => { const [x] = c.links!.splice(drag, 1); c.links!.splice(i, 0, x) }); setDrag(null) }}
          className={`group border rounded-lg pl-2 pr-1.5 py-1 flex gap-2 items-center bg-white ${drag === i ? 'opacity-50' : ''} border-ink-150`}>
          <i className="fas fa-grip-vertical text-ink-300 text-[11px] cursor-grab" title="ลากเพื่อเรียง" />
          <input key={l.label + i} defaultValue={l.label} aria-label="ชื่อลิงก์" onBlur={e => e.target.value !== l.label && f.api.editCol('แก้ชื่อลิงก์', c => { c.links![i].label = e.target.value })} onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="flex-1 min-w-0 bg-transparent h-7 outline-none focus:bg-ink-50 rounded px-1" />
          <span className={`text-caption whitespace-nowrap ${l.href ? 'text-ink-400' : 'text-ink-300 italic'}`}>{l.href || 'ยังไม่ผูกลิงก์'}</span>
          <button aria-label={`ลบลิงก์ ${l.label}`} onClick={() => f.api.editCol(`ลบลิงก์ ${l.label}`, c => { c.links!.splice(i, 1) })} className="w-6 h-6 rounded grid place-items-center text-ink-400 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-red-600"><i className="fas fa-times text-[11px]" /></button>
        </div>
      ))}
      <div className="relative">
        <button onClick={() => setPick(!pick)} aria-expanded={pick} className="text-red-600 font-semibold text-body py-0.5"><i className="fas fa-plus text-[10px]" /> เพิ่มลิงก์ / เลือกจากเมนู</button>
        {pick && (
          <div className="absolute z-20 left-0 right-0 top-[calc(100%+4px)] bg-white border border-ink-150 rounded-xl shadow-xl p-2 flex flex-col">
            <div className="text-caption font-semibold text-ink-500 px-2 pt-1 pb-1.5">หน้าบนเมนูเว็บ · ไม่ต้องพิมพ์ URL</div>
            {pages.map(p => <button key={p.id} onClick={() => { setPick(false); f.api.editCol(`เพิ่มลิงก์ ${p.name}`, c => { (c.links ??= []).push({ label: p.name, href: p.path }) }) }} className="flex justify-between items-center px-2 py-1.5 rounded-md hover:bg-ink-50 text-body"><span>{p.name}</span><span className="text-ink-400 text-caption">{p.path}</span></button>)}
            <button onClick={() => { setPick(false); f.api.editCol('เพิ่มลิงก์', c => { (c.links ??= []).push({ label: 'ลิงก์ใหม่', href: '' }) }) }} className="text-left px-2 py-1.5 mt-1 border-t border-ink-100 rounded-md hover:bg-ink-50 text-body text-ink-600"><i className="fas fa-link text-[11px] mr-1.5" />ลิงก์เอง (ใส่ URL ทีหลัง)</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- column properties (1k / 3d panel) ---------- */
const LAB = 'text-caption font-semibold text-ink-500 tracking-[.04em] mb-1.5'
function ColumnForm({ f, look }: { f: F; look: Look }) {
  const c = f.col; if (!c) return null
  const field = (label: string, v: string, key: 'title' | 'text', area?: boolean) => (
    <div><div className={LAB}>{label}</div>
      {area
        ? <textarea key={c.id + key + v} defaultValue={v} rows={3} onBlur={e => e.target.value !== v && f.api.editCol(`แก้${label}`, x => { x[key] = e.target.value })} className="w-full border border-ink-200 rounded-[9px] px-2.5 py-2 text-body leading-relaxed resize-none" />
        : <input key={c.id + key + v} defaultValue={v} onBlur={e => e.target.value !== v && f.api.editCol(`แก้${label}`, x => { x[key] = e.target.value })} onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className="w-full h-9 border border-ink-200 rounded-[9px] px-2.5 text-body" />}
    </div>
  )
  return (
    <div className="flex flex-col gap-3.5">
      {c.kind === 'links' && <>{field('หัวข้อ', c.title, 'title')}<div><div className={LAB}>ลิงก์ ({c.links?.length ?? 0})</div><LinksEditor f={f} /></div></>}
      {c.kind === 'brand' && <>{field('ชื่อร้าน', c.title, 'title')}{field('ข้อความ', c.text ?? '', 'text', true)}</>}
      {c.kind === 'copyright' && field('ข้อความลิขสิทธิ์', c.text ?? '', 'text')}
      {c.kind === 'social' && <>{field('หัวข้อ', c.title, 'title')}<div><div className={LAB}>โซเชียล</div><div className="flex flex-col gap-1.5 text-body">{SOCIALS.map(([k, l]) => {
        const on = c.items?.includes(k)
        return <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={!!on} onChange={() => f.api.editCol(`${on ? 'ซ่อน' : 'แสดง'} ${l}`, x => { x.items = on ? (x.items ?? []).filter(i => i !== k) : [...(x.items ?? []), k] })} /><i className={`fab fa-${k} w-4 text-center text-ink-600`} />{l}</label>
      })}</div><div className="text-caption text-ink-400 mt-1.5">ลิงก์บัญชีมาจาก ตั้งค่า → ข้อมูลร้าน</div></div></>}
      {c.kind === 'payments' && <div className="rounded-lg bg-ink-50 border border-ink-150 p-2.5 text-meta text-ink-600 leading-relaxed"><b className="text-ink-900">{c.items?.join(' · ')}</b><br />ดึงจาก ตั้งค่า → ช่องทางชำระเงิน · แก้ที่นั่น</div>}
      {c.kind === 'empty' && <div><div className={LAB}>คอลัมน์ว่าง · ใส่อะไร</div><div className="grid grid-cols-2 gap-1.5 text-meta">
        {([['links', 'รายการลิงก์', 'fas fa-list'], ['social', 'โซเชียล', 'fas fa-share-alt'], ['payments', 'ช่องทางชำระเงิน', 'far fa-credit-card'], ['copyright', 'ข้อความสั้น', 'fas fa-font']] as const).map(([k, l, ic]) => (
          <button key={k} onClick={() => f.api.editCol(`ใส่${l}`, x => { x.kind = k; x.title = ''; if (k === 'links') x.links = []; if (k === 'social') x.items = ['facebook', 'instagram', 'line']; if (k === 'payments') x.items = ['VISA', 'Mastercard', 'PromptPay', 'COD']; if (k === 'copyright') x.text = '[รอข้อมูล]' })} className="h-9 border border-ink-200 rounded-lg flex items-center gap-2 px-2.5 hover:border-ink-400"><i className={`${ic} text-ink-500 w-4`} />{l}</button>
        ))}</div></div>}
      {look === 'b' && <div><div className={LAB}>สีตัวอักษร</div><div className="border border-ink-150 rounded-[10px] px-3 py-2.5 flex items-center gap-2.5"><span className="w-6 h-6 rounded-md" style={{ background: FOOTER_TEXT }} /><div className="flex-1 text-body"><div className="font-semibold">{FOOTER_TEXT}</div><div className="text-caption text-info-700"><i className="fas fa-link text-[9px]" /> Token · On Dark</div></div></div></div>}
    </div>
  )
}


/* ---------- rows list (1j cards with mini preview · 3d compact) — drag to reorder ---------- */
function RowList({ f, look }: { f: F; look: 'a' | 'c' }) {
  const [drag, setDrag] = useState<number | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const [menu, setMenu] = useState<string | null>(null)
  return (
    <div className="flex flex-col gap-2.5">
      {f.list.map((r, i) => {
        const sel = f.row?.id === r.id
        const icons = (
          <span className="ml-auto flex gap-1 text-ink-400 relative">
            <button aria-label={r.hidden ? 'แสดงแถว' : 'ซ่อนแถว'} title={r.hidden ? 'แสดงแถว' : 'ซ่อนแถว'} onClick={e => { e.stopPropagation(); f.api.toggleRow(r.id) }} className="w-7 h-7 rounded-md grid place-items-center hover:bg-ink-100 hover:text-ink-700"><i className={r.hidden ? 'far fa-eye-slash' : 'far fa-eye'} /></button>
            <button aria-label="คุณสมบัติแถว" title="คุณสมบัติแถว" onClick={e => { e.stopPropagation(); f.api.select(r.id) }} className="w-7 h-7 rounded-md grid place-items-center hover:bg-ink-100 hover:text-ink-700"><i className="fas fa-cog" /></button>
            {look === 'c' && <button aria-label="คัดลอกแถว" title="คัดลอกแถว" onClick={e => { e.stopPropagation(); f.api.dupRow(r.id) }} className="w-7 h-7 rounded-md grid place-items-center hover:bg-ink-100 hover:text-ink-700"><i className="far fa-clone" /></button>}
            <button aria-label="เพิ่มเติม" aria-expanded={menu === r.id} onClick={e => { e.stopPropagation(); setMenu(menu === r.id ? null : r.id) }} className="w-7 h-7 rounded-md grid place-items-center hover:bg-ink-100 hover:text-ink-700"><i className="fas fa-ellipsis-h" /></button>
            {menu === r.id && (
              <span className="absolute right-0 top-8 z-20 bg-white border border-ink-150 rounded-lg shadow-xl p-1 flex flex-col w-44 text-body text-ink-700" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setMenu(null); f.api.moveRow(i, i - 1) }} disabled={i === 0} className="text-left px-2.5 py-1.5 rounded hover:bg-ink-50 disabled:text-ink-300"><i className="fas fa-arrow-up w-5" />ย้ายขึ้น</button>
                <button onClick={() => { setMenu(null); f.api.moveRow(i, i + 1) }} disabled={i === f.list.length - 1} className="text-left px-2.5 py-1.5 rounded hover:bg-ink-50 disabled:text-ink-300"><i className="fas fa-arrow-down w-5" />ย้ายลง</button>
                <button onClick={() => { setMenu(null); f.api.dupRow(r.id) }} className="text-left px-2.5 py-1.5 rounded hover:bg-ink-50"><i className="far fa-clone w-5" />คัดลอกแถว</button>
                <button onClick={() => { setMenu(null); f.api.deleteRow(r.id) }} className="text-left px-2.5 py-1.5 rounded hover:bg-red-50 text-red-600"><i className="far fa-trash-alt w-5" />ลบแถว</button>
              </span>
            )}
          </span>
        )
        const head = (
          <>
            <i className="fas fa-grip-vertical text-ink-300 cursor-grab" title="ลากเพื่อเรียงลำดับ" />
            <span className="font-semibold whitespace-nowrap">แถว {i + 1}</span>
            <span className={`text-caption text-ink-500 truncate ${look === 'c' ? 'flex-1' : ''}`}>{rowMeta(r)}{r.hidden ? ' · ซ่อนอยู่' : ''}</span>
            {icons}
          </>
        )
        return (
          <div key={r.id} draggable onDragStart={() => setDrag(i)} onDragEnd={() => { setDrag(null); setOver(null) }} onDragOver={e => { e.preventDefault(); setOver(i) }} onDrop={() => { if (drag !== null) f.api.moveRow(drag, i); setDrag(null); setOver(null) }}
            onClick={() => f.api.select(r.id)} aria-current={sel}
            className={`bg-white rounded-xl cursor-pointer ${look === 'a' ? 'overflow-visible' : 'flex items-center gap-2.5 px-3 py-2'} ${drag === i ? 'opacity-50' : ''} ${r.hidden ? 'opacity-60' : ''}`}
            style={{ border: `1px solid ${sel ? 'var(--red-300)' : 'var(--ink-150)'}`, boxShadow: sel ? '0 0 0 3px rgba(227,41,41,.12)' : undefined, borderTop: over === i && drag !== i ? '2px solid var(--info-500)' : undefined }}>
            {look === 'a' ? <>
              <div className="flex items-center gap-2.5 px-3 py-2 border-b border-ink-100">{head}</div>
              <div className="rounded-b-xl px-4 py-3.5 grid gap-3 text-caption" style={{ background: '#2d2a28', color: FOOTER_TEXT, gridTemplateColumns: r.widths.map(w => `${w}fr`).join(' ') }}>
                {r.cols.map(c => <div key={c.id} className="border border-dashed border-white/20 rounded-md p-2 leading-normal min-h-[40px]"><div className="text-white font-semibold mb-0.5">{c.kind === 'copyright' ? '' : c.kind === 'empty' ? 'ว่าง' : c.title}</div>{cellText(c)}</div>)}
              </div>
            </> : head}
          </div>
        )
      })}
    </div>
  )
}
const cellText = (c: FooterCol) => c.kind === 'links' ? (c.links ?? []).map(l => l.label).join(' · ') : c.kind === 'social' ? (c.items ?? []).map(k => SOCIALS.find(s => s[0] === k)?.[1] ?? k).join(' · ') : c.kind === 'payments' ? (c.items ?? []).join(' · ') : c.kind === 'brand' ? (c.text ?? '').split('\n')[0] : c.text ?? ''

function BuildCard({ f, look }: { f: F; look: 'b' | 'c' }) {
  if (look === 'c') return (
    <>
      <div className="mt-auto bg-ink-50 border border-ink-150 rounded-xl p-3 flex gap-2.5 items-center">
        <img src="./img/mascot-box.png" alt="" className="w-10 h-[50px] object-cover rounded-lg" style={{ objectPosition: 'center 15%' }} />
        <div className="flex-1 text-meta leading-normal text-ink-700"><b>สร้าง Footer จากข้อมูลร้าน</b> — ดึงที่อยู่ เบอร์ โซเชียล ช่องทางชำระเงิน มาจัด 4 คอลัมน์ ครบ 4 ภาษา</div>
      </div>
      <button onClick={f.api.buildFromShop} className="h-9 rounded-[9px] text-white font-semibold flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,var(--red-600),var(--orange-500))' }}><i className="fas fa-magic text-[11px]" />สร้างฉบับร่าง</button>
    </>
  )
  return (
    <div className="flex-1 bg-white rounded-[14px] shadow-sm border border-black/5 px-4 py-3.5 flex gap-3.5 items-center">
      <img src="./img/mascot-box.png" alt="" className="w-[54px] h-[68px] object-cover rounded-[10px]" style={{ objectPosition: 'center 15%' }} />
      <div className="flex-1"><div className="font-bold">สร้าง Footer จากข้อมูลร้านให้ไหมครับ?</div><div className="text-meta text-ink-600 leading-normal">ดึงที่อยู่ เบอร์ โซเชียล และช่องทางชำระเงินจาก <b>ตั้งค่า → ข้อมูลร้าน</b> มาจัดเป็น 4 คอลัมน์ พร้อมข้อความทั้ง 4 ภาษา</div></div>
      <button onClick={f.api.buildFromShop} className="h-9 px-3.5 rounded-[10px] text-white font-semibold flex items-center gap-2 whitespace-nowrap" style={{ background: 'linear-gradient(135deg,var(--red-600),var(--orange-500))' }}><i className="fas fa-magic text-[11px]" />สร้างฉบับร่าง</button>
    </div>
  )
}

function useHot(f: F, look: Look, color: string) {
  return {
    sel: f.row ? { row: f.row.id, col: f.colIdx } : null, look, color,
    onCol: (row: string, col: number) => f.api.select(row, col),
    onAction: (a: 'ai' | 'props' | 'delete', row: string, col: number) => {
      f.api.select(row, col)
      const c = f.list.find(r => r.id === row)?.cols[col]
      if (a === 'delete') f.api.deleteCol(row, col); else if (a === 'ai' && c) f.api.askAi(colSummary(c))
    },
  }
}

/* ---------- V4 (โคลนจาก V3) · 3d — footer จริง + กริดคอลัมน์ + รายการแถวแบบเดิม · panel ขวา = คุณสมบัติคอลัมน์ ---------- */
export function FooterV4(_: { collapsed?: boolean }) {
  useUndoKeys()
  const f = useFooter()
  const fit = useWidth()
  const hot = useHot(f, 'c', 'var(--red-600)')
  return (
    <div className="text-body flex-1 flex flex-col min-w-0 min-h-0 bg-cream">
      <div className="h-14 bg-white border-b border-ink-150 flex items-center px-6 gap-3 flex-none">
        <span className="font-bold text-heading">Footer</span>
        <span className="ml-2"><LangSwitch f={f} /></span>
        <div className="flex-1" />
        <CloneBtn f={f} /><AddRow f={f} /><PublishBtn look="c" />
      </div>
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 min-w-0 overflow-auto px-6 pt-[22px] pb-28 flex flex-col gap-3.5">
          {f.rows ? <>
            <div ref={fit.ref} className="bg-white rounded-[14px] shadow-md border border-black/5 overflow-hidden"><FooterPreview site={f.draft} width={fit.w} lang={f.lang} strip={44} hot={hot} /></div>
            <RowList f={f} look="c" />
          </> : <EmptyLang f={f} />}
        </div>
        <div className="w-[340px] bg-white border-l border-ink-150 flex-none flex flex-col min-h-0">
          <div className="px-4 py-3.5 border-b border-ink-150 flex items-center gap-2">
            <span className="font-bold text-heading truncate">{f.col ? `คอลัมน์ · ${colSummary(f.col)}` : 'คอลัมน์'}</span>
            {f.col && <span className="text-caption font-bold px-1.5 py-0.5 rounded-[5px] bg-red-50 text-red-700 whitespace-nowrap">กำลังแก้</span>}
            {f.row && <span className="ml-auto text-caption text-ink-500 whitespace-nowrap">แถว {f.rowIdx + 1}</span>}
          </div>
          <div className="flex-1 overflow-auto p-4 flex flex-col gap-3.5">
            {f.col && <ColumnForm f={f} look="c" />}
            {f.row && <>
              <div><div className={LAB}>คอลัมน์ของแถว</div><ColCount f={f} h={34} /></div>
              <ColorField look="c" site={f.draft} value={f.row.bg} inheritName="พื้นเข้ม (Footer)" title="พื้นหลังแถว" scope="แถวนี้" onChange={v => f.api.setBg(f.row!.id, v)} />
            </>}
            <BuildCard f={f} look="c" />
          </div>
        </div>
      </div>
      <PublishDialog />
    </div>
  )
}
