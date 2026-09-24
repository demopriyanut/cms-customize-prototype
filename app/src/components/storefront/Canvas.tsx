import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { colSummary, FOOTER_TEXT, hasSub, HEADER_INHERIT, menuLabel, PRODUCTS, ROLE_STYLE, tokenByName, tokenHex, type FooterCol, type Section, type SiteDoc, type Zone, type PageDoc } from '@/data/schema'
import { orderedBlocks, useStore, type Device, type DropTarget } from '@/data/store'
import { useGo, useRoute } from '@/components/shell/nav'
import { useDrag, type Gap } from '@/components/editor/drag'

/* =====================================================================
   Canvas — the storefront preview built from the Page Schema (Blueprint D4).
   - laid out at a real device width then zoomed to the preview width (mobile = real mobile layout)
   - selected block: drag handle at its head + แก้ไข · ทำซ้ำ · ซ่อน · ลบ (+ ↑↓ for keyboard / no-drag use)
   - Header / Footer are site-level: locked here, edited in their own screens
   - L1 zones show as "ช่องบน / ช่องล่าง · แทรกได้"; system blocks can change values but not move
   - drag shows a drop line; dropping where it is not allowed explains why and where it is allowed
   - library placement mode shows "วางที่นี่" slots only where dropping is allowed
   ===================================================================== */

export const REAL_W: Record<Device, number> = { desktop: 1240, tablet: 820, mobile: 390 }

interface Props { site: SiteDoc; page: PageDoc; device: Device; previewWidth: number; accent?: string }

export function Canvas({ site, page, device, previewWidth, accent = 'var(--red-600)' }: Props) {
  const zoom = previewWidth / REAL_W[device]
  const preview = useStore(s => s.preview)
  const placing = useStore(s => s.placing)
  const blocks = orderedBlocks(site, page)
  const rootRef = useRef<HTMLDivElement>(null)
  const drag = useDrag(rootRef, '[data-block]')
  const overlays = !preview
  const ctx: Ctx = { site, device, zoom, accent, overlays, drag }

  /* build the render list: blocks + empty-zone placeholders + placement slots */
  const items: ReactNode[] = []
  const zones = page.zones ?? []
  const pushSlot = (zone: Zone, index: number, key: string) => {
    if (placing && zone.insert) items.push(<PlaceSlot key={key} to={{ zone: zone.id, index }} zoom={zoom} />)
  }
  items.push(<Block key={site.header.id} s={site.header} zone={null} index={0} ctx={ctx} />)
  for (const z of zones) {
    const inZone = blocks.filter(b => b.zone?.id === z.id)
    if (inZone.length === 0) {
      if (placing && z.insert) pushSlot(z, 0, `slot-${z.id}-0`)
      else items.push(<ZonePlaceholder key={`zp-${z.id}`} zone={z} zoom={zoom} overlays={overlays} empty={page.lock === 'L0'} />)
      continue
    }
    const hasZoneFrame = page.lock === 'L1' && z.insert
    const zoneItems: ReactNode[] = []
    inZone.forEach((b, i) => {
      if (placing && z.insert) zoneItems.push(<PlaceSlot key={`slot-${z.id}-${i}`} to={{ zone: z.id, index: i }} zoom={zoom} />)
      zoneItems.push(<Block key={b.s.id} s={b.s} zone={z} index={i} ctx={ctx} />)
    })
    if (placing && z.insert) zoneItems.push(<PlaceSlot key={`slot-${z.id}-end`} to={{ zone: z.id, index: inZone.length }} zoom={zoom} />)
    items.push(hasZoneFrame && overlays
      ? <div key={`zf-${z.id}`} style={{ position: 'relative', outline: `${2 / zoom}px dashed ${ROLE_STYLE.slot.color}`, outlineOffset: -2 / zoom, background: 'rgba(46,144,250,.04)' }}><ZoneTag zone={z} zoom={zoom} />{zoneItems}</div>
      : <div key={`z-${z.id}`}>{zoneItems}</div>)
  }
  items.push(<Block key={site.footer.id} s={site.footer} zone={null} index={0} ctx={ctx} />)

  return (
    <div ref={rootRef} style={{ width: previewWidth }} onClick={() => useStore.getState().setEditing(null)}>
      <div style={{ width: REAL_W[device], zoom, background: '#fff', fontFamily: "'Prompt',sans-serif", color: '#222', position: 'relative' } as CSSProperties}>
        {items}
      </div>
      {drag.state && <DragOverlay gap={drag.state.gap} label={drag.state.label} x={drag.state.x} y={drag.state.y} line={drag.state.line} />}
    </div>
  )
}

interface Ctx { site: SiteDoc; device: Device; zoom: number; accent: string; overlays: boolean; drag: ReturnType<typeof useDrag> }
const px = (n: number, z: number) => `${n / z}px`

function ZoneTag({ zone, zoom }: { zone: Zone; zoom: number }) {
  return <span style={{ position: 'absolute', right: px(8, zoom), top: px(-9, zoom), zIndex: 4, fontSize: px(11, zoom), fontWeight: 600, fontFamily: 'var(--font-heading)', background: ROLE_STYLE.slot.bg, color: ROLE_STYLE.slot.fg, padding: `${px(2, zoom)} ${px(7, zoom)}`, borderRadius: px(5, zoom) }}>{zone.label}</span>
}

