/* Hallmark · component: sidebar-nav · genre: modern-minimal · theme: project tokens (Ketshopweb CI · ketshopweb-ds-tokens.css)
 * studied: yes · DNA-source: image (user reference — a Framer editor side panel) · DNA taken: line icons quieter than text ·
 *   bold light group titles over indented grey items · hairline between groups · soft neutral fill for the current item
 * states: default · hover · focus · active · disabled (+ reason) · current — loading / error / success n/a (in-app route change is instant)
 * contrast: items 9.8:1 · titles 15:1 · current white on CI red 6.6:1 · focus ring 4.2:1 on ink-900 · no-screen items are inactive (aria-disabled)
 * pre-emit critique: P5 H5 E4 S4 R5 V4
 *
 * V4 sidebar (cloned from components/shell/Sidebars.tsx on 2026-09-24, rebuilt the same day). Only V4 uses this file.
 * Type: Prompt (CI Thai UI face; Latin in the same face so a menu name never switches family) · antialiased on the dark ground.
 * Two levels you can scan by weight + colour, not size (as in the reference): group title 13/600 near-white, 20px from the edge ›
 *   items 13/400 grey, icon indented to 32px. Mode tabs 13/500 when chosen.
 * Icons: Lucide line icons 16px / stroke 1.75, one step quieter than the label. Rows 32px · 2px apart.
 * Groups are separated by a hairline + 12px, the whole list scrolls on its own with a visible cue.
 * Current item: solid Ketshopweb Red fill (#B12629) (no side bar) + white 600 label + white icon drawn heavier (stroke 2.25) so text and icon carry the same weight.
 * No collapsing groups.
 * « folds it to a 72px icon rail (remembered per browser). */
import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  AppWindow, Bell, Braces, ChartLine, ChartPie, ChevronDown, Cookie, CreditCard, Files, Gauge, Globe, History, Images, LayoutTemplate, Mail, MapPin,
  Megaphone, Menu, MousePointerClick, Newspaper, Package, Paintbrush, Palette, PanelBottom, PanelLeft, PanelLeftClose, PanelLeftOpen, PanelTop, Plug,
  Receipt, Search, ShieldCheck, SlidersHorizontal, Store, TicketPercent, Truck, Users, Warehouse, Wrench,
} from 'lucide-react'
import { FRONT_GROUPS, MANAGE_GROUPS, SCREENS } from '@/versions/registry'
import { isReady } from '@/versions/screens'
import { useSidebarActions } from '@/components/shell/Sidebars'
import { useRoute, useUi } from '@/components/shell/nav'

const ICON: Record<string, LucideIcon> = {
  'Page Layouts': Files, Header: PanelTop, Footer: PanelBottom, Menu, 'System Design': Palette, 'เทมเพลต': LayoutTemplate,
  'Product Display': Store, 'Blog Manager': Newspaper, 'Coupon Display': TicketPercent, 'Event Popup': AppWindow, Sidebar: PanelLeft, Media: Images,
  SEO: Search, 'Conversion Tools': ChartLine, 'Google Map': MapPin, 'Cookie · PDPA banner': Cookie, Language: Globe,
  Button: MousePointerClick, 'Advance CSS': Braces, Maintenance: Wrench,
  Overview: Gauge, Dashboard: ChartPie, 'E-commerce': Receipt, Marketing: Megaphone, 'Delivery Manager': Truck,
  'Product Manager': Package, Warehouse, Users, Email: Mail, Extension: Plug, 'History Logs': History,
  'ทั่วไป': SlidersHorizontal, 'การขาย · ขนส่ง · ชำระเงิน': CreditCard, 'การแจ้งเตือน': Bell, 'PDPA · นโยบาย': ShieldCheck,
}
const STROKE = 1.75        // icon line weight that sits with a 400 label
const STROKE_ON = 2.25     // …and with the 600 label of the current item, so text and icon carry the same weight
const groupName = (label: string) => label.split(' · ')[0]      // "ออกแบบ · Design" → "ออกแบบ"

function useMenu() {
  const { tab, openItem, setTab } = useSidebarActions()
  const { version, screen, missing } = useRoute()
  const active = missing ?? screen?.sb ?? null
  const groups = tab === 'front' ? FRONT_GROUPS : MANAGE_GROUPS
  /* a menu is live when this version has a screen for it; everything in "จัดการ" is outside the prototype */
  const live = (label: string) => {
    if (tab !== 'front' || !version) return false
    const s = SCREENS.find(x => x.sb === label)
    return !!s && isReady(version.id, s.id)
  }
  return { tab, setTab, openItem, active, groups, live }
}

