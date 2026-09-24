import { useState } from 'react'
import { EDITABLE_PAGES, LOCK_STYLE, LOCK_TEXT, PAGE_GROUPS, type PageDoc } from '@/data/schema'
import { diffSites, pageOf, useStore } from '@/data/store'
import { useGo, useRoute } from '@/components/shell/nav'
import { Avatar } from '@/components/editor/parts'

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
const dot = (status: string) => status === 'ฉบับร่าง' ? 'var(--warning-500)' : 'var(--success-500)'
const LockTag = ({ lock }: { lock: PageDoc['lock'] }) => <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-[5px]" style={{ background: LOCK_STYLE[lock].bg, color: LOCK_STYLE[lock].fg }}>{lock}</span>

function Topbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-14 bg-white border-b border-ink-150 flex items-center px-6 gap-3 flex-none">
      <span className="font-bold text-[16px]">ปรับแต่งเว็บไซต์</span><span className="text-ink-400">/</span><span className="text-ink-600">เลือกหน้า</span>
      <div className="flex-1" />{children}
    </div>
  )
}
const ViewSite = ({ round }: { round?: boolean }) => (
  <span className={`h-9 border border-ink-200 bg-white flex items-center px-3.5 gap-2 font-medium ${round ? 'rounded-full' : 'rounded-lg'}`}><i className="fas fa-external-link-alt text-[12px] text-ink-500" />ดูเว็บไซต์</span>
)

