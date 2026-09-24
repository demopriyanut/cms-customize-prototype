/* V4 — cloned from V3 (PageEditorC in screens/page-editor.tsx) on 2026-09-24 so V4 can change without touching V3.
   Only V4 uses this file. */
import { useEffect, useRef, useState } from 'react'
import { useChanges, usePage, useStore, type Device } from '@/data/store'
import { LOCK_TEXT, type PageDoc } from '@/data/schema'
import { Canvas } from '@/components/storefront/Canvas'
import { useGo, useRoute } from '@/components/shell/nav'
import { Avatar, DeviceToggle, DiffCard, Legend, LockPill, MascotImg, TierChips, usePanel } from './parts'
import { HistoryPanel, LayerList, LibraryPanel, PageRuleBanner, PlacingBar, PropertiesPanel, PublishDialog, useEditorKeys } from './panels'

/* =====================================================================
   แต่งหน้าเว็บ (Page Layout) — V1 = 1b · V2 = 1c · V3 = 3a
   Layout per mockup; behaviour per Blueprint D3/D4/B1 (shared by all versions):
   drag + drop line · locked drop explains why · library → choose spot · inline text edit ·
   properties (inherit vs override) · undo/redo · history · preview · publish with summary + guard checks.
   The page's lock level (L0/L1/L2) comes from data and changes what the editor allows.
   ===================================================================== */

/* preview width = the room the canvas has: desktop fills it (560–960), tablet ≤ 640, mobile at its real 390px */
function useFitWidth(device: Device) {
  const ref = useRef<HTMLDivElement>(null)
  const [avail, setAvail] = useState(800)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const measure = () => { const cs = getComputedStyle(el); setAvail(el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) }
    measure()
    const ro = new ResizeObserver(measure); ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const w = device === 'desktop' ? Math.max(560, Math.min(680, avail)) : device === 'tablet' ? Math.min(640, Math.max(480, avail)) : 390
  return { ref, w }
}

function useEditor() {
  useEditorKeys()
  const { version } = useRoute(); const go = useGo()
  const { site, page } = usePage()
  const device = useStore(s => s.device)
  const changes = useChanges()
  const past = useStore(s => s.past.length); const future = useStore(s => s.future.length)
  return { back: () => version && go.to(version.id, 'entry'), site, page, device, changes: changes.length, canUndo: past > 0, canRedo: future > 0 }
}

function PagePicker({ page, onClick, withPath, pill }: { page: PageDoc; onClick: () => void; withPath?: boolean; pill?: boolean }) {
  return (
    <button onClick={onClick} title="เลือกหน้าอื่น" className={pill ? 'font-semibold flex items-center gap-2' : 'h-9 border border-ink-400 rounded-lg flex items-center px-3 gap-2 bg-white hover:border-ink-400'}>
      <i className="far fa-window-restore text-ink-500" /><span className="font-semibold">{page.name}</span>{withPath && <span className="text-ink-500">{page.path}</span>}<LockPill lock={page.lock} /><i className="fas fa-chevron-down text-[11px] text-ink-400" />
    </button>
  )
}
function UndoRedo({ canUndo, canRedo, round }: { canUndo: boolean; canRedo: boolean; round?: boolean }) {
  const undo = useStore(s => s.undo); const redo = useStore(s => s.redo)
  const c = `w-[30px] h-[30px] grid place-items-center ${round ? 'rounded-full' : 'rounded-md'} hover:bg-ink-100`
  return <><button onClick={undo} title="ย้อน (Ctrl+Z)" aria-label="ย้อน" className={`${c} ${canUndo ? '' : 'text-ink-500'}`}><i className="fas fa-undo" /></button><button onClick={redo} title="ทำซ้ำ (Ctrl+Shift+Z)" aria-label="ทำซ้ำ" className={`${c} ${canRedo ? '' : 'text-ink-500'}`}><i className="fas fa-redo" /></button></>
}
function PreviewToggle({ pill }: { pill?: boolean }) {
  const preview = useStore(s => s.preview); const setPreview = useStore(s => s.setPreview)
  return <button onClick={() => setPreview(!preview)} aria-pressed={preview} title="พรีวิว — ซ่อนกรอบและป้ายเพื่อดูหน้าจริง" className={`h-[30px] px-2.5 flex items-center gap-1.5 text-body font-semibold whitespace-nowrap ${pill ? 'rounded-full' : 'rounded-md'} ${preview ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100'}`}><i className={preview ? 'fas fa-eye' : 'far fa-eye'} />พรีวิว</button>
}
function Publish({ variant }: { variant: 'split' | 'pill' }) {
  const open = useStore(s => s.setPublishOpen)
  if (variant === 'pill') return <button onClick={() => open(true)} className="h-[38px] bg-ink-900 text-white rounded-full px-4.5 flex items-center gap-2 font-semibold shadow-md"><i className="fas fa-paper-plane text-[11px]" />เผยแพร่</button>
  return (
    <div className="h-9 flex rounded-lg overflow-hidden text-white font-semibold">
      <button onClick={() => open(true)} className="bg-red-600 hover:bg-red-700 px-4 flex items-center gap-2"><i className="fas fa-paper-plane text-[11px]" />เผยแพร่</button>
      <span className="bg-red-700 w-[30px] grid place-items-center"><i className="fas fa-chevron-down text-[11px]" /></span>
    </div>
  )
}
const ViewSite = () => <div className="h-9 border border-ink-200 rounded-lg flex items-center px-3.5 gap-2 bg-white font-medium"><i className="fas fa-external-link-alt text-[11px] text-ink-500" />ดูเว็บไซต์</div>
const DraftDot = ({ n, suffix = '' }: { n: number; suffix?: string }) => <div className="flex items-center gap-1.5 text-body text-ink-500"><span className={`w-2 h-2 rounded-full ${n ? 'bg-warning-500' : 'bg-success-500'}`} />{n ? `ฉบับร่าง · ${n} การเปลี่ยนแปลง${suffix}` : 'ฉบับร่างตรงกับเว็บจริง'}</div>
function AddButton({ className = '', children }: { className?: string; children: React.ReactNode }) {
  const setLibrary = useStore(s => s.setLibrary); const open = useStore(s => s.libraryOpen)
  return <button onClick={() => setLibrary(!open)} aria-expanded={open} className={className}>{children}</button>
}
const pageCanInsert = (p: PageDoc) => (p.zones ?? []).some(z => z.insert)

