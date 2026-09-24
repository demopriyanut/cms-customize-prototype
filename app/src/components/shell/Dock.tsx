import { useEffect, useState } from 'react'
import { byId, flatOrder, mainVersions, refOf, rootOf, subsOf, type VersionDef, type VersionId } from '@/versions/registry'
import { useStore } from '@/data/store'
import { useGo, useRoute, useUi } from './nav'

/* =====================================================================
   Master V — bottom-centre version switcher. A designer tool, NOT part of the CMS.
   Versions are a tree: main versions (V1, V2 …) and their sub versions (V3.1 …).
   Switching keeps you on the same screen so versions compare like-for-like.
   ===================================================================== */
export function Dock() {
  const { version, screen, missing } = useRoute()
  const go = useGo()
  const { dockMini, dockPop, set } = useUi()
  const toast = useStore(s => s.toast)
  const resetAll = useStore(s => s.resetAll)
  const showToast = useStore(s => s.showToast)
  const [confirmReset, setConfirmReset] = useState(false)
  useEffect(() => { if (!dockPop) setConfirmReset(false) }, [dockPop])

  const tail = missing ? 'x:' + encodeURIComponent(missing) : (screen?.id ?? 'entry')
  const openVersion = (id: VersionId) => { set({ dockPop: false }); go.to(id, version ? tail : 'entry') }
  const root = version ? rootOf(version.id) : null
  const siblings = root ? subsOf(root.id) : []

  useEffect(() => { document.body.classList.toggle('dock-on', !dockMini) }, [dockMini])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t?.closest?.('input,textarea,select,[contenteditable="true"]')) return
      if (e.key === ']' || e.key === '[') {
        const list = flatOrder()
        const i = list.findIndex(x => x.id === version?.id)
        const n = list[(i + (e.key === ']' ? 1 : -1) + list.length) % list.length]
        openVersion(n.id)
      } else if (e.key === 'Escape') set({ dockPop: false })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (dockMini) return (
    <button onClick={() => set({ dockMini: false })} title="เปิด Master V" className="fixed bottom-0 z-[100] w-11 h-[30px] rounded-t-full bg-ink-900 text-white grid place-items-center shadow-lg -translate-x-1/2" style={{ left: 'calc(var(--sbw,0px) + (100vw - var(--sbw,0px)) / 2)' }}>
      <i className="fas fa-chevron-up text-[12px]" />
    </button>
  )

  const mains = mainVersions()
  const subCount = flatOrder().length - mains.length
  const pill = (x: VersionDef, on: boolean, sub?: boolean) => (
    <button key={x.id} onClick={() => openVersion(x.id)} title={`${x.label} · ${x.name} (${x.track})`} aria-current={on}
      className={`h-[26px] min-w-[30px] px-2.5 rounded-full font-semibold whitespace-nowrap ${sub ? 'text-[12px]' : 'text-[13px]'} ${on ? 'bg-white text-ink-900' : 'text-white/70 hover:text-white'}`}>{x.label}</button>
  )

  return (
    <div className="fixed bottom-3.5 z-[100] -translate-x-1/2" style={{ left: 'calc(var(--sbw,0px) + (100vw - var(--sbw,0px)) / 2)' }}>
      {toast && <div role="status" className="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+10px)] whitespace-nowrap bg-white text-ink-900 border border-ink-150 shadow-xl rounded-[10px] px-3.5 py-2 text-[13.5px]">{toast}</div>}
      {dockPop && (
        <div role="dialog" aria-label="Master V · เลือกเวอร์ชัน" className="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+10px)] w-[440px] bg-white rounded-2xl border border-ink-150 p-2 flex flex-col max-h-[70vh]" style={{ boxShadow: 'var(--shadow-3xl)' }}>
          <div className="flex items-center justify-between px-2.5 pt-2 pb-2.5 border-b border-ink-100 mb-1.5 flex-none">
            <span><b>Master V</b> <span className="text-[12.5px] text-ink-500">· {mains.length} หลัก{subCount ? ` · ${subCount} ย่อย` : ''}</span></span>
            <span className="text-[12px] text-ink-500"><Kbd>[</Kbd> <Kbd>]</Kbd> สลับ · <Kbd>Esc</Kbd> ปิด</span>
          </div>
          <div className="overflow-auto flex flex-col gap-0.5 min-h-0">
            {mains.map(x => {
              const subs = subsOf(x.id); const base = byId(x.base)
              return (
                <div key={x.id}>
                  <button onClick={() => openVersion(x.id)} aria-current={version?.id === x.id} className={`w-full text-left flex gap-2.5 p-2.5 rounded-[10px] ${version?.id === x.id ? 'bg-ink-50' : 'hover:bg-ink-50'}`}>
                    <span className="w-[30px] h-[30px] rounded-lg bg-ink-900 text-white font-bold font-display text-[13px] grid place-items-center flex-none">{x.label}</span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-1.5 font-semibold">{x.name} <span className="font-normal text-ink-500 text-[12.5px]">· {x.track}</span>
                        {base && <span className="ml-auto text-[11px] font-semibold px-1.5 py-px rounded-full bg-orange-50 text-orange-700 whitespace-nowrap">ต่อยอดจาก {base.label}</span>}</span>
                      <span className="block text-[12.5px] text-ink-500 leading-[1.45] mt-0.5">{x.desc}</span>
                    </span>
                  </button>
                  {subs.length > 0 && (
                    <div className="ml-[26px] pl-3 border-l-2 border-ink-100 flex flex-col gap-0.5 mb-1">
                      {subs.map(y => (
                        <button key={y.id} onClick={() => openVersion(y.id)} aria-current={version?.id === y.id} className={`w-full text-left flex gap-2 items-center px-2 py-1.5 rounded-lg ${version?.id === y.id ? 'bg-ink-50' : 'hover:bg-ink-50'}`}>
                          <span className="h-6 min-w-[38px] px-1.5 rounded-md bg-ink-700 text-white font-bold font-display text-[12px] grid place-items-center flex-none">{y.label}</span>
                          <span className="flex-1 min-w-0"><span className="block font-semibold text-[13px] truncate">{y.name}</span><span className="block text-[12px] text-ink-500 truncate">{y.desc}</span></span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex gap-1.5 mt-1.5 pt-1.5 border-t border-ink-100 flex-none">
            <button onClick={() => { set({ dockPop: false }); go.index() }} className="flex-1 h-9 rounded-lg hover:bg-ink-50 flex items-center gap-2 px-2.5 font-semibold"><i className="fas fa-th-large text-ink-500" />หน้ารวมเวอร์ชัน</button>
            {confirmReset
              ? <button onClick={() => { resetAll(); set({ dockPop: false }); showToast('รีเซ็ตข้อมูลตัวอย่างแล้ว — กลับเป็นแบบ mockup') }} className="h-9 rounded-lg bg-red-600 text-white flex items-center gap-2 px-3 font-semibold"><i className="fas fa-undo-alt" />ยืนยัน · ฉบับร่างทุกเวอร์ชันจะหาย</button>
              : <button onClick={() => setConfirmReset(true)} className="h-9 rounded-lg hover:bg-ink-50 flex items-center gap-2 px-2.5 text-ink-600"><i className="fas fa-undo-alt" />รีเซ็ตข้อมูล</button>}
          </div>
        </div>
      )}
      <div role="toolbar" aria-label="Master V · สลับเวอร์ชัน" className="flex items-center gap-1 bg-ink-900 text-white rounded-full p-[5px]" style={{ boxShadow: '0 12px 32px -8px rgba(10,11,15,.45),0 0 0 1px rgba(255,255,255,.06)' }}>
        <button onClick={() => set({ dockPop: !dockPop })} aria-expanded={dockPop} title="Master V" className="h-8 rounded-full px-3 flex items-center gap-2 font-semibold text-[13.5px] whitespace-nowrap hover:bg-white/8">
          <i className="fas fa-layer-group text-[13px] opacity-80" />{version ? `${version.label} · ${version.name}` : 'Master V'}<i className={`fas fa-chevron-${dockPop ? 'down' : 'up'} text-[9px] opacity-60`} />
        </button>
        <span className="w-px h-5 bg-white/15 mx-0.5" />
        <div className="flex gap-0.5 bg-white/8 rounded-full p-[3px]">{mains.map(x => pill(x, root?.id === x.id))}</div>
        {root && siblings.length > 0 && (
          <div className="flex gap-0.5 bg-white/8 rounded-full p-[3px] ml-0.5" aria-label={`เวอร์ชันย่อยของ ${root.label}`}>
            {pill(root, version?.id === root.id, true)}{siblings.map(y => pill(y, version?.id === y.id, true))}
          </div>
        )}
        {version && <span className="text-[12.5px] text-white/60 pl-1 pr-2 whitespace-nowrap">{screen ? `${screen.short} · ${refOf(version.id, screen.id)}` : missing}</span>}
        <span className="w-px h-5 bg-white/15 mx-0.5" />
        <button onClick={() => go.index()} title="หน้ารวมเวอร์ชัน" className="h-8 rounded-full px-2.5 hover:bg-white/8"><i className="fas fa-th-large text-[13px]" /></button>
        <button onClick={() => set({ dockMini: true, dockPop: false })} title="ซ่อน Master V" className="h-8 rounded-full px-2.5 hover:bg-white/8"><i className="fas fa-chevron-down text-[12px]" /></button>
      </div>
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <span className="font-display text-[11.5px] px-[5px] py-px rounded bg-ink-100 text-ink-600">{children}</span>
}