function ZonePlaceholder({ zone, zoom, overlays, empty }: { zone: Zone; zoom: number; overlays: boolean; empty: boolean }) {
  const setLibrary = useStore(s => s.setLibrary)
  if (!overlays) return <div style={{ height: 40 }} />
  if (!zone.insert) return (
    <div data-block="" data-zone={zone.id} data-closed="1" data-reason={`ช่องนี้${zone.closedNote ?? 'ปิดอยู่'}`} style={{ margin: '12px 16px', padding: 18, border: `${2 / zoom}px dashed var(--ink-300)`, textAlign: 'center', color: 'var(--ink-500)', fontSize: px(12, zoom), fontFamily: 'var(--font-heading)' }}>
      <i className="fas fa-lock" /> {zone.label} · {zone.closedNote}
    </div>
  )
  return (
    <div data-block="" data-zone={zone.id} data-index="0" data-empty="1" style={{ margin: empty ? '24px 16px' : '12px 16px', padding: empty ? 56 : 22, border: `${2 / zoom}px dashed ${ROLE_STYLE.slot.color}`, background: 'rgba(46,144,250,.05)', textAlign: 'center', color: ROLE_STYLE.slot.fg, fontFamily: 'var(--font-heading)', fontSize: px(12.5, zoom), borderRadius: px(8, zoom) }}>
      {empty ? <>
        <div style={{ fontSize: px(15, zoom), fontWeight: 700, color: 'var(--ink-900)', marginBottom: px(4, zoom) }}>หน้านี้ยังไม่มีบล็อก</div>
        <div style={{ color: 'var(--ink-500)', marginBottom: px(12, zoom) }}>เลือกจากคลังแล้วคลิกวาง หรือพิมพ์สั่งผู้ช่วย Ket ให้จัดให้</div>
      </> : <div style={{ fontWeight: 600, marginBottom: px(8, zoom) }}>{zone.label}</div>}
      <button onClick={e => { e.stopPropagation(); setLibrary(true) }} style={{ fontSize: px(12, zoom), fontWeight: 600, padding: `${px(6, zoom)} ${px(12, zoom)}`, borderRadius: px(8, zoom), background: '#fff', border: `${1 / zoom}px solid var(--ink-200)`, color: 'var(--ink-900)' }}>
        <i className="fas fa-plus" /> เพิ่ม Section จากคลัง
      </button>
    </div>
  )
}

function PlaceSlot({ to, zoom }: { to: DropTarget; zoom: number }) {
  const place = useStore(s => s.place)
  return (
    <button data-place-slot="" onClick={e => { e.stopPropagation(); place(to) }}
      className="place-slot"
      style={{ display: 'block', width: `calc(100% - ${px(24, zoom)})`, margin: `${px(4, zoom)} auto`, height: px(32, zoom), border: `${2 / zoom}px dashed var(--info-500)`, borderRadius: px(8, zoom), background: 'rgba(46,144,250,.08)', color: 'var(--info-700)', fontFamily: 'var(--font-heading)', fontSize: px(12.5, zoom), fontWeight: 600 }}>
      <i className="fas fa-plus" /> วางที่นี่
    </button>
  )
}

