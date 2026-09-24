/* =====================================================================
   Page Schema (mock) — per Blueprint v0.3
   D2: Site → Theme tokens → Header & Footer (site-level, shared by every page) → Page → Zone (Region) → Section
   D3: every PAGE declares its lock level; the editor reads it from data and changes behaviour — no per-page code.
       L0 free · L1 insert only in open zones · L2 values only · L3 read-only (not listed for editing)
   Demo data = what the mockup already contains (GIRLY CLOSET, products, tokens). Generic UI labels only beyond that.
   ===================================================================== */

export type Lock = 'L0' | 'L1' | 'L2' | 'L3'
export type Device = 'desktop' | 'tablet' | 'mobile'
export type SectionType =
  | 'header' | 'footer'                                 // site-level regions
  | 'marquee' | 'hero' | 'products' | 'benefit'         // content blocks from the mockup storefront
  | 'library'                                           // a block added from the library (placeholder look)
  | 'product-info' | 'cart'                             // system blocks (L1 / L2 pages)

/* role on the canvas — what the user may do with it (D3 legend) */
export type Role = 'free' | 'system' | 'global'

export type ColorRef = { token: string } | { hex: string }
export interface SectionStyle {
  bg?: ColorRef                    // undefined = inherit (no own background · Header: Token พื้นผิว)
  fg?: ColorRef                    // text colour (Header menu) · undefined = inherit Token ตัวอักษร
  spacing?: 'S' | 'M' | 'L'
  hideOn?: Device[]
}

/* Footer = rows → columns (mockup 1j / 1k / 3d); one set of rows per language (TH = main) */
export interface FooterLink { label: string; href: string }
export interface FooterCol { id: string; kind: 'brand' | 'links' | 'social' | 'payments' | 'copyright' | 'empty'; title: string; text?: string; links?: FooterLink[]; items?: string[] }
export interface FooterRow { id: string; cols: FooterCol[]; widths: number[]; bg?: ColorRef; padY: number; hidden?: boolean; hideOn?: Device[]; bar?: boolean }

export interface Section {
  id: string
  type: SectionType
  name: string
  meta: string
  role: Role
  zone: string                     // zone id inside the page ('site' for header/footer)
  hidden?: boolean
  data: Record<string, string>
  style?: SectionStyle
  origin?: 'ai'                    // added by ผู้ช่วย Ket (T0)
  rows?: Record<string, FooterRow[]>  // footer only · key = language
}

export interface Zone {
  id: string
  label: string
  insert: boolean                  // may new blocks be dropped here?
  closedNote?: string              // shown when a zone exists but is closed for this shop
}

export interface PageDoc {
  id: string
  name: string
  path: string
  lock: Lock
  group: 'on' | 'off' | 'sys'
  when: string
  thumb: string
  mockDraft?: boolean              // mockup shows this page as having a draft
  zones?: Zone[]                   // pages that can be opened in the editor
  sections?: Section[]
}

export interface Token { name: string; hex: string }

/* Menu (mockup 1f / 1g / 3b · flow 3u) — drives the Header navigation
   layout: normal = dropdown of children · col1–3 = columns of links + banner (Menu Collection) · none = no submenu */
export type MenuLayout = 'none' | 'normal' | 'col1' | 'col2' | 'col3'
export interface MenuLink { name: string; url: string }
export interface MenuItem {
  id: string
  kind: string                     // one of MENU_TYPES keys (+ 'system')
  i18n: Record<string, string>     // ชื่อเมนู TH / EN / JP / CN ('' = ยังไม่ใส่)
  target: string                   // ลิงก์ไปที่ (label shown in the picker)
  layout: MenuLayout
  children: MenuItem[]
  cols: { head: string; links: MenuLink[] }[]
  banner?: { url: string }
  showOn: Record<Device, boolean>
  newTab?: boolean
  iconOnly?: boolean               // shown as a search icon (ผู้ช่วยเสนอใน 1g)
}

export interface SiteDoc {
  name: string
  tokens: Token[]
  header: Section
  footer: Section
  menu: MenuItem[]
  pages: PageDoc[]
}

