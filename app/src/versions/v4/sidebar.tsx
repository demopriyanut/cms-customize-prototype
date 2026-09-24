/* V4 — sidebar "safe" cloned from components/shell/Sidebars.tsx (SidebarSafe) on 2026-09-24.
   Numbers back to CmsSidebar.dc.html (variant safe): rows 30px · text 13 · icons 13 · group label 10/600 caps .08em ·
   toggle 12 · footer 12/11 — the V1–V3 sidebar was enlarged (+4px rows, +0.5–1px text). Only V4 uses this file. */
import { FRONT_GROUPS, MANAGE_GROUPS } from '@/versions/registry'
import { useSidebarActions } from '@/components/shell/Sidebars'
import { useRoute } from '@/components/shell/nav'

export function SidebarV4() {
  const { tab, openItem, setTab } = useSidebarActions()
  const { screen, missing } = useRoute()
  const active = missing ?? screen?.sb ?? null
  const groups = tab === 'front' ? FRONT_GROUPS : MANAGE_GROUPS
  const tg = (on: boolean) => on ? 'bg-ink-0 text-ink-900 font-semibold' : 'text-ink-400'
  return (
    <aside className="w-[240px] h-screen bg-ink-900 flex flex-col text-[13px] text-ink-300 flex-none">
      <div className="h-14 flex items-center px-5 flex-none border-b border-ink-800"><img src="./img/Logo-Light-Color.png" alt="Ketshopweb" className="h-6 w-auto" /></div>
      <div className="px-3.5 pt-3.5 pb-1.5">
        <div role="tablist" className="flex bg-ink-800 rounded-lg p-[3px] text-[12px] font-medium">
          <button role="tab" aria-selected={tab === 'back'} onClick={() => setTab('back')} className={`flex-1 py-[5px] rounded-md ${tg(tab === 'back')}`}>จัดการ</button>
          <button role="tab" aria-selected={tab === 'front'} onClick={() => setTab('front')} className={`flex-1 py-[5px] rounded-md ${tg(tab === 'front')}`}>ปรับแต่ง</button>
        </div>
      </div>
      <nav className="flex-1 overflow-auto px-2.5 py-1">
        {groups.map(g => (
          <div key={g.label}>
            <div className="text-[10px] tracking-[.08em] uppercase text-ink-500 font-semibold px-2.5 pt-1.5 pb-0.5 font-display">{g.label}</div>
            {g.items.map(([label, icon, hint]) => {
              const on = tab === 'front' && label === active
              return (
                <button key={label} onClick={() => tab === 'front' && openItem(label)} aria-current={on ? 'page' : undefined}
                  className={`w-full text-left h-[30px] flex items-center px-2.5 gap-2.5 rounded-lg ${on ? 'bg-red-600 text-white font-semibold' : 'text-ink-300 hover:bg-white/5'}`}>
                  <span className="w-[18px] text-[13px] text-center flex-none opacity-90"><i className={icon} /></span>
                  <span className="flex-1 truncate">{label}</span>
                  <span className={`text-[10px] ${on ? 'text-white/70' : 'text-ink-500'}`}>{hint}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="px-3.5 pt-2 pb-2.5 border-t border-ink-800 flex items-center gap-2.5">
        <div className="w-[30px] h-[30px] rounded-full bg-ink-0 overflow-hidden flex-none"><img src="./img/mascot-hello.png" alt="" className="w-full h-full object-cover object-[center_20%]" /></div>
        <div className="flex-1 min-w-0"><div className="text-[12px] font-semibold text-ink-100">ผู้ช่วย Ket</div><div className="text-[11px] text-ink-500">พร้อมช่วยเสมอ · ⌘K</div></div>
        <span className="text-[11px] text-ink-500">8.7.4</span>
      </div>
    </aside>
  )
}
