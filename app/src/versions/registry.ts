/* 1 version = the whole back office (sidebar + every screen) in one concept.
   V1 = แนว A ปลอดภัย · V2 = แนว B กล้า · V3 = แนว C ลูกผสม — from "Ketshopweb CMS Mockups.dc.html". */

export type VersionId = 'v1' | 'v2' | 'v3'
export type ScreenId = 'entry' | 'page' | 'menu' | 'header' | 'footer' | 'system-design'

export const VERSIONS: { id: VersionId; label: string; name: string; track: string; sidebar: 'safe' | 'bold'; sbName: string; desc: string }[] = [
  { id: 'v1', label: 'V1', name: 'ปลอดภัย', track: 'แนว A', sidebar: 'safe', sbName: 'sidebar ดำจัดกลุ่ม 240px',
    desc: 'โครงหน้าจอเดิม · panel ขวา Sections / คุณสมบัติ / ประวัติ · ผู้ช่วย Ket เป็นช่องเล็กท้าย panel' },
  { id: 'v2', label: 'V2', name: 'กล้า', track: 'แนว B', sidebar: 'bold', sbName: 'sidebar ดำเดิม ย่อเป็นไอคอน 72px ได้',
    desc: 'พื้นครีม · panel ลอย · หน้าเลือกแบบ prompt ใหญ่กลางจอ · แชทผู้ช่วย Ket ขวาแบบ Lovable' },
  { id: 'v3', label: 'V3', name: 'ลูกผสม', track: 'แนว C', sidebar: 'safe', sbName: 'sidebar ดำจัดกลุ่ม 240px',
    desc: 'โครง 3 ช่องเดิม + ลูกเล่นจาก B · ผู้ช่วย Ket เป็น tab ใน panel ขวา · toolbar ลอยบน canvas' },
]

export const SCREENS: { id: ScreenId; short: string; name: string; sb: string; icon: string }[] = [
  { id: 'entry', short: 'หน้าเลือก', name: 'หน้าเลือก · ปรับแต่งเว็บไซต์', sb: 'Page Layouts', icon: 'far fa-window-restore' },
  { id: 'page', short: 'แต่งหน้าเว็บ', name: 'แต่งหน้าเว็บ · Page Layout', sb: 'Page Layouts', icon: 'fas fa-th-large' },
  { id: 'menu', short: 'Menu', name: 'Menu', sb: 'Menu', icon: 'fas fa-stream' },
  { id: 'header', short: 'Header', name: 'Header', sb: 'Header', icon: 'fas fa-heading' },
  { id: 'footer', short: 'Footer', name: 'Footer', sb: 'Footer', icon: 'fas fa-shoe-prints' },
  { id: 'system-design', short: 'System Design', name: 'System Design · สี & ฟอนต์', sb: 'System Design', icon: 'fas fa-palette' },
]

export const REF: Record<VersionId, Record<ScreenId, string>> = {
  v1: { entry: '1d', page: '1b', menu: '1f', header: '1h', footer: '1j', 'system-design': '1l' },
  v2: { entry: '1e', page: '1c', menu: '1g', header: '1i', footer: '1k', 'system-design': '1m' },
  v3: { entry: '3f', page: '3a', menu: '3b', header: '3c', footer: '3d', 'system-design': '3e' },
}

/* screens built so far (per version) */
export const READY: Record<VersionId, ScreenId[]> = {
  v1: ['entry', 'page', 'header', 'footer'],
  v2: ['entry', 'page', 'header', 'footer'],
  v3: ['entry', 'page', 'header', 'footer'],
}
export const isReady = (v: VersionId, s: ScreenId) => READY[v].includes(s)

export const FRONT_GROUPS: { label: string; items: [string, string, string?][] }[] = [
  { label: 'ออกแบบ · Design', items: [['Page Layouts', 'fas fa-th-large'], ['Header', 'fas fa-heading'], ['Footer', 'fas fa-shoe-prints'], ['Menu', 'fas fa-stream'], ['System Design', 'fas fa-palette', 'ใหม่'], ['เทมเพลต', 'far fa-clone', 'ย้าย']] },
  { label: 'เนื้อหา · Content', items: [['Product Display', 'fas fa-store'], ['Blog Manager', 'fas fa-pen-nib'], ['Coupon Display', 'fas fa-ticket-alt'], ['Event Popup', 'far fa-window-restore'], ['Sidebar', 'fas fa-columns'], ['Media', 'far fa-images', '⇄']] },
  { label: 'เว็บไซต์ & SEO', items: [['SEO', 'fas fa-search-location', 'ย้าย'], ['Conversion Tools', 'fas fa-chart-pie', 'ย้าย'], ['Google Map', 'fas fa-map-marked-alt', 'ย้าย'], ['Cookie · PDPA banner', 'fas fa-cookie-bite', '⇄'], ['Language', 'fas fa-globe-asia']] },
  { label: 'ขั้นสูง · Advanced', items: [['Button', 'far fa-hand-pointer'], ['Advance CSS', 'fas fa-code'], ['Maintenance', 'fas fa-tools']] },
]
export const MANAGE_GROUPS: { label: string; items: [string, string, string?][] }[] = [
  { label: 'ภาพรวม · Overview', items: [['Overview', 'fas fa-tachometer-alt'], ['Dashboard', 'fas fa-chart-line', '▾']] },
  { label: 'ขาย · Sales', items: [['E-commerce', 'fas fa-receipt', '▾'], ['Marketing', 'fas fa-bullhorn', '▾'], ['Delivery Manager', 'fas fa-shipping-fast', '▾']] },
  { label: 'สินค้า & ลูกค้า', items: [['Product Manager', 'fas fa-box-open', '▾'], ['Warehouse', 'fas fa-boxes', '▾'], ['Users', 'fas fa-user-friends', '▾']] },
  { label: 'ระบบ · System', items: [['Media', 'far fa-images', '⇄'], ['Email', 'far fa-envelope'], ['Extension', 'fas fa-plug'], ['History Logs', 'fas fa-history']] },
  { label: 'ตั้งค่าร้าน · Setting', items: [['ทั่วไป', 'fas fa-sliders-h'], ['การขาย · ขนส่ง · ชำระเงิน', 'far fa-credit-card'], ['การแจ้งเตือน', 'fas fa-bell'], ['PDPA · นโยบาย', 'fas fa-shield-alt', '⇄']] },
]