export const HOME_ID = 'home'
export const EDITABLE_PAGES = ['home', 'product-detail', 'cart']

/* tokens from mockup 1l (สีหลักของร้าน) */
const TOKENS: Token[] = [
  { name: 'Primary', hex: '#134083' }, { name: 'Accent', hex: '#E32929' }, { name: 'ตัวอักษร', hex: '#13151B' },
  { name: 'พื้นผิว', hex: '#DFE7F3' }, { name: 'พื้นเข้ม (Footer)', hex: '#2D2A28' }, { name: 'ราคา', hex: '#000000' },
]

export const PRODUCTS = [
  { name: 'Aloe Water Jelly 50ml', price: '฿590', bg: '#f6dfe6' },
  { name: 'Hydra Gel Cream', price: '฿690', bg: '#f3f3f3' },
  { name: 'Happy Frog Mask Set', price: '฿290', bg: '#e6f0fb' },
  { name: 'Scrunchie Bag Mini', price: '฿1,290', bg: '#ecebf5' },
]

const Z_MAIN: Zone[] = [{ id: 'main', label: 'เนื้อหาของหน้า', insert: true }]

const home: Section[] = [
  { id: 's-marquee-1', type: 'marquee', role: 'free', zone: 'main', name: 'ข้อความวิ่ง · SALE', meta: 'Marquee', data: { text: 'SALE • LIMITED TIME' } },
  { id: 's-hero', type: 'hero', role: 'free', zone: 'main', name: 'Hero Banner', meta: 'Slider · 2 สไลด์', data: {
    tag: 'GIRLY CLOSET', title: 'NEW COLLECTION 2026',
    body: 'อัปเดตลุคใหม่กับคอลเลกชันล่าสุด รวมไอเทมที่ต้องมี ไม่ว่าจะลุคชิล ลุคเที่ยว หรือวันสบายๆ ก็ครบจบในที่เดียว',
    cta: 'SHOP NOW', panelBg: '#faf8f5' } },
  { id: 's-marquee-2', type: 'marquee', role: 'free', zone: 'main', name: 'ข้อความวิ่ง · SALE', meta: 'Marquee', data: { text: 'SALE • LIMITED TIME' } },
  { id: 's-products', type: 'products', role: 'free', zone: 'main', name: 'Product · แนะนำ', meta: 'Product_ห้ามลบ · 4 ชิ้น', data: { title: 'SHOP NOW', badge: 'RECOMMENDED' } },
  { id: 's-benefit', type: 'benefit', role: 'free', zone: 'main', name: 'benefit', meta: 'รูปภาพ · 1 element', data: {} },
]

/* L1 — product detail (mockup 1l product card data + D3 layout: ช่องบน / บล็อกสินค้าของระบบ / ช่องล่าง) */
const productDetail: Section[] = [
  { id: 'p-info', type: 'product-info', role: 'system', zone: 'system', name: 'รายละเอียดสินค้า', meta: 'บล็อกของระบบ · ข้อมูลจากคลังสินค้า', data: {
    name: 'Aloe Water Jelly 50ml', desc: 'เจลบำรุงผิวสูตรว่านหางจระเข้', price: '฿590', compare: '฿790', cta: 'หยิบใส่ตะกร้า', showCompare: 'yes' } },
]
const Z_L1: Zone[] = [
  { id: 'top', label: 'ช่องบน · แทรกได้', insert: true },
  { id: 'system', label: 'บล็อกสินค้าของระบบ', insert: false },
  { id: 'bottom', label: 'ช่องล่าง · แทรกได้', insert: true },
]

/* L2 — cart: values only (ข้อความ · ซ่อนฟิลด์ · สีปุ่ม) + bottom slot open only for some shops */
const cart: Section[] = [
  { id: 'c-cart', type: 'cart', role: 'system', zone: 'system', name: 'ตะกร้าสินค้า', meta: 'บล็อกของระบบ · แก้ได้เฉพาะค่า', data: {
    title: 'ตะกร้าสินค้า', cta: 'ดำเนินการชำระเงิน', showNote: 'yes', showCoupon: 'yes', noteLabel: 'หมายเหตุถึงร้าน', couponLabel: 'โค้ดส่วนลด' },
    style: { bg: { token: 'Primary' } } },
]
const Z_L2: Zone[] = [
  { id: 'system', label: 'บล็อกของระบบ', insert: false },
  { id: 'bottom', label: 'ช่องล่าง', insert: false, closedNote: 'เปิดเฉพาะบางร้าน' },
]