function DragOverlay({ gap, label, x, y, line }: { gap: Gap | null; label: string; x: number; y: number; line: { top: number; left: number; width: number } | null }) {
  const ok = !!gap?.target
  return (
    <>
      {line && <div style={{ position: 'fixed', left: line.left, top: line.top - 1.5, width: line.width, height: 3, background: ok ? 'var(--info-500)' : 'var(--red-600)', borderRadius: 2, zIndex: 80, pointerEvents: 'none', boxShadow: '0 0 0 3px rgba(255,255,255,.8)' }}><span style={{ position: 'absolute', left: -5, top: -3.5, width: 10, height: 10, borderRadius: '50%', background: ok ? 'var(--info-500)' : 'var(--red-600)' }} /></div>}
      <div style={{ position: 'fixed', left: x + 14, top: y + 10, zIndex: 90, pointerEvents: 'none', fontFamily: 'var(--font-heading)', fontSize: 12, maxWidth: 320 }}>
        <div style={{ background: 'var(--ink-900)', color: '#fff', borderRadius: 8, padding: '6px 10px', boxShadow: 'var(--shadow-xl)', fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center' }}><i className="fas fa-grip-vertical" style={{ opacity: .6 }} />{label}</div>
        <div style={{ marginTop: 4, background: ok ? 'var(--info-100)' : 'var(--red-50)', color: ok ? 'var(--info-700)' : 'var(--red-700)', border: `1px solid ${ok ? 'var(--info-500)' : 'var(--red-300)'}`, borderRadius: 8, padding: '5px 9px', lineHeight: 1.45 }}>
          {ok ? <>วางตรงนี้ได้ · {gap!.zoneLabel}</> : <><b>วางตรงนี้ไม่ได้</b> — {gap?.reason ?? 'นอกพื้นที่หน้า'}<br />{gap?.allowed && <>วางได้ที่: {gap.allowed}</>}</>}
        </div>
      </div>
    </>
  )
}

/* ---------- a block with its frame ---------- */
function Block({ s, zone, index, ctx }: { s: Section; zone: Zone | null; index: number; ctx: Ctx }) {
  const selected = useStore(st => st.selected)
  const select = useStore(st => st.select)
  const placing = useStore(st => st.placing)
  const sel = selected === s.id && ctx.overlays && !placing
  const z = ctx.zoom
  if (s.hidden && !ctx.overlays) return null
  if (s.style?.hideOn?.includes(ctx.device) && !ctx.overlays) return null
  const hiddenHere = s.hidden || s.style?.hideOn?.includes(ctx.device)
  const role = s.origin === 'ai' ? 'ai' : s.role
  const rs = ROLE_STYLE[role]
  const outline = !ctx.overlays ? 'none' : sel ? `${px(2, z)} solid ${s.role === 'free' && !s.origin ? ctx.accent : rs.color}` : s.role === 'free' && !s.origin ? `${px(1, z)} dashed rgba(19,21,27,.25)` : `${px(1.5, z)} ${s.role === 'global' ? 'solid' : 'dashed'} ${rs.color}`
  const bg = tokenHex(ctx.site, s.style?.bg)
  const pad = s.style?.spacing === 'S' ? 0.6 : s.style?.spacing === 'L' ? 1.6 : 1
  return (
    <div data-block="" data-id={s.id} data-zone={zone?.id ?? 'site'} data-index={index} data-role={s.role}
      data-reason={s.role === 'global' ? `${s.name} ใช้ร่วมทุกหน้า แก้ที่ตั้งค่ากลาง` : s.role === 'system' ? 'บล็อกหลักของระบบ ย้าย/แทรกทับไม่ได้' : ''}
      onClick={e => { e.stopPropagation(); if (!placing) select(s.id) }}
      style={{ position: s.type === 'header' && s.data.sticky === 'yes' && !ctx.overlays ? 'sticky' : 'relative', top: 0, zIndex: s.type === 'header' && !ctx.overlays ? 10 : undefined, outline, outlineOffset: px(-2, z), cursor: placing ? 'default' : 'pointer', opacity: hiddenHere && ctx.overlays ? 0.35 : 1, background: s.origin === 'ai' && ctx.overlays ? 'var(--orange-50)' : undefined, filter: hiddenHere && ctx.overlays ? 'grayscale(1)' : undefined }}>
      {ctx.overlays && (sel ? <SelBar s={s} ctx={ctx} /> : s.type !== 'marquee' || s.role !== 'free' ? <Chip s={s} z={z} /> : null)}
      {hiddenHere && ctx.overlays && <span style={{ position: 'absolute', right: px(8, z), top: px(6, z), zIndex: 5, fontSize: px(11, z), fontFamily: 'var(--font-heading)', background: 'var(--ink-900)', color: '#fff', borderRadius: px(5, z), padding: `${px(2, z)} ${px(6, z)}` }}><i className="far fa-eye-slash" /> {s.hidden ? 'ซ่อนอยู่' : 'ซ่อนบนจอนี้'}</span>}
      <Body s={s} ctx={ctx} bg={bg} pad={pad} />
    </div>
  )
}

function Chip({ s, z }: { s: Section; z: number }) {
  const role = s.origin === 'ai' ? 'ai' : s.role
  const rs = ROLE_STYLE[role]
  return (
    <div style={{ position: 'absolute', left: px(8, z), top: px(s.role === 'global' ? 6 : -9, z), zIndex: 5, display: 'flex', gap: px(4, z), alignItems: 'center', fontSize: px(11, z), fontWeight: 600, fontFamily: 'var(--font-heading)', pointerEvents: 'none' }}>
      <span style={{ background: s.role === 'free' && !s.origin ? 'var(--ink-700)' : rs.color, color: '#fff', padding: `${px(2, z)} ${px(7, z)}`, borderRadius: px(5, z) }}>{s.origin === 'ai' ? `+ ${s.name}` : s.name}</span>
      <span style={{ background: rs.bg, color: rs.fg, padding: `${px(2, z)} ${px(6, z)}`, borderRadius: px(5, z), display: 'inline-flex', gap: px(4, z), alignItems: 'center' }}>
        {s.role !== 'free' && <i className="fas fa-lock" style={{ fontSize: px(8, z) }} />}
        {s.origin === 'ai' ? 'ฉบับร่าง · T0' : rs.label}
      </span>
    </div>
  )
}

/* selected: handle at the head (D4) + actions */
function SelBar({ s, ctx }: { s: Section; ctx: Ctx }) {
  const z = ctx.zoom
  const st = useStore.getState
  const { version } = useRoute(); const go = useGo()
  const free = s.role === 'free'
  const color = free ? (s.origin ? ROLE_STYLE.ai.color : ctx.accent) : ROLE_STYLE[s.role].color
  const btn = (icon: string, title: string, onClick: () => void, extra?: CSSProperties, text?: string) => (
    <button key={title} title={title} aria-label={title} onClick={e => { e.stopPropagation(); onClick() }} style={{ height: px(26, z), padding: `0 ${px(8, z)}`, display: 'inline-flex', gap: px(5, z), alignItems: 'center', borderRadius: px(6, z), color: '#fff', fontSize: px(12, z), fontWeight: 600, ...extra }}><i className={icon} />{text}</button>
  )
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, transform: s.type === 'header' ? undefined : `translateY(-100%)`, zIndex: 6, display: 'flex', alignItems: 'center', gap: px(2, z), background: color, padding: `${px(2, z)} ${px(4, z)}`, fontFamily: 'var(--font-heading)', minHeight: px(32, z) }}>
      {free
        ? <span title="ลากเพื่อย้าย" aria-label="ลากเพื่อย้าย" onPointerDown={e => ctx.drag.start(e, s.id, s.name)} style={{ cursor: 'grab', height: px(26, z), padding: `0 ${px(8, z)}`, display: 'inline-flex', alignItems: 'center', gap: px(6, z), color: '#fff', fontSize: px(12.5, z), fontWeight: 700, touchAction: 'none' }}><i className="fas fa-grip-vertical" />☰ {s.name}</span>
        : <span style={{ color: '#fff', fontSize: px(12.5, z), fontWeight: 700, padding: `0 ${px(8, z)}`, display: 'inline-flex', gap: px(6, z), alignItems: 'center' }}><i className="fas fa-lock" />{s.name} · {s.role === 'global' ? 'ใช้ร่วมทุกหน้า แก้ที่ตั้งค่ากลาง' : 'บล็อกของระบบ ปรับค่าได้ ย้ายไม่ได้'}</span>}
      <span style={{ flex: 1 }} />
      {free && btn('fas fa-magic', 'ปรับด้วยผู้ช่วย', () => { st().setPanel('ai', 'open'); st().showToast('ส่ง “' + s.name + '” ให้ผู้ช่วย Ket เป็นบริบทแล้ว') }, { background: 'linear-gradient(135deg,var(--red-600),var(--orange-500))' })}
      {s.role !== 'global' && btn('fas fa-cog', 'แก้ไข', () => { st().setPanel('props', 'open'); st().setPanel('a', 'props'); st().setPanel('b', 'props'); st().setPanel('c', 'props') }, undefined, 'แก้ไข')}
      {free && btn('far fa-clone', 'ทำซ้ำ', () => st().duplicate(s.id), undefined, 'ทำซ้ำ')}
      {free && btn(s.hidden ? 'far fa-eye' : 'far fa-eye-slash', s.hidden ? 'แสดง' : 'ซ่อน', () => st().toggleHidden(s.id), undefined, s.hidden ? 'แสดง' : 'ซ่อน')}
      {free && btn('far fa-trash-alt', 'ลบ', () => st().remove(s.id), undefined, 'ลบ')}
      {free && btn('fas fa-arrow-up', 'ย้ายขึ้น (Alt+↑)', () => st().nudge(s.id, -1))}
      {free && btn('fas fa-arrow-down', 'ย้ายลง (Alt+↓)', () => st().nudge(s.id, 1))}
      {s.role === 'global' && version && btn('fas fa-external-link-alt', `ไปแก้ที่ ${s.name}`, () => go.to(version.id, s.type === 'header' ? 'header' : 'footer'), { background: 'rgba(255,255,255,.15)' }, `ไปแก้ที่ ${s.name}`)}
    </div>
  )
}

