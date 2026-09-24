/* V4 — cloned from screens/shared.tsx on 2026-09-24 so V4 owns it (type standard: text-display/title/heading/body/meta/caption). Only V4 uses this file. */
import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/data/store'
import { tokenByName, tokenHex, type ColorRef, type SiteDoc } from '@/data/schema'

/* pieces shared by the site-level screens (Header · Footer · …) */

export type Look = 'a' | 'b' | 'c'

/* undo / redo from the keyboard (these screens have no page section to delete, so not the page editor's full key map) */
export function useUndoKeys() {
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

/* width available to a preview (drawn at the real device width, then zoomed to this) */
export function useWidth() {
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

export function DraftState({ dirty, suffix = '' }: { dirty: boolean; suffix?: string }) {
  return <span className="flex items-center gap-1.5 text-body text-ink-500 whitespace-nowrap"><span className={`w-2 h-2 rounded-full ${dirty ? 'bg-warning-500' : 'bg-success-500'}`} />{dirty ? 'ฉบับร่าง' : 'ตรงกับเว็บจริง'}{suffix}</span>
}
export function PublishBtn({ look }: { look: Look }) {
  const open = useStore(s => s.setPublishOpen)
  if (look === 'b') return <button onClick={() => open(true)} className="h-[38px] bg-ink-900 text-white rounded-full px-4 flex items-center gap-2 font-semibold shadow-md"><i className="fas fa-paper-plane text-[11px]" />เผยแพร่</button>
  return <button onClick={() => open(true)} className="h-9 rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 flex items-center gap-2 font-semibold"><i className="fas fa-paper-plane text-[11px]" />เผยแพร่</button>
}
export function ViewSite({ pill }: { pill?: boolean }) {
  return pill
    ? <span className="h-[38px] bg-white rounded-full px-3.5 flex items-center gap-2 font-semibold shadow-sm whitespace-nowrap">ดูเว็บไซต์</span>
    : <span className="h-9 border border-ink-200 rounded-lg bg-white flex items-center px-3.5 font-medium whitespace-nowrap">ดูเว็บไซต์</span>
}

export function Toggle({ on, onChange, label, color, row }: { on: boolean; onChange: (v: boolean) => void; label: string; color: string; row?: boolean }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className={`flex items-center gap-2.5 text-left ${row ? 'justify-between w-full' : ''} ${on ? 'text-ink-900' : 'text-ink-500'}`}>
      {!row && <Knob on={on} color={color} />}<span>{label}</span>{row && <Knob on={on} color={color} />}
    </button>
  )
}
const Knob = ({ on, color }: { on: boolean; color: string }) => (
  <span className="w-[34px] h-5 rounded-full relative flex-none transition-colors" style={{ background: on ? color : 'var(--ink-200)' }}><span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-all" style={{ left: on ? 16 : 2 }} /></span>
)

/* colour: สืบทอดจาก Token (น้ำเงิน · 🔗) vs ตั้งทับเฉพาะจุดนี้ (อำพัน) — Blueprint B1 · mockup 1h / 1i / 3c / 1j / 3d */
export function ColorField({ look, site, value, inheritName, title, scope, onChange }: {
  look: Look; site: SiteDoc; value: ColorRef | undefined; inheritName: string; title: string; scope: string; onChange: (v: ColorRef | undefined) => void
}) {
  const [open, setOpen] = useState(false)
  const hex = tokenHex(site, value) ?? tokenByName(site, inheritName)
  const what = !value ? '' : 'token' in value ? `Token ${value.token}` : value.hex.toUpperCase()
  const sub = !value
    ? (look === 'a' ? `สืบทอด · Token “${inheritName}” ${hex}` : look === 'b' ? `Token · ${inheritName}` : `สืบทอด Token · ${inheritName}`)
    : (look === 'b' ? `ตั้งทับ ${what}` : `ตั้งทับเฉพาะจุดนี้ · ${what}`)
  const set = (v: ColorRef | undefined) => { setOpen(false); onChange(v) }
  const sw = look === 'a' ? 'w-7 h-7 rounded-[7px]' : 'w-6 h-6 rounded-md'
  return (
    <div className="relative">
      <div className={`rounded-[10px] px-3 py-2.5 flex items-center gap-2.5 border ${value ? 'border-warning-500 bg-warning-50' : 'border-ink-150 bg-white'}`}>
        <button onClick={() => setOpen(!open)} aria-label={`เลือกสี${title}`} className={`${sw} border border-ink-200 flex-none`} style={{ background: hex }} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-body">{title}</div>
          <div className={`text-meta flex gap-1.5 items-center ${value ? 'text-warning-700' : 'text-info-700'}`}><i className={`fas ${value ? 'fa-unlink' : 'fa-link'} text-[9px]`} /><span className="truncate">{sub}</span></div>
        </div>
        {value
          ? <button onClick={() => set(undefined)} className="text-meta text-ink-700 border border-ink-200 bg-white rounded-md px-2 py-1 whitespace-nowrap hover:border-ink-400"><i className="fas fa-undo text-[9px]" /> {look === 'a' ? 'ใช้ Token' : 'Token'}</button>
          : look !== 'b' && <button onClick={() => setOpen(!open)} aria-expanded={open} className="text-meta text-ink-600 border border-ink-200 rounded-md px-2 py-1 whitespace-nowrap hover:border-ink-400">ตั้งทับ</button>}
      </div>
      {open && (
        <div className="absolute z-20 left-0 right-0 top-[calc(100%+6px)] bg-white border border-ink-150 rounded-xl shadow-xl p-3 flex flex-col gap-2.5 min-w-[240px]">
          <div className="text-meta font-semibold text-ink-600">ตั้งทับเฉพาะ{scope} — เลือก Token หรือสีเอง</div>
          <div className="flex flex-wrap gap-1.5">{site.tokens.map(t => (
            <button key={t.name} onClick={() => set({ token: t.name })} title={`Token · ${t.name} ${t.hex}`} className="flex items-center gap-1.5 border border-ink-150 rounded-md pl-1 pr-2 py-1 text-meta hover:border-ink-400"><span className="w-4 h-4 rounded border border-ink-200" style={{ background: t.hex }} />{t.name}</button>
          ))}</div>
          <label className="flex items-center gap-2 text-body text-ink-600 cursor-pointer"><span className="w-6 h-6 rounded-md border border-dashed border-ink-300 grid place-items-center relative overflow-hidden"><i className="fas fa-eye-dropper text-[11px]" /><input type="color" defaultValue={hex} className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => set({ hex: e.target.value.toUpperCase() })} /></span>สีเอง (ไม่ผูกกับ Token)</label>
          <div className="flex justify-between items-center border-t border-ink-100 pt-2">
            <button onClick={() => set(undefined)} className="text-meta font-semibold text-info-700"><i className="fas fa-link text-[9px]" /> ใช้ค่าสืบทอด · {inheritName}</button>
            <button onClick={() => setOpen(false)} className="text-meta text-ink-500">ปิด</button>
          </div>
        </div>
      )}
    </div>
  )
}

export function Empty({ name, onBack, backLabel }: { name: string; onBack?: () => void; backLabel?: string }) {
  return (
    <div className="flex-1 grid place-items-center text-center text-ink-500 py-10 px-4 text-body leading-relaxed">
      <div><i className="far fa-lightbulb text-xl text-ink-300" /><br /><b className="text-ink-900">{name}</b><br />ยังไม่มีใน mockup — พื้นที่ว่างสำหรับลอง idea<br />
        {onBack && <button onClick={onBack} className="mt-3 h-8 px-3 rounded-lg border border-ink-200 text-ink-700 font-semibold text-body hover:bg-ink-50">{backLabel}</button>}</div>
    </div>
  )
}