/* Header settings — values as shown in mockup 1h / 1i / 3c (Navigation tab):
   Layout มาตรฐาน · ตัวอักษรเมนู Prompt 12 px · Sticky on · Top bar on · มือถือยุบเป็น ☰ on · โปร่งใสทับแบนเนอร์ off
   colours: พื้นหลัง inherits Token พื้นผิว (#DFE7F3) · ตัวอักษรเมนู overridden #333333 */
const HEADER_DATA: Record<string, string> = {
  phone: '02-345-6789', logo: 'GIRLY CLOSET',
  layout: 'standard', menuFont: 'Prompt', menuSize: '12', menuUpper: 'yes',
  sticky: 'yes', topbar: 'yes', mobileMenu: 'yes', transparent: 'no',
}
export const HEADER_INHERIT = { bg: 'พื้นผิว', fg: 'ตัวอักษร' }
export const NAV_LAYOUTS = [
  { key: 'standard', name: 'มาตรฐาน', justify: 'space-between', logoOrder: 1 },
  { key: 'center', name: 'โลโก้กลาง', justify: 'center', logoOrder: 2 },
  { key: 'left', name: 'เมนูซ้าย', justify: 'flex-start', logoOrder: 3 },
] as const
export const MENU_FONTS = ['Prompt', 'Poppins']   // the two faces of the Ketshopweb DS
/* "ลองแบบอื่นด้วยผู้ช่วย Ket" — the 3 alternatives from mockup 1i / 3c (logo / menu / tokens kept, arrangement changes) */
export const HEADER_PRESETS: { key: string; name: string; desc: string; data: Record<string, string>; style: SectionStyle }[] = [
  { key: 'minimal', name: 'Minimal', desc: 'โลโก้ซ้าย · เมนูตัวเล็ก · ไม่มี top bar', data: { layout: 'standard', topbar: 'no', menuSize: '11' }, style: { bg: { hex: '#FFFFFF' }, fg: { hex: '#222222' } } },
  { key: 'editorial', name: 'Editorial', desc: 'โลโก้กลาง · เมนูใต้โลโก้', data: { layout: 'stacked' }, style: { bg: { hex: '#FAF8F5' }, fg: { hex: '#222222' } } },
  { key: 'dark', name: 'Dark contrast', desc: 'พื้นเข้มจาก Token Surface Dark', data: { layout: 'standard' }, style: { bg: { token: 'พื้นเข้ม (Footer)' }, fg: { hex: '#FFFFFF' } } },
]

/* Footer rows as drawn in mockup 1j / 1k / 3d (row list data "footerRows"):
   แถว 1 · 4 คอลัมน์ 1.4fr 1fr 1fr 1fr (แบรนด์ / Shop / Help / Follow) · พื้น Token พื้นเข้ม · ระยะบน–ล่าง 40 px · แสดงบนคอม+แท็บเล็ต
   แถว 2 · ช่องทางชำระเงิน · แถว 3 · ลิขสิทธิ์ (both on the darker bar #242220)
   Help links have no URL in the mockup → left empty (ยังไม่ผูกลิงก์) */
