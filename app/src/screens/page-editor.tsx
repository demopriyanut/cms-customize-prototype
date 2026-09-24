import { useEffect, useRef, useState } from 'react'
import { useChanges, usePage, useStore, type Device } from '@/data/store'
import { AI_PROPOSAL, LOCK_TEXT, type PageDoc } from '@/data/schema'
import { Canvas } from '@/components/storefront/Canvas'
import { useGo, useRoute } from '@/components/shell/nav'
import { Avatar, DeviceToggle, DiffCard, Legend, LockPill, MascotImg, Tabs, TierChips, usePanel } from '@/components/editor/parts'
import { HistoryPanel, LayerList, LibraryPanel, PageRuleBanner, PlacingBar, PropertiesPanel, PublishDialog, useEditorKeys } from '@/components/editor/panels'

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
  const w = device === 'desktop' ? Math.max(560, Math.min(960, avail)) : device === 'tablet' ? Math.min(640, Math.max(480, avail)) : 390
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
    <button onClick={onClick} title="เลือกหน้าอื่น" className={pill ? 'font-semibold flex items-center gap-2' : 'h-9 border border-ink-200 rounded-lg flex items-center px-3 gap-2 bg-white hover:border-ink-400'}>
      <i className="far fa-window-restore text-ink-500" /><span className="font-semibold">{page.name}</span>{withPath && <span className="text-ink-400">{page.path}</span>}<LockPill lock={page.lock} /><i className="fas fa-chevron-down text-[11px] text-ink-400" />
    </button>
  )
}
function UndoRedo({ canUndo, canRedo, round }: { canUndo: boolean; canRedo: boolean; round?: boolean }) {
  const undo = useStore(s => s.undo); const redo = useStore(s => s.redo)
  const c = `w-[30px] h-[30px] grid place-items-center ${round ? 'rounded-full' : 'rounded-md'} hover:bg-ink-100`
  return <><button onClick={undo} title="ย้อน (Ctrl+Z)" aria-label="ย้อน" className={`${c} ${canUndo ? '' : 'text-ink-300'}`}><i className="fas fa-undo" /></button><button onClick={redo} title="ทำซ้ำ (Ctrl+Shift+Z)" aria-label="ทำซ้ำ" className={`${c} ${canRedo ? '' : 'text-ink-300'}`}><i className="fas fa-redo" /></button></>
}
function PreviewToggle({ pill }: { pill?: boolean }) {
  const preview = useStore(s => s.preview); const setPreview = useStore(s => s.setPreview)
  return <button onClick={() => setPreview(!preview)} aria-pressed={preview} title="พรีวิว — ซ่อนกรอบและป้ายเพื่อดูหน้าจริง" className={`h-[30px] px-2.5 flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap ${pill ? 'rounded-full' : 'rounded-md'} ${preview ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100'}`}><i className={preview ? 'fas fa-eye' : 'far fa-eye'} />พรีวิว</button>
}
function Publish({ variant }: { variant: 'split' | 'pill' }) {
  const open = useStore(s => s.setPublishOpen)
  if (variant === 'pill') return <button onClick={() => open(true)} className="h-[38px] bg-ink-900 text-white rounded-full px-4.5 flex items-center gap-2 font-semibold shadow-md"><i className="fas fa-paper-plane text-[12px]" />เผยแพร่</button>
  return (
    <div className="h-9 flex rounded-lg overflow-hidden text-white font-semibold">
      <button onClick={() => open(true)} className="bg-red-600 hover:bg-red-700 px-4 flex items-center gap-2"><i className="fas fa-paper-plane text-[12px]" />เผยแพร่</button>
      <span className="bg-red-700 w-[30px] grid place-items-center"><i className="fas fa-chevron-down text-[11px]" /></span>
    </div>
  )
}
const ViewSite = () => <div className="h-9 border border-ink-200 rounded-lg flex items-center px-3.5 gap-2 bg-white font-medium"><i className="fas fa-external-link-alt text-[12px] text-ink-500" />ดูเว็บไซต์</div>
const DraftDot = ({ n, suffix = '' }: { n: number; suffix?: string }) => <div className="flex items-center gap-1.5 text-[13px] text-ink-500"><span className={`w-2 h-2 rounded-full ${n ? 'bg-warning-500' : 'bg-success-500'}`} />{n ? `ฉบับร่าง · ${n} การเปลี่ยนแปลง${suffix}` : 'ฉบับร่างตรงกับเว็บจริง'}</div>
function AddButton({ className = '', children }: { className?: string; children: React.ReactNode }) {
  const setLibrary = useStore(s => s.setLibrary); const open = useStore(s => s.libraryOpen)
  return <button onClick={() => setLibrary(!open)} aria-expanded={open} className={className}>{children}</button>
}
const pageCanInsert = (p: PageDoc) => (p.zones ?? []).some(z => z.insert)

