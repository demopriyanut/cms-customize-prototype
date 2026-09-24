import { useEffect, useRef, useState } from 'react'
import { diffSites, useStore } from '@/data/store'
import { HEADER_INHERIT, HEADER_PRESETS, MENU_FONTS, NAV_LAYOUTS, tokenByName, tokenHex, type ColorRef, type SiteDoc } from '@/data/schema'
import { HeaderPreview, HZONE_LABEL, type HZone } from '@/components/storefront/Canvas'
import { DeviceToggle, MascotImg } from '@/components/editor/parts'
import { PublishDialog } from '@/components/editor/panels'

/* =====================================================================
   Header (ใช้ร่วมทุกหน้า) — V1 = 1h · V2 = 1i · V3 = 3c · flow 3v
   1 เปิด Header → เห็นของจริง + ป้ายโซน   2 คลิกโซน → ไปที่การตั้งค่าของโซนนั้น
   3 เลือก Layout → preview เปลี่ยนทันที    4 สี: สืบทอด Token (น้ำเงิน) / ตั้งทับ (อำพัน) · "Token" คืนค่ากลาง
   5 ลองแบบอื่น (ผู้ช่วย Ket) → ลองชั่วคราว เทียบ แล้วเลือก   6 เช็กมือถือ ☰ · Sticky · เผยแพร่ครั้งเดียวมีผลทุกหน้า
   Every change is a commit to the draft (undo / history) — the web changes only on เผยแพร่.
   Only the Navigation settings exist in the mockup; other tabs / zones stay empty ("ยังไม่มีใน mockup").
   ===================================================================== */

type Look = 'a' | 'b' | 'c'
const TOGGLES: Record<Look, [string, string][]> = {
  a: [['sticky', 'Sticky header เมื่อเลื่อน'], ['topbar', 'แสดง Top bar (ติดต่อ)'], ['transparent', 'โปร่งใสทับแบนเนอร์']],
  b: [['sticky', 'Sticky เมื่อเลื่อน'], ['mobileMenu', 'มือถือ: ยุบเป็น ☰'], ['transparent', 'โปร่งใสทับแบนเนอร์']],
  c: [['sticky', 'Sticky เมื่อเลื่อน'], ['mobileMenu', 'มือถือ: ยุบเป็น ☰'], ['transparent', 'โปร่งใสทับแบนเนอร์']],
}
const TOGGLE_LOG: Record<string, [string, string]> = {
  sticky: ['เปิด Sticky', 'ปิด Sticky'], topbar: ['แสดง Top bar', 'ซ่อน Top bar'], mobileMenu: ['มือถือยุบเมนูเป็น ☰', 'มือถือแสดงเมนูเต็ม'], transparent: ['โปร่งใสทับแบนเนอร์', 'เลิกโปร่งใส'],
}

/* ---------- shared state + helpers ---------- */
function useHeader() {
  const draft = useStore(s => s.draft)
  const published = useStore(s => s.published)
  const setGlobal = useStore(s => s.setGlobal)
  const [trial, setTrial] = useState<string | null>(null)
  const [peek, setPeek] = useState(false)
  const h = draft.header
  const preset = HEADER_PRESETS.find(p => p.key === trial)
  /* the site the preview draws: draft, or draft + the alternative being tried */
  const shown: SiteDoc = preset && !peek ? { ...draft, header: { ...h, data: { ...h.data, ...preset.data }, style: { ...h.style, ...preset.style } } } : draft
  const dirty = diffSites(published, draft).some(c => c.pageName === 'ทุกหน้า' && c.label.includes('Header'))
  const setData = (k: string, v: string, label: string) => { setTrial(null); setGlobal('header', { data: { [k]: v } }, 'Header · ' + label) }
  const setColor = (k: 'bg' | 'fg', v: ColorRef | undefined, label: string) => { setTrial(null); setGlobal('header', { style: { [k]: v } }, 'Header · ' + label) }
  const applyPreset = (key: string) => {
    const p = HEADER_PRESETS.find(x => x.key === key)!
    setTrial(null); setPeek(false)
    const ok = setGlobal('header', { data: p.data, style: p.style }, `Header · ใช้แบบ ${p.name} (ผู้ช่วย Ket เสนอ)`, 'ผู้ช่วย Ket')
    useStore.getState().showToast(ok ? `ใช้แบบ ${p.name} แล้ว — อยู่ในฉบับร่าง · Ctrl+Z เพื่อย้อน` : `ตอนนี้เป็นแบบ ${p.name} อยู่แล้ว`)
  }
  return { draft, h, shown, dirty, trial, preset, peek, setPeek, setTrial, setData, setColor, applyPreset }
}
type H = ReturnType<typeof useHeader>