export const FOOTER_LANGS = ['TH', 'EN', 'JP', 'CN']
export const FOOTER_TEXT = '#CFC8C2'             // mockup: "Token · On Dark" — not in the 1l token set
const FOOTER_ROWS: FooterRow[] = [
  { id: 'fr-1', widths: [1.4, 1, 1, 1], padY: 40, hideOn: ['mobile'], cols: [
    { id: 'fc-brand', kind: 'brand', title: 'GIRLY CLOSET', text: 'เสื้อผ้าแฟชั่นผู้หญิง ส่งไวทั่วไทย\n02-345-6789 · hello@girlycloset.co' },
    { id: 'fc-shop', kind: 'links', title: 'Shop', links: [{ label: 'New in', href: '/collection/new' }, { label: 'Collection', href: '/collection' }, { label: 'Sale', href: '/promotion' }] },
    { id: 'fc-help', kind: 'links', title: 'Help', links: [{ label: 'การจัดส่ง', href: '' }, { label: 'คืนสินค้า', href: '' }, { label: 'ติดต่อเรา', href: '' }] },
    { id: 'fc-follow', kind: 'social', title: 'Follow', items: ['facebook', 'instagram', 'line'] },
  ] },
  { id: 'fr-2', widths: [1], padY: 12, bar: true, bg: { hex: '#242220' }, cols: [{ id: 'fc-pay', kind: 'payments', title: 'ชำระเงิน', items: ['VISA', 'Mastercard', 'PromptPay', 'COD'] }] },
  { id: 'fr-3', widths: [1], padY: 12, bar: true, bg: { hex: '#242220' }, cols: [{ id: 'fc-copy', kind: 'copyright', title: '', text: '© 2026 Girly Closet · Powered by Ketshopweb' }] },
]
export const colSummary = (c: FooterCol) => c.kind === 'brand' ? 'แบรนด์' : c.kind === 'payments' ? 'โลโก้ช่องทางชำระเงิน' : c.kind === 'copyright' ? 'ลิขสิทธิ์' : c.kind === 'empty' ? 'ว่าง' : c.title
export const rowMeta = (r: FooterRow) => `${r.cols.length} คอลัมน์ · ${r.cols.map(colSummary).join(' / ')}`

/* the 10 menu types (mockup data "menuTypes") */
export const MENU_TYPES: { key: string; name: string; desc: string; icon: string }[] = [
  { key: 'page', name: 'หน้าเพจใหม่', desc: 'สร้างหน้าว่างแล้วแต่ง', icon: 'far fa-file' }, { key: 'link', name: 'แทรกลิงก์', desc: 'URL ภายนอก/ภายใน', icon: 'fas fa-link' },
  { key: 'category', name: 'หมวดหมู่สินค้า', desc: 'ลิงก์ไปหมวด', icon: 'fas fa-tags' }, { key: 'product', name: 'สินค้า', desc: 'ลิงก์ไปสินค้าชิ้นเดียว', icon: 'fas fa-box' },
  { key: 'blog', name: 'บทความ', desc: 'ลิงก์ไปบทความ', icon: 'far fa-newspaper' }, { key: 'blogcat', name: 'หมวดหมู่บทความ', desc: 'รวมบทความ', icon: 'fas fa-folder' },
  { key: 'heading', name: 'หัวข้อ', desc: 'เมนูแม่ ไม่มีลิงก์', icon: 'fas fa-heading' }, { key: 'pay', name: 'แจ้งชำระเงิน', desc: 'หน้าระบบ · L2', icon: 'fas fa-receipt' },
  { key: 'track', name: 'ตรวจสอบพัสดุ', desc: 'หน้าระบบ · L2', icon: 'fas fa-truck' }, { key: 'order', name: 'ค้นหาคำสั่งซื้อ', desc: 'หน้าระบบ · L2', icon: 'fas fa-search' },
]
export const MENU_KIND_LABEL: Record<string, string> = { page: 'หน้าเพจ', link: 'ลิงก์', category: 'หมวดหมู่สินค้า', product: 'สินค้า', blog: 'บทความ', blogcat: 'หมวดหมู่บทความ', heading: 'หัวข้อ', system: 'หน้าระบบ', pay: 'หน้าระบบ', track: 'หน้าระบบ', order: 'หน้าระบบ' }
export const MENU_KIND_ICON: Record<string, string> = { page: 'far fa-file', link: 'fas fa-link', category: 'fas fa-tags', product: 'fas fa-box', blog: 'far fa-newspaper', blogcat: 'fas fa-folder', heading: 'fas fa-heading', system: 'fas fa-magic', pay: 'fas fa-receipt', track: 'fas fa-truck', order: 'fas fa-search' }
export const MENU_LAYOUTS: { key: MenuLayout; name: string; desc: string; cols: number[] }[] = [
  { key: 'normal', name: 'Normal', desc: 'dropdown ธรรมดา', cols: [1] }, { key: 'col1', name: 'Column 1', desc: '1 คอลัมน์ + banner', cols: [1, 1.2] },
  { key: 'col2', name: 'Column 2', desc: '2 คอลัมน์ + banner', cols: [1, 1, 1.2] }, { key: 'col3', name: 'Column 3', desc: '3 คอลัมน์ + banner', cols: [1, 1, 1, 1.2] },
]
export const MENU_MAX = 12
/* product categories seen in the mockup (Menu Collection of COLLECTION) — the only category data the prototype has */
export const CATEGORIES: MenuLink[] = [{ name: 'New in', url: '/new' }, { name: 'Dresses', url: '/c/dresses' }, { name: 'Accessories', url: '/c/acc' }, { name: 'Autumn', url: '/c/autumn' }, { name: 'Office', url: '/c/office' }, { name: 'ลด 30%+', url: '/sale' }]
export const menuLabel = (m: MenuItem) => m.i18n.EN || m.i18n.TH || 'เมนูใหม่'
export const hasSub = (m: MenuItem) => m.layout.startsWith('col') || (m.layout === 'normal' && m.children.length > 0)
const ALL_ON: Record<Device, boolean> = { desktop: true, tablet: true, mobile: true }
const mItem = (id: string, en: string, kind: string, target: string, extra: Partial<MenuItem> = {}): MenuItem =>
  ({ id, kind, i18n: { TH: '', EN: en, JP: '', CN: '' }, target, layout: 'normal', children: [], cols: [], showOn: { ...ALL_ON }, ...extra })