/* ---------- V1 · 1b ---------- */
export function PageEditorA() {
  const { back, site, page, device, changes, canUndo, canRedo } = useEditor()
  const tab = usePanel('a', 'sections')
  const fit = useFitWidth(device)
  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-ink-100">
      <div className="h-[60px] bg-white border-b border-ink-150 flex items-center px-5 gap-3 flex-none">
        <PagePicker page={page} onClick={back} withPath />
        <DeviceToggle variant="square" />
        <span className="font-display text-[13px] text-ink-500 px-1">100%</span>
        <span className="w-px h-[22px] bg-ink-150" />
        <div className="h-9 flex items-center px-2.5 gap-1.5 text-ink-700"><i className="fas fa-globe text-ink-500" />TH <i className="fas fa-chevron-down text-[11px] text-ink-400" /></div>
        <button onClick={() => useStore.getState().setPanel('a', 'history')} className="h-9 flex items-center px-2.5 gap-1.5 text-ink-700 hover:bg-ink-50 rounded-lg"><i className="fas fa-history text-ink-500" />ประวัติ</button>
        <PreviewToggle />
        <div className="flex-1" />
        <DraftDot n={changes} suffix=" · บันทึกอัตโนมัติ" />
        <ViewSite /><Publish variant="split" />
        <div className="flex items-center gap-2 pl-2"><Avatar /><i className="fas fa-chevron-down text-[11px] text-ink-400" /></div>
      </div>
      <div className="flex-1 flex min-h-0 relative">
        <div ref={fit.ref} className="flex-1 relative overflow-auto flex flex-col items-center px-8 pt-10 pb-28 canvas-dots-ink">
          <PageRuleBanner page={page} className="mb-4 max-w-full" style={{ width: fit.w }} />
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-600 mb-3 max-w-full" style={{ width: fit.w }}><Legend all /></div>
          <div className="shadow-xl rounded-md self-center bg-white flex-none"><Canvas site={site} page={page} device={device} previewWidth={fit.w} /></div>
        </div>
        <PlacingBar className="absolute left-1/2 -translate-x-1/2 top-3" />
        <LibraryPanel page={page} className="absolute left-4 top-4" />
        <div className="fb absolute left-4 bottom-4 flex gap-1 bg-white border border-ink-150 rounded-lg p-1 shadow-sm text-ink-600 items-center">
          <UndoRedo canUndo={canUndo} canRedo={canRedo} />
        </div>
        <div className="fb absolute right-[376px] bottom-4 flex items-center gap-2 bg-ink-900 text-white rounded-full py-1.5 pl-1.5 pr-3 text-[13px] shadow-lg"><MascotImg size={24} />กด <b className="font-display">⌘K</b> เพื่อสั่งผู้ช่วย Ket</div>
        <div className="w-[360px] bg-white border-l border-ink-150 flex-none flex flex-col min-h-0">
          <Tabs id="a" def="sections" items={[['sections', <>Sections <span className="font-display text-ink-400 font-medium">{(page.sections ?? []).length + 2}</span></>], ['props', 'คุณสมบัติ'], ['history', 'ประวัติ']]} />
          {tab === 'sections' ? (
            <>
              <div className="px-4 pt-4 pb-3 flex gap-2">
                <AddButton className={`flex-1 h-9 border rounded-lg flex items-center justify-center gap-2 font-semibold ${pageCanInsert(page) ? 'border-ink-200 hover:bg-ink-50' : 'border-ink-150 text-ink-400'}`}><i className="fas fa-plus text-[12px]" />Add Section</AddButton>
                <button onClick={() => useStore.getState().showToast('สร้างด้วย AI — ยังไม่มีบทตั้งไว้ในรอบนี้ ลองข้อเสนอของผู้ช่วยใน V2 / V3')} className="h-9 px-3 rounded-lg flex items-center gap-1.5 font-semibold text-white" style={{ background: 'linear-gradient(135deg,var(--red-600),var(--orange-500))' }}><i className="fas fa-magic text-[12px]" />สร้างด้วย AI</button>
              </div>
              <div className="flex-1 overflow-auto px-4 pb-4"><LayerList site={site} page={page} variant="card" /></div>
            </>
          ) : tab === 'props' ? <PropertiesPanel site={site} pageId={page.id} /> : <HistoryPanel />}
          <div className="border-t border-ink-150 p-4 bg-ink-50">
            <div className="flex items-center gap-2 mb-2"><MascotImg size={26} className="border border-ink-150" /><span className="font-semibold text-[13.5px]">ผู้ช่วย Ket</span><span className="text-[12px] text-ink-500">แก้ลงฉบับร่างเท่านั้น</span></div>
            <div className="bg-white border border-ink-200 rounded-xl px-3 py-2.5 text-[13.5px] text-ink-400 flex items-center gap-2">บอกว่าอยากปรับอะไรในหน้านี้…<span className="ml-auto w-[26px] h-[26px] rounded-[7px] bg-red-600 text-white grid place-items-center"><i className="fas fa-arrow-up text-[11px]" /></span></div>
            <div className="flex gap-1.5 mt-2 flex-wrap text-[12px]">{['เปลี่ยนแบนเนอร์', 'เพิ่มสินค้าแนะนำ', 'ดูบนมือถือ'].map(l => <span key={l} className="border border-ink-200 rounded-full px-2 py-0.5 bg-white">{l}</span>)}</div>
          </div>
        </div>
      </div>
      <PublishDialog />
    </div>
  )
}

