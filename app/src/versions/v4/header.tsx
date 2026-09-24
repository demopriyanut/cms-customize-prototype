/* V4 — cloned from V3 (HeaderC in screens/header.tsx) on 2026-09-24 so V4 can change without touching V3.
   Only V4 uses this file. */
import { useState } from 'react'
import { diffSites, useStore } from '@/data/store'
import { HEADER_INHERIT, HEADER_PRESETS, MENU_FONTS, NAV_LAYOUTS, tokenHex, type ColorRef, type SiteDoc } from '@/data/schema'
import { HeaderPreview, type HZone } from '@/components/storefront/Canvas'
import { DeviceToggle, MascotImg } from './parts'
import { PublishDialog } from './panels'
import { ColorField, DraftState, Empty, PublishBtn, Toggle, useUndoKeys, useWidth, ViewSite, type Look } from './shared'

/* =====================================================================
   Header (ใช้ร่วมทุกหน้า) — V1 = 1h · V2 = 1i · V3 = 3c · flow 3v
   1 เปิด Header → เห็นของจริง + ป้ายโซน   2 คลิกโซน → ไปที่การตั้งค่าของโซนนั้น
   3 เลือก Layout → preview เปลี่ยนทันที    4 สี: สืบทอด Token (น้ำเงิน) / ตั้งทับ (อำพัน) · "Token" คืนค่ากลาง
   5 ลองแบบอื่น (ผู้ช่วย Ket) → ลองชั่วคราว เทียบ แล้วเลือก   6 เช็กมือถือ ☰ · Sticky · เผยแพร่ครั้งเดียวมีผลทุกหน้า
   Every change is a commit to the draft (undo / history) — the web changes only on เผยแพร่.
   Only the Navigation settings exist in the mockup; other tabs / zones stay empty ("ยังไม่มีใน mockup").
   ===================================================================== */

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

function Toggles({ look, hd, color, row }: { look: Look; hd: H; color: string; row?: boolean }) {
  return <>{TOGGLES[look].map(([k, l]) => <Toggle key={k} label={l} color={color} row={row} on={hd.h.data[k] === 'yes'} onChange={v => hd.setData(k, v ? 'yes' : 'no', TOGGLE_LOG[k][v ? 0 : 1])} />)}</>
}