/* menu tree of mockup 1f / 3b (7 / 12) · COLLECTION = Column 3 with the Menu Collection of 3b */
const MENU: MenuItem[] = [
  mItem('m-home', 'HOME', 'page', 'หน้าเพจ: HOME · /home'),
  mItem('m-collection', 'COLLECTION', 'category', 'หมวดหมู่: Collection (ทั้งหมด)', { i18n: { TH: 'คอลเลกชัน', EN: 'COLLECTION', JP: '', CN: '' }, layout: 'col3',
    cols: [{ head: 'SHOP BY', links: [{ name: 'New in', url: '/new' }, { name: 'Dresses', url: '/c/dresses' }, { name: 'Accessories', url: '/c/acc' }] },
      { head: 'EDIT', links: [{ name: 'Autumn', url: '/c/autumn' }, { name: 'Office', url: '/c/office' }] },
      { head: 'SALE', links: [{ name: 'ลด 30%+', url: '/sale' }] }], banner: { url: '/collection/autumn' } }),
  mItem('m-product', 'PRODUCT', 'product', 'หน้าเพจ: PRODUCT · /product'),
  mItem('m-promotion', 'PROMOTION', 'page', 'หน้าเพจ: PROMOTION · /promotion'),
  mItem('m-blog', 'BLOG', 'blog', 'หน้าเพจ: BLOG · /blog'),
  mItem('m-contact', 'CONTACT', 'page', 'หน้าเพจ: CONTACT · /contact'),
  mItem('m-ai', 'AI SEARCH', 'system', 'หน้าระบบ: AI Search', { showOn: { desktop: true, tablet: true, mobile: false } }),
]