/* undo / redo from the keyboard (this screen has no section to delete, so not the page editor's full key map) */
function useUndoKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t?.closest?.('input,textarea,select,[contenteditable="true"]')) return
      const st = useStore.getState(); const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); st.undo() }
      else if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); st.redo() }
      else if (e.key === 'Escape' && st.publishOpen) st.setPublishOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

/* width available to the preview (the header is drawn at the real device width, then zoomed to this) */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(900)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const measure = () => setW(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure); ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { ref, w }
}

function DraftState({ dirty, suffix = '' }: { dirty: boolean; suffix?: string }) {
  return <span className="flex items-center gap-1.5 text-[12.5px] text-ink-500 whitespace-nowrap"><span className={`w-2 h-2 rounded-full ${dirty ? 'bg-warning-500' : 'bg-success-500'}`} />{dirty ? 'ฉบับร่าง' : 'ตรงกับเว็บจริง'}{suffix}</span>
}
function PublishBtn({ look }: { look: Look }) {
  const open = useStore(s => s.setPublishOpen)
  if (look === 'b') return <button onClick={() => open(true)} className="h-[38px] bg-ink-900 text-white rounded-full px-4 flex items-center gap-2 font-semibold shadow-md"><i className="fas fa-paper-plane text-[11px]" />เผยแพร่</button>
  return <button onClick={() => open(true)} className="h-9 rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 flex items-center gap-2 font-semibold"><i className="fas fa-paper-plane text-[11px]" />เผยแพร่</button>
}
function ViewSite({ pill }: { pill?: boolean }) {
  return pill
    ? <span className="h-[38px] bg-white rounded-full px-3.5 flex items-center gap-2 font-semibold shadow-sm whitespace-nowrap">ดูเว็บไซต์</span>
    : <span className="h-9 border border-ink-200 rounded-lg bg-white flex items-center px-3.5 font-medium whitespace-nowrap">ดูเว็บไซต์</span>
}

function Toggle({ on, onChange, label, color, row }: { on: boolean; onChange: (v: boolean) => void; label: string; color: string; row?: boolean }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className={`flex items-center gap-2.5 text-left ${row ? 'justify-between w-full' : ''} ${on ? 'text-ink-900' : 'text-ink-500'}`}>
      {!row && <Knob on={on} color={color} />}<span>{label}</span>{row && <Knob on={on} color={color} />}
    </button>
  )
}
const Knob = ({ on, color }: { on: boolean; color: string }) => (
  <span className="w-[34px] h-5 rounded-full relative flex-none transition-colors" style={{ background: on ? color : 'var(--ink-200)' }}><span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-all" style={{ left: on ? 16 : 2 }} /></span>
)
function Toggles({ look, hd, color, row }: { look: Look; hd: H; color: string; row?: boolean }) {
  return <>{TOGGLES[look].map(([k, l]) => <Toggle key={k} label={l} color={color} row={row} on={hd.h.data[k] === 'yes'} onChange={v => hd.setData(k, v ? 'yes' : 'no', TOGGLE_LOG[k][v ? 0 : 1])} />)}</>
}