/* ---------- inline text: double-click to edit (D4) ---------- */
function Txt({ s, field, style, as = 'div' }: { s: Section; field: string; style?: CSSProperties; as?: 'div' | 'span' }) {
  const editing = useStore(st => st.editing)
  const key = `${s.id}:${field}`
  const on = editing === key
  const Tag = as
  const editable = s.role !== 'global' && s.type !== 'product-info'
  return (
    <Tag
      data-edit={field}
      contentEditable={on}
      suppressContentEditableWarning
      onDoubleClick={e => {
        e.stopPropagation()
        const st = useStore.getState()
        if (st.preview || st.compare === 'before') return
        if (!editable) return st.showToast(s.role === 'global' ? `${s.name} ใช้ร่วมทุกหน้า — แก้ที่หน้า ${s.name}` : 'ข้อมูลสินค้ามาจากคลังสินค้า — แก้ที่ Product Manager · ที่นี่ปรับการแสดงผลได้')
        st.select(s.id); st.setEditing(key)
        setTimeout(() => { const el = document.querySelector(`[data-id="${s.id}"] [data-edit="${field}"]`) as HTMLElement | null; el?.focus(); if (el) { const r = document.createRange(); r.selectNodeContents(el); const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(r) } })
      }}
      onKeyDown={e => { if (on && (e.key === 'Enter' && !e.shiftKey)) { e.preventDefault(); (e.target as HTMLElement).blur() } if (on && e.key === 'Escape') { (e.target as HTMLElement).textContent = s.data[field]; (e.target as HTMLElement).blur() } }}
      onBlur={e => { if (!on) return; useStore.getState().setEditing(null); useStore.getState().setField(s.id, field, (e.target as HTMLElement).textContent ?? '') }}
      title={editable ? 'ดับเบิลคลิกเพื่อแก้ข้อความ' : undefined}
      style={{ outline: on ? '2px solid var(--orange-500)' : undefined, outlineOffset: 2, cursor: editable ? 'text' : undefined, ...style }}>
      {s.data[field]}
    </Tag>
  )
}

