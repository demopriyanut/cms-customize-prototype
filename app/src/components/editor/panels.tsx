import { useEffect, useRef } from 'react'
import { LIBRARY, LOCK_STYLE, LOCK_TEXT, ROLE_STYLE, tokenHex, type Device, type PageDoc, type Section, type SectionStyle, type SiteDoc } from '@/data/schema'
import { findSection, orderedBlocks, useChanges, useStore } from '@/data/store'
import { useGo, useRoute } from '@/components/shell/nav'
import { useDrag } from './drag'
import { SECTION_ICON, THUMB } from './parts'

/* =====================================================================
   Editor panels shared by V1 / V2 / V3 (each version places them in its own layout)
   ===================================================================== */

/* ---------- ชั้นของหน้า: draggable list incl. locked Header/Footer rows ---------- */
export function LayerList({ site, page, variant }: { site: SiteDoc; page: PageDoc; variant: 'card' | 'compact' }) {
  const selected = useStore(s => s.selected); const select = useStore(s => s.select)
  const ref = useRef<HTMLDivElement>(null)
  const drag = useDrag(ref, '[data-block]')
  const blocks = orderedBlocks(site, page)
  const zones = page.zones ?? []
  const rows: React.ReactNode[] = []
  const row = (s: Section, zone: string, index: number) => {
    const sel = s.id === selected
    const role = s.origin === 'ai' ? 'ai' : s.role
    const rs = ROLE_STYLE[role]
    const locked = s.role !== 'free'
    const common = {
      'data-block': '', 'data-id': s.id, 'data-zone': zone, 'data-index': index, 'data-role': s.role,
      'data-reason': s.role === 'global' ? `${s.name} ใช้ร่วมทุกหน้า แก้ที่ตั้งค่ากลาง` : s.role === 'system' ? 'บล็อกหลักของระบบ ย้าย/แทรกทับไม่ได้' : '',
    }
    if (variant === 'compact') return (
      <div key={s.id} {...common} onClick={() => select(s.id)} role="button" tabIndex={0} aria-pressed={sel} onKeyDown={e => e.key === 'Enter' && select(s.id)}
        className={`w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-[10px] cursor-pointer ${sel ? 'bg-orange-50 text-orange-700 font-semibold' : s.origin === 'ai' ? 'bg-orange-50/60 text-orange-700 font-medium' : 'text-ink-800 font-medium hover:bg-ink-50'} ${s.hidden ? 'opacity-50' : ''}`}>
        {locked ? <i className="fas fa-lock w-3.5 text-center text-[11px] text-ink-400" /> : <i onPointerDown={e => drag.start(e, s.id, s.name)} title="ลากเพื่อย้าย" className="fas fa-grip-vertical w-3.5 text-center text-[12px] text-ink-300 cursor-grab touch-none" />}
        <i className={`${SECTION_ICON[s.type]} w-3.5 text-center text-[12px] opacity-80`} />
        <span className="flex-1 text-[13.5px] truncate">{s.name}</span>
        {s.hidden && <i className="far fa-eye-slash text-[11px]" />}
        <span className="text-[11px] font-bold px-[5px] py-px rounded whitespace-nowrap" style={{ background: rs.bg, color: rs.fg }}>{locked ? (s.role === 'global' ? 'ทุกหน้า' : 'ระบบ') : s.origin ? 'AI' : page.lock}</span>
      </div>
    )
    return (
      <div key={s.id} {...common} onClick={() => select(s.id)} role="button" tabIndex={0} aria-pressed={sel} onKeyDown={e => e.key === 'Enter' && select(s.id)}
        className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2.5 rounded-[10px] border cursor-pointer ${sel ? 'border-red-300 bg-red-50' : s.origin === 'ai' ? 'border-orange-500 border-dashed bg-orange-50' : locked ? 'border-ink-150 bg-ink-50' : 'border-ink-150 bg-white hover:border-ink-300'} ${s.hidden ? 'opacity-50' : ''}`}>
        {locked ? <i className="fas fa-lock text-ink-400 text-[11px] w-[11px]" title={common['data-reason']} /> : <i onPointerDown={e => drag.start(e, s.id, s.name)} title="ลากเพื่อย้าย" className="fas fa-grip-vertical text-ink-300 text-[12px] cursor-grab touch-none w-[11px]" />}
        <span className="w-10 h-7 rounded flex-none border border-ink-150" style={{ background: THUMB[s.type] }} />
        <span className="flex-1 min-w-0"><span className="block font-semibold text-[13.5px] truncate">{s.name}</span><span className="block text-[12px] text-ink-500 truncate">{s.meta}</span></span>
        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-[5px] whitespace-nowrap" style={{ background: rs.bg, color: rs.fg }}>{locked ? (s.role === 'global' ? 'ทุกหน้า' : 'ระบบ') : s.origin ? 'AI' : `${page.lock} อิสระ`}</span>
        {!locked && <button title={s.hidden ? 'แสดง' : 'ซ่อน'} onClick={e => { e.stopPropagation(); useStore.getState().toggleHidden(s.id) }} className="text-ink-400 hover:text-ink-900"><i className={s.hidden ? 'far fa-eye-slash' : 'far fa-eye'} /></button>}
      </div>
    )
  }
  rows.push(row(site.header, 'site', 0))
  for (const z of zones) {
    const inZone = blocks.filter(b => b.zone?.id === z.id)
    if (page.lock !== 'L0') rows.push(<div key={'zh-' + z.id} data-zone-label={z.label} className="text-[11px] font-semibold tracking-[.04em] px-1 pt-1.5" style={{ color: z.insert ? ROLE_STYLE.slot.fg : 'var(--ink-500)' }}>{z.insert ? <i className="fas fa-plus-square mr-1" /> : <i className="fas fa-lock mr-1" />}{z.label}{z.closedNote ? ` · ${z.closedNote}` : ''}</div>)
    if (inZone.length === 0) {
      rows.push(z.insert
        ? <div key={'ze-' + z.id} data-block="" data-zone={z.id} data-index={0} data-empty="1" className="border border-dashed rounded-lg px-2 py-2 text-[12px] text-center" style={{ borderColor: ROLE_STYLE.slot.color, color: ROLE_STYLE.slot.fg }}>ว่าง · ลาก Section มาวาง หรือเพิ่มจากคลัง</div>
        : <div key={'ze-' + z.id} data-block="" data-zone={z.id} data-closed="1" data-reason={`ช่องนี้${z.closedNote ?? 'ปิดอยู่'}`} className="border border-dashed border-ink-200 rounded-lg px-2 py-2 text-[12px] text-center text-ink-400"><i className="fas fa-lock" /> {z.closedNote ?? 'ปิดอยู่'}</div>)
    }
    inZone.forEach((b, i) => rows.push(row(b.s, z.id, i)))
  }
  rows.push(row(site.footer, 'site', 0))
  return (
    <div ref={ref} className={`flex flex-col ${variant === 'card' ? 'gap-2' : 'gap-1'}`}>
      {rows}
      {drag.state && (
        <>
          {drag.state.line && <div className="fixed h-[3px] rounded pointer-events-none z-[80]" style={{ left: drag.state.line.left, top: drag.state.line.top - 1.5, width: drag.state.line.width, background: drag.state.gap?.target ? 'var(--info-500)' : 'var(--red-600)' }} />}
          <div className="fixed z-[90] pointer-events-none text-[13px] max-w-[300px]" style={{ left: drag.state.x + 14, top: drag.state.y + 10 }}>
            <div className="bg-ink-900 text-white rounded-lg px-2.5 py-1.5 font-semibold shadow-xl">{drag.state.label}</div>
            <div className={`mt-1 rounded-lg px-2.5 py-1 border ${drag.state.gap?.target ? 'bg-info-100 text-info-700 border-info-500' : 'bg-red-50 text-red-700 border-red-300'}`}>{drag.state.gap?.target ? `วางได้ · ${drag.state.gap.zoneLabel}` : <><b>วางไม่ได้</b> — {drag.state.gap?.reason}</>}</div>
          </div>
        </>
      )}
    </div>
  )
}

/* ---------- คลัง Section / Element: pick first, then choose where to drop (D4) ---------- */
export function LibraryPanel({ page, className = '' }: { page: PageDoc; className?: string }) {
  const open = useStore(s => s.libraryOpen); const setLibrary = useStore(s => s.setLibrary); const startPlacing = useStore(s => s.startPlacing)
  if (!open) return null
  const canInsert = (page.zones ?? []).some(z => z.insert)
  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-black/5 p-4 w-[312px] flex flex-col gap-3 z-30 ${className}`} role="dialog" aria-label="คลัง">
      <div className="flex items-center justify-between"><b className="text-[14px]">คลัง</b><button onClick={() => setLibrary(false)} aria-label="ปิดคลัง" className="w-7 h-7 rounded-lg hover:bg-ink-100 text-ink-500"><i className="fas fa-times" /></button></div>
      {!canInsert ? (
        <div className="text-[13px] text-ink-600 leading-relaxed bg-warning-100/60 rounded-lg p-2.5"><i className="fas fa-lock mr-1" />หน้านี้ระดับ <b>{page.lock}</b> — {LOCK_TEXT[page.lock].rule}</div>
      ) : <>
        <div className="text-[12px] text-ink-500">เลือกก่อน แล้วคลิกช่อง “วางที่นี่” บนหน้าเว็บ</div>
        <div className="text-[11px] font-semibold tracking-[.06em] text-ink-500 uppercase font-display mt-1">คลัง Section</div>
        <div className="grid grid-cols-2 gap-2">
          {LIBRARY.sections.map(x => (
            <button key={x.key} onClick={() => startPlacing({ kind: 'section', key: x.key, label: x.label, icon: x.icon })} className="text-left border border-ink-150 rounded-[10px] p-2.5 hover:border-ink-400 hover:bg-ink-50">
              <i className={`${x.icon} text-ink-500`} /><div className="font-semibold text-[13px] mt-1">{x.label}</div><div className="text-[11.5px] text-ink-500 leading-tight">{x.desc}</div>
            </button>
          ))}
        </div>
        <div className="text-[11px] font-semibold tracking-[.06em] text-ink-500 uppercase font-display mt-1">คลัง Element</div>
        <div className="grid grid-cols-3 gap-2">
          {LIBRARY.elements.map(x => (
            <button key={x.key} onClick={() => startPlacing({ kind: 'element', key: x.key, label: x.label, icon: x.icon })} className="border border-ink-150 rounded-[10px] py-2.5 hover:border-ink-400 hover:bg-ink-50 text-[12.5px]">
              <i className={`${x.icon} text-ink-500 block mb-0.5`} />{x.label}
            </button>
          ))}
        </div>
      </>}
    </div>
  )
}