/* layout picker — 1h: wireframe radio cards · 3c: small wireframe cards · 1i: text chips */
function LayoutPicker({ look, hd, accent }: { look: Look; hd: H; accent: string }) {
  const cur = hd.h.data.layout
  const pick = (k: string, name: string) => hd.setData('layout', k, 'Layout ' + name)
  const note = cur === 'stacked' && <div className="text-[12px] text-ink-500 mt-2"><i className="fas fa-magic text-orange-600 mr-1" />ตอนนี้ใช้แบบ Editorial จากผู้ช่วย Ket (โลโก้กลาง · เมนูใต้โลโก้) — เลือกการ์ดเพื่อกลับเป็นแบบมาตรฐานของระบบ</div>
  if (look === 'b') return (
    <div>
      <div className="flex gap-1.5">{NAV_LAYOUTS.map(n => { const on = cur === n.key; return (
        <button key={n.key} role="radio" aria-checked={on} onClick={() => pick(n.key, n.name)} className={`flex-1 h-10 rounded-[9px] text-[12.5px] ${on ? 'font-semibold' : 'border border-ink-200 text-ink-600 hover:border-ink-400'}`} style={on ? { border: `2px solid ${accent}` } : undefined}>{n.name}</button>
      ) })}</div>{note}
    </div>
  )
  const big = look === 'a'
  return (
    <div>
      <div role="radiogroup" aria-label="Navigation Layout" className={big ? 'grid grid-cols-3 gap-3 max-w-[760px]' : 'flex gap-1.5'}>
        {NAV_LAYOUTS.map(n => {
          const on = cur === n.key
          const bar = (w: number, h: number, c: string, order?: number, key?: number) => <span key={key} style={{ display: 'block', width: w, height: h, borderRadius: 2, background: c, order }} />
          return (
            <button key={n.key} role="radio" aria-checked={on} onClick={() => pick(n.key, n.name)} className={`text-left ${big ? 'rounded-xl p-2.5' : 'flex-1 rounded-[10px] p-2'} ${on ? 'bg-red-50' : 'bg-white hover:border-ink-300'}`} style={{ border: `2px solid ${on ? 'var(--red-600)' : 'var(--ink-150)'}` }}>
              <div className={`bg-white border border-ink-150 rounded-md flex items-center ${big ? 'h-16 px-2 gap-1.5' : 'h-[34px] px-1.5 gap-1'}`} style={{ justifyContent: n.justify }}>
                {bar(big ? 38 : 22, big ? 10 : 7, 'var(--ink-800)', n.logoOrder)}
                <span className={`flex order-2 ${big ? 'gap-1' : 'gap-0.5'}`}>{Array.from({ length: big ? 4 : 3 }, (_, i) => bar(big ? 14 : 8, big ? 6 : 4, 'var(--ink-300)', undefined, i))}</span>
                {big && bar(20, 6, 'var(--ink-300)', 3)}
              </div>
              {big
                ? <div className="flex items-center gap-2 mt-2"><span className="w-3.5 h-3.5 rounded-full grid place-items-center" style={{ border: `2px solid ${on ? 'var(--red-600)' : 'var(--ink-300)'}` }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: on ? 'var(--red-600)' : 'transparent' }} /></span><span className="font-semibold text-[13px]">{n.name}</span></div>
                : <div className="text-[12px] font-semibold mt-1.5 text-center">{n.name}</div>}
            </button>
          )
        })}
      </div>{note}
    </div>
  )
}

function FontRow({ hd, withCase }: { hd: H; withCase?: boolean }) {
  const d = hd.h.data
  const size = Number(d.menuSize || 12)
  return (
    <div className="flex gap-1.5">
      <label className="flex-1 relative">
        <span className="sr-only">ฟอนต์เมนู</span>
        <select value={d.menuFont} onChange={e => hd.setData('menuFont', e.target.value, 'ฟอนต์เมนู ' + e.target.value)} className="w-full h-9 appearance-none border border-ink-200 rounded-[9px] pl-2.5 pr-7 bg-white text-[13px]">
          {MENU_FONTS.map(f => <option key={f}>{f}</option>)}
        </select>
        <i className="fas fa-chevron-down text-[9px] text-ink-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </label>
      <div className="w-[84px] h-9 border border-ink-200 rounded-[9px] flex items-center bg-white font-display text-[13px]">
        <button aria-label="เล็กลง" onClick={() => size > 10 && hd.setData('menuSize', String(size - 1), `ขนาดเมนู ${size - 1} px`)} className="w-6 h-full text-ink-500 hover:text-ink-900">−</button>
        <span className="flex-1 text-center whitespace-nowrap">{size} px</span>
        <button aria-label="ใหญ่ขึ้น" onClick={() => size < 16 && hd.setData('menuSize', String(size + 1), `ขนาดเมนู ${size + 1} px`)} className="w-6 h-full text-ink-500 hover:text-ink-900">+</button>
      </div>
      {withCase && <button aria-pressed={d.menuUpper !== 'no'} title="ตัวพิมพ์ใหญ่ทั้งหมด" onClick={() => hd.setData('menuUpper', d.menuUpper === 'no' ? 'yes' : 'no', d.menuUpper === 'no' ? 'เมนูตัวพิมพ์ใหญ่' : 'เมนูตัวพิมพ์ปกติ')}
        className={`w-11 h-9 rounded-[9px] border text-[13px] font-bold ${d.menuUpper !== 'no' ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white'}`}>Aa</button>}
    </div>
  )
}