/* ---------- V4 (โคลนจาก V3) · 3a ---------- */
export function PageEditorV4(_: { collapsed?: boolean }) {
  const { back, site, page, device, changes, canUndo, canRedo } = useEditor()
  const tab = usePanel('c', 'ai')
  const compare = useStore(s => s.compare); const setCompare = useStore(s => s.setCompare)
  const isHome = page.id === 'home'
  const fit = useFitWidth(device)
  return (
    <div className="text-body flex-1 flex flex-col min-w-0 min-h-0 bg-ink-50">
      <div className="h-14 bg-white border-b border-ink-150 flex items-center px-4 gap-2.5 flex-none">
        <h1 className="sr-only">แต่งหน้าเว็บ · {page.name}</h1>
        <PagePicker page={page} onClick={back} />
        <div className="h-9 flex items-center px-2.5 gap-1.5 text-ink-700"><i className="fas fa-globe text-ink-500" />TH <i className="fas fa-chevron-down text-[11px] text-ink-400" /></div>
        <button onClick={() => useStore.getState().setPanel('c', 'history')} className="h-9 flex items-center px-2.5 gap-1.5 text-ink-700 hover:bg-ink-50 rounded-lg"><i className="fas fa-history text-ink-500" />ประวัติ</button>
        <div className="flex-1" />
        <DraftDot n={changes} />
        <ViewSite /><Publish variant="split" />
        <div className="pl-2"><Avatar /></div>
      </div>
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 relative min-w-0 flex flex-col">
          <div ref={fit.ref} tabIndex={0} role="region" aria-label="หน้าเว็บ (canvas) · เลือก Section จากรายการ Sections ได้ด้วยคีย์บอร์ด" className="flex-1 overflow-auto flex flex-col items-center px-8 pt-[84px] pb-28 canvas-dots-cool outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-600">
            <PageRuleBanner page={page} className="mb-4 max-w-full" style={{ width: fit.w }} />
            <div className="rounded-[10px] bg-white overflow-hidden flex-none" style={{ boxShadow: '0 24px 60px -20px rgba(94,22,24,.25),var(--shadow-lg)' }}><Canvas site={site} page={page} device={device} previewWidth={fit.w} selBar="float" accent="var(--orange-600)" /></div>
          </div>
          <div className="absolute left-1/2 top-4 -translate-x-1/2 flex items-center gap-1 bg-white rounded-full p-[5px] shadow-lg border border-black/5">
            <DeviceToggle variant="pill" />
            <span className="font-display text-body text-ink-500 px-2">100%</span>
            <span className="w-px h-5 bg-ink-150" />
            <span className="flex gap-0.5 text-ink-600"><UndoRedo canUndo={canUndo} canRedo={canRedo} round /></span>
            <span className="w-px h-5 bg-ink-150" />
            <span className="flex gap-0.5 bg-ink-100 rounded-full p-[3px] text-caption font-semibold">
              {([['before', 'ก่อน'], ['after', 'หลัง']] as const).map(([k, l]) => <button key={k} onClick={() => setCompare(k)} aria-pressed={compare === k} className={`px-2.5 py-1 rounded-full ${compare === k ? 'bg-white shadow-xs' : 'text-ink-500'}`}>{l}</button>)}
            </span>
            <PreviewToggle pill />
          </div>
          <div className="fb absolute left-4 bottom-4 flex gap-2.5 text-caption text-ink-600 bg-white rounded-full px-3 py-1.5 shadow-sm"><Legend all /></div>
          <PlacingBar className="absolute left-1/2 -translate-x-1/2 top-[62px]" />
          <LibraryPanel page={page} className="absolute left-4 top-4" />
        </div>
        <div className="w-[340px] bg-white border-l border-ink-150 flex-none flex flex-col min-h-0">
          <PanelTabs id="c" def="ai" items={[['sections', <>Sections <span className="font-display text-ink-500">{(page.sections ?? []).length + 2}</span></>], ['props', 'คุณสมบัติ'], ['ai', <><MascotImg size={18} className="border border-ink-150" />ผู้ช่วย Ket</>]]} />
          {tab === 'ai' ? (
            <>
              <div tabIndex={0} aria-label="บทสนทนากับผู้ช่วย Ket" className="flex-1 overflow-auto p-5 flex flex-col gap-4 text-body leading-[1.6] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-600">
                {isHome ? <>
                  <div className="self-end max-w-[88%] bg-ink-900 text-white rounded-[16px_16px_4px_16px] px-3.5 py-2.5">เปลี่ยนแบนเนอร์เป็นโทน Autumn แล้วเพิ่มบล็อกสินค้าแนะนำใต้แบนเนอร์</div>
                  <div className="flex flex-col gap-2"><div>ผมเตรียมให้ 2 จุด — ไม่แตะ Header/Footer (ใช้ร่วมทุกหน้า) กดยอมรับทีละจุดได้ครับ</div><DiffCard accept="var(--ink-900)" compact /></div>
                </> : <AssistantNote page={page} />}
              </div>
              <div className="px-5 pt-4 pb-5 border-t border-ink-150">
                <TierChips labels={['T0 บล็อกเดิม', 'T1 HTML/CSS', 'T2']} />
                <div className="border border-ink-200 rounded-xl px-3 py-2.5 flex items-center gap-2 text-ink-500">สั่งต่อ…<span className="ml-auto w-7 h-7 rounded-lg text-white grid place-items-center" style={{ backgroundColor: 'var(--red-600)', backgroundImage: 'var(--ket-grad)' }}><i className="fas fa-arrow-up text-[11px]" /></span></div>
              </div>
            </>
          ) : tab === 'sections' ? (
            <div tabIndex={0} aria-label="รายการ Sections" className="flex-1 overflow-auto p-4 flex flex-col gap-3 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-600">
              <AddButton className={`h-9 border rounded-lg flex items-center justify-center gap-2 font-semibold ${pageCanInsert(page) ? 'border-ink-200 hover:bg-ink-50' : 'border-ink-150 text-ink-400'}`}><i className="fas fa-plus text-[11px]" />เพิ่ม Section จากคลัง</AddButton>
              <LayerList site={site} page={page} variant="card" />
            </div>
          ) : tab === 'props' ? <PropertiesPanel site={site} pageId={page.id} /> : <HistoryPanel />}
        </div>
      </div>
      <PublishDialog />
    </div>
  )
}