/* banner while choosing where to drop */
export function PlacingBar({ className = '' }: { className?: string }) {
  const placing = useStore(s => s.placing); const startPlacing = useStore(s => s.startPlacing)
  useEffect(() => {
    if (!placing) return
    const first = document.querySelector<HTMLElement>('[data-place-slot]'); first?.focus()
  }, [placing])
  if (!placing) return null
  return (
    <div className={`bg-info-700 text-white rounded-full pl-3 pr-1.5 py-1.5 flex items-center gap-2 text-[13px] shadow-lg z-40 ${className}`} role="status">
      <i className={placing.icon} /><b>{placing.label}</b> · คลิก “วางที่นี่” ตรงที่ต้องการ · <span className="opacity-80">Tab เลื่อนช่อง · Enter วาง</span>
      <button onClick={() => startPlacing(null)} className="ml-1 h-7 px-2.5 rounded-full bg-white/15 hover:bg-white/25 font-semibold">ยกเลิก · Esc</button>
    </div>
  )
}

/* page-level rule shown on L1 / L2 pages so users know before they try (B1) */
export function PageRuleBanner({ page, className = '', style }: { page: PageDoc; className?: string; style?: React.CSSProperties }) {
  if (page.lock === 'L0') return null
  return (
    <div className={`rounded-xl px-4 py-3 text-[13.5px] leading-relaxed flex items-start gap-2.5 border ${className}`} style={{ background: LOCK_STYLE[page.lock].bg, color: LOCK_STYLE[page.lock].fg, borderColor: 'rgba(0,0,0,.06)', ...style }}>
      <i className="fas fa-info-circle" /><span><b>{page.name} · {page.lock} {LOCK_TEXT[page.lock].short}</b> — {LOCK_TEXT[page.lock].rule}</span>
    </div>
  )
}

