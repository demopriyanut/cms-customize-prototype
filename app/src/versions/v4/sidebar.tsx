/* V4 — sidebar "safe" cloned from components/shell/Sidebars.tsx (SidebarSafe) on 2026-09-24. Only V4 uses this file.
   Wide 240px: rows 30px · text 13 (body) · icons 13 · group label 11/600 caps (caption) with a 12px gap before each group ·
   toggle 12 (meta) · footer 12/11 (numbers from CmsSidebar.dc.html; V1–V3 were enlarged).
   « folds it to a 72px icon rail to give the canvas room (remembered per browser) — groups become thin dividers,
   names show as a tooltip on hover / focus, the ย้าย / ⇄ / ใหม่ hints become a small dot. */
import { useState } from 'react'
import { FRONT_GROUPS, MANAGE_GROUPS } from '@/versions/registry'
import { useSidebarActions } from '@/components/shell/Sidebars'
import { useRoute, useUi } from '@/components/shell/nav'

export function SidebarV4() {
  const { tab, openItem, setTab } = useSidebarActions()
  const { screen, missing } = useRoute()
  const rail = useUi(s => s.rail); const setUi = useUi(s => s.set)
  const active = missing ?? screen?.sb ?? null
  const groups = tab === 'front' ? FRONT_GROUPS : MANAGE_GROUPS
  if (rail) return <Rail groups={groups} tab={tab} active={active} openItem={openItem} setTab={setTab} onExpand={() => setUi({ rail: false })} />
  const tg = (on: boolean) => on ? 'bg-ink-0 text-ink-900 font-semibold' : 'text-ink-400'
  return (
    <aside className="w-[240px] h-screen bg-ink-900 flex flex-col text-body text-ink-300 flex-none">
      <div className="h-14 flex items-center pl-5 pr-3 gap-2 flex-none border-b border-ink-800">
        <img src="./img/Logo-Light-Color.png" alt="Ketshopweb" className="h-6 w-auto" />
        <button onClick={() => setUi({ rail: true })} title="ย่อเหลือไอคอน" aria-label="ย่อ sidebar เหลือไอคอน" className="ml-auto w-8 h-8 rounded-lg grid place-items-center text-ink-400 hover:text-ink-100 hover:bg-white/5"><i className="fas fa-angle-double-left text-body" /></button>
      </div>
      <div className="px-3.5 pt-3.5 pb-1.5">
        <div role="tablist" className="flex bg-ink-800 rounded-lg p-[3px] text-meta font-medium">
          <button role="tab" aria-selected={tab === 'back'} onClick={() => setTab('back')} className={`flex-1 py-[5px] rounded-md ${tg(tab === 'back')}`}>จัดการ</button>
          <button role="tab" aria-selected={tab === 'front'} onClick={() => setTab('front')} className={`flex-1 py-[5px] rounded-md ${tg(tab === 'front')}`}>ปรับแต่ง</button>
        </div>
      </div>
      <nav className="flex-1 overflow-auto px-2.5 py-1">
        {groups.map((g, gi) => (
          <div key={g.label}>
            {/* group gap 12 (> row gap 0) so each group reads as one block · label 11px ink-400 = 5.9:1 on ink-900 */}
            <div className={`text-caption tracking-[.06em] uppercase text-ink-400 font-semibold px-2.5 pb-1 font-display ${gi === 0 ? 'pt-1' : 'pt-3'}`}>{g.label}</div>
            {g.items.map(([label, icon, hint]) => {
              const on = tab === 'front' && label === active
              return (
                <button key={label} onClick={() => tab === 'front' && openItem(label)} aria-current={on ? 'page' : undefined}
                  className={`w-full text-left h-[30px] flex items-center px-2.5 gap-2.5 rounded-lg ${on ? 'bg-red-600 text-white font-semibold' : 'text-ink-300 hover:bg-white/5'}`}>
                  <span className="w-[18px] text-body text-center flex-none opacity-90"><i className={icon} /></span>
                  <span className="flex-1 truncate">{label}</span>
                  <span className={`text-caption ${on ? 'text-white/70' : 'text-ink-400'}`}>{hint}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="px-3.5 pt-2 pb-2.5 border-t border-ink-800 flex items-center gap-2.5">
        <div className="w-[30px] h-[30px] rounded-full bg-ink-0 overflow-hidden flex-none"><img src="./img/mascot-hello.png" alt="" className="w-full h-full object-cover object-[center_20%]" /></div>
        <div className="flex-1 min-w-0"><div className="text-meta font-semibold text-ink-100">ผู้ช่วย Ket</div><div className="text-caption text-ink-400">พร้อมช่วยเสมอ · ⌘K</div></div>
        <span className="text-caption text-ink-400">8.7.4</span>
      </div>
    </aside>
  )
}

/* 72px icon rail — same items and order; name in a tooltip (fixed, so the scrolling list doesn't clip it) */
function Rail({ groups, tab, active, openItem, setTab, onExpand }: {
  groups: typeof FRONT_GROUPS; tab: 'front' | 'back'; active: string | null
  openItem: (label: string) => void; setTab: (t: 'front' | 'back') => void; onExpand: () => void
}) {
  const [tip, setTip] = useState<{ text: string; y: number } | null>(null)
  const tipOn = (text: string) => (e: React.SyntheticEvent<HTMLElement>) => { const r = e.currentTarget.getBoundingClientRect(); setTip({ text, y: r.top + r.height / 2 }) }
  const tipProps = (text: string) => ({ onMouseEnter: tipOn(text), onFocus: tipOn(text), onMouseLeave: () => setTip(null), onBlur: () => setTip(null), 'aria-label': text })
  const mode = (t: 'front' | 'back', icon: string, label: string) => (
    <button role="tab" aria-selected={tab === t} onClick={() => setTab(t)} {...tipProps(label)} className={`w-[30px] h-[26px] rounded-md grid place-items-center text-meta ${tab === t ? 'bg-ink-0 text-ink-900' : 'text-ink-400 hover:text-ink-100'}`}><i className={icon} /></button>
  )
  return (
    <aside className="w-[72px] h-screen bg-ink-900 flex flex-col items-center text-ink-300 flex-none relative">
      <div className="h-14 w-full flex items-center justify-center flex-none border-b border-ink-800"><img src="./img/Logo-Circle-Light.svg" alt="Ketshopweb" className="w-8 h-8" /></div>
      <button onClick={onExpand} {...tipProps('ขยาย sidebar')} className="mt-2 w-10 h-8 rounded-lg grid place-items-center text-ink-400 hover:text-ink-100 hover:bg-white/5 flex-none"><i className="fas fa-angle-double-right text-body" /></button>
      <div role="tablist" className="mt-1.5 flex gap-0.5 bg-ink-800 rounded-lg p-[3px] flex-none">{mode('back', 'fas fa-store', 'จัดการ')}{mode('front', 'fas fa-paint-brush', 'ปรับแต่ง')}</div>
      <nav className="flex-1 overflow-auto w-full px-3 py-2 flex flex-col items-center">
        {groups.map((g, gi) => (
          <div key={g.label} className="w-full flex flex-col items-center">
            {gi > 0 && <span className="w-8 h-px bg-ink-800 my-1.5" aria-hidden />}
            {g.items.map(([label, icon, hint]) => {
              const on = tab === 'front' && label === active
              return (
                <button key={label} onClick={() => tab === 'front' && openItem(label)} aria-current={on ? 'page' : undefined} {...tipProps(hint ? `${label} · ${hint}` : label)}
                  className={`relative w-11 h-8 flex-none grid place-items-center rounded-lg text-body ${on ? 'bg-red-600 text-white' : 'text-ink-300 hover:bg-white/5 hover:text-ink-100'}`}>
                  <i className={icon} />
                  {hint && <span className={`absolute right-1.5 top-1.5 w-1.5 h-1.5 rounded-full ${on ? 'bg-white/70' : 'bg-ink-500'}`} aria-hidden />}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="w-full py-2.5 border-t border-ink-800 flex justify-center flex-none">
        <div {...tipProps('ผู้ช่วย Ket · พร้อมช่วยเสมอ · ⌘K')} tabIndex={0} className="w-[30px] h-[30px] rounded-full bg-ink-0 overflow-hidden"><img src="./img/mascot-hello.png" alt="" className="w-full h-full object-cover object-[center_20%]" /></div>
      </div>
      {tip && <div role="tooltip" className="fixed left-[80px] z-[150] -translate-y-1/2 bg-white text-ink-900 text-meta font-semibold rounded-md px-2.5 py-1 shadow-lg whitespace-nowrap pointer-events-none" style={{ top: tip.y }}>{tip.text}</div>}
    </aside>
  )
}
