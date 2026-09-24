/* V4 — cloned from components/editor/parts.tsx on 2026-09-24 so V4 owns it (type standard: text-display/title/heading/body/meta/caption). Only V4 uses this file. */
import type { ReactNode } from 'react'
import { AI_PROPOSAL, LOCK_STYLE, ROLE_STYLE, type Lock, type Section } from '@/data/schema'
import { useStore, type Device } from '@/data/store'

/* shared editor pieces used by V1 / V2 / V3 */

export function LockPill({ lock, long }: { lock: Lock; long?: boolean }) {
  return <span className="text-caption font-semibold px-1.5 py-0.5 rounded-[5px] whitespace-nowrap" style={{ background: LOCK_STYLE[lock].bg, color: LOCK_STYLE[lock].fg }}>{lock}{long ? (lock === 'L2' ? ' แก้ค่า' : ' อิสระ') : ''}</span>
}

const DEVICES: [Device, string, string][] = [['desktop', 'fas fa-desktop', 'คอม'], ['tablet', 'fas fa-tablet-alt', 'แท็บเล็ต'], ['mobile', 'fas fa-mobile-alt', 'มือถือ']]

export function DeviceToggle({ variant }: { variant: 'square' | 'pill' }) {
  const device = useStore(s => s.device); const setDevice = useStore(s => s.setDevice)
  if (variant === 'square') return (
    <div role="radiogroup" aria-label="ขนาดจอ" className="h-9 bg-ink-100 rounded-lg p-[3px] flex gap-0.5 text-ink-500">
      {DEVICES.map(([k, ic, l]) => <button key={k} role="radio" aria-checked={device === k} title={l} onClick={() => setDevice(k)} className={`w-[34px] grid place-items-center rounded-md ${device === k ? 'bg-white text-ink-900 shadow-xs' : 'hover:text-ink-900'}`}><i className={ic} /></button>)}
    </div>
  )
  return (
    <span role="radiogroup" aria-label="ขนาดจอ" className="flex gap-0.5 bg-ink-100 rounded-full p-[3px] text-ink-500">
      {DEVICES.map(([k, ic, l]) => <button key={k} role="radio" aria-checked={device === k} title={l} onClick={() => setDevice(k)} className={`w-[30px] h-[26px] grid place-items-center rounded-full ${device === k ? 'bg-ink-900 text-white' : 'hover:text-ink-900'}`}><i className={`${ic} text-[12px]`} /></button>)}
    </span>
  )
}

export function Tabs({ id, items, def }: { id: string; items: [string, ReactNode][]; def: string }) {
  const cur = useStore(s => s.panel[id] ?? def); const setPanel = useStore(s => s.setPanel)
  return (
    <div role="tablist" className="flex border-b border-ink-150 px-2 font-medium text-ink-500 text-heading flex-none">
      {items.map(([k, label]) => (
        <button key={k} role="tab" aria-selected={k === cur} onClick={() => setPanel(id, k)}
          className={`pt-4 pb-3.5 px-3 flex gap-1.5 items-center ${k === cur ? 'text-ink-900 font-semibold border-b-2 border-red-600 -mb-px' : 'hover:text-ink-900'}`}>{label}</button>
      ))}
    </div>
  )
}
export const usePanel = (id: string, def: string) => useStore(s => s.panel[id] ?? def)

export function NotInMockup({ what }: { what: string }) {
  return (
    <div className="flex-1 grid place-items-center text-center text-ink-500 p-6 text-body leading-relaxed">
      <div><i className="far fa-lightbulb text-xl text-ink-300" /><br /><b className="text-ink-900">{what}</b><br />ยังไม่มีใน mockup — พื้นที่ว่างสำหรับลอง idea</div>
    </div>
  )
}

export const THUMB: Record<Section['type'], string> = {
  header: '#dfe7f3', marquee: '#fff', hero: 'linear-gradient(160deg,#d9b493,#5e3b28)', products: '#f6dfe6', benefit: '#bfbfbf', footer: '#2d2a28',
  library: '#f7f8fa', 'product-info': '#e6f0fb', cart: '#f7f8fa',
}
export const SECTION_ICON: Record<Section['type'], string> = {
  header: 'far fa-window-maximize', marquee: 'fas fa-text-width', hero: 'far fa-image', products: 'fas fa-th-large', benefit: 'far fa-image', footer: 'fas fa-window-minimize',
  library: 'fas fa-cube', 'product-info': 'fas fa-box-open', cart: 'fas fa-shopping-cart',
}

