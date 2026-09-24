import { useEffect } from 'react'
import { HashRouter, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

import { SCREENS, byId, mainVersions, refOf, subsOf, type ScreenId, type VersionId } from '@/versions/registry'
import { isReady, screenOf, sidebarOf } from '@/versions/screens'
import { SidebarBoldNarrow, SidebarBoldWide, SidebarSafe } from '@/components/shell/Sidebars'
import { Dock } from '@/components/shell/Dock'
import { useGo, useRoute, useUi } from '@/components/shell/nav'

/* hash routes when run locally; in-memory routes inside the Artifact frame (it only passes plain #anchors) */
const Router = import.meta.env.VITE_ROUTER === 'memory' ? MemoryRouter : HashRouter

export default function App() {
  return (
    <>
    <Router>
      <Routes>
        <Route path="/" element={<><IndexPage /><Dock /></>} />
        <Route path="/:v/:screen?" element={<><VersionShell /><Dock /></>} />
      </Routes>
    </Router>
    <div className="narrow-note" role="note"><div><b>เปิดบนจอคอมพิวเตอร์</b><br />prototype นี้จำลองหลังบ้าน CMS บนจอกว้าง 1280px ขึ้นไป</div></div>
    </>
  )
}

/* ---------- one version = its own sidebar + its own screens ---------- */
function VersionShell() {
  const { version, screen, missing } = useRoute()
  const { tab, v2Collapsed, set } = useUi()
  const loc = useLocation()
  useEffect(() => { set({ v2Collapsed: null }) }, [loc.pathname, set])   // V2 rail follows the mockup per screen

  const collapsedAuto = screen?.id === 'entry' || screen?.id === 'page'
  const collapsed = v2Collapsed ?? collapsedAuto
  const OwnSidebar = version ? sidebarOf(version.id) : null
  const rail = useUi(s => s.rail)
  const sbw = !version ? 0 : OwnSidebar ? (rail ? 72 : 240) : version.sidebar === 'bold' && collapsed ? 72 : 240
  useEffect(() => { document.body.style.setProperty('--sbw', sbw + 'px') }, [sbw])

  if (!version) return <IndexPage />
  const sidebar = OwnSidebar ? <OwnSidebar /> : version.sidebar === 'safe' ? <SidebarSafe />
    : collapsed ? <SidebarBoldNarrow onExpand={() => set({ v2Collapsed: false })} /> : <SidebarBoldWide onCollapse={() => set({ v2Collapsed: true })} />

  let body
  if (tab === 'back') body = <Placeholder title="ฝั่ง “จัดการ”" line="ไม่อยู่ในขอบเขต prototype นี้ — สนเฉพาะหน้าตกแต่งเว็บ · กด “ปรับแต่ง” เพื่อกลับ" />
  else if (missing) body = <Placeholder title={missing} line="ยังไม่มี mockup ของเมนูนี้ — ว่างไว้สำหรับลอง idea" />
  else if (screen && !isReady(version.id, screen.id)) body = <Placeholder title={`${version.label} · ${screen.name}`} line={`มี mockup แล้ว (${refOf(version.id, screen.id)}) — ทำเป็น prototype ในรอบถัดไป`} />
  else body = <Screen v={version.id} s={screen!.id} collapsed={collapsed} />

  return <div className="flex h-screen">{sidebar}<main className="flex-1 min-w-0 h-screen relative flex flex-col">{body}</main></div>
}

function Screen({ v, s, collapsed }: { v: VersionId; s: ScreenId; collapsed: boolean }) {
  const C = screenOf(v, s)
  return C ? <C collapsed={collapsed} /> : null
}

function Placeholder({ title, line }: { title: string; line: string }) {
  return (
    <div className="flex-1 grid place-items-center text-center text-ink-500 p-6">
      <div className="max-w-[400px] leading-relaxed"><i className="far fa-folder-open text-[26px] text-ink-300" /><br /><b className="text-[16px] text-ink-900">{title}</b><br />{line}</div>
    </div>
  )
}

/* ---------- หน้ารวมเวอร์ชัน (designer tool, no CMS sidebar) ---------- */
function IndexPage() {
  const go = useGo(); const set = useUi(s => s.set)
  useEffect(() => { document.body.style.setProperty('--sbw', '0px') }, [])
  const open = (v: VersionId, s: ScreenId) => { set({ tab: 'front' }); go.to(v, s) }
  return (
    <div className="h-screen overflow-auto bg-ink-50 px-12 pt-10 pb-28">
      <div className="text-[12px] font-semibold tracking-[.08em] text-ink-500 font-display">KETSHOPWEB CMS · ปรับแต่ง · PROTOTYPE</div>
      <h1 className="mt-1.5 mb-1.5 text-[26px] font-bold">หน้ารวมเวอร์ชัน</h1>
      <div className="text-ink-600 max-w-[720px] leading-relaxed">1 เวอร์ชัน = หลังบ้านทั้งชุด (sidebar + ทุกหน้า) ในแนวคิดเดียว · เข้าไปแล้วเดินในระบบได้เหมือนผู้ใช้จริง · สลับเทียบเวอร์ชันที่แถบ<b>ล่างกลาง</b> หรือกด <Kbd>[</Kbd> <Kbd>]</Kbd> — สลับแล้วยังอยู่หน้าเดิม · การแก้ในฉบับร่างใช้ร่วมกันทุกเวอร์ชันและไม่หายเมื่อรีเฟรช</div>
      <div className="mt-2.5 text-[12.5px] text-ink-500 leading-relaxed">อิงจาก <b>Ketshopweb CMS Mockups.dc.html</b> แนว A / B / C และ Blueprint v0.3 · ร้านตัวอย่าง GIRLY CLOSET เป็นข้อมูลจำลองจาก mockup · ไม่ต่อ backend</div>
      <div className="grid gap-4 mt-6" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))' }}>
        {mainVersions().map(v => {
          const subs = subsOf(v.id); const base = byId(v.base)
          return (
            <div key={v.id} className="bg-white border border-ink-200 rounded-[14px] p-4 flex flex-col gap-2.5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-[10px] bg-ink-900 text-white grid place-items-center font-bold font-display">{v.label}</span>
                <div className="flex-1 min-w-0"><div className="font-bold text-base">{v.name} <span className="font-medium text-[13px] text-ink-500">· {v.track}</span></div><div className="text-[12.5px] text-ink-500">{v.sbName}</div></div>
                {base && <span className="text-[11.5px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 whitespace-nowrap">ต่อยอดจาก {base.label}</span>}
              </div>
              <div className="text-[13.5px] text-ink-600 leading-[1.55]">{v.desc}</div>
              <button onClick={() => open(v.id, 'entry')} className="h-[38px] rounded-[10px] bg-red-600 text-white font-semibold flex items-center justify-center gap-2">เข้า {v.label} · เริ่มที่กด "ปรับแต่ง" <i className="fas fa-arrow-right text-[12px]" /></button>
              <ScreenList v={v.id} open={open} />
              {subs.length > 0 && (
                <div className="border-t border-ink-100 pt-2.5 flex flex-col gap-1.5">
                  <div className="text-[12px] font-semibold text-ink-500">เวอร์ชันย่อย · {subs.length}</div>
                  {subs.map(x => (
                    <button key={x.id} onClick={() => open(x.id, 'entry')} className="text-left flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] bg-ink-50 hover:bg-ink-100">
                      <span className="h-6 min-w-[38px] px-1.5 rounded-md bg-ink-700 text-white grid place-items-center font-bold font-display text-[12px]">{x.label}</span>
                      <span className="flex-1 min-w-0"><span className="block font-semibold truncate">{x.name}</span><span className="block text-[12px] text-ink-500 truncate">{x.desc}</span></span>
                      <i className="fas fa-arrow-right text-[11px] text-ink-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
function ScreenList({ v, open }: { v: VersionId; open: (v: VersionId, s: ScreenId) => void }) {
  return (
    <div className="flex flex-col gap-1 mt-0.5">
      {SCREENS.map(s => isReady(v, s.id) ? (
        <button key={s.id} onClick={() => open(v, s.id)} className="text-left flex items-center gap-2.5 px-2.5 py-[7px] border border-ink-150 rounded-[9px] bg-white hover:border-ink-400">
          <i className={`${s.icon} w-4 text-center text-ink-500`} /><span className="flex-1 font-semibold">{s.name}</span><span className="font-display text-[12px] text-ink-400">{refOf(v, s.id)}</span><i className="fas fa-arrow-right text-[11px] text-ink-400" />
        </button>
      ) : (
        <div key={s.id} className="flex items-center gap-2.5 px-2.5 py-[7px] border border-dashed border-ink-200 rounded-[9px] text-ink-400">
          <i className={`${s.icon} w-4 text-center`} /><span className="flex-1">{s.name}</span><span className="font-display text-[12px]">{refOf(v, s.id)}</span><span className="text-[11.5px] font-semibold px-2 py-0.5 rounded-full bg-ink-100 text-ink-500">รอบถัดไป</span>
        </div>
      ))}
    </div>
  )
}
function Kbd({ children }: { children: React.ReactNode }) {
  return <span className="font-display text-[11.5px] px-[5px] py-px rounded bg-ink-100 text-ink-600">{children}</span>
}
