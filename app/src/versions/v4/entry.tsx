/* V4 — cloned from V3 (EntryC in screens/entry.tsx) on 2026-09-24 so V4 can change without touching V3.
   Only V4 uses this file. */
import { EDITABLE_PAGES, LOCK_STYLE, LOCK_TEXT, PAGE_GROUPS, type PageDoc } from '@/data/schema'
import { diffSites, pageOf, useStore } from '@/data/store'
import { useGo, useRoute } from '@/components/shell/nav'

/* =====================================================================
   หน้าเลือก (after pressing "ปรับแต่ง") — V1 = 1d · V2 = 1e · V3 = 3f
   ===================================================================== */

function useOpenPage() {
  const { version } = useRoute(); const go = useGo(); const toast = useStore(s => s.showToast)
  return (p: PageDoc) => {
    if (p.lock === 'L3') return toast(`${p.name} · L3 ${LOCK_TEXT.L3.short} — ${LOCK_TEXT.L3.rule}`)
    if ((EDITABLE_PAGES.includes(p.id) || p.id.startsWith('new-')) && version) { useStore.getState().openPage(p.id); go.to(version.id, 'page') }
    else toast(`prototype นี้เปิดแต่งได้: หน้าแรก (L0) · รายละเอียดสินค้า (L1) · ตะกร้า (L2) — “${p.name}” ยังไม่มีเนื้อหาใน mockup`)
  }
}
function useNewPage() {
  const { version } = useRoute(); const go = useGo()
  return () => { const id = useStore.getState().createPage(); useStore.getState().openPage(id); if (version) go.to(version.id, 'page') }
}
function usePages() {
  const draft = useStore(s => s.draft); const published = useStore(s => s.published)
  const changed = new Set(diffSites(published, draft).map(c => c.pageName))
  // status comes from the real draft vs published (Landing 11.11 keeps the mockup's draft flag — it has no content here)
  return draft.pages.map(p => ({ ...p, status: changed.has(p.name) || p.mockDraft || !pageOf(published, p.id) ? 'ฉบับร่าง' : 'เผยแพร่แล้ว' }))
}
function NewPageBtn({ className }: { className: string }) {
  const create = useNewPage()
  return <button onClick={create} className={className}><i className="fas fa-plus text-[12px]" />สร้างหน้าใหม่</button>
}
const LockTag = ({ lock }: { lock: PageDoc['lock'] }) => <span className="text-caption font-bold px-1.5 py-0.5 rounded-[5px]" style={{ background: LOCK_STYLE[lock].bg, color: LOCK_STYLE[lock].fg }}>{lock}</span>

function Topbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-14 bg-white border-b border-ink-150 flex items-center px-6 gap-3 flex-none">
      <h1 className="font-bold text-title">ปรับแต่งเว็บไซต์</h1><span className="text-ink-500">/</span><span className="text-ink-600">เลือกหน้า</span>
      <div className="flex-1" />{children}
    </div>
  )
}
const ViewSite = ({ round }: { round?: boolean }) => (
  <span className={`h-9 border border-ink-200 bg-white flex items-center px-3.5 gap-2 font-medium ${round ? 'rounded-full' : 'rounded-lg'}`}><i className="fas fa-external-link-alt text-[11px] text-ink-500" />ดูเว็บไซต์</span>
)