/* scroll state of the menu list → fades + "more below" cue */
function useScrollCue() {
  const ref = useRef<HTMLElement>(null)
  const [cue, setCue] = useState({ up: false, down: false })
  const measure = () => { const el = ref.current; if (!el) return; setCue({ up: el.scrollTop > 2, down: el.scrollTop + el.clientHeight < el.scrollHeight - 2 }) }
  useEffect(() => {
    const el = ref.current; if (!el) return
    el.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' })
    measure()
    const ro = new ResizeObserver(measure); ro.observe(el); if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => ro.disconnect()
  }, [])
  return { ref, cue, onScroll: measure, more: () => ref.current?.scrollBy({ top: 160, behavior: 'smooth' }) }
}
function Fades({ cue, more, rail }: { cue: { up: boolean; down: boolean }; more: () => void; rail?: boolean }) {
  return <>
    {cue.up && <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-ink-900 to-transparent" />}
    {cue.down && <>
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-ink-900 to-transparent" />
      <button onClick={more} aria-label="เลื่อนดูเมนูเพิ่ม" title="เลื่อนดูเมนูเพิ่ม"
        className={`absolute left-1/2 -translate-x-1/2 bottom-2 h-7 rounded-full bg-ink-800 text-ink-200 text-caption font-semibold flex items-center gap-1.5 shadow-lg hover:bg-ink-700 hover:text-white ${rail ? 'w-7 justify-center' : 'px-3'}`}>
        {!rail && 'เลื่อนดูเมนูเพิ่ม'}<ChevronDown size={14} strokeWidth={STROKE} aria-hidden />
      </button>
    </>}
  </>
}

/* row look shared by wide + rail: idle grey · hover lifts · current = soft fill + white + orange bar · no screen = muted + reason */
const rowTone = (on: boolean, live: boolean) => on
  ? 'bg-red-600 text-white font-semibold'
  : live ? 'text-ink-300 hover:bg-white/[.05] hover:text-white active:bg-white/10 active:translate-y-px' : 'text-ink-500 cursor-not-allowed'

export function SidebarV4() {
  const m = useMenu()
  const rail = useUi(s => s.rail); const setUi = useUi(s => s.set)
  const sc = useScrollCue()
  if (rail) return <Rail m={m} onExpand={() => setUi({ rail: false })} />
  const tg = (on: boolean) => on ? 'bg-ink-700 text-white font-semibold' : 'text-ink-400 hover:text-white active:translate-y-px'
  return (
    <aside className="w-[240px] h-screen bg-ink-900 flex flex-col text-ink-300 flex-none antialiased font-heading">
      {/* brand */}
      <div className="h-14 flex items-center px-5 gap-2 flex-none border-b border-ink-800">
        <img src="./img/Logo-Light-Color.png" alt="Ketshopweb" className="h-6 w-auto" />
        <button onClick={() => setUi({ rail: true })} title="ย่อเหลือไอคอน" aria-label="ย่อ sidebar เหลือไอคอน" className="ml-auto -mr-1.5 w-8 h-8 rounded-lg grid place-items-center text-ink-400 hover:text-white hover:bg-white/5"><PanelLeftClose size={16} strokeWidth={STROKE} aria-hidden /></button>
      </div>
      {/* mode — tabs like the reference's top tabs: the chosen one sits on a soft fill */}
      <div className="px-3 py-3 flex-none border-b border-ink-800">
        <div role="tablist" aria-label="โหมด" className="flex gap-1 text-body">
          <button role="tab" aria-selected={m.tab === 'back'} onClick={() => m.setTab('back')} className={`flex-1 h-8 rounded-lg ${tg(m.tab === 'back')}`}>จัดการ</button>
          <button role="tab" aria-selected={m.tab === 'front'} onClick={() => m.setTab('front')} className={`flex-1 h-8 rounded-lg ${tg(m.tab === 'front')}`}>ปรับแต่ง</button>
        </div>
      </div>
      {/* menu list — the only part that scrolls */}
      <div className="relative flex-1 min-h-0">
        <nav ref={sc.ref} onScroll={sc.onScroll} aria-label="เมนูหลัก" className="nav-scroll h-full overflow-y-auto pb-4">
          <div>
            {m.groups.map((g, gi) => (
              <section key={g.label} aria-label={groupName(g.label)} className={`pt-3 pb-2 ${gi > 0 ? 'border-t border-ink-800' : ''}`}>
                <h2 className="px-5 h-8 flex items-center text-body font-semibold text-ink-100">{groupName(g.label)}</h2>
                <div className="px-3 flex flex-col gap-0.5">
                  {g.items.map(([label]) => {
                    const on = m.tab === 'front' && label === m.active
                    const live = m.live(label)
                    const Icon = ICON[label] ?? Files
                    return (
                      <button key={label} onClick={() => live && m.openItem(label)} aria-disabled={!live && !on ? true : undefined} aria-current={on ? 'page' : undefined}
                        title={live || on ? undefined : 'ยังไม่มีหน้าจอใน prototype'}
                        className={`relative w-full text-left h-8 flex items-center pl-5 pr-2 gap-2.5 rounded-lg text-body font-normal transition-colors ${rowTone(on, live)}`}>
                        <Icon size={16} strokeWidth={on ? STROKE_ON : STROKE} aria-hidden className={`flex-none ${on ? 'text-white' : 'text-ink-400'}`} />
                        <span className="flex-1 truncate">{label}</span>
                        {!live && !on && <span className="sr-only">(ยังไม่มีหน้าจอใน prototype)</span>}
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>
        <Fades cue={sc.cue} more={sc.more} />
      </div>
      {/* assistant */}
      <div className="px-5 py-3 border-t border-ink-800 flex items-center gap-3 flex-none">
        <div className="w-8 h-8 rounded-full bg-ink-0 overflow-hidden flex-none"><img src="./img/mascot-hello.png" alt="" className="w-full h-full object-cover object-[center_20%]" /></div>
        <div className="flex-1 min-w-0"><div className="text-body font-semibold text-ink-100">ผู้ช่วย Ket</div><div className="text-caption text-ink-400">พร้อมช่วยเสมอ · ⌘K</div></div>
        <span className="text-caption text-ink-400">8.7.4</span>
      </div>
    </aside>
  )
}

/* 72px icon rail — same order, same rules; names in a tooltip (fixed, so the scrolling list doesn't clip it) */
function Rail({ m, onExpand }: { m: ReturnType<typeof useMenu>; onExpand: () => void }) {
  const [tip, setTip] = useState<{ text: string; y: number } | null>(null)
  const sc = useScrollCue()
  const tipOn = (text: string) => (e: React.SyntheticEvent<HTMLElement>) => { const r = e.currentTarget.getBoundingClientRect(); setTip({ text, y: r.top + r.height / 2 }) }
  const tipProps = (text: string) => ({ onMouseEnter: tipOn(text), onFocus: tipOn(text), onMouseLeave: () => setTip(null), onBlur: () => setTip(null), 'aria-label': text })
  const mode = (t: 'front' | 'back', Icon: LucideIcon, label: string) => (
    <button role="tab" aria-selected={m.tab === t} onClick={() => m.setTab(t)} {...tipProps(label)} className={`w-7 h-7 rounded-md grid place-items-center ${m.tab === t ? 'bg-ink-700 text-white' : 'text-ink-400 hover:text-white'}`}><Icon size={15} strokeWidth={STROKE} aria-hidden /></button>
  )
  return (
    <aside className="w-[72px] h-screen bg-ink-900 flex flex-col items-center text-ink-300 flex-none antialiased">
      <div className="h-14 w-full flex items-center justify-center flex-none border-b border-ink-800"><img src="./img/Logo-Circle-Light.svg" alt="Ketshopweb" className="w-8 h-8" /></div>
      <div className="w-full py-3 flex flex-col items-center gap-2 flex-none border-b border-ink-800">
        <button onClick={onExpand} {...tipProps('ขยาย sidebar')} className="w-11 h-8 rounded-lg grid place-items-center text-ink-400 hover:text-white hover:bg-white/5"><PanelLeftOpen size={16} strokeWidth={STROKE} aria-hidden /></button>
        <div role="tablist" aria-label="โหมด" className="flex gap-0.5">{mode('back', Store, 'จัดการ')}{mode('front', Paintbrush, 'ปรับแต่ง')}</div>
      </div>
      <div className="relative flex-1 min-h-0 w-full">
        <nav ref={sc.ref} onScroll={sc.onScroll} aria-label="เมนูหลัก" className="nav-scroll h-full overflow-y-auto pb-4">
          <div className="flex flex-col items-center">
            {m.groups.map((g, gi) => (
              <section key={g.label} aria-label={groupName(g.label)} className={`w-full flex flex-col items-center gap-0.5 py-2.5 ${gi > 0 ? 'border-t border-ink-800' : ''}`}>
                {g.items.map(([label]) => {
                  const on = m.tab === 'front' && label === m.active
                  const live = m.live(label)
                  const Icon = ICON[label] ?? Files
                  return (
                    <button key={label} onClick={() => live && m.openItem(label)} aria-disabled={!live && !on ? true : undefined} aria-current={on ? 'page' : undefined} {...tipProps(live || on ? label : `${label} · ยังไม่มีหน้าจอใน prototype`)}
                      className={`relative w-11 h-9 flex-none grid place-items-center rounded-lg transition-colors ${rowTone(on, live)}`}>
                      <Icon size={18} strokeWidth={on ? STROKE_ON : STROKE} aria-hidden className={on ? 'text-white' : live ? 'text-ink-300' : 'text-ink-500'} />
                    </button>
                  )
                })}
              </section>
            ))}
          </div>
        </nav>
        <Fades cue={sc.cue} more={sc.more} rail />
      </div>
      <div className="w-full py-3 border-t border-ink-800 flex justify-center flex-none">
        <div onMouseEnter={tipOn('ผู้ช่วย Ket · พร้อมช่วยเสมอ · ⌘K')} onMouseLeave={() => setTip(null)} className="w-8 h-8 rounded-full bg-ink-0 overflow-hidden"><img src="./img/mascot-hello.png" alt="" className="w-full h-full object-cover object-[center_20%]" /></div>
      </div>
      {tip && <div role="tooltip" className="fixed left-[80px] z-[150] -translate-y-1/2 bg-white text-ink-900 text-meta font-semibold rounded-md px-2.5 py-1 shadow-lg whitespace-nowrap pointer-events-none" style={{ top: tip.y }}>{tip.text}</div>}
    </aside>
  )
}