function Body({ s, ctx, bg, pad }: { s: Section; ctx: Ctx; bg: string | null; pad: number }) {
  const m = ctx.device === 'mobile'
  const t = ctx.device === 'tablet'
  switch (s.type) {
    case 'header': return <HeaderBody s={s} site={ctx.site} device={ctx.device} zoom={ctx.zoom} />
    case 'marquee': return (
      <div style={{ padding: `${16 * pad}px 0`, background: bg ?? undefined, fontSize: m ? 16 : 20, letterSpacing: '.28em', whiteSpace: 'nowrap', overflow: 'hidden', color: '#111', fontWeight: 500, display: 'flex', gap: '1em' }}>
        {Array.from({ length: 5 }, (_, i) => i === 0 ? <span key={i}>• <Txt s={s} field="text" as="span" /></span> : <span key={i}>• {s.data.text}</span>)}
      </div>
    )
    case 'hero': {
      const dark = s.data.panelBg === '#B07A55'
      const panel = (
        <div style={{ background: s.data.panelBg, color: dark ? '#fff' : '#222', boxShadow: '0 12px 48px rgba(0,0,0,.12)', padding: m ? '24px 20px' : '32px 28px', display: 'flex', flexDirection: 'column', gap: 12, ...(m ? {} : { position: 'absolute', right: 0, top: 40, width: '56%', minHeight: 340 }) }}>
          <Txt s={s} field="tag" as="span" style={{ alignSelf: 'flex-start', background: dark ? '#fff' : '#c8522e', color: dark ? '#B07A55' : '#fff', fontSize: 13, padding: '4px 10px', letterSpacing: '.05em', fontWeight: 600 }} />
          <Txt s={s} field="title" style={{ fontFamily: 'Georgia,serif', fontSize: m ? 30 : 38, lineHeight: 1.1, letterSpacing: '.02em' }} />
          <Txt s={s} field="body" style={{ fontSize: m ? 14 : 13, color: dark ? 'rgba(255,255,255,.85)' : '#555', lineHeight: 1.5 }} />
          <Txt s={s} field="cta" style={{ marginTop: 'auto', alignSelf: 'flex-end', fontSize: 16, textDecoration: 'underline', fontWeight: 500 }} />
        </div>
      )
      const img = <div style={{ background: 'linear-gradient(160deg,#d9b493 0%,#b07a55 45%,#5e3b28 100%)', display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.7)', ...(m ? { height: 300 } : { position: 'absolute', left: 0, top: 0, width: '60%', height: '100%' }) }}><i className="far fa-image" style={{ fontSize: m ? 44 : 56 }} /></div>
      return (
        <div style={{ padding: `${12 * pad}px ${m ? 12 : 16}px ${24 * pad}px`, background: bg ?? undefined }}>
          {m ? <div>{img}{panel}</div> : <div style={{ position: 'relative', height: 420 }}>{img}{panel}<div style={{ position: 'absolute', left: '28%', bottom: 8, display: 'flex', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#222' }} /><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#bbb' }} /></div></div>}
        </div>
      )
    }
    case 'products': {
      const cols = m || t ? 2 : 4
      return (
        <div style={{ padding: `${24 * pad}px ${m ? 12 : 16}px ${28 * pad}px`, background: bg ?? undefined }}>
          <Txt s={s} field="title" style={{ textAlign: 'center', fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: m ? 28 : 40, letterSpacing: '-.01em', marginBottom: 20 }} />
          {!s.origin && (
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 999, padding: '10px 12px 10px 24px', gap: 16, marginBottom: 24, background: '#fff' }}>
              <i className="fas fa-search" style={{ fontSize: 16, color: '#666' }} /><span style={{ flex: 1, fontSize: 15, color: '#999' }}>สำรวจด้วย Ai</span>
              <span style={{ border: '1px solid #f0b400', borderRadius: 999, padding: '6px 16px', fontSize: 14, fontWeight: 600, display: 'inline-flex', gap: 8, alignItems: 'center', background: '#fff' }}><i className="fas fa-magic" style={{ color: '#7c3aed', fontSize: 13 }} />ค้นหาด้วย Ai</span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},minmax(0,1fr))`, gap: 16 }}>
            {PRODUCTS.map(p => (
              <div key={p.name} style={{ border: '1px solid #eee', position: 'relative', background: '#fff' }}>
                <span style={{ position: 'absolute', left: 0, top: 0, background: '#111', color: '#fff', fontSize: 11, padding: '4px 8px', fontWeight: 600, letterSpacing: '.03em' }}>{s.data.badge}</span>
                <div style={{ height: m ? 150 : 172, background: p.bg, display: 'grid', placeItems: 'center', color: 'rgba(0,0,0,.25)' }}><i className="fas fa-tshirt" style={{ fontSize: 40 }} /></div>
                <div style={{ padding: 12, fontSize: 15, lineHeight: 1.3 }}><div style={{ fontWeight: 500 }}>{p.name}</div><div style={{ color: '#c8522e', fontWeight: 600, marginTop: 4 }}>{p.price}</div></div>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'benefit': return (
      <div style={{ padding: `${4 * pad}px ${m ? 12 : 16}px ${24 * pad}px`, background: bg ?? undefined }}>
        <div style={{ height: m ? 140 : 180, background: 'linear-gradient(180deg,#9a9a9a,#c9c9c9 60%,#e2e2e2)', display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.8)' }}><i className="far fa-image" style={{ fontSize: 48 }} /></div>
      </div>
    )
    case 'library': return (
      <div style={{ padding: `${28 * pad}px ${m ? 16 : 28}px`, background: bg ?? '#f7f8fa', display: 'flex', alignItems: 'center', gap: 20, color: '#555', fontFamily: 'var(--font-heading)' }}>
        <span style={{ width: 64, height: 64, borderRadius: 12, background: '#fff', border: '1px dashed #bbb', display: 'grid', placeItems: 'center', fontSize: 26, color: '#999', flex: 'none' }}><i className={s.data.icon} /></span>
        <div><div style={{ fontSize: 20, fontWeight: 700, color: '#222' }}>{s.name}</div><div style={{ fontSize: 14 }}>บล็อกตัวอย่างจากคลัง · ใส่เนื้อหาจริงที่แผงคุณสมบัติ</div></div>
      </div>
    )
    case 'product-info': return (
      <div style={{ padding: m ? 16 : 28, display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 28 }}>
        <div style={{ height: m ? 320 : 460, background: '#f6dfe6', display: 'grid', placeItems: 'center', color: 'rgba(0,0,0,.25)' }}><i className="fas fa-tshirt" style={{ fontSize: 64 }} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontWeight: 600, color: '#134083', fontSize: 28 }}>{s.data.name}</div>
          <div style={{ fontSize: 16, color: '#5e5e5e' }}>{s.data.desc}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}><span style={{ fontSize: 36, fontWeight: 700, color: '#000' }}>{s.data.price}</span>{s.data.showCompare === 'yes' && <span style={{ fontSize: 18, color: '#b0b0b0', textDecoration: 'line-through' }}>{s.data.compare}</span>}</div>
          <Txt s={{ ...s, type: 'library' }} field="cta" style={{ marginTop: 12, background: tokenHex(ctx.site, s.style?.bg) ?? '#134083', color: '#fff', textAlign: 'center', borderRadius: 8, padding: 14, fontSize: 18, fontWeight: 600 }} />
        </div>
      </div>
    )
    case 'cart': {
      const btn = tokenHex(ctx.site, s.style?.bg) ?? '#134083'
      return (
        <div style={{ padding: m ? 16 : 32, display: 'grid', gridTemplateColumns: m ? '1fr' : '1.6fr 1fr', gap: 28 }}>
          <div>
            <Txt s={s} field="title" style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }} />
            {PRODUCTS.slice(0, 2).map(p => (
              <div key={p.name} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #eee' }}>
                <span style={{ width: 72, height: 72, background: p.bg, display: 'grid', placeItems: 'center', color: 'rgba(0,0,0,.25)', flex: 'none' }}><i className="fas fa-tshirt" style={{ fontSize: 24 }} /></span>
                <span style={{ flex: 1, fontSize: 16 }}>{p.name}</span><span style={{ fontSize: 16, border: '1px solid #ddd', padding: '4px 12px' }}>1</span><span style={{ fontSize: 16, fontWeight: 600, width: 90, textAlign: 'right' }}>{p.price}</span>
              </div>
            ))}
            {s.data.showNote === 'yes' && <div style={{ marginTop: 16 }}><Txt s={s} field="noteLabel" style={{ fontSize: 14, color: '#555', marginBottom: 6 }} /><div style={{ height: 64, border: '1px solid #ddd' }} /></div>}
          </div>
          <div style={{ background: '#f7f8fa', padding: 20, display: 'flex', flexDirection: 'column', gap: 12, alignSelf: 'start' }}>
            {s.data.showCoupon === 'yes' && <div><Txt s={s} field="couponLabel" style={{ fontSize: 14, color: '#555', marginBottom: 6 }} /><div style={{ display: 'flex', gap: 8 }}><div style={{ flex: 1, height: 40, border: '1px solid #ddd', background: '#fff' }} /><span style={{ padding: '0 14px', display: 'grid', placeItems: 'center', border: '1px solid #ddd', background: '#fff', fontSize: 14 }}>ใช้</span></div></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}><span>รวม</span><b>฿1,280</b></div>
            <Txt s={s} field="cta" style={{ background: btn, color: '#fff', textAlign: 'center', borderRadius: 8, padding: 14, fontSize: 17, fontWeight: 600 }} />
          </div>
        </div>
      )
    }
    case 'footer': return <FooterBody s={s} site={ctx.site} device={ctx.device} zoom={ctx.zoom} edit={ctx.overlays} />
  }
}


/* =====================================================================
   Header — one renderer for the storefront canvas and the Header screens (1h / 1i / 3c).
   Reads the site-level settings: Layout · Top bar · ตัวอักษรเมนู · สี (inherit Token vs override) ·
   มือถือยุบเป็น ☰ · โปร่งใสทับแบนเนอร์ · Sticky (applies in พรีวิว, where the page scrolls).
   Hot-zones (Header screens only): TOP BAR / โลโก้ / Navigation / ค้นหา & ตะกร้า — click = jump to its settings.
   ===================================================================== */
export type HZone = 'topbar' | 'logo' | 'nav' | 'actions'
export const HZONE_LABEL: Record<HZone, string> = { topbar: 'TOP BAR', logo: 'โลโก้', nav: 'Navigation', actions: 'ค้นหา & ตะกร้า' }
export interface HotZones { active: HZone | null; onZone: (z: HZone) => void; color: string; look: 'a' | 'b' | 'c' }

/* mockup menu size "12 px" is read off previews drawn at ~¾ of the real storefront → ×4/3 at real width */
const menuPx = (v: string | undefined) => Number(v || 12) * 4 / 3

function HeaderBody({ s, site, device, zoom, hot }: { s: Section; site: SiteDoc; device: Device; zoom: number; hot?: HotZones }) {
  const d = s.data
  const m = device === 'mobile', t = device === 'tablet'
  const bg = tokenHex(site, s.style?.bg) ?? tokenByName(site, HEADER_INHERIT.bg)
  const fg = tokenHex(site, s.style?.fg) ?? tokenByName(site, HEADER_INHERIT.fg)
  const transparent = d.transparent === 'yes'
  const collapse = m && d.mobileMenu !== 'no'
  const layout = d.layout || 'standard'
  const fs = menuPx(d.menuSize) * (t ? 0.85 : m ? 0.9 : 1)
  const font = d.menuFont === 'Poppins' ? "'Poppins',sans-serif" : "'Prompt',sans-serif"

  const Z = ({ zone, children, style, tagSide = 'left', tagTop }: { zone: HZone; children: ReactNode; style?: CSSProperties; tagSide?: 'left' | 'right'; tagTop?: boolean }) => {
    if (!hot) return <div style={style}>{children}</div>
    const on = hot.active === zone
    const soft = on && hot.look !== 'a' && zone !== 'topbar'
    const label = !on ? HZONE_LABEL[zone] : hot.look === 'a' ? `${HZONE_LABEL[zone].toUpperCase()} · กำลังแก้` : hot.look === 'c' ? `${HZONE_LABEL[zone]} · กำลังแก้` : HZONE_LABEL[zone]
    const tagStyle: CSSProperties = tagTop
      ? { position: 'absolute', left: px(8, zoom), top: 0, borderRadius: `0 0 ${px(5, zoom)} ${px(5, zoom)}` }
      : { position: 'absolute', [tagSide]: px(-6, zoom), top: px(-28, zoom), borderRadius: px(6, zoom) }
    return (
      <div data-hz={zone} data-hz-on={on ? '' : undefined} data-hz-look={hot.look} role="button" tabIndex={0} aria-pressed={on} aria-label={`ตั้งค่า ${HZONE_LABEL[zone]}`}
        onClick={e => { e.stopPropagation(); hot.onZone(zone) }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hot.onZone(zone) } }}
        style={{ position: 'relative', cursor: 'pointer',
          outline: on ? `${px(2, zoom)} solid ${hot.color}` : `${px(1, zoom)} dashed ${zone === 'topbar' ? 'rgba(255,255,255,.55)' : 'rgba(19,21,27,.35)'}`,
          outlineOffset: zone === 'topbar' ? px(-4, zoom) : soft ? 0 : px(6, zoom), borderRadius: soft ? px(10, zoom) : undefined,
          ...(soft ? { background: 'rgba(255,255,255,.55)', padding: `${px(8, zoom)} ${px(12, zoom)}`, margin: `${px(-8, zoom)} ${px(-12, zoom)}` } : {}), ...style }}>
        <span className="hz-tag" style={{ ...tagStyle, zIndex: 3, whiteSpace: 'nowrap', fontFamily: 'var(--font-heading)', fontSize: px(11, zoom), fontWeight: 700, letterSpacing: 0, textTransform: 'none', lineHeight: 1.4,
          background: on ? hot.color : 'var(--ink-900)', color: '#fff', padding: `${px(2, zoom)} ${px(7, zoom)}`, display: 'inline-flex', gap: px(5, zoom), alignItems: 'center' }}>
          {label}{on && hot.look === 'b' && <i className="fas fa-cog" style={{ fontSize: px(9, zoom) }} />}{on && hot.look !== 'a' && <i className="fas fa-magic" style={{ fontSize: px(9, zoom) }} />}
        </span>
        {children}
      </div>
    )
  }

  const topbar = d.topbar === 'no'
    ? (hot ? <Z zone="topbar" tagTop style={{ background: 'var(--ink-100)', color: 'var(--ink-500)', fontSize: 15, padding: '8px 24px 8px 120px', fontFamily: 'var(--font-heading)' }}><i className="far fa-eye-slash" /> Top bar ซ่อนอยู่</Z> : null)
    : <Z zone="topbar" tagTop style={{ background: '#6b5343', color: '#fff', fontSize: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: m ? '8px 16px' : '10px 24px' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginLeft: hot ? 104 : 0 }}><i className="fab fa-facebook-square" /><i className="fab fa-line" />{!m && <><i className="fas fa-envelope" /><i className="fas fa-phone" /><span>{d.phone}</span></>}</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><i className="fas fa-user" style={{ fontSize: 15 }} />{!m && <>User Account <i className="fas fa-caret-down" /></>}</div>
      </Z>

  const logo = <Z zone="logo" tagSide={m ? 'right' : 'left'} style={{ fontFamily: 'Georgia,serif', fontSize: m ? 22 : 30, letterSpacing: '.06em', fontWeight: 700, color: fg, whiteSpace: 'nowrap' }}>{d.logo}</Z>
  const navList = (
    <div style={{ display: 'flex', gap: t ? 16 : 22, fontSize: fs, fontFamily: font, textTransform: d.menuUpper === 'no' ? 'none' : 'uppercase', letterSpacing: '.02em', color: fg, alignItems: 'center', flexWrap: m ? 'nowrap' : 'wrap', whiteSpace: 'nowrap' }}>
      {(site.menu ?? []).filter(n => n.showOn[device]).map(n => n.iconOnly ? <i key={n.id} className="fas fa-search" title={menuLabel(n)} /> : <span key={n.id}>{menuLabel(n)}{hasSub(n) ? ' ▾' : ''}</span>)}
    </div>
  )
  const nav = collapse ? <Z zone="nav"><i className="fas fa-bars" style={{ fontSize: 22, color: fg }} /></Z> : <Z zone="nav">{navList}</Z>
  const actions = (
    <Z zone="actions" tagSide="right" style={{ display: 'flex', gap: m ? 14 : 16, fontSize: m ? 19 : 18, color: fg, alignItems: 'center', whiteSpace: 'nowrap' }}>
      <i className="fas fa-search" />{!m && <i className="far fa-user" />}<span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><i className="fas fa-shopping-bag" />{!m && '(0)'}</span>
    </Z>
  )

  const padY = hot ? 38 / zoom : 16          // hot-zone mode leaves room (on screen) for the zone tags above logo / menu
  const padB = hot ? 22 / zoom : 16
  const barPad = m ? `${hot ? padY : 14}px 16px ${hot ? padB : 14}px` : `${padY}px 28px ${padB}px`
  let bar: ReactNode
  if (m) bar = (
    <div style={{ padding: barPad }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>{collapse && nav}{logo}{actions}</div>
      {!collapse && <div style={{ marginTop: hot ? 38 / zoom : 12, overflowX: 'auto' }}>{nav}</div>}
    </div>
  )
  else if (layout === 'center') bar = <div style={{ padding: barPad, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 20 }}><div style={{ justifySelf: 'start' }}>{nav}</div>{logo}<div style={{ justifySelf: 'end' }}>{actions}</div></div>
  else if (layout === 'left') bar = <div style={{ padding: barPad, display: 'flex', alignItems: 'center', gap: 40 }}>{logo}{nav}<div style={{ marginLeft: 'auto' }}>{actions}</div></div>
  else if (layout === 'stacked') bar = <div style={{ padding: barPad, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: hot ? 40 / zoom : 14, position: 'relative' }}>{logo}{nav}<div style={{ position: 'absolute', right: 28, top: padY + 8 }}>{actions}</div></div>
  else bar = <div style={{ padding: barPad, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>{logo}{nav}{actions}</div>

  return (
    <div style={{ position: 'relative' }}>
      {topbar}
      <div style={transparent ? { position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 3 } : { background: bg }}>{bar}</div>
    </div>
  )
}

/* Header screens: the real header at the chosen device width, zoomed to fit, with clickable zones.
   strip = a hint of the banner underneath (mockup 1i / 3c, px on screen) — "โปร่งใสทับแบนเนอร์" lays the bar over it */
export function HeaderPreview({ site, width, hot, strip = 0 }: { site: SiteDoc; width: number; hot?: HotZones; strip?: number }) {
  const device = useStore(s => s.device)
  const real = REAL_W[device]
  const w = device === 'mobile' ? Math.min(390, width) : device === 'tablet' ? Math.min(width, 640) : width
  const zoom = w / real
  const transparent = site.header.data.transparent === 'yes'
  const h = Math.max(strip, transparent ? 120 : 0)
  return (
    <div style={{ width: w, margin: '0 auto' }}>
      <div style={{ width: real, zoom, fontFamily: "'Prompt',sans-serif", color: '#222', position: 'relative', background: '#fff' } as CSSProperties}>
        <HeaderBody s={site.header} site={site} device={device} zoom={zoom} hot={hot} />
        {h > 0 && <div style={{ height: h / zoom, background: 'linear-gradient(160deg,#d9b493,#5e3b28)', opacity: transparent ? 1 : 0.32 }} />}
      </div>
    </div>
  )
}

/* =====================================================================
   Footer — rows → columns (mockup 1j / 1k / 3d), one renderer for the canvas and the Footer screens.
   Each row: column widths (fr) · background (inherit Token พื้นเข้ม / override) · ระยะบน–ล่าง · แสดงบนจอไหน.
   Footer screens add: column grid lines, row tags, click a column → select (toolbar ✦ ⚙ ลบ),
   and in V2 (1k) drag a grid line to change column widths.
   ===================================================================== */
export interface FooterHot {
  sel: { row: string; col: number } | null
  look: 'a' | 'b' | 'c'
  color: string
  onCol: (row: string, col: number) => void
  onAction: (a: 'ai' | 'props' | 'delete', row: string, col: number) => void
  onResize?: (row: string, widths: number[]) => void
}
const FOOTER_BG = 'พื้นเข้ม (Footer)'
const SOCIAL_ICON: Record<string, string> = { facebook: 'fab fa-facebook', instagram: 'fab fa-instagram', line: 'fab fa-line', tiktok: 'fab fa-tiktok' }

function FooterCell({ c, m }: { c: FooterCol; m: boolean }) {
  if (c.kind === 'brand') return <div><div style={{ fontFamily: 'Georgia,serif', color: '#fff', fontSize: 24, marginBottom: 12 }}>{c.title}</div><div style={{ lineHeight: 1.6, whiteSpace: 'pre-line' }}>{c.text}</div></div>
  if (c.kind === 'links') return <div><div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>{c.title}</div>{(c.links ?? []).map((l, i) => <div key={i} style={{ lineHeight: 1.7 }}>{l.label}</div>)}</div>
  if (c.kind === 'social') return <div><div style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>{c.title}</div><div style={{ display: 'flex', gap: 12, fontSize: 20 }}>{(c.items ?? []).map(k => <i key={k} className={SOCIAL_ICON[k] ?? 'fas fa-link'} />)}</div></div>
  if (c.kind === 'payments') return <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{(c.items ?? []).map(k => <span key={k} style={{ minWidth: 52, height: 30, padding: '0 8px', borderRadius: 4, background: '#fff', color: '#2d2a28', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center', fontFamily: "'Poppins',sans-serif" }}>{k}</span>)}</div>
  if (c.kind === 'copyright') return <div style={{ fontSize: 13, color: '#9a938d' }}>{c.text}</div>
  return <div style={{ minHeight: m ? 40 : 60 }} />
}

function FooterBody({ s, site, device, zoom, lang = 'TH', hot, edit }: { s: Section; site: SiteDoc; device: Device; zoom: number; lang?: string; hot?: FooterHot; edit?: boolean }) {
  const [live, setLive] = useState<{ row: string; widths: number[] } | null>(null)
  const m = device === 'mobile'
  const rows = s.rows?.[lang] ?? s.rows?.TH ?? []
  const dim = !!hot || !!edit
  return (
    <div style={{ color: FOOTER_TEXT, fontSize: 15 }}>
      {rows.map((r, ri) => {
        const off = r.hidden || r.hideOn?.includes(device)
        if (off && !dim) return null
        const widths = live?.row === r.id ? live.widths : r.widths
        const cols = m && r.cols.length > 2 ? '1fr 1fr' : widths.map(w => `${w}fr`).join(' ')
        const selRow = hot?.sel?.row === r.id
        const bg = tokenHex(site, r.bg) ?? tokenByName(site, FOOTER_BG)
        const pad = hot ? Math.max(r.padY, (r.bar ? 30 : 36) / zoom) : r.padY   // hot mode: room for the row tag
        const startResize = (e: React.PointerEvent, i: number) => {
          if (!hot?.onResize) return
          e.preventDefault(); e.stopPropagation()
          const grid = (e.currentTarget as HTMLElement).closest('[data-frow]')?.querySelector('[data-fgrid]') as HTMLElement | null
          if (!grid) return
          const x0 = e.clientX, w0 = [...widths], sum = w0.reduce((a, b) => a + b, 0)
          const pxPerFr = (grid.getBoundingClientRect().width - 20 * zoom * (w0.length - 1)) / sum
          let cur = w0
          const move = (ev: PointerEvent) => {
            const d = (ev.clientX - x0) / pxPerFr
            const a = Math.max(0.4, w0[i] + d), b = Math.max(0.4, w0[i] + w0[i + 1] - a)
            cur = w0.map((w, k) => k === i ? Math.round((w0[i] + w0[i + 1] - b) * 10) / 10 : k === i + 1 ? Math.round(b * 10) / 10 : w)
            setLive({ row: r.id, widths: cur })
          }
          const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); setLive(null); if (cur !== w0) hot.onResize!(r.id, cur) }
          window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
        }
        const tag = hot && (
          <span style={{ position: 'absolute', left: 28, top: 6 / zoom, zIndex: 3, fontSize: px(11, zoom), fontWeight: 700, color: '#fff', background: selRow ? hot.color : 'var(--ink-600)', padding: `${px(2, zoom)} ${px(7, zoom)}`, borderRadius: px(5, zoom), fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
            แถว {ri + 1}{selRow ? ` · ${r.cols.length} คอลัมน์` : hot.look === 'b' && r.bar ? ` · ${colSummary(r.cols[0])}` : ''}{off ? ' · ซ่อนอยู่' : ''}
          </span>
        )
        return (
          <div key={r.id} data-frow={r.id} style={{ background: bg, padding: `${pad}px ${m ? 20 : 28}px ${r.bar ? (hot ? r.padY : pad) : Math.round(pad * 0.7)}px`, position: 'relative', opacity: off ? 0.4 : 1 }}>
            {tag}
            {hot && !m && r.cols.length > 1 && (
              <div style={{ position: 'absolute', left: 28, right: 28, top: 0, bottom: 0, display: 'grid', gridTemplateColumns: cols, gap: 20, pointerEvents: 'none' }}>
                {r.cols.map((_, i) => (
                  <span key={i} style={{ borderRight: `${px(1, zoom)} dashed rgba(255,255,255,.18)`, borderLeft: i === 0 ? `${px(1, zoom)} dashed rgba(255,255,255,.18)` : undefined, position: 'relative' }}>
                    {hot.onResize && i < r.cols.length - 1 && <span role="separator" aria-label="ลากเพื่อปรับความกว้างคอลัมน์" onPointerDown={e => startResize(e, i)} style={{ position: 'absolute', right: -11, top: 0, bottom: 0, width: 20, cursor: 'col-resize', pointerEvents: 'auto', display: 'grid', placeItems: 'center' }}><span style={{ width: px(6, zoom), height: px(28, zoom), borderRadius: px(3, zoom), background: 'rgba(255,255,255,.4)' }} /></span>}
                  </span>
                ))}
              </div>
            )}
            <div data-fgrid="" style={{ display: 'grid', gridTemplateColumns: cols, gap: 20, position: 'relative', alignItems: r.bar ? 'center' : 'start' }}>
              {r.cols.map((c, ci) => {
                const span = m && r.cols.length > 2 && c.kind === 'brand' ? { gridColumn: '1 / -1' } : undefined
                if (!hot) return <div key={c.id} style={span}><FooterCell c={c} m={m} /></div>
                const on = selRow && hot.sel?.col === ci
                const tb = (icon: string, label: string, a: 'ai' | 'props' | 'delete', grad?: boolean) => (
                  <button key={a} title={label} aria-label={label} onClick={e => { e.stopPropagation(); hot.onAction(a, r.id, ci) }} style={{ width: px(24, zoom), height: px(24, zoom), display: 'grid', placeItems: 'center', borderRadius: px(5, zoom), color: '#fff', background: grad ? 'linear-gradient(135deg,var(--red-600),var(--orange-500))' : undefined }}><i className={icon} style={{ fontSize: px(10, zoom) }} /></button>
                )
                return (
                  <div key={c.id} data-fcol="" data-hz-on={on ? '' : undefined} role="button" tabIndex={0} aria-pressed={on} aria-label={`เลือกคอลัมน์ ${colSummary(c)}`}
                    onClick={e => { e.stopPropagation(); hot.onCol(r.id, ci) }} onKeyDown={e => { if (e.key === 'Enter') hot.onCol(r.id, ci) }}
                    style={{ ...span, position: 'relative', cursor: 'pointer', borderRadius: 2, outline: on ? `${px(2, zoom)} solid ${hot.color}` : `${px(1, zoom)} dashed transparent`, outlineOffset: px(8, zoom) }}>
                    {on && <span style={{ position: 'absolute', right: px(-8, zoom), top: px(-38, zoom), display: 'flex', gap: px(2, zoom), background: 'var(--ink-900)', borderRadius: px(7, zoom), padding: px(3, zoom), zIndex: 4 }}>
                      {hot.look !== 'a' && tb('fas fa-magic', 'ปรับด้วยผู้ช่วย Ket', 'ai', true)}{tb('fas fa-cog', 'คุณสมบัติคอลัมน์', 'props')}{tb('fas fa-trash-alt', 'ลบคอลัมน์', 'delete')}
                    </span>}
                    {c.kind === 'empty'
                      ? <div style={{ minHeight: 60, border: `${px(1, zoom)} dashed rgba(255,255,255,.3)`, borderRadius: 6, display: 'grid', placeItems: 'center', fontSize: 13, color: 'rgba(255,255,255,.55)', fontFamily: 'var(--font-heading)' }}>คอลัมน์ว่าง · คลิกเพื่อใส่เนื้อหา</div>
                      : <FooterCell c={c} m={m} />}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* Footer screens: the real footer at desktop width, zoomed to fit, under a hint of the page content */
export function FooterPreview({ site, width, lang, hot, strip = 0 }: { site: SiteDoc; width: number; lang: string; hot?: FooterHot; strip?: number }) {
  const real = REAL_W.desktop
  const zoom = width / real
  return (
    <div style={{ width }}>
      {strip > 0 && <div style={{ height: strip, background: 'var(--ink-100)', display: 'grid', placeItems: 'center', color: 'var(--ink-400)', fontSize: 12 }}>… เนื้อหาหน้า …</div>}
      <div style={{ width: real, zoom, fontFamily: "'Prompt',sans-serif", position: 'relative' } as CSSProperties}>
        <FooterBody s={site.footer} site={site} device="desktop" zoom={zoom} lang={lang} hot={hot} />
      </div>
    </div>
  )
}