export const INITIAL_SITE: SiteDoc = {
  name: 'GIRLY CLOSET',
  tokens: TOKENS,
  header: { id: 'site-header', type: 'header', role: 'global', zone: 'site', name: 'Header', meta: 'ใช้ร่วมทุกหน้า', data: HEADER_DATA, style: { fg: { hex: '#333333' } } },
  footer: { id: 'site-footer', type: 'footer', role: 'global', zone: 'site', name: 'Footer', meta: 'ใช้ร่วมทุกหน้า', data: {
    brand: 'GIRLY CLOSET', about: 'เสื้อผ้าแฟชั่นผู้หญิง ส่งไวทั่วไทย', contact: '02-345-6789 · hello@girlycloset.co' }, rows: { TH: FOOTER_ROWS } },
  menu: MENU,
  pages: [
    { id: HOME_ID, name: 'หน้าแรก', path: '/home', lock: 'L0', group: 'on', when: 'แก้ 2 นาทีที่แล้ว', thumb: 'linear-gradient(160deg,#d9b493,#5e3b28)', zones: Z_MAIN, sections: home },
    { id: 'collection', name: 'COLLECTION', path: '/collection', lock: 'L1', group: 'on', when: 'เมื่อวาน', thumb: '#f6dfe6' },
    { id: 'product', name: 'PRODUCT', path: '/product', lock: 'L1', group: 'on', when: '3 วันก่อน', thumb: '#e6f0fb' },
    { id: 'promotion', name: 'PROMOTION', path: '/promotion', lock: 'L0', group: 'on', when: '5 วันก่อน', thumb: '#fde9c9' },
    { id: 'blog', name: 'BLOG', path: '/blog', lock: 'L1', group: 'on', when: '1 สัปดาห์', thumb: '#ecebf5' },
    { id: 'contact', name: 'CONTACT', path: '/contact', lock: 'L0', group: 'on', when: '2 สัปดาห์', thumb: '#e8f5ee' },
    { id: 'landing-1111', name: 'Landing 11.11', path: '/sale-1111', lock: 'L0', group: 'off', when: 'แก้ 1 ชม.ที่แล้ว', thumb: '#13151B', mockDraft: true },
    { id: 'about', name: 'About us', path: '/about', lock: 'L0', group: 'off', when: '1 เดือน', thumb: '#f3f3f3' },
    { id: 'size-guide', name: 'Size guide', path: '/size-guide', lock: 'L0', group: 'off', when: '2 เดือน', thumb: '#fff7ed' },
    { id: 'product-detail', name: 'รายละเอียดสินค้า', path: '/product/:id', lock: 'L1', group: 'sys', when: 'เมื่อวาน', thumb: '#e6f0fb', zones: Z_L1, sections: productDetail },
    { id: 'cart', name: 'ตะกร้า', path: '/cart', lock: 'L2', group: 'sys', when: '—', thumb: '#f7f8fa', zones: Z_L2, sections: cart },
    { id: 'checkout', name: 'ชำระเงิน', path: '/checkout', lock: 'L2', group: 'sys', when: '—', thumb: '#f7f8fa' },
    { id: 'register', name: 'สมัครสมาชิก / เข้าสู่ระบบ', path: '/register', lock: 'L2', group: 'sys', when: '—', thumb: '#f7f8fa' },
    { id: 'thankyou', name: 'ขอบคุณ (Thank you)', path: '/thankyou', lock: 'L3', group: 'sys', when: 'ระบบ', thumb: '#eef0f4' },
  ],
}

/* page-group headers as in mockup 1d / 1e / 3f (counts are the mockup's own numbers) */
export const PAGE_GROUPS = [
  { key: 'on' as const, label: 'หน้าบนเมนู', count: 7, note: 'แก้ได้ตามระดับ', icon: 'fa fa-bars' },
  { key: 'off' as const, label: 'หน้านอกเมนู', count: 3, note: 'Landing / Sale page', icon: 'far fa-file' },
  { key: 'sys' as const, label: 'หน้าของระบบ', count: 12, note: 'L2 แก้ค่า · L3 ล็อก', icon: 'fas fa-lock' },
]

export const LOCK_STYLE: Record<Lock, { bg: string; fg: string }> = {
  L0: { bg: 'var(--success-100)', fg: 'var(--success-700)' },
  L1: { bg: 'var(--info-100)', fg: 'var(--info-700)' },
  L2: { bg: 'var(--warning-100)', fg: 'var(--warning-700)' },
  L3: { bg: 'var(--ink-150)', fg: 'var(--ink-700)' },
}
export const LOCK_TEXT: Record<Lock, { short: string; rule: string }> = {
  L0: { short: 'แก้ได้อิสระ', rule: 'เพิ่ม ลบ ย้ายได้ทั้งหน้า' },
  L1: { short: 'มีช่องแทรก', rule: 'แทรก Section ได้เฉพาะช่องที่เปิด · บล็อกหลักของระบบปรับค่าได้แต่ย้ายไม่ได้' },
  L2: { short: 'แก้ได้เฉพาะค่า', rule: 'ไม่มีที่จับลาก · แก้ข้อความ ซ่อนฟิลด์ เปลี่ยนสีปุ่มได้' },
  L3: { short: 'อ่านอย่างเดียว', rule: 'ระบบเรนเดอร์ทั้งหมด ไม่เปิดให้แต่ง' },
}