function AssistantNote({ page }: { page: PageDoc }) {
  return (
    <div className="flex gap-2.5 items-start">
      <MascotImg src="mascot-idea.png" size={26} pos="center 22%" className="border border-ink-150" />
      <div className="flex-1 bg-ink-50 rounded-xl p-3">หน้านี้ระดับ <b>{page.lock}</b> — {LOCK_TEXT[page.lock].rule}<br /><span className="text-ink-500 text-meta">ผมจะเสนอเฉพาะสิ่งที่หน้านี้อนุญาต และเขียนลงฉบับร่างเท่านั้น (บทตั้งไว้ของ prototype มีเฉพาะหน้าแรก)</span></div>
    </div>
  )
}

/* 3a tab strip: 13px · padding 14 / 10 / 12 (the shared Tabs is 14px for V1–V3) */
function PanelTabs({ id, items, def }: { id: string; items: [string, React.ReactNode][]; def: string }) {
  const cur = useStore(s => s.panel[id] ?? def); const setPanel = useStore(s => s.setPanel)
  return (
    <div role="tablist" className="flex border-b border-ink-150 px-2 font-medium text-ink-500 text-body flex-none">
      {items.map(([k, label]) => (
        <button key={k} role="tab" aria-selected={k === cur} onClick={() => setPanel(id, k)}
          className={`pt-3.5 pb-3 px-2.5 flex gap-1.5 items-center ${k === cur ? 'text-ink-900 font-semibold border-b-2 border-orange-600 -mb-px' : 'hover:text-ink-900'}`}>{label}</button>
      ))}
    </div>
  )
}