/* ---------- คุณสมบัติของสิ่งที่เลือก (D4 right panel) ---------- */
export function PropertiesPanel({ site, pageId }: { site: SiteDoc; pageId: string }) {
  const selected = useStore(s => s.selected)
  const s = findSection(site, pageId, selected)
  const st = useStore.getState
  const { version } = useRoute(); const go = useGo()
  const readOnly = useStore(x => x.compare) === 'before'
  if (!s) return <div className="flex-1 grid place-items-center text-ink-500 text-[13.5px] p-6 text-center">เลือก Section บนหน้าเว็บ<br />หรือในรายการ เพื่อดูคุณสมบัติ</div>
  if (s.role === 'global') return (
    <div className="flex-1 overflow-auto p-5 flex flex-col gap-4 text-[13.5px]">
      <Head s={s} />
      <div className="rounded-xl bg-ink-50 border border-ink-150 p-3 leading-relaxed"><i className="fas fa-lock text-ink-500 mr-1" /><b>{s.name} ใช้ร่วมทุกหน้า</b><br />แก้ที่หน้า {s.name} เพื่อให้ทุกหน้าเปลี่ยนพร้อมกัน — ในหน้านี้ย้ายหรือลบไม่ได้</div>
      {version && <button onClick={() => go.to(version.id, s.type === 'header' ? 'header' : 'footer')} className="h-9 rounded-lg bg-ink-900 text-white font-semibold"><i className="fas fa-external-link-alt text-[12px] mr-1.5" />ไปแก้ที่ {s.name}</button>}
      <TokenRow label="สีพื้นหลัง" site={site} bg={s.style?.bg} disabled />
    </div>
  )
  const textFields = Object.entries(s.data).filter(([k]) => FIELD_LABEL[k])
  return (
    <div className="flex-1 overflow-auto p-5 flex flex-col gap-5 text-[13.5px]">
      <Head s={s} />
      {s.role === 'system' && <div className="rounded-xl p-2.5 leading-relaxed" style={{ background: ROLE_STYLE.system.bg, color: ROLE_STYLE.system.fg }}><i className="fas fa-lock mr-1" />{s.type === 'cart' ? 'หน้าธุรกรรม — แก้ได้เฉพาะค่า: ข้อความ · ซ่อนฟิลด์ · สีปุ่ม' : 'บล็อกของระบบ — ปรับค่าได้ ย้ายไม่ได้ · ข้อมูลสินค้ามาจากคลังสินค้า'}</div>}
      {s.type === 'products' && <div className="rounded-xl p-2.5 bg-info-100 text-info-700 leading-relaxed"><i className="fas fa-sync-alt mr-1" />สินค้าดึงสดจากคลังสินค้า — แก้การแสดงผลได้ แต่ข้อมูลมาจากระบบ</div>}
      {textFields.length > 0 && (
        <Group title="เนื้อหา">
          {textFields.map(([k, v]) => (
            <label key={k} className="flex flex-col gap-1">
              <span className="text-[12px] text-ink-500">{FIELD_LABEL[k]}</span>
              <input key={s.id + k + v} defaultValue={v} disabled={readOnly || (s.type === 'product-info' && k !== 'cta')} onBlur={e => st().setField(s.id, k, e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="h-9 border border-ink-200 rounded-lg px-3 bg-white disabled:bg-ink-50 disabled:text-ink-400" />
            </label>
          ))}
          <div className="text-[11.5px] text-ink-400">หรือดับเบิลคลิกข้อความบนหน้าเว็บเพื่อแก้ในที่</div>
        </Group>
      )}
      {(s.type === 'cart' || s.type === 'product-info') && (
        <Group title={s.type === 'cart' ? 'ซ่อนฟิลด์' : 'การแสดงผล'}>
          {(s.type === 'cart' ? [['showNote', 'ช่องหมายเหตุถึงร้าน'], ['showCoupon', 'ช่องโค้ดส่วนลด']] : [['showCompare', 'แสดงราคาก่อนลด']]).map(([k, l]) => (
            <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={s.data[k] === 'yes'} disabled={readOnly} onChange={e => st().setField(s.id, k, e.target.checked ? 'yes' : 'no')} />{l}</label>
          ))}
        </Group>
      )}
      <TokenRow label={s.type === 'cart' || s.type === 'product-info' ? 'สีปุ่ม' : 'สีพื้นหลัง'} site={site} bg={s.style?.bg} disabled={readOnly}
        inheritText={s.type === 'cart' || s.type === 'product-info' ? 'สืบทอด · Token Primary' : 'สืบทอด · ไม่มีพื้น (ตามพื้นหน้าเว็บ)'}
        onChange={bg => st().setStyle(s.id, { bg }, bg ? 'ตั้งสีเฉพาะจุด · ' + s.name : 'กลับไปใช้ค่ากลาง · ' + s.name)} />
      {s.role === 'free' && <>
        <Group title="ระยะห่าง">
          <div className="flex gap-1 bg-ink-100 rounded-lg p-[3px]">{(['S', 'M', 'L'] as const).map(k => {
            const on = (s.style?.spacing ?? 'M') === k
            return <button key={k} disabled={readOnly} onClick={() => st().setStyle(s.id, { spacing: k }, `ระยะห่าง ${k} · ${s.name}`)} className={`flex-1 h-7 rounded-md text-[13px] ${on ? 'bg-white shadow-xs font-semibold' : 'text-ink-500'}`}>{k === 'S' ? 'แคบ' : k === 'M' ? 'ปกติ' : 'กว้าง'}</button>
          })}</div>
        </Group>
        <Group title="ซ่อนตามขนาดจอ">
          <div className="flex gap-3">{(['desktop', 'tablet', 'mobile'] as Device[]).map(d => {
            const hidden = s.style?.hideOn?.includes(d)
            return <label key={d} className="flex items-center gap-1.5"><input type="checkbox" checked={!!hidden} disabled={readOnly} onChange={() => {
              const cur = s.style?.hideOn ?? []; st().setStyle(s.id, { hideOn: hidden ? cur.filter(x => x !== d) : [...cur, d] }, `${hidden ? 'แสดง' : 'ซ่อน'}บน${DEV_TH[d]} · ${s.name}`)
            }} />ซ่อนบน{DEV_TH[d]}</label>
          })}</div>
        </Group>
        <div className="flex gap-1.5">
          <button disabled={readOnly} onClick={() => st().duplicate(s.id)} className="flex-1 h-8 rounded-lg border border-ink-200 hover:bg-ink-50"><i className="far fa-clone mr-1" />ทำซ้ำ</button>
          <button disabled={readOnly} onClick={() => st().toggleHidden(s.id)} className="flex-1 h-8 rounded-lg border border-ink-200 hover:bg-ink-50"><i className={`far ${s.hidden ? 'fa-eye' : 'fa-eye-slash'} mr-1`} />{s.hidden ? 'แสดง' : 'ซ่อน'}</button>
          <button disabled={readOnly} onClick={() => st().remove(s.id)} className="flex-1 h-8 rounded-lg border border-ink-200 hover:bg-red-50 hover:text-red-700"><i className="far fa-trash-alt mr-1" />ลบ</button>
        </div>
      </>}
      {readOnly && <div className="text-[12px] text-ink-500">กำลังดู “ก่อน” (ฉบับเผยแพร่) — สลับเป็น “หลัง” เพื่อแก้</div>}
    </div>
  )
}
const DEV_TH: Record<Device, string> = { desktop: 'คอม', tablet: 'แท็บเล็ต', mobile: 'มือถือ' }
const FIELD_LABEL: Record<string, string> = { text: 'ข้อความ', tag: 'ป้าย', title: 'หัวข้อ', body: 'คำอธิบาย', cta: 'ข้อความปุ่ม', badge: 'ป้ายบนสินค้า', name: 'ชื่อสินค้า (จากคลังสินค้า)', price: 'ราคา (จากคลังสินค้า)', noteLabel: 'ป้ายช่องหมายเหตุ', couponLabel: 'ป้ายช่องโค้ดส่วนลด' }

function Head({ s }: { s: Section }) {
  const rs = ROLE_STYLE[s.origin === 'ai' ? 'ai' : s.role]
  return <div className="flex items-center gap-2"><span className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: rs.bg, color: rs.fg }}><i className={SECTION_ICON[s.type]} /></span><div className="flex-1 min-w-0"><div className="font-bold text-[15px] truncate">{s.name}</div><div className="text-[12px]" style={{ color: rs.fg }}>{rs.label}</div></div></div>
}
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-2"><div className="text-[12px] font-semibold text-ink-600 tracking-[.02em]">{title}</div>{children}</div>
}