/* canvas region states (D3 legend) mapped onto the mockup DS colours */
export const ROLE_STYLE = {
  free: { color: 'var(--success-500)', bg: 'var(--success-100)', fg: 'var(--success-700)', label: 'แก้ได้อิสระ' },
  slot: { color: 'var(--info-500)', bg: 'var(--info-100)', fg: 'var(--info-700)', label: 'ช่องที่เปิดให้แทรก' },
  system: { color: 'var(--warning-500)', bg: 'var(--warning-100)', fg: 'var(--warning-700)', label: 'บล็อกของระบบ · แก้ค่าได้' },
  global: { color: 'var(--ink-500)', bg: 'var(--ink-150)', fg: 'var(--ink-700)', label: 'ใช้ร่วมทุกหน้า' },
  ai: { color: '#D73226', bg: 'var(--red-50)', fg: 'var(--red-700)', label: 'เพิ่มโดยผู้ช่วย' },   // ผู้ช่วย Ket = CI red→orange, not the orange used for selection
}

/* library (D4 left rail: คลัง Section / คลัง Element) — pick first, then choose where to drop */
export const LIBRARY = {
  sections: [
    { key: 'content', label: 'เนื้อหา', icon: 'fas fa-align-left', desc: 'หัวข้อ + ข้อความ + รูป' },
    { key: 'slide', label: 'สไลด์', icon: 'far fa-images', desc: 'แบนเนอร์เลื่อน' },
    { key: 'map', label: 'แผนที่', icon: 'fas fa-map-marked-alt', desc: 'ที่ตั้งร้าน' },
    { key: 'columns', label: 'คอลัมน์', icon: 'fas fa-columns', desc: 'แบ่ง 2–4 คอลัมน์' },
    { key: 'template', label: 'เทมเพลตสำเร็จ', icon: 'far fa-clone', desc: 'แม่แบบที่จัดไว้แล้ว' },
  ],
  elements: [
    { key: 'text', label: 'ข้อความ', icon: 'fas fa-font' }, { key: 'image', label: 'รูป', icon: 'far fa-image' },
    { key: 'gallery', label: 'แกลเลอรี', icon: 'fas fa-th' }, { key: 'product', label: 'สินค้า', icon: 'fas fa-box-open' },
    { key: 'category', label: 'หมวดหมู่', icon: 'fas fa-tags' }, { key: 'search', label: 'ค้นหา', icon: 'fas fa-search' },
    { key: 'form', label: 'ฟอร์ม', icon: 'far fa-list-alt' }, { key: 'video', label: 'วิดีโอ', icon: 'fas fa-play-circle' },
    { key: 'code', label: 'โค้ด', icon: 'fas fa-code' },
  ],
}

/* the assistant's scripted proposal from mockup 1c / 3a */
export const AI_PROPOSAL = {
  prompt: 'เปลี่ยนแบนเนอร์หน้าแรกให้เป็นโทน Autumn แล้วเพิ่มบล็อกสินค้าแนะนำใต้แบนเนอร์',
  items: [
    { id: 'hero', title: 'Hero Banner · แก้ไข', short: 'สีพื้น + หัวข้อ "AUTUMN EDIT"' },
    { id: 'prod', title: 'เพิ่ม Section · Product แนะนำ', short: 'ใต้ Hero · T0', detail: 'ตำแหน่ง: ใต้ Hero · T0 ประกอบจากบล็อกที่มี' },
  ],
}

export const tokenHex = (site: SiteDoc, c: ColorRef | undefined) =>
  !c ? null : 'token' in c ? (site.tokens.find(t => t.name === c.token)?.hex ?? null) : c.hex
export const tokenByName = (site: SiteDoc, name: string) => site.tokens.find(t => t.name === name)?.hex ?? '#000000'