/* assistant diff card — ✓ / ✕ really edit the draft */
export function DiffCard({ accept = 'var(--ink-900)', compact = false }: { accept?: string; compact?: boolean }) {
  const diff = useStore(s => s.diff); const resolve = useStore(s => s.resolveDiff); const acceptAll = useStore(s => s.acceptAll)
  const compare = useStore(s => s.compare); const setCompare = useStore(s => s.setCompare)
  return (
    <div className="border border-ink-150 rounded-xl overflow-hidden bg-white">
      <div className="flex items-center gap-2 px-2.5 py-2 border-b border-ink-100 bg-ink-50"><span className="text-meta font-bold text-ink-600 tracking-[.04em]">DIFF · 2 การเปลี่ยนแปลง</span><span className="ml-auto text-meta text-ink-500">ฉบับร่าง</span></div>
      {AI_PROPOSAL.items.map(it => {
        const st = diff[it.id]
        return (
          <div key={it.id} className={`p-2.5 flex gap-2 items-center border-b border-ink-100 ${st === 'no' ? 'opacity-45' : ''} ${st === 'ok' ? 'bg-success-50' : ''}`}>
            {it.id === 'hero'
              ? <span className="w-9 h-[26px] rounded flex-none" style={{ background: 'linear-gradient(160deg,#d9b493,#5e3b28)' }} />
              : <span className="w-9 h-[26px] rounded flex-none bg-success-50 border border-dashed border-success-500 grid place-items-center text-success-600"><i className="fas fa-plus text-[9px]" /></span>}
            <div className="flex-1 min-w-0"><div className={`font-semibold ${st === 'no' ? 'line-through' : ''}`}>{it.title}</div><div className="text-meta text-ink-500">{compact ? it.short : it.id === 'hero' ? <><span className="line-through">#dfe7f3</span> → #B07A55 · หัวข้อ "AUTUMN EDIT 2026"</> : it.detail}</div></div>
            <button onClick={() => resolve(it.id, 'ok')} title="ยอมรับ" aria-pressed={st === 'ok'} className={`w-[26px] h-[26px] rounded-[7px] grid place-items-center border ${st === 'ok' ? 'bg-success-600 border-success-600 text-white' : 'bg-success-50 border-success-100 text-success-600'}`}><i className="fas fa-check text-[11px]" /></button>
            <button onClick={() => resolve(it.id, 'no')} title="ไม่รับ" aria-pressed={st === 'no'} className={`w-[26px] h-[26px] rounded-[7px] grid place-items-center border border-ink-150 text-ink-500 ${st === 'no' ? 'bg-ink-100' : ''}`}><i className="fas fa-times text-[11px]" /></button>
          </div>
        )
      })}
      <div className="flex gap-2 p-2.5 bg-ink-50">
        <button onClick={acceptAll} className="flex-1 h-8 rounded-lg text-white font-semibold text-body" style={{ background: accept }}>ยอมรับทั้งหมด</button>
        <button onClick={() => setCompare(compare === 'after' ? 'before' : 'after')} className="h-8 px-3 rounded-lg border border-ink-200 text-body bg-white">{compare === 'after' ? (compact ? 'ก่อน/หลัง' : 'ดูก่อน/หลัง') : 'ดูฉบับร่าง'}</button>
      </div>
    </div>
  )
}

export function TierChips({ labels }: { labels: [string, string, string] }) {
  return (
    <div className="flex gap-1.5 mb-2 text-meta font-semibold">
      <span className="rounded-full px-2.5 py-[3px] bg-ink-900 text-white">{labels[0]}</span>
      <span className="rounded-full px-2.5 py-[3px] border border-ink-200 text-ink-600">{labels[1]}</span>
      <span className="rounded-full px-2.5 py-[3px] border border-ink-200 text-ink-400">{labels[2]} <i className="fas fa-lock text-[9px]" /></span>
    </div>
  )
}

/* D3 legend — what each colour on the canvas means (mapped onto the mockup DS colours) */
export function Legend({ all }: { all?: boolean }) {
  const items: [string, string][] = [[ROLE_STYLE.free.color, 'แก้ได้อิสระ'], [ROLE_STYLE.slot.color, 'ช่องแทรก'], [ROLE_STYLE.system.color, 'ระบบ · แก้ค่า'], [ROLE_STYLE.global.color, 'ใช้ร่วมทุกหน้า']]
  if (all) items.push([ROLE_STYLE.ai.color, 'ผู้ช่วยเพิ่ม'])
  return <>{items.map(([c, l]) => <span key={l}><span className="inline-block w-2 h-2 rounded-[2px] mr-1" style={{ background: c }} />{l}</span>)}</>
}

export function Avatar({ size = 30 }: { size?: number }) {
  return <span className="rounded-full flex-none" style={{ width: size, height: size, background: 'radial-gradient(circle at 40% 35%,#f4c98e,#8a5a2b 70%)' }} />
}

export function MascotImg({ src = 'mascot-hello.png', size, pos = 'center 20%', className = '' }: { src?: string; size: number; pos?: string; className?: string }) {
  return <span className={`rounded-full bg-white overflow-hidden flex-none inline-block ${className}`} style={{ width: size, height: size }}><img src={`./img/${src}`} alt="" className="w-full h-full object-cover" style={{ objectPosition: pos }} /></span>
}