/* inherited from the site tokens vs overridden at this spot (B1) */
function TokenRow({ label, site, bg, onChange, disabled, inheritText = 'สืบทอด · ค่ากลาง' }: { label: string; site: SiteDoc; bg: SectionStyle['bg']; onChange?: (bg: SectionStyle['bg']) => void; disabled?: boolean; inheritText?: string }) {
  const hex = tokenHex(site, bg)
  const state = !bg ? 'inherit' : 'token' in bg ? 'token' : 'raw'
  return (
    <Group title={label}>
      <div className="flex items-center gap-2 rounded-lg border border-ink-200 px-2.5 py-2">
        <span className="w-5 h-5 rounded border border-ink-200 flex-none" style={{ background: hex ?? 'repeating-linear-gradient(45deg,#fff 0 4px,#eef0f4 4px 8px)' }} />
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5 text-[13px]"><span className={`w-2 h-2 rounded-full ${state === 'inherit' ? 'bg-orange-500' : state === 'token' ? 'bg-info-500' : 'bg-red-600'}`} />{state === 'inherit' ? inheritText : state === 'token' ? `ใช้ Token · ${(bg as { token: string }).token}` : 'ตั้งทับเฉพาะจุดนี้ · สีดิบ'}</span>
          <span className="block text-[11.5px] text-ink-400 font-display">{hex ?? '—'}</span>
        </span>
        {state !== 'inherit' && onChange && !disabled && <button onClick={() => onChange(undefined)} className="text-[12px] font-semibold text-ink-600 hover:text-ink-900">ใช้ค่ากลาง</button>}
      </div>
      {onChange && !disabled && (
        <div className="flex flex-wrap gap-1.5 items-center">
          {site.tokens.map(t => <button key={t.name} title={`Token · ${t.name} ${t.hex}`} onClick={() => onChange({ token: t.name })} className={`w-6 h-6 rounded-md border ${bg && 'token' in bg && bg.token === t.name ? 'ring-2 ring-offset-1 ring-ink-900 border-white' : 'border-ink-200'}`} style={{ background: t.hex }} />)}
          <label title="สีดิบ (ไม่แนะนำ — ด่านตรวจจะเตือน)" className="w-6 h-6 rounded-md border border-dashed border-ink-300 grid place-items-center text-ink-400 cursor-pointer relative overflow-hidden text-[11px]"><i className="fas fa-eye-dropper" /><input type="color" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => onChange({ hex: e.target.value.toUpperCase() })} /></label>
          <span className="text-[11.5px] text-ink-400">จุดส้ม = สืบทอด · ฟ้า = Token · แดง = สีดิบ</span>
        </div>
      )}
    </Group>
  )
}