function PageGroups({ withEdit }: { withEdit: boolean }) {
  const pages = usePages(); const open = useOpenPage()
  return (
    <div className="grid grid-cols-3 gap-3.5 flex-1 min-h-0">
      {PAGE_GROUPS.map(g => (
        <div key={g.key} className="bg-white border border-ink-150 rounded-[14px] flex flex-col overflow-hidden">
          <div className="py-2.5 px-3.5 border-b border-ink-100 flex items-center gap-2"><i className={`${g.icon} text-ink-500`} /><h3 className="font-bold">{g.label}</h3><span className="font-display text-ink-500">{g.count}</span><span className="ml-auto text-caption text-ink-500">{g.note}</span></div>
          <div className="p-1.5 flex flex-col gap-[3px] overflow-auto">
            {pages.filter(p => p.group === g.key).map(p => (
              <button key={p.id} onClick={() => open(p)} className={`w-full text-left flex items-center gap-2.5 px-2 py-[7px] rounded-[10px] ${p.lock === 'L3' ? 'opacity-50' : 'hover:bg-ink-50'}`}>
                <span className="w-11 h-[30px] rounded-[5px] border border-ink-150 flex-none" style={{ background: p.thumb }} />
                <span className="flex-1 min-w-0"><span className="block font-semibold text-body truncate">{p.name}</span><span className="block text-caption text-ink-500">{p.path} · {p.when}</span></span>
                {p.lock === 'L3' && <span className="text-caption text-ink-500">อ่านอย่างเดียว</span>}
                <LockTag lock={p.lock} />
                {p.status === 'ฉบับร่าง' ? <span className="text-caption font-semibold px-1.5 py-0.5 rounded-[5px] bg-warning-100 text-warning-700 whitespace-nowrap">ฉบับร่าง</span> : <span className="sr-only">เผยแพร่แล้ว</span>}
                {withEdit && <span className="text-caption font-semibold border border-ink-200 rounded-md px-2 py-[3px]">แก้ไข</span>}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------- V4 (โคลนจาก V3) · 3f ---------- */
export function EntryV4(_: { collapsed?: boolean }) {
  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-cream text-body">
      <Topbar>
        <span className="flex items-center gap-1.5 text-meta text-ink-500"><span className="w-2 h-2 rounded-full bg-warning-500" />2 หน้ามีฉบับร่างรอเผยแพร่</span>
        <ViewSite />
        <NewPageBtn className="h-9 rounded-lg bg-ink-900 text-white flex items-center px-3 gap-2 font-semibold" />
      </Topbar>
      <div tabIndex={0} aria-label="เนื้อหาหน้าเลือก" className="flex-1 overflow-auto px-6 pt-[22px] pb-24 flex flex-col gap-[18px] outline-none focus-visible:ring-2 focus-visible:ring-orange-600">
        <div className="rounded-[18px] shadow-md border border-black/5 px-[22px] py-[18px] flex items-center gap-5" style={{ background: '#fff radial-gradient(ellipse 40% 80% at 100% 50%,rgba(230,52,34,.08),transparent 70%)' }}>
          <img src="./img/mascot-hero.png" alt="" className="w-24 h-24 object-cover object-[50%_30%] rounded-full border-[3px] border-white shadow-md" />
          <div className="flex-1 min-w-0 flex flex-col gap-2.5">
            <div><div className="font-bold text-display">สวัสดีครับ admin — จะให้ช่วยแต่งอะไรดี?</div><div className="text-meta text-ink-500">พิมพ์สั่ง หรือวางรูปเว็บที่ชอบให้ผมล้อโครงตาม · ทุกอย่างลงฉบับร่างก่อน คุณกดเผยแพร่เอง</div></div>
            <div className="border border-ink-200 rounded-[14px] px-3 py-2.5 flex flex-col gap-2 bg-white">
              <div className="text-body text-ink-500">เช่น "เปลี่ยนแบนเนอร์หน้าแรกเป็นแคมเปญ 11.11 โทนดำ-ทอง"</div>
              <div className="flex items-center gap-2 text-ink-500 text-meta">
                <span className="flex items-center gap-1.5 border border-ink-200 rounded-full px-2.5 py-[3px]"><i className="far fa-window-restore" />หน้าแรก <i className="fas fa-chevron-down text-[9px]" /></span>
                <span className="flex items-center gap-1.5 border border-ink-200 rounded-full px-2.5 py-[3px]"><i className="fas fa-layer-group" />T0 บล็อกเดิม</span>
                <span className="flex items-center gap-1.5 border border-dashed border-ink-300 rounded-full px-2.5 py-[3px]"><i className="far fa-image" />วางรูป reference</span>
                <span className="ml-auto h-[34px] px-3.5 rounded-[10px] text-white flex items-center gap-2 font-semibold text-body" style={{ backgroundColor: 'var(--red-600)', backgroundImage: 'var(--ket-grad)' }}>สร้างฉบับร่าง <i className="fas fa-arrow-right text-[11px]" /></span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5"><h2 className="font-bold text-heading">เลือกหน้าที่จะแต่ง</h2><div className="h-8 w-[240px] border border-ink-200 rounded-lg bg-white flex items-center px-2.5 gap-2 text-ink-500 ml-1.5 text-meta"><i className="fas fa-search" />ค้นหาหน้า…</div><div className="flex-1" /><span className="text-meta text-ink-500">ป้าย <span className="font-semibold px-1.5 py-0.5 rounded-[5px] bg-warning-100 text-warning-700">ฉบับร่าง</span> = แก้แล้วยังไม่เผยแพร่</span></div>
        <PageGroups withEdit />
      </div>
    </div>
  )
}