/* layout picker — 1h: wireframe radio cards · 3c: small wireframe cards · 1i: text chips */
function LayoutPicker({ look, hd, accent }: { look: Look; hd: H; accent: string }) {
  const cur = hd.h.data.layout
  const pick = (k: string, name: string) => hd.setData('layout', k, 'Layout ' + name)
  const note = cur === 'stacked' && <div className="text-caption text-ink-500 mt-2"><i className="fas fa-magic text-ai mr-1" aria-hidden />ตอนนี้ใช้แบบ Editorial จากผู้ช่วย Ket (โลโก้กลาง · เมนูใต้โลโก้) — เลือกการ์ดเพื่อกลับเป็นแบบมาตรฐานของระบบ</div>
  if (look === 'b') return (
    <div>
      <div className="flex gap-1.5">{NAV_LAYOUTS.map(n => { const on = cur === n.key; return (
        <button key={n.key} role="radio" aria-checked={on} onClick={() => pick(n.key, n.name)} className={`flex-1 h-10 rounded-[9px] text-meta ${on ? 'font-semibold' : 'border border-ink-400 text-ink-600 hover:border-ink-400'}`} style={on ? { border: `2px solid ${accent}` } : undefined}>{n.name}</button>
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
            <button key={n.key} role="radio" aria-checked={on} onClick={() => pick(n.key, n.name)} className={`text-left ${big ? 'rounded-xl p-2.5' : 'flex-1 rounded-[10px] p-2'} ${on ? 'bg-orange-50' : 'bg-white hover:border-ink-400'}`} style={{ border: `2px solid ${on ? 'var(--orange-600)' : 'var(--ink-400)'}` }}>
              <div className={`bg-white border border-ink-150 rounded-md flex items-center ${big ? 'h-16 px-2 gap-1.5' : 'h-[34px] px-1.5 gap-1'}`} style={{ justifyContent: n.justify }}>
                {bar(big ? 38 : 22, big ? 10 : 7, 'var(--ink-800)', n.logoOrder)}
                <span className={`flex order-2 ${big ? 'gap-1' : 'gap-0.5'}`}>{Array.from({ length: big ? 4 : 3 }, (_, i) => bar(big ? 14 : 8, big ? 6 : 4, 'var(--ink-300)', undefined, i))}</span>
                {big && bar(20, 6, 'var(--ink-300)', 3)}
              </div>
              {big
                ? <div className="flex items-center gap-2 mt-2"><span className="w-3.5 h-3.5 rounded-full grid place-items-center" style={{ border: `2px solid ${on ? 'var(--orange-600)' : 'var(--ink-400)'}` }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: on ? 'var(--orange-600)' : 'transparent' }} /></span><span className="font-semibold text-body">{n.name}</span></div>
                : <div className="text-caption font-semibold mt-1.5 text-center">{n.name}</div>}
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
        <select value={d.menuFont} onChange={e => hd.setData('menuFont', e.target.value, 'ฟอนต์เมนู ' + e.target.value)} className="w-full h-9 appearance-none border border-ink-400 rounded-[9px] pl-2.5 pr-7 bg-white text-body">
          {MENU_FONTS.map(f => <option key={f}>{f}</option>)}
        </select>
        <i className="fas fa-chevron-down text-[9px] text-ink-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </label>
      <div className="w-[84px] h-9 border border-ink-200 rounded-[9px] flex items-center bg-white font-display text-body">
        <button aria-label="เล็กลง" onClick={() => size > 10 && hd.setData('menuSize', String(size - 1), `ขนาดเมนู ${size - 1} px`)} className="w-6 h-full text-ink-500 hover:text-ink-900">−</button>
        <span className="flex-1 text-center whitespace-nowrap">{size} px</span>
        <button aria-label="ใหญ่ขึ้น" onClick={() => size < 16 && hd.setData('menuSize', String(size + 1), `ขนาดเมนู ${size + 1} px`)} className="w-6 h-full text-ink-500 hover:text-ink-900">+</button>
      </div>
      {withCase && <button aria-pressed={d.menuUpper !== 'no'} title="ตัวพิมพ์ใหญ่ทั้งหมด" onClick={() => hd.setData('menuUpper', d.menuUpper === 'no' ? 'yes' : 'no', d.menuUpper === 'no' ? 'เมนูตัวพิมพ์ใหญ่' : 'เมนูตัวพิมพ์ปกติ')}
        className={`w-11 h-9 rounded-[9px] border text-body font-bold ${d.menuUpper !== 'no' ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-ink-400 bg-white'}`}>Aa</button>}
    </div>
  )
}

/* สี: สืบทอดจาก Token (น้ำเงิน) vs ตั้งทับเฉพาะจุดนี้ (อำพัน) */
function ColorRow({ look, hd, which }: { look: Look; hd: H; which: 'bg' | 'fg' }) {
  const title = which === 'bg' ? (look === 'a' ? 'พื้นหลัง Header' : 'พื้นหลัง') : (look === 'a' ? 'ตัวอักษรเมนู' : 'ตัวอักษร')
  return <ColorField look={look} site={hd.draft} value={hd.h.style?.[which]} inheritName={HEADER_INHERIT[which]} title={title} scope=" Header"
    onChange={v => hd.setColor(which, v, v ? `ตั้งสี${title}เฉพาะจุด` : `${title} กลับไปใช้ Token`)} />
}

/* the Navigation settings — the only part of the Header form the mockup draws */
function NavigationForm({ look, hd }: { look: Look; hd: H }) {
  if (look === 'a') return (
    <div className="flex flex-col gap-5">
      <div><div className="font-bold text-heading">Navigation Layout</div><div className="text-meta text-ink-500">เลือกรูปแบบการวางโลโก้และเมนู — เปลี่ยนแล้วพรีวิวด้านบนอัปเดตทันที</div></div>
      <LayoutPicker look="a" hd={hd} accent="var(--orange-600)" />
      <div className="flex flex-wrap gap-x-7 gap-y-3 py-3.5 border-y border-ink-100 text-body"><Toggles look="a" hd={hd} color="var(--orange-600)" /></div>
      <div>
        <div className="font-bold text-heading mb-2.5">สี <span className="text-caption text-ink-500 font-normal">· ค่าเริ่มต้นสืบทอดจาก System Design → เปลี่ยนที่นั่นจะเปลี่ยนทุกหน้า</span></div>
        <div className="grid grid-cols-2 gap-2.5 max-w-[760px]"><ColorRow look="a" hd={hd} which="bg" /><ColorRow look="a" hd={hd} which="fg" /></div>
      </div>
    </div>
  )
  const lab = look === 'b' ? 'text-caption font-semibold text-ink-500 tracking-[.04em] mb-2' : 'font-semibold mb-2'
  return (
    <div className="flex flex-col gap-4">
      <div><div className={lab}>{look === 'b' ? 'LAYOUT' : 'Navigation Layout'}</div><LayoutPicker look={look} hd={hd} accent="var(--orange-600)" /></div>
      <div><div className={lab}>{look === 'b' ? 'ตัวอักษร' : 'ตัวอักษรเมนู'}</div><FontRow hd={hd} withCase={look === 'c'} /></div>
      <div><div className={lab}>สี</div><div className="flex flex-col gap-1.5"><ColorRow look={look} hd={hd} which="bg" /><ColorRow look={look} hd={hd} which="fg" /></div></div>
      <div className="flex flex-col gap-2.5 text-body pt-2 border-t border-ink-100"><Toggles look={look} hd={hd} color={look === 'b' ? 'var(--ink-900)' : 'var(--orange-600)'} row /></div>
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
        <span className="text-meta text-ink-500">· {look === 'b' ? 'ใช้โลโก้/เมนู/สีจาก Token เดิม เปลี่ยนแค่การจัดวาง' : 'โลโก้/เมนู/สี Token เดิม เปลี่ยนแค่การจัดวาง'}</span>
        <button onClick={() => showToast('บทตั้งไว้ของ prototype มี 3 แบบตาม mockup — ยังไม่มีแบบอื่นให้สุ่ม')} className="ml-auto text-meta text-ink-700 font-semibold hover:text-ink-900"><i className="fas fa-sync-alt text-[10px]" /> สุ่มใหม่</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {HEADER_PRESETS.map(p => {
          const bg = tokenHex(hd.draft, p.style.bg) ?? '#fff', fg = tokenHex(hd.draft, p.style.fg) ?? '#222'
          const trying = hd.trial === p.key
          return (
            <div key={p.key} className={`border rounded-xl overflow-hidden ${trying ? 'border-orange-600 ring-2 ring-orange-100' : 'border-ink-150'}`}>
              <div className="flex items-center px-3.5 gap-2.5" style={{ height: look === 'b' ? 58 : 54, background: bg, justifyContent: p.data.layout === 'stacked' ? 'center' : 'space-between', flexDirection: p.data.layout === 'stacked' ? 'column' : 'row' }}>
                <span className="font-bold text-caption" style={{ fontFamily: 'Georgia,serif', color: fg }}>GIRLY CLOSET</span>
                <span className="flex gap-1.5">{Array.from({ length: look === 'b' ? 4 : 3 }, (_, i) => <span key={i} className="w-4 h-[5px] rounded-sm opacity-50" style={{ background: fg }} />)}</span>
              </div>
              <div className="px-2.5 py-2 flex items-center gap-2 text-meta">
                <div className="flex-1 min-w-0"><div className="font-semibold">{p.name}</div><div className="text-caption text-ink-500 leading-snug">{p.desc}</div></div>
                {look === 'b'
                  ? <button onClick={() => hd.applyPreset(p.key)} className="border border-ink-400 rounded-[7px] px-2.5 py-1 font-semibold text-caption whitespace-nowrap hover:border-ink-900">ใช้แบบนี้</button>
                  : <button onClick={() => { hd.setPeek(false); hd.setTrial(trying ? null : p.key) }} aria-pressed={trying} className={`rounded-[7px] px-2.5 py-1 font-semibold text-caption whitespace-nowrap border ${trying ? 'bg-orange-50 border-orange-600 text-orange-700' : 'border-ink-400 hover:border-ink-900'}`}>{trying ? 'กำลังลอง' : 'ลองดู'}</button>}
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
    <div role="status" className="flex items-center gap-2.5 bg-orange-50 border border-orange-600 text-ink-900 rounded-xl px-3.5 py-2.5 text-body">
      <i className="fas fa-magic text-ai" aria-hidden />
      <span className="flex-1 min-w-0">กำลังลองแบบ <b>{hd.preset.name}</b> · ชั่วคราว ยังไม่ลงฉบับร่าง</span>
      <span className="flex gap-0.5 bg-white border border-ink-400 rounded-full p-[3px] text-caption font-semibold">
        {([[true, 'แบบเดิม'], [false, 'แบบที่ลอง']] as const).map(([v, l]) => <button key={l} aria-pressed={hd.peek === v} onClick={() => hd.setPeek(v)} className={`px-2.5 py-1 rounded-full ${hd.peek === v ? 'bg-orange-50 text-orange-700' : 'text-ink-600'}`}>{l}</button>)}
      </span>
      <button onClick={() => hd.applyPreset(hd.preset!.key)} className="h-8 px-3 rounded-lg text-white font-semibold" style={{ backgroundColor: 'var(--red-600)', backgroundImage: 'var(--ket-grad)' }}>ใช้แบบนี้</button>
      <button onClick={() => hd.setTrial(null)} className="h-8 px-2.5 rounded-lg border border-ink-400 bg-white text-ink-900 hover:bg-ink-50">ยกเลิก</button>
    </div>
  )
}

/* ---------- V4 (โคลนจาก V3) · 3c — hot-zone + ลองแบบอื่น · ฟอร์มอยู่ panel ขวาตามโครงเดิม ---------- */
const TABS_C: [string, string, HZone | null][] = [['layout', 'Layout', null], ['logo', 'โลโก้', 'logo'], ['topbar', 'Top bar', 'topbar'], ['nav', 'Navigation', 'nav'], ['color', 'สี', null]]
export function HeaderV4(_: { collapsed?: boolean }) {
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
    <div className="text-body flex-1 flex flex-col min-w-0 min-h-0 bg-ink-50">
      <div className="h-14 bg-white border-b border-ink-150 flex items-center px-6 gap-3 flex-none">
        <h1 className="font-bold text-title">Header</h1><span className="text-ink-500">/</span><span className="text-ink-600">ใช้กับทุกหน้า</span>
        <span className="ml-2"><DeviceToggle variant="square" /></span>
        <div className="flex-1" />
        <DraftState dirty={hd.dirty} />
        <ViewSite /><PublishBtn look="c" />
      </div>
      <div className="flex-1 flex min-h-0">
        <div tabIndex={0} aria-label="พื้นที่ preview Header" className="outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-600 flex-1 min-w-0 overflow-auto px-6 pt-[22px] pb-28 flex flex-col gap-4">
          <div className="bg-white rounded-[14px] shadow-md border border-black/5 overflow-hidden">
            <div ref={fit.ref}><HeaderPreview site={hd.shown} width={fit.w} strip={90} hot={{ active: cur[2], color: 'var(--orange-600)', look: 'c', onZone }} /></div>
          </div>
          <TrialBar hd={hd} />
          <Alternatives look="c" hd={hd} />
        </div>
        <div className="w-[340px] bg-white border-l border-ink-150 flex-none flex flex-col min-h-0">
          <div role="tablist" className="flex border-b border-ink-150 px-1.5 font-medium text-ink-500 text-body flex-none">
            {TABS_C.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setPanel('hdr-c', k)} className={`flex-auto pt-3.5 pb-3 px-1.5 whitespace-nowrap ${tab === k ? 'text-ink-900 font-semibold border-b-2 border-orange-600 -mb-px' : 'hover:text-ink-900'}`}>{l}</button>)}
          </div>
          <div tabIndex={0} aria-label="แผงตั้งค่า Header" className="flex-1 overflow-auto p-4 flex flex-col outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-600">
            {tab === 'nav' ? <NavigationForm look="c" hd={hd} /> : <Empty name={cur[1]} onBack={() => setPanel('hdr-c', 'nav')} backLabel="ไปที่ Navigation (ส่วนที่ mockup ออกแบบไว้)" />}
          </div>
        </div>
      </div>
      <PublishDialog />
    </div>
  )
}