/* ---------- ประวัติเวอร์ชัน: who changed what + restore (B1, D1) ---------- */
export function HistoryPanel() {
  const log = useStore(s => s.log); const restore = useStore(s => s.restore)
  const fmt = (t: number) => new Date(t).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return (
    <div className="flex-1 overflow-auto p-4 flex flex-col gap-1.5 text-[13px]">
      <div className="text-[12px] text-ink-500 px-1 pb-1">ทุกการแก้บันทึกลงฉบับร่าง · ย้อนกลับไปจุดไหนก็ได้ · เว็บจริงเปลี่ยนเมื่อกดเผยแพร่เท่านั้น</div>
      {log.length === 0 && <div className="text-ink-400 text-center py-8">ยังไม่มีการแก้ในรอบนี้</div>}
      {log.map((e, i) => (
        <div key={e.id} className={`flex gap-2.5 items-start p-2 rounded-lg ${e.kind === 'publish' ? 'bg-success-50' : 'hover:bg-ink-50'}`}>
          <span className={`w-6 h-6 rounded-full grid place-items-center flex-none text-[11px] ${e.kind === 'publish' ? 'bg-success-600 text-white' : e.actor === 'ผู้ช่วย Ket' ? 'bg-orange-100 text-orange-700' : 'bg-ink-100 text-ink-600'}`}><i className={e.kind === 'publish' ? 'fas fa-paper-plane' : e.actor === 'ผู้ช่วย Ket' ? 'fas fa-magic' : 'fas fa-user'} /></span>
          <div className="flex-1 min-w-0"><div className="font-semibold truncate">{e.label}</div><div className="text-[12px] text-ink-500">{e.actor} · {fmt(e.at)}{i === 0 && e.kind !== 'publish' ? ' · ล่าสุด' : ''}</div></div>
          {i > 0 && e.kind !== 'publish' && <button onClick={() => restore(e.id)} className="text-[12px] font-semibold border border-ink-200 rounded-md px-2 py-0.5 hover:bg-white whitespace-nowrap">ย้อนมาจุดนี้</button>}
        </div>
      ))}
    </div>
  )
}