/* ---------- V2 · 1c ---------- */
export function PageEditorB({ collapsed }: { collapsed: boolean }) {
  const { back, site, page, device, changes, canUndo, canRedo } = useEditor()
  const tab = usePanel('b', 'chat')
  const fit = useFitWidth(device)
  const w = fit.w
  const isHome = page.id === 'home'
  void collapsed
  return (
    <div className="flex-1 relative min-w-0 min-h-0 flex bg-cream">
      <div ref={fit.ref} className="flex-1 relative overflow-auto flex flex-col items-center pt-[88px] pb-28 pl-[296px] pr-8 canvas-dots-cream">
        <PageRuleBanner page={page} className="mb-4 max-w-full" style={{ width: w }} />
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-600 mb-3 max-w-full" style={{ width: w }}><Legend all /></div>
        <div className="rounded-xl bg-white overflow-hidden flex-none" style={{ boxShadow: '0 24px 60px -20px rgba(94,22,24,.25),var(--shadow-lg)' }}><Canvas site={site} page={page} device={device} previewWidth={w} accent="var(--orange-600)" /></div>
      </div>
      <div className="absolute left-[292px] top-[18px] flex items-center gap-1 bg-white rounded-full py-[5px] pl-3.5 pr-1.5 shadow-lg border border-black/5">
        <PagePicker page={page} onClick={back} pill />
        <span className="w-px h-5 bg-ink-150 mx-2" />
        <DeviceToggle variant="pill" />
        <span className="font-display text-[13px] text-ink-500 px-2">100%</span>
        <PreviewToggle pill />
      </div>
      <div className="absolute right-[398px] top-[18px] flex items-center gap-2">
        <span className="h-[38px] bg-white rounded-full px-3.5 flex items-center gap-2 font-semibold shadow-sm"><i className="fas fa-external-link-alt text-[12px] text-ink-500" />ดูเว็บไซต์</span>
        <Publish variant="pill" />
      </div>
      <PlacingBar className="absolute left-1/2 -translate-x-1/2 top-[70px]" />
      <div className="absolute left-5 top-[84px] w-[252px] bg-white rounded-2xl shadow-lg border border-black/5 p-3.5 flex flex-col gap-1.5 max-h-[calc(100%-180px)] overflow-auto">
        <div className="flex items-center justify-between px-1.5 pt-0.5 pb-2"><span className="font-bold text-[14px]">Layers</span><span className="flex gap-2 text-ink-500"><i className="fas fa-search" /><AddButton><i className="fas fa-plus" /></AddButton></span></div>
        <LayerList site={site} page={page} variant="compact" />
        <AddButton className={`mt-1.5 border border-dashed rounded-[10px] p-2 text-center text-[13px] ${pageCanInsert(page) ? 'border-ink-300 text-ink-500 hover:bg-ink-50' : 'border-ink-200 text-ink-300'}`}><i className="fas fa-plus text-[11px]" /> เพิ่ม Section จากคลัง</AddButton>
      </div>
      <LibraryPanel page={page} className="absolute left-[284px] top-[84px]" />
      <div className="fb absolute right-[398px] bottom-4 flex items-center gap-2">
        <span className="flex gap-0.5 text-ink-600 bg-white rounded-full p-[3px] shadow-sm"><UndoRedo canUndo={canUndo} canRedo={canRedo} round /><button onClick={() => useStore.getState().setPanel('b', 'history')} title="ประวัติ" className="w-[30px] h-[30px] grid place-items-center rounded-full hover:bg-ink-100"><i className="fas fa-history" /></button></span>
        <span className="flex items-center gap-1.5 text-[13px] text-ink-600 bg-white rounded-full px-3 py-2 shadow-sm"><span className={`w-2 h-2 rounded-full ${changes ? 'bg-warning-500' : 'bg-success-500'}`} />{changes ? `ฉบับร่าง · ${changes} การเปลี่ยนแปลงรอเผยแพร่` : 'ฉบับร่างตรงกับเว็บจริง'}</span>
      </div>
      <div className="w-[380px] bg-white border-l border-ink-150 flex-none flex flex-col min-h-0">
        <div className="px-5 py-4 border-b border-ink-150 flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-full p-[2px]" style={{ background: 'linear-gradient(135deg,var(--red-600),var(--orange-500))' }}><MascotImg src="mascot-laptop.png" size={32} pos="center 22%" /></span>
          <div className="flex-1 min-w-0"><div className="font-bold">ผู้ช่วย Ket</div><div className="text-[12px] text-ink-500">เขียนลงฉบับร่าง · คุณเป็นคนกดเผยแพร่</div></div>
        </div>
        <div className="px-5 pt-3 pb-3 border-b border-ink-150">
          <span role="tablist" className="flex gap-0.5 bg-ink-100 rounded-full p-[3px] text-[13px] font-semibold">
            {([['chat', 'แชท'], ['props', 'คุณสมบัติ'], ['history', 'ประวัติ']] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => useStore.getState().setPanel('b', k)} className={`flex-1 py-1.5 rounded-full ${tab === k ? 'bg-white shadow-xs' : 'text-ink-500'}`}>{l}</button>)}
          </span>
        </div>
        {tab === 'chat' ? (
          <div className="flex-1 overflow-auto p-5 flex flex-col gap-4 text-[13.5px] leading-[1.6]">
            {isHome ? <>
              <div className="self-end max-w-[86%] bg-ink-900 text-white rounded-[16px_16px_4px_16px] px-3.5 py-2.5">{AI_PROPOSAL.prompt}</div>
              <div className="flex gap-2.5 items-start">
                <MascotImg src="mascot-idea.png" size={26} pos="center 22%" className="border border-ink-150" />
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div>ผมเตรียมให้ 2 จุดครับ — ไม่แตะ Header/Footer เพราะใช้ร่วมทุกหน้า ดูส่วนต่างแล้วกดยอมรับได้ทีละจุด</div>
                  <DiffCard />
                  <div className="text-[12px] text-ink-500 flex gap-1.5 items-center"><i className="fas fa-shield-alt" />ผ่านด่านตรวจ: ไม่มีสคริปต์ · ใช้สีจาก Token · ไม่แตะช่องที่ล็อก</div>
                </div>
              </div>
            </> : <AssistantNote page={page} />}
          </div>
        ) : tab === 'props' ? <PropertiesPanel site={site} pageId={page.id} /> : <HistoryPanel />}
        <div className="px-5 pt-4 pb-5 border-t border-ink-150">
          <TierChips labels={['T0 ประกอบจากบล็อก', 'T1 HTML/CSS', 'T2 JS']} />
          <div className="border border-ink-200 rounded-[14px] px-3 py-2.5 flex flex-col gap-2 shadow-xs">
            <div className="text-ink-400">สั่งต่อได้เลย เช่น "ทำเวอร์ชันมือถือให้กระชับขึ้น"</div>
            <div className="flex items-center gap-2.5 text-ink-500"><i className="fas fa-paperclip" /><i className="far fa-image" /><SelectedRef /><span className="ml-auto w-[30px] h-[30px] rounded-[9px] text-white grid place-items-center" style={{ background: 'linear-gradient(135deg,var(--red-600),var(--orange-500))' }}><i className="fas fa-arrow-up text-[12px]" /></span></div>
          </div>
        </div>
      </div>
      <PublishDialog />
    </div>
  )
}