/* สี: สืบทอดจาก Token (น้ำเงิน · 🔗) vs ตั้งทับเฉพาะจุดนี้ (อำพัน) — Blueprint B1 */
function ColorRow({ look, hd, which }: { look: Look; hd: H; which: 'bg' | 'fg' }) {
  const [open, setOpen] = useState(false)
  const site = hd.draft
  const ref = hd.h.style?.[which]
  const inheritName = HEADER_INHERIT[which]
  const hex = tokenHex(site, ref) ?? tokenByName(site, inheritName)
  const title = which === 'bg' ? (look === 'a' ? 'พื้นหลัง Header' : 'พื้นหลัง') : (look === 'a' ? 'ตัวอักษรเมนู' : 'ตัวอักษร')
  const what = !ref ? '' : 'token' in ref ? `Token ${ref.token}` : ref.hex.toUpperCase()
  const sub = !ref
    ? (look === 'a' ? `สืบทอด · Token “${inheritName}” ${hex}` : look === 'b' ? `Token · ${inheritName}` : `สืบทอด Token · ${inheritName}`)
    : (look === 'b' ? `ตั้งทับ ${what}` : `ตั้งทับเฉพาะจุดนี้ · ${what}`)
  const set = (v: ColorRef | undefined) => { setOpen(false); hd.setColor(which, v, v ? `ตั้งสี${title}เฉพาะจุด` : `${title} กลับไปใช้ Token`) }
  const sw = look === 'a' ? 'w-7 h-7 rounded-[7px]' : 'w-6 h-6 rounded-md'
  return (
    <div className="relative">
      <div className={`rounded-[10px] px-3 py-2.5 flex items-center gap-2.5 border ${ref ? 'border-warning-500 bg-warning-50' : 'border-ink-150 bg-white'}`}>
        <button onClick={() => setOpen(!open)} aria-label={`เลือกสี${title}`} className={`${sw} border border-ink-200 flex-none`} style={{ background: hex }} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[13px]">{title}</div>
          <div className={`text-[12px] flex gap-1.5 items-center ${ref ? 'text-warning-700' : 'text-info-700'}`}><i className={`fas ${ref ? 'fa-unlink' : 'fa-link'} text-[9px]`} /><span className="truncate">{sub}</span></div>
        </div>
        {ref
          ? <button onClick={() => set(undefined)} className="text-[12px] text-ink-700 border border-ink-200 bg-white rounded-md px-2 py-1 whitespace-nowrap hover:border-ink-400"><i className="fas fa-undo text-[9px]" /> {look === 'a' ? 'ใช้ Token' : 'Token'}</button>
          : look !== 'b' && <button onClick={() => setOpen(!open)} aria-expanded={open} className="text-[12px] text-ink-600 border border-ink-200 rounded-md px-2 py-1 whitespace-nowrap hover:border-ink-400">ตั้งทับ</button>}
      </div>
      {open && (
        <div className="absolute z-20 left-0 right-0 top-[calc(100%+6px)] bg-white border border-ink-150 rounded-xl shadow-xl p-3 flex flex-col gap-2.5 min-w-[240px]">
          <div className="text-[12px] font-semibold text-ink-600">ตั้งทับเฉพาะ Header — เลือก Token หรือสีเอง</div>
          <div className="flex flex-wrap gap-1.5">{site.tokens.map(t => (
            <button key={t.name} onClick={() => set({ token: t.name })} title={`Token · ${t.name} ${t.hex}`} className="flex items-center gap-1.5 border border-ink-150 rounded-md pl-1 pr-2 py-1 text-[12px] hover:border-ink-400"><span className="w-4 h-4 rounded border border-ink-200" style={{ background: t.hex }} />{t.name}</button>
          ))}</div>
          <label className="flex items-center gap-2 text-[12.5px] text-ink-600 cursor-pointer"><span className="w-6 h-6 rounded-md border border-dashed border-ink-300 grid place-items-center relative overflow-hidden"><i className="fas fa-eye-dropper text-[11px]" /><input type="color" defaultValue={hex} className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => set({ hex: e.target.value.toUpperCase() })} /></span>สีเอง (ไม่ผูกกับ Token)</label>
          <div className="flex justify-between items-center border-t border-ink-100 pt-2">
            <button onClick={() => set(undefined)} className="text-[12px] font-semibold text-info-700"><i className="fas fa-link text-[9px]" /> ใช้ค่าสืบทอด · {inheritName}</button>
            <button onClick={() => setOpen(false)} className="text-[12px] text-ink-500">ปิด</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* the Navigation settings — the only part of the Header form the mockup draws */
function NavigationForm({ look, hd }: { look: Look; hd: H }) {
  if (look === 'a') return (
    <div className="flex flex-col gap-5">
      <div><div className="font-bold text-[15px]">Navigation Layout</div><div className="text-[12.5px] text-ink-500">เลือกรูปแบบการวางโลโก้และเมนู — เปลี่ยนแล้วพรีวิวด้านบนอัปเดตทันที</div></div>
      <LayoutPicker look="a" hd={hd} accent="var(--red-600)" />
      <div className="flex flex-wrap gap-x-7 gap-y-3 py-3.5 border-y border-ink-100 text-[13px]"><Toggles look="a" hd={hd} color="var(--red-600)" /></div>
      <div>
        <div className="font-bold text-[15px] mb-2.5">สี <span className="text-[12px] text-ink-500 font-normal">· ค่าเริ่มต้นสืบทอดจาก System Design → เปลี่ยนที่นั่นจะเปลี่ยนทุกหน้า</span></div>
        <div className="grid grid-cols-2 gap-2.5 max-w-[760px]"><ColorRow look="a" hd={hd} which="bg" /><ColorRow look="a" hd={hd} which="fg" /></div>
      </div>
    </div>
  )
  const lab = look === 'b' ? 'text-[11.5px] font-semibold text-ink-500 tracking-[.04em] mb-2' : 'font-semibold mb-2'
  return (
    <div className="flex flex-col gap-4">
      <div><div className={lab}>{look === 'b' ? 'LAYOUT' : 'Navigation Layout'}</div><LayoutPicker look={look} hd={hd} accent="var(--orange-600)" /></div>
      <div><div className={lab}>{look === 'b' ? 'ตัวอักษร' : 'ตัวอักษรเมนู'}</div><FontRow hd={hd} withCase={look === 'c'} /></div>
      <div><div className={lab}>สี</div><div className="flex flex-col gap-1.5"><ColorRow look={look} hd={hd} which="bg" /><ColorRow look={look} hd={hd} which="fg" /></div></div>
      <div className="flex flex-col gap-2.5 text-[13px] pt-2 border-t border-ink-100"><Toggles look={look} hd={hd} color={look === 'b' ? 'var(--ink-900)' : 'var(--red-600)'} row /></div>
    </div>
  )
}

function Empty({ name, onNav }: { name: string; onNav: () => void }) {
  return (
    <div className="flex-1 grid place-items-center text-center text-ink-500 py-10 px-4 text-[13.5px] leading-relaxed">
      <div><i className="far fa-lightbulb text-xl text-ink-300" /><br /><b className="text-ink-900">{name}</b><br />ยังไม่มีใน mockup — พื้นที่ว่างสำหรับลอง idea<br />
        <button onClick={onNav} className="mt-3 h-8 px-3 rounded-lg border border-ink-200 text-ink-700 font-semibold text-[12.5px] hover:bg-ink-50">ไปที่ Navigation (ส่วนที่ mockup ออกแบบไว้)</button></div>
    </div>
  )
}

/* "ลองแบบอื่นด้วยผู้ช่วย Ket" — 1i: ใช้แบบนี้ (ลงฉบับร่างทันที) · 3c: ลองดู (ชั่วคราว เทียบแล้วเลือก) */
function Alternatives({ look, hd }: { look: 'b' | 'c'; hd: H }) {
  const showToast = useStore(s => s.showToast)
  return (
    <div className={`bg-white shadow-sm border border-black/5 px-4 py-3.5 flex flex-col gap-3 ${look === 'b' ? 'rounded-2xl' : 'rounded-[14px]'}`}>
      <div className="flex items-center gap-2.5 flex-wrap">
        <MascotImg src="mascot-idea.png" size={28} pos="center 20%" className="border border-ink-150" />
        <span className="font-bold">ลองแบบอื่นด้วยผู้ช่วย Ket</span>
        <span className="text-[12.5px] text-ink-500">· {look === 'b' ? 'ใช้โลโก้/เมนู/สีจาก Token เดิม เปลี่ยนแค่การจัดวาง' : 'โลโก้/เมนู/สี Token เดิม เปลี่ยนแค่การจัดวาง'}</span>
        <button onClick={() => showToast('บทตั้งไว้ของ prototype มี 3 แบบตาม mockup — ยังไม่มีแบบอื่นให้สุ่ม')} className="ml-auto text-[12.5px] text-red-600 font-semibold"><i className="fas fa-sync-alt text-[10px]" /> สุ่มใหม่</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {HEADER_PRESETS.map(p => {
          const bg = tokenHex(hd.draft, p.style.bg) ?? '#fff', fg = tokenHex(hd.draft, p.style.fg) ?? '#222'
          const trying = hd.trial === p.key
          return (
            <div key={p.key} className={`border rounded-xl overflow-hidden ${trying ? 'border-red-600 ring-2 ring-red-100' : 'border-ink-150'}`}>
              <div className="flex items-center px-3.5 gap-2.5" style={{ height: look === 'b' ? 58 : 54, background: bg, justifyContent: p.data.layout === 'stacked' ? 'center' : 'space-between', flexDirection: p.data.layout === 'stacked' ? 'column' : 'row' }}>
                <span className="font-bold text-[12px]" style={{ fontFamily: 'Georgia,serif', color: fg }}>GIRLY CLOSET</span>
                <span className="flex gap-1.5">{Array.from({ length: look === 'b' ? 4 : 3 }, (_, i) => <span key={i} className="w-4 h-[5px] rounded-sm opacity-50" style={{ background: fg }} />)}</span>
              </div>
              <div className="px-2.5 py-2 flex items-center gap-2 text-[12.5px]">
                <div className="flex-1 min-w-0"><div className="font-semibold">{p.name}</div><div className="text-[11.5px] text-ink-500 leading-snug">{p.desc}</div></div>
                {look === 'b'
                  ? <button onClick={() => hd.applyPreset(p.key)} className="border border-ink-200 rounded-[7px] px-2.5 py-1 font-semibold text-[12px] whitespace-nowrap hover:border-ink-900">ใช้แบบนี้</button>
                  : <button onClick={() => { hd.setPeek(false); hd.setTrial(trying ? null : p.key) }} aria-pressed={trying} className={`rounded-[7px] px-2.5 py-1 font-semibold text-[12px] whitespace-nowrap border ${trying ? 'bg-red-600 border-red-600 text-white' : 'border-ink-200 hover:border-ink-900'}`}>{trying ? 'กำลังลอง' : 'ลองดู'}</button>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TrialBar({ hd }: { hd: H }) {
  if (!hd.preset) return null
  return (
    <div role="status" className="flex items-center gap-2.5 bg-ink-900 text-white rounded-xl px-3.5 py-2.5 text-[13px]">
      <i className="fas fa-magic text-orange-500" />
      <span className="flex-1 min-w-0">กำลังลองแบบ <b>{hd.preset.name}</b> · ชั่วคราว ยังไม่ลงฉบับร่าง</span>
      <span className="flex gap-0.5 bg-white/10 rounded-full p-[3px] text-[12px] font-semibold">
        {([[true, 'แบบเดิม'], [false, 'แบบที่ลอง']] as const).map(([v, l]) => <button key={l} aria-pressed={hd.peek === v} onClick={() => hd.setPeek(v)} className={`px-2.5 py-1 rounded-full ${hd.peek === v ? 'bg-white text-ink-900' : 'text-white/70'}`}>{l}</button>)}
      </span>
      <button onClick={() => hd.applyPreset(hd.preset!.key)} className="h-8 px-3 rounded-lg bg-red-600 font-semibold">ใช้แบบนี้</button>
      <button onClick={() => hd.setTrial(null)} className="h-8 px-2.5 rounded-lg text-white/75 hover:text-white">ยกเลิก</button>
    </div>
  )
}

/* ---------- V1 · 1h — preview + ป้ายโซน · tab ซ้าย / ฟอร์มขวา ---------- */
const TABS_A: [string, string, string, string, HZone | null][] = [
  ['layout', 'Layout', 'fas fa-columns', '', null], ['brand', 'โลโก้ & แบรนด์', 'far fa-image', 'Token', 'logo'], ['topbar', 'Top bar · ติดต่อ', 'fas fa-phone', '', 'topbar'],
  ['nav', 'Navigation', 'fa fa-bars', '', 'nav'], ['actions', 'ค้นหา & ตะกร้า', 'fas fa-shopping-bag', '', 'actions'], ['behavior', 'พฤติกรรม · Sticky', 'fas fa-thumbtack', '', null], ['color', 'สี & ตัวอักษร', 'fas fa-palette', 'Token', null],
]
export function HeaderA() {
  useUndoKeys()
  const hd = useHeader()
  const tab = useStore(s => s.panel['hdr-a'] ?? 'nav'); const setPanel = useStore(s => s.setPanel)
  const cur = TABS_A.find(t => t[0] === tab)!
  const fit = useWidth()
  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-ink-50">
      <div className="h-14 bg-white border-b border-ink-150 flex items-center px-6 gap-3 flex-none">
        <span className="font-bold text-[15px]">Header</span><span className="text-ink-400">/</span><span className="text-ink-600">{tab === 'nav' ? 'Navigation Menu' : cur[1]}</span>
        <div className="flex-1" />
        <DraftState dirty={hd.dirty} suffix=" · ใช้กับทุกหน้า" />
        <ViewSite /><PublishBtn look="a" />
      </div>
      <div className="flex-1 overflow-auto px-6 pt-5 pb-28 flex flex-col gap-4">
        <div className="bg-white border border-ink-150 rounded-xl px-3 pt-2.5 pb-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[12px] text-ink-500"><span className="font-semibold text-ink-700">พรีวิว</span>· คลิกโซนเพื่อข้ามไปตั้งค่า<span className="ml-auto"><DeviceToggle variant="square" /></span></div>
          <div ref={fit.ref} className="rounded-lg overflow-hidden border border-ink-150 bg-ink-50">
            <HeaderPreview site={hd.shown} width={fit.w} hot={{ active: cur[4], color: 'var(--red-600)', look: 'a', onZone: z => setPanel('hdr-a', TABS_A.find(t => t[4] === z)![0]) }} />
          </div>
        </div>
        <div className="flex gap-4 items-start">
          <div role="tablist" aria-orientation="vertical" className="w-[220px] flex-none bg-white border border-ink-150 rounded-xl p-2 flex flex-col gap-0.5">
            {TABS_A.map(([k, name, icon, hint]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setPanel('hdr-a', k)} className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-left ${tab === k ? 'bg-red-50 text-red-700 font-semibold' : 'text-ink-800 hover:bg-ink-50'}`}>
                <i className={`${icon} w-3.5 text-center text-[12px] opacity-85`} /><span className="flex-1">{name}</span><span className="text-[11px] text-ink-400">{hint}</span>
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-0 bg-white border border-ink-150 rounded-xl px-6 py-5 flex flex-col">
            {tab === 'nav' ? <NavigationForm look="a" hd={hd} /> : <Empty name={cur[1]} onNav={() => setPanel('hdr-a', 'nav')} />}
          </div>
        </div>
      </div>
      <PublishDialog />
    </div>
  )
}

/* ---------- V2 · 1i — preview ใหญ่เป็นพระเอก · panel ลอยขวา · ลองแบบอื่น ---------- */
export function HeaderB() {
  useUndoKeys()
  const hd = useHeader()
  const zone = useStore(s => s.panel['hdr-b'] ?? 'nav') as HZone | ''; const setPanel = useStore(s => s.setPanel)
  const fit = useWidth()
  return (
    <div className="flex-1 min-w-0 min-h-0 overflow-auto bg-cream px-7 pt-6 pb-28 flex flex-col gap-[18px]">
      <div className="flex items-center gap-3">
        <div><div className="font-bold text-[20px] leading-tight">Header</div><div className="text-[12.5px] text-ink-500">ใช้กับทุกหน้า · คลิกส่วนใดบน preview เพื่อแก้</div></div>
        <div className="flex-1" />
        <DraftState dirty={hd.dirty} />
        <DeviceToggle variant="pill" />
        <ViewSite pill /><PublishBtn look="b" />
      </div>
      <div className="flex gap-[18px] items-start">
        <div className="flex-1 min-w-0 flex flex-col gap-[18px]">
          <div className="bg-white rounded-[18px] shadow-lg border border-black/5 overflow-hidden">
            <div ref={fit.ref}><HeaderPreview site={hd.shown} width={fit.w} strip={120} hot={{ active: zone || null, color: 'var(--orange-600)', look: 'b', onZone: z => setPanel('hdr-b', z) }} /></div>
          </div>
          <Alternatives look="b" hd={hd} />
        </div>
        <div className="w-80 flex-none bg-white rounded-2xl shadow-lg border border-black/5 p-4 flex flex-col gap-3.5">
          {zone ? <>
            <div className="flex items-center gap-2"><span className="font-bold text-[15px]">{HZONE_LABEL[zone]}</span><span className="text-[11px] font-bold px-1.5 py-0.5 rounded-[5px] bg-orange-50 text-orange-700">กำลังแก้</span><button onClick={() => setPanel('hdr-b', '')} aria-label="ปิด" className="ml-auto w-7 h-7 grid place-items-center rounded-md text-ink-400 hover:bg-ink-50"><i className="fas fa-times" /></button></div>
            {zone === 'nav' ? <NavigationForm look="b" hd={hd} /> : <Empty name={HZONE_LABEL[zone]} onNav={() => setPanel('hdr-b', 'nav')} />}
          </> : <div className="text-center text-ink-500 py-10 text-[13.5px] leading-relaxed"><i className="fas fa-mouse-pointer text-ink-300 text-lg" /><br />คลิกส่วนใดบน preview เพื่อแก้<br /><button onClick={() => setPanel('hdr-b', 'nav')} className="mt-2 text-[12.5px] font-semibold text-orange-700">เปิด Navigation</button></div>}
        </div>
      </div>
      <PublishDialog />
    </div>
  )
}

/* ---------- V3 · 3c — hot-zone + ลองแบบอื่น · ฟอร์มอยู่ panel ขวาตามโครงเดิม ---------- */
const TABS_C: [string, string, HZone | null][] = [['layout', 'Layout', null], ['logo', 'โลโก้', 'logo'], ['topbar', 'Top bar', 'topbar'], ['nav', 'Navigation', 'nav'], ['color', 'สี', null]]
export function HeaderC() {
  useUndoKeys()
  const hd = useHeader()
  const tab = useStore(s => s.panel['hdr-c'] ?? 'nav'); const setPanel = useStore(s => s.setPanel)
  const showToast = useStore(s => s.showToast)
  const cur = TABS_C.find(t => t[0] === tab)!
  const fit = useWidth()
  const onZone = (z: HZone) => {
    const t = TABS_C.find(x => x[2] === z)
    if (t) setPanel('hdr-c', t[0]); else showToast('โซน “ค้นหา & ตะกร้า” ยังไม่มีแท็บตั้งค่าใน mockup 3c')
  }
  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-cream">
      <div className="h-14 bg-white border-b border-ink-150 flex items-center px-6 gap-3 flex-none">
        <span className="font-bold text-[15px]">Header</span><span className="text-ink-400">/</span><span className="text-ink-600">ใช้กับทุกหน้า</span>
        <span className="ml-2"><DeviceToggle variant="square" /></span>
        <div className="flex-1" />
        <DraftState dirty={hd.dirty} />
        <ViewSite /><PublishBtn look="c" />
      </div>
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 min-w-0 overflow-auto px-6 pt-[22px] pb-28 flex flex-col gap-4">
          <div className="bg-white rounded-[14px] shadow-md border border-black/5 overflow-hidden">
            <div ref={fit.ref}><HeaderPreview site={hd.shown} width={fit.w} strip={90} hot={{ active: cur[2], color: 'var(--red-600)', look: 'c', onZone }} /></div>
          </div>
          <TrialBar hd={hd} />
          <Alternatives look="c" hd={hd} />
        </div>
        <div className="w-[340px] bg-white border-l border-ink-150 flex-none flex flex-col min-h-0">
          <div role="tablist" className="flex border-b border-ink-150 px-1.5 font-medium text-ink-500 text-[13px] flex-none">
            {TABS_C.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setPanel('hdr-c', k)} className={`flex-auto pt-3.5 pb-3 px-1.5 whitespace-nowrap ${tab === k ? 'text-ink-900 font-semibold border-b-2 border-red-600 -mb-px' : 'hover:text-ink-900'}`}>{l}</button>)}
          </div>
          <div className="flex-1 overflow-auto p-4 flex flex-col">
            {tab === 'nav' ? <NavigationForm look="c" hd={hd} /> : <Empty name={cur[1]} onNav={() => setPanel('hdr-c', 'nav')} />}
          </div>
        </div>
      </div>
      <PublishDialog />
    </div>
  )
}

