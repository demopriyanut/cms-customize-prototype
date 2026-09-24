import { FRONT_GROUPS, MANAGE_GROUPS, SCREENS } from '@/versions/registry'
import { useGo, useRoute, useUi } from './nav'

/* =====================================================================
   CmsSidebar — "safe" (V1, V3) and "bold" wide / narrow (V2), ported from CmsSidebar.dc.html
   ===================================================================== */

export function useSidebarActions() {
  const { version } = useRoute()
  const go = useGo()
  const { tab, set } = useUi()
  const openItem = (label: string) => {
    if (!version) return
    set({ tab: 'front' })
    const s = SCREENS.find(x => x.sb === label)
    go.to(version.id, s ? (s.id === 'page' ? 'entry' : s.id) : 'x:' + encodeURIComponent(label))
  }
  const setTab = (t: 'front' | 'back') => {
    set({ tab: t })
    if (t === 'front' && version) go.to(version.id, 'entry')
  }
  return { tab, openItem, setTab }
}

function useActive() {
  const { screen, missing } = useRoute()
  return missing ?? screen?.sb ?? null
}

export function SidebarSafe() {
  const { tab, openItem, setTab } = useSidebarActions()
  const active = useActive()
  const groups = tab === 'front' ? FRONT_GROUPS : MANAGE_GROUPS
  const tg = (on: boolean) => on ? 'bg-ink-0 text-ink-900 font-semibold' : 'text-ink-400 font-medium'
  return (
    <aside className="w-[240px] h-screen bg-ink-900 flex flex-col text-[13.5px] text-ink-300 flex-none">
      <div className="h-14 flex items-center px-5 flex-none border-b border-ink-800"><img src="./img/Logo-Light-Color.png" alt="Ketshopweb" className="h-6 w-auto" /></div>
      <div className="px-3.5 pt-3.5 pb-1.5">
        <div role="tablist" className="flex bg-ink-800 rounded-lg p-[3px] text-[13px]">
          <button role="tab" aria-selected={tab === 'back'} onClick={() => setTab('back')} className={`flex-1 py-[5px] rounded-md ${tg(tab === 'back')}`}>จัดการ</button>
          <button role="tab" aria-selected={tab === 'front'} onClick={() => setTab('front')} className={`flex-1 py-[5px] rounded-md ${tg(tab === 'front')}`}>ปรับแต่ง</button>
        </div>
      </div>
      <nav className="flex-1 overflow-auto px-2.5 py-1">
        {groups.map(g => (
          <div key={g.label}>
            <div className="text-[11px] tracking-[.08em] uppercase text-ink-500 font-semibold px-3 pt-3.5 pb-1 font-display">{g.label}</div>
            {g.items.map(([label, icon, hint]) => {
              const on = tab === 'front' && label === active
              return (
                <button key={label} onClick={() => tab === 'front' && openItem(label)} aria-current={on ? 'page' : undefined}
                  className={`w-full text-left h-[34px] flex items-center px-3 gap-3 rounded-lg ${on ? 'bg-red-600 text-white font-semibold' : 'text-ink-300 hover:bg-white/5'}`}>
                  <span className="w-[18px] text-[14px] text-center flex-none opacity-90"><i className={icon} /></span>
                  <span className="flex-1 truncate">{label}</span>
                  <span className={`text-[11px] ${on ? 'text-white/70' : 'text-ink-500'}`}>{hint}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="px-3.5 pt-2 pb-2.5 border-t border-ink-800 flex items-center gap-2.5">
        <div className="w-[30px] h-[30px] rounded-full bg-ink-0 overflow-hidden flex-none"><img src="./img/mascot-hello.png" alt="" className="w-full h-full object-cover object-[center_20%]" /></div>
        <div className="flex-1 min-w-0"><div className="text-[13px] font-semibold text-ink-100">ผู้ช่วย Ket</div><div className="text-[12px] text-ink-500">พร้อมช่วยเสมอ · ⌘K</div></div>
        <span className="text-[12px] text-ink-500">8.7.4</span>
      </div>
    </aside>
  )
}

function Mascot({ size }: { size: number }) {
  return (
    <div className="relative rounded-full p-[2px] flex-none" style={{ width: size, height: size, background: 'linear-gradient(135deg,var(--red-600),var(--orange-500))' }}>
      <div className="w-full h-full rounded-full bg-legacy overflow-hidden"><img src="./img/mascot-laptop.png" alt="" className="w-full h-full object-cover object-[center_22%]" /></div>
      <span className="absolute -right-px -top-px w-[11px] h-[11px] rounded-full bg-success-500 border-2 border-legacy" />
    </div>
  )
}

export function SidebarBoldWide({ onCollapse }: { onCollapse: () => void }) {
  const { tab, openItem, setTab } = useSidebarActions()
  const active = useActive()
  const back = tab === 'back'
  const groups = back ? MANAGE_GROUPS : FRONT_GROUPS
  return (
    <aside className="w-[240px] h-screen bg-legacy flex flex-col text-sm text-white/70 flex-none">
      <div className="h-[60px] flex items-center pl-5 pr-3 flex-none border-b border-white/8 gap-2">
        <img src="./img/Logo-Light-Color.png" alt="Ketshopweb" className="h-[26px] w-auto" />
        <button onClick={onCollapse} title="ย่อเมนู" className="ml-auto w-8 h-8 rounded-lg grid place-items-center text-white/55 bg-white/6 hover:bg-white/10"><i className="fas fa-angle-double-left text-[14px]" /></button>
      </div>
      <div className="px-3.5 pt-2.5 pb-1">
        <div role="tablist" className="flex bg-white/10 rounded-[10px] p-[3px] text-[14px] font-semibold">
          <button role="tab" aria-selected={back} onClick={() => setTab('back')} className={`flex-1 py-[5px] rounded-lg ${back ? 'bg-white text-legacy' : 'text-white/60'}`}>จัดการ</button>
          <button role="tab" aria-selected={!back} onClick={() => setTab('front')} className={`flex-1 py-[5px] rounded-lg ${!back ? 'bg-white text-legacy' : 'text-white/60'}`}>ปรับแต่ง</button>
        </div>
      </div>
      <nav className="flex-1 overflow-auto px-3 py-1">
        {groups.map(g => (
          <div key={g.label}>
            <div className="text-[11.5px] tracking-[.06em] text-white/40 font-semibold px-3 pt-3.5 pb-1 leading-[1.3]">{g.label}</div>
            {g.items.map(([label, icon, hint]) => {
              const on = !back && label === active
              return (
                <button key={label} onClick={() => !back && openItem(label)} aria-current={on ? 'page' : undefined}
                  className={`w-full text-left h-[34px] flex items-center px-3 gap-3 rounded-[9px] ${on ? 'bg-legacy-active text-white font-semibold' : 'text-white/70 hover:bg-white/5'}`}>
                  <span className="w-[22px] text-[16px] text-center flex-none"><i className={icon} /></span>
                  <span className="flex-1 truncate text-[13.5px]">{label}</span>
                  <span className="text-[11px] text-white/40">{hint}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="px-3.5 pt-2.5 pb-3 border-t border-white/8 flex items-center gap-2.5">
        <Mascot size={36} />
        <div className="flex-1 min-w-0"><div className="text-[14px] font-semibold text-white">ผู้ช่วย Ket</div><div className="text-[12px] text-white/45">พร้อมช่วยเสมอ · ⌘K</div></div>
      </div>
    </aside>
  )
}

export function SidebarBoldNarrow({ onExpand }: { onExpand: () => void }) {
  const { tab, openItem, setTab } = useSidebarActions()
  const active = useActive()
  const back = tab === 'back'
  const groups = back ? MANAGE_GROUPS : FRONT_GROUPS
  return (
    <aside className="w-[72px] h-screen bg-legacy flex flex-col items-center flex-none">
      <div className="h-[60px] flex items-center justify-center flex-none w-full border-b border-white/8"><img src="./img/Logo-Circle-Light.svg" alt="Ketshopweb" className="w-8 h-8" /></div>
      <button onClick={onExpand} title="ขยายเมนู" className="mt-2.5 mb-1.5 w-10 h-8 rounded-lg grid place-items-center text-white/55 bg-white/6 hover:bg-white/10 flex-none"><i className="fas fa-angle-double-right text-[14px]" /></button>
      <div role="tablist" className="w-12 bg-white/10 rounded-[10px] p-[3px] flex flex-col gap-0.5 text-[11px] font-semibold mb-1.5 flex-none">
        <button role="tab" aria-selected={back} title="จัดการ" onClick={() => setTab('back')} className={`py-[5px] rounded-[7px] ${back ? 'bg-white text-legacy' : 'text-white/60'}`}><i className="fas fa-store" /></button>
        <button role="tab" aria-selected={!back} title="ปรับแต่ง" onClick={() => setTab('front')} className={`py-[5px] rounded-[7px] ${!back ? 'bg-white text-legacy' : 'text-white/60'}`}><i className="fas fa-paint-brush" /></button>
      </div>
      <nav className="flex-1 overflow-auto w-full px-3 flex flex-col gap-0.5">
        {groups.map(g => (
          <div key={g.label} className="flex flex-col gap-0.5">
            <div className="h-px bg-white/10 mx-1 my-1.5 flex-none" />
            {g.items.map(([label, icon]) => {
              const on = !back && label === active
              return <button key={label} title={label} aria-label={label} onClick={() => !back && openItem(label)} className={`h-10 flex-none grid place-items-center rounded-[10px] text-[17px] ${on ? 'bg-legacy-active text-white' : 'text-white/70 hover:bg-white/5'}`}><i className={icon} /></button>
            })}
          </div>
        ))}
      </nav>
      <div className="pt-2 pb-3 flex-none" title="ผู้ช่วย Ket"><Mascot size={40} /></div>
    </aside>
  )
}