/* ---------- V3 · 3a ---------- */
export function PageEditorC() {
  const { back, site, page, device, changes, canUndo, canRedo } = useEditor()
  const tab = usePanel('c', 'ai')
  const compare = useStore(s => s.compare); const setCompare = useStore(s => s.setCompare)
  const isHome = page.id === 'home'
  const fit = useFitWidth(device)
  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-cream">
      <div className="h-[60px] bg-white border-b border-ink-150 flex items-center px-5 gap-3 flex-none">
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
          <div ref={fit.ref} className="flex-1 overflow-auto flex flex-col items-center px-8 pt-[84px] pb-28 canvas-dots-cream">
            <PageRuleBanner page={page} className="mb-4 max-w-full" style={{ width: fit.w }} />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-600 mb-3 max-w-full" style={{ width: fit.w }}><Legend all /></div>
            <div className="rounded-[10px] bg-white overflow-hidden flex-none" style={{ boxShadow: '0 24px 60px -20px rgba(94,22,24,.25),var(--shadow-lg)' }}><Canvas site={site} page={page} device={device} previewWidth={fit.w} /></div>
          </div>
          <div className="absolute left-1/2 top-4 -translate-x-1/2 flex items-center gap-1 bg-white rounded-full p-[5px] shadow-lg border border-black/5">
            <DeviceToggle variant="pill" />
            <span className="font-display text-[13px] text-ink-500 px-2">100%</span>
            <span className="w-px h-5 bg-ink-150" />
            <span className="flex gap-0.5 text-ink-600"><UndoRedo canUndo={canUndo} canRedo={canRedo} round /></span>
            <span className="w-px h-5 bg-ink-150" />
            <span className="flex gap-0.5 bg-ink-100 rounded-full p-[3px] text-[12px] font-semibold">
              {([['before', 'ก่อน'], ['after', 'หลัง']] as const).map(([k, l]) => <button key={k} onClick={() => setCompare(k)} aria-pressed={compare === k} className={`px-2.5 py-1 rounded-full ${compare === k ? 'bg-white shadow-xs' : 'text-ink-500'}`}>{l}</button>)}
            </span>
            <PreviewToggle pill />
          </div>
          <PlacingBar className="absolute left-1/2 -translate-x-1/2 top-[62px]" />
          <LibraryPanel page={page} className="absolute left-4 top-4" />
        </div>
        <div className="w-[360px] bg-white border-l border-ink-150 flex-none flex flex-col min-h-0">
          <Tabs id="c" def="ai" items={[['sections', <>Sections <span className="font-display text-ink-400">{(page.sections ?? []).length + 2}</span></>], ['props', 'คุณสมบัติ'], ['ai', <><MascotImg size={18} className="border border-ink-150" />ผู้ช่วย Ket</>]]} />
          {tab === 'ai' ? (
            <>
              <div className="flex-1 overflow-auto p-5 flex flex-col gap-4 text-[13.5px] leading-[1.6]">
                {isHome ? <>
                  <div className="self-end max-w-[88%] bg-ink-900 text-white rounded-[16px_16px_4px_16px] px-3.5 py-2.5">เปลี่ยนแบนเนอร์เป็นโทน Autumn แล้วเพิ่มบล็อกสินค้าแนะนำใต้แบนเนอร์</div>
                  <div className="flex flex-col gap-2"><div>ผมเตรียมให้ 2 จุด — ไม่แตะ Header/Footer (ใช้ร่วมทุกหน้า) กดยอมรับทีละจุดได้ครับ</div><DiffCard accept="var(--red-600)" compact /></div>
                </> : <AssistantNote page={page} />}
              </div>
              <div className="px-5 pt-4 pb-5 border-t border-ink-150">
                <TierChips labels={['T0 บล็อกเดิม', 'T1 HTML/CSS', 'T2']} />
                <div className="border border-ink-200 rounded-xl px-3 py-2.5 flex items-center gap-2 text-ink-400">สั่งต่อ…<span className="ml-auto w-7 h-7 rounded-lg bg-red-600 text-white grid place-items-center"><i className="fas fa-arrow-up text-[11px]" /></span></div>
              </div>
            </>
          ) : tab === 'sections' ? (
            <div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
              <AddButton className={`h-9 border rounded-lg flex items-center justify-center gap-2 font-semibold ${pageCanInsert(page) ? 'border-ink-200 hover:bg-ink-50' : 'border-ink-150 text-ink-400'}`}><i className="fas fa-plus text-[12px]" />เพิ่ม Section จากคลัง</AddButton>
              <LayerList site={site} page={page} variant="card" />
            </div>
          ) : tab === 'props' ? <PropertiesPanel site={site} pageId={page.id} /> : <HistoryPanel />}
        </div>
      </div>
      <PublishDialog />
    </div>
  )
}

function SelectedRef() {
  const { site, page } = usePage(); const sel = useStore(s => s.selected)
  const s = [site.header, site.footer, ...(page.sections ?? [])].find(x => x.id === sel)
  return <span className="text-[12px] truncate">อ้างอิง: {s?.name ?? '—'}</span>
}
function AssistantNote({ page }: { page: PageDoc }) {
  return (
    <div className="flex gap-2.5 items-start">
      <MascotImg src="mascot-idea.png" size={26} pos="center 22%" className="border border-ink-150" />
      <div className="flex-1 bg-ink-50 rounded-xl p-3">หน้านี้ระดับ <b>{page.lock}</b> — {LOCK_TEXT[page.lock].rule}<br /><span className="text-ink-500 text-[12.5px]">ผมจะเสนอเฉพาะสิ่งที่หน้านี้อนุญาต และเขียนลงฉบับร่างเท่านั้น (บทตั้งไว้ของ prototype มีเฉพาะหน้าแรก)</span></div>
    </div>
  )
}