/* ---------- เผยแพร่: summary + guard checks + a person confirms (D1, D5) ---------- */
export function PublishDialog() {
  const open = useStore(s => s.publishOpen); const set = useStore(s => s.setPublishOpen); const publish = useStore(s => s.publish)
  const draft = useStore(s => s.draft)
  const changes = useChanges()
  if (!open) return null
  const raw: { page: string; name: string; hex: string }[] = []
  for (const p of draft.pages) for (const s of p.sections ?? []) if (s.style?.bg && 'hex' in s.style.bg) raw.push({ page: p.name, name: s.name, hex: s.style.bg.hex })
  const checks = [
    { ok: true, label: 'กรองโค้ดอันตราย', note: 'ไม่มีสคริปต์ในหน้า' },
    { ok: true, label: 'CSS ไม่แตะตัวเลือกระดับเว็บ', note: 'ไม่มี Section AI T1/T2 ในรอบนี้' },
    { ok: raw.length === 0, label: 'ใช้ค่าจากชุดสีกลาง', note: raw.length === 0 ? 'ทุกสีอ้างอิง Token' : raw.map(r => `${r.name} (${r.page}) ใช้สีดิบ ${r.hex}`).join(' · ') },
    { ok: true, label: 'ลำดับหัวข้อและคำอธิบายรูป', note: 'ไม่เสียโครงสร้างการอ่าน' },
    { ok: true, label: 'น้ำหนักไฟล์และความเร็ว', note: 'ไม่มีไฟล์ใหม่' },
    { ok: true, label: 'ไม่เขียนลงช่องที่ล็อก', note: 'ระบบกันไว้ตั้งแต่ตอนแก้' },
  ]
  const blocked = checks.some(c => !c.ok)
  const fixRaw = () => {
    const st = useStore.getState()
    for (const p of draft.pages) for (const s of p.sections ?? []) if (s.style?.bg && 'hex' in s.style.bg) {
      const near = nearestToken(draft, s.style.bg.hex)
      const prev = st.pageId; useStore.setState({ pageId: p.id }); st.setStyle(s.id, { bg: { token: near } }, `เปลี่ยนสีดิบเป็น Token ${near} · ${s.name}`); useStore.setState({ pageId: prev })
    }
  }
  return (
    <div className="fixed inset-0 z-[120] bg-ink-900/40 grid place-items-center p-6" onClick={() => set(false)}>
      <div role="dialog" aria-modal="true" aria-label="เผยแพร่" onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-[520px] max-h-[85vh] overflow-auto shadow-2xl">
        <div className="px-5 pt-5 pb-3 border-b border-ink-100"><div className="font-bold text-[16px]">เผยแพร่ขึ้นเว็บจริง</div><div className="text-[13px] text-ink-500">ตรวจสิ่งที่เปลี่ยนและผลด่านตรวจก่อน — คุณเป็นคนกดเสมอ</div></div>
        <div className="px-5 py-3">
          <div className="text-[13px] font-semibold text-ink-600 mb-1.5">สิ่งที่เปลี่ยน · {changes.length} จุด</div>
          {changes.length === 0 ? <div className="text-[13.5px] text-ink-400 py-2">ฉบับร่างเหมือนเว็บจริงแล้ว ไม่มีอะไรให้เผยแพร่</div> : (
            <div className="flex flex-col gap-1">{changes.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-[13.5px] py-1"><span className={`w-5 h-5 rounded grid place-items-center text-[9px] ${c.kind === 'add' ? 'bg-success-100 text-success-700' : c.kind === 'remove' ? 'bg-red-100 text-red-700' : 'bg-info-100 text-info-700'}`}><i className={c.kind === 'add' ? 'fas fa-plus' : c.kind === 'remove' ? 'fas fa-minus' : c.kind === 'move' ? 'fas fa-arrows-alt-v' : 'fas fa-pen'} /></span><span className="text-ink-500">{c.pageName}</span><span className="font-medium">{c.label}</span></div>
            ))}</div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-ink-100">
          <div className="text-[13px] font-semibold text-ink-600 mb-1.5">ด่านตรวจ</div>
          {checks.map(c => (
            <div key={c.label} className="flex items-start gap-2 text-[13.5px] py-1"><i className={`mt-0.5 ${c.ok ? 'fas fa-check-circle text-success-600' : 'fas fa-exclamation-circle text-red-600'}`} /><span className="flex-1"><b className="font-medium">{c.label}</b><span className="block text-[12.5px] text-ink-500">{c.note}</span></span></div>
          ))}
          {blocked && <button onClick={fixRaw} className="mt-1.5 h-8 px-3 rounded-lg border border-ink-200 text-[13px] font-semibold hover:bg-ink-50"><i className="fas fa-magic mr-1" />แก้ตามที่แนะนำ · เปลี่ยนเป็น Token ที่ใกล้ที่สุด</button>}
        </div>
        <div className="px-5 py-4 border-t border-ink-100 flex gap-2 justify-end bg-ink-50 rounded-b-2xl">
          <button onClick={() => set(false)} className="h-9 px-4 rounded-lg border border-ink-200 bg-white">ยกเลิก</button>
          <button onClick={publish} disabled={changes.length === 0 || blocked} className="h-9 px-4 rounded-lg bg-red-600 text-white font-semibold disabled:opacity-40"><i className="fas fa-paper-plane text-[12px] mr-1.5" />ยืนยันเผยแพร่</button>
        </div>
      </div>
    </div>
  )
}
function nearestToken(site: SiteDoc, hex: string) {
  const rgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
  const [r, g, b] = rgb(hex)
  let best = site.tokens[0].name, bd = Infinity
  for (const t of site.tokens) { const [x, y, z] = rgb(t.hex); const d = (x - r) ** 2 + (y - g) ** 2 + (z - b) ** 2; if (d < bd) { bd = d; best = t.name } }
  return best
}

/* ---------- keyboard: every action works without a mouse (B1) ---------- */
export function useEditorKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t?.closest?.('input,textarea,select,[contenteditable="true"]')) return
      const st = useStore.getState()
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); st.undo() }
      else if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); st.redo() }
      else if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); st.duplicate(st.selected) }
      else if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); st.nudge(st.selected, -1) }
      else if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); st.nudge(st.selected, 1) }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && !st.placing) { e.preventDefault(); st.remove(st.selected) }
      else if (e.key === 'Escape') { if (st.placing) st.startPlacing(null); else if (st.libraryOpen) st.setLibrary(false); else if (st.publishOpen) st.setPublishOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