function PageGroups({ withEdit }: { withEdit: boolean }) {
  const pages = usePages(); const open = useOpenPage()
  return (
    <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
      {PAGE_GROUPS.map(g => (
        <div key={g.key} className="bg-white border border-ink-150 rounded-[14px] flex flex-col overflow-hidden">
          <div className={`${withEdit ? 'py-2.5' : 'py-3'} px-3.5 border-b border-ink-100 flex items-center gap-2`}><i className={`${g.icon} text-ink-500`} /><span className="font-bold">{g.label}</span><span className="font-display text-ink-400">{g.count}</span><span className="ml-auto text-[12px] text-ink-500">{g.note}</span></div>
          <div className="p-1.5 flex flex-col gap-1 overflow-auto">
            {pages.filter(p => p.group === g.key).map(p => (
              <button key={p.id} onClick={() => open(p)} className={`w-full text-left flex items-center gap-2.5 p-2 rounded-[10px] ${p.lock === 'L3' ? 'opacity-50' : 'hover:bg-ink-50'}`}>
                <span className="w-11 h-8 rounded-[5px] border border-ink-150 flex-none" style={{ background: p.thumb }} />
                <span className="flex-1 min-w-0"><span className="block font-semibold text-[13.5px] truncate">{p.name}</span><span className="block text-[12px] text-ink-500">{p.path} · {p.when}</span></span>
                {p.lock === 'L3' && <span className="text-[11px] text-ink-500">อ่านอย่างเดียว</span>}
                <LockTag lock={p.lock} />
                <span className="w-2 h-2 rounded-full flex-none" style={{ background: dot(p.status) }} title={p.status} />
                {withEdit && <span className="text-[12px] font-semibold border border-ink-200 rounded-md px-2 py-[3px]">แก้ไข</span>}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------- V1 · 1d ---------- */
export function EntryA() {
  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-ink-50">
      <Topbar><ViewSite /><div className="flex items-center gap-2 pl-2"><Avatar /><span>admin shop</span><i className="fas fa-chevron-down text-[11px] text-ink-400" /></div></Topbar>
      <div className="flex-1 overflow-auto p-6 pb-24 flex flex-col gap-5">
        <div className="bg-white border border-ink-150 rounded-2xl px-5.5 py-4.5 flex items-center gap-4.5">
          <img src="./img/mascot-hello.png" alt="" className="w-16 h-[78px] object-cover object-[center_15%] rounded-xl" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base">สวัสดีครับ admin! วันนี้จะแต่งอะไรดี</div>
            <div className="text-[13px] text-ink-500 mb-2.5">ผู้ช่วย Ket แก้ลงฉบับร่างเท่านั้น คุณเป็นคนกดเผยแพร่เสมอ</div>
            <div className="flex gap-2 items-center">
              <div className="flex-1 h-[42px] border border-ink-200 rounded-xl flex items-center px-3.5 gap-2.5 text-ink-400"><i className="fas fa-magic text-red-600" />เช่น "เปลี่ยนแบนเนอร์หน้าแรกเป็นแคมเปญ 11.11"</div>
              <span className="h-[42px] px-4.5 rounded-xl bg-red-600 text-white flex items-center font-semibold">เริ่ม</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 text-[13px] w-[220px]">
            {[['far fa-image', 'เปลี่ยนแบนเนอร์ก่อนแคมเปญ'], ['fas fa-th-large', 'เพิ่มบล็อกสินค้าแนะนำ'], ['fas fa-mobile-alt', 'ดูหน้าตาบนมือถือ']].map(([ic, l]) => (
              <span key={l} className="border border-ink-200 rounded-lg px-2.5 py-1.5 flex gap-2 items-center"><i className={`${ic} text-ink-500`} />{l}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-[16px]">เลือกหน้าที่จะแต่ง</span>
          <div className="h-[34px] w-[260px] border border-ink-200 rounded-lg bg-white flex items-center px-2.5 gap-2 text-ink-400 ml-2.5"><i className="fas fa-search" />ค้นหาหน้า…</div>
          <div className="flex-1" />
          <span className="h-[34px] border border-ink-200 rounded-lg bg-white flex items-center px-3 gap-2 font-semibold"><i className="fas fa-magic text-red-600 text-[12px]" />สร้างหน้าจาก prompt</span>
          <NewPageBtn className="h-[34px] rounded-lg bg-ink-900 text-white flex items-center px-3 gap-2 font-semibold" />
        </div>
        <PageGroups withEdit={false} />
      </div>
    </div>
  )
}

/* ---------- V2 · 1e ---------- */
export function EntryB() {
  const pages = usePages(); const open = useOpenPage()
  const [g, setG] = useState<'on' | 'off' | 'sys'>('on')
  const list = pages.filter(p => p.group === g).slice(0, 5)   // mockup 1e shows 5 cards
  return (
    <div className="flex-1 min-w-0 min-h-0 relative overflow-auto flex flex-col items-center px-12 pt-10 pb-24" style={{ background: '#FAF6F2 radial-gradient(ellipse 60% 40% at 50% 0%,rgba(230,52,34,.10),transparent 70%)' }}>
      <div className="absolute right-6 top-5 flex items-center gap-2"><span className="h-[38px] bg-white rounded-full px-3.5 flex items-center gap-2 font-semibold shadow-sm"><i className="fas fa-external-link-alt text-[12px] text-ink-500" />ดูเว็บไซต์</span><span className="shadow-sm rounded-full"><Avatar size={38} /></span></div>
      <img src="./img/mascot-hero.png" alt="" className="w-[150px] h-[150px] object-cover object-[50%_30%] rounded-full border-4 border-white flex-none" style={{ boxShadow: '0 20px 40px -16px rgba(177,38,41,.35)' }} />
      <div className="font-bold text-[28px] tracking-[-.01em] mt-4">จะให้ผมช่วยแต่งอะไรดีครับ?</div>
      <div className="text-ink-500 mt-1 text-[14.5px]">พิมพ์สั่งได้เลย หรือเลือกหน้าด้านล่างเพื่อลากวางเอง — ทุกอย่างลงฉบับร่างก่อนเสมอ</div>
      <div className="w-full max-w-[760px] mt-5.5 bg-white rounded-[20px] shadow-xl border border-black/5 px-4.5 pt-4 pb-3 flex flex-col gap-3">
        <div className="text-[16px] text-ink-400">เช่น "ทำหน้า Landing สำหรับโปร 11.11 ใช้สินค้าหมวด Dresses ที่ลด 30%+ โทนสีตามแบรนด์"</div>
        <div className="flex items-center gap-2 text-ink-500 text-[13px]">
          <span className="flex items-center gap-1.5 border border-ink-200 rounded-full px-2.5 py-1"><i className="far fa-window-restore" />หน้าใหม่ <i className="fas fa-chevron-down text-[9px]" /></span>
          <span className="flex items-center gap-1.5 border border-ink-200 rounded-full px-2.5 py-1"><i className="fas fa-layer-group" />T0 ประกอบจากบล็อก <i className="fas fa-chevron-down text-[9px]" /></span>
          <i className="fas fa-paperclip ml-1.5" /><i className="far fa-image" />
          <span className="ml-auto h-9 px-4 rounded-xl text-white flex items-center gap-2 font-semibold text-[14px]" style={{ background: 'linear-gradient(135deg,var(--red-600),var(--orange-500))' }}>สร้างฉบับร่าง <i className="fas fa-arrow-right text-[12px]" /></span>
        </div>
      </div>
      <div className="flex gap-2 mt-3 text-[13px] text-ink-600 flex-wrap justify-center">
        {['เปลี่ยนแบนเนอร์ก่อนแคมเปญ', 'เพิ่มบล็อกสินค้าแนะนำ', 'แก้ข้อความใน Footer', 'ย้อนกลับเวอร์ชันเมื่อวาน'].map(l => <span key={l} className="bg-white rounded-full px-3 py-1.5 shadow-xs">{l}</span>)}
      </div>
      <div className="w-full mt-8.5 flex items-center gap-2.5">
        <span className="font-bold text-[16px]">หน้าทั้งหมด</span>
        <span role="tablist" className="flex gap-0.5 bg-black/5 rounded-full p-[3px] text-[13px] font-semibold">
          {PAGE_GROUPS.map(x => <button key={x.key} role="tab" aria-selected={x.key === g} onClick={() => setG(x.key)} className={`px-3 py-[5px] rounded-full ${x.key === g ? 'bg-white shadow-xs' : 'text-ink-500'}`}>{x.label} {x.count}</button>)}
        </span>
        <div className="flex-1" />
        <NewPageBtn className="h-[34px] bg-white rounded-full flex items-center px-3.5 gap-2 font-semibold shadow-xs" />
      </div>
      <div className="w-full mt-3.5 grid grid-cols-5 gap-3.5">
        {list.map(p => (
          <button key={p.id} onClick={() => open(p)} className="text-left bg-white rounded-[14px] shadow-sm hover:shadow-md border border-black/5 overflow-hidden">
            <span className="block h-[110px] relative" style={{ background: p.thumb }}><span className="absolute left-2 top-2"><LockTag lock={p.lock} /></span><span className="absolute right-2 top-2 text-[11px] font-semibold px-[7px] py-0.5 rounded-[5px] bg-white/90" style={{ color: dot(p.status) }}>● {p.status}</span></span>
            <span className="block px-3 py-2.5"><span className="block font-semibold text-[13.5px]">{p.name}</span><span className="block text-[12px] text-ink-500">{p.path} · {p.when}</span></span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- V3 · 3f ---------- */
export function EntryC() {
  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-cream">
      <Topbar>
        <span className="flex items-center gap-1.5 text-[13px] text-ink-500"><span className="w-2 h-2 rounded-full bg-warning-500" />2 หน้ามีฉบับร่างรอเผยแพร่</span>
        <ViewSite />
        <NewPageBtn className="h-9 rounded-lg bg-ink-900 text-white flex items-center px-3 gap-2 font-semibold" />
      </Topbar>
      <div className="flex-1 overflow-auto px-6 pt-5.5 pb-24 flex flex-col gap-4.5">
        <div className="rounded-[18px] shadow-md border border-black/5 px-5.5 py-4.5 flex items-center gap-5" style={{ background: '#fff radial-gradient(ellipse 40% 80% at 100% 50%,rgba(230,52,34,.08),transparent 70%)' }}>
          <img src="./img/mascot-hero.png" alt="" className="w-24 h-24 object-cover object-[50%_30%] rounded-full border-[3px] border-white shadow-md" />
          <div className="flex-1 min-w-0 flex flex-col gap-2.5">
            <div><div className="font-bold text-lg">สวัสดีครับ admin — จะให้ช่วยแต่งอะไรดี?</div><div className="text-[13px] text-ink-500">พิมพ์สั่ง หรือวางรูปเว็บที่ชอบให้ผมล้อโครงตาม · ทุกอย่างลงฉบับร่างก่อน คุณกดเผยแพร่เอง</div></div>
            <div className="border border-ink-200 rounded-[14px] px-3 py-2.5 flex flex-col gap-2 bg-white">
              <div className="text-[14.5px] text-ink-400">เช่น "เปลี่ยนแบนเนอร์หน้าแรกเป็นแคมเปญ 11.11 โทนดำ-ทอง"</div>
              <div className="flex items-center gap-2 text-ink-500 text-[13px]">
                <span className="flex items-center gap-1.5 border border-ink-200 rounded-full px-2.5 py-[3px]"><i className="far fa-window-restore" />หน้าแรก <i className="fas fa-chevron-down text-[9px]" /></span>
                <span className="flex items-center gap-1.5 border border-ink-200 rounded-full px-2.5 py-[3px]"><i className="fas fa-layer-group" />T0 บล็อกเดิม</span>
                <span className="flex items-center gap-1.5 border border-dashed border-ink-300 rounded-full px-2.5 py-[3px]"><i className="far fa-image" />วางรูป reference</span>
                <span className="ml-auto h-[34px] px-3.5 rounded-[10px] text-white flex items-center gap-2 font-semibold text-[13.5px]" style={{ background: 'linear-gradient(135deg,var(--red-600),var(--orange-500))' }}>สร้างฉบับร่าง <i className="fas fa-arrow-right text-[11px]" /></span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5"><span className="font-bold text-sm">เลือกหน้าที่จะแต่ง</span><div className="h-8 w-[240px] border border-ink-200 rounded-lg bg-white flex items-center px-2.5 gap-2 text-ink-400 ml-1.5 text-[13px]"><i className="fas fa-search" />ค้นหาหน้า…</div><div className="flex-1" /><span className="text-[13px] text-ink-500"><span className="text-success-500">●</span> เผยแพร่แล้ว &nbsp; <span className="text-warning-600">●</span> มีฉบับร่าง</span></div>
        <PageGroups withEdit />
      </div>
    </div>
  )
}
