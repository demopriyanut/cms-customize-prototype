# Job · branch `Mark`

- **คนรับผิดชอบ:** Mark
- **เริ่ม:** 2026-09-24
- **สถานะ:** กำลังทำ · รวมเข้า main รอบแรก 2026-09-24 · ทำต่อใน V4
- **เป้าหมาย:** เก็บตกหล่นจาก mockup ให้ครบทุกช่อง (ตรวจเทียบ 50 ช่องแล้ว — รายการเต็มใน `STATUS.md` › รายการตกหล่น)

## ขอบเขตในรอบนี้

1. Header — 1h (V1) · 1i (V2) · 3c (V3)
2. Footer — 1j (V1) · 1k (V2) · 3d (V3)
3. Menu — 1f (V1) · 1g (V2) · 3b (V3)
4. System Design — 1l (V1) · 1m (V2) · 3e (V3)
5. สถานะผู้ช่วย Ket (1n) + ส่วนที่ขาดในหน้าที่ทำแล้ว (หน้าแต่ง / หน้าเลือก / sidebar)
6. ระบบเดิม (1a · 0c) ไว้เทียบ

นอกขอบเขตรอบนี้: 5a · 2d · 2c — รอสรุประบบไอเดียใต้แต่ละ V (งานครึ่งทางอยู่ใน `git stash` บนเครื่อง Mark)

## ไฟล์ส่วนกลางที่แตะ (กระทบทุกคน)

| ไฟล์ | แก้อะไร |
|---|---|
| `app/src/data/schema.ts` | ค่าตั้ง Header (layout · top bar · ฟอนต์/ขนาดเมนู · sticky · มือถือ ☰ · โปร่งใส) · `style.fg` สีตัวอักษร · `ColorRef` · 3 แบบจากผู้ช่วย (`HEADER_PRESETS`) · `NAV_ITEMS` · Header เปลี่ยนเป็นสืบทอดสีพื้นจาก Token พื้นผิว |
| `app/src/data/store.ts` | action ใหม่ `setGlobal` (แก้ Header/Footer ผ่าน commit) · `diffSites` นับการแก้ Header/Footer · **store version 2 → 3 = ฉบับร่างในเบราว์เซอร์ทุกคนรีเซ็ตเป็นแบบ mockup** |
| `app/src/components/storefront/Canvas.tsx` | แยกตัววาด Header (`HeaderBody`) ใช้ร่วมหน้าแต่งหน้าเว็บ + หน้า Header · `HeaderPreview` + hot-zone · Header มีค้นหา/ผู้ใช้/ตะกร้าตาม mockup · Sticky ตอนพรีวิว |
| `app/src/data/schema.ts` (รอบ Footer) | Footer เป็น แถว → คอลัมน์ ต่อภาษา (`FooterRow` / `FooterCol` · `rows.TH`) ตามแถวใน mockup · `FOOTER_LANGS` |
| `app/src/data/store.ts` (รอบ Footer) | action `editFooter(lang, …)` · **store version 3 → 4 (รีเซ็ตฉบับร่างอีกรอบ)** |
| `app/src/components/storefront/Canvas.tsx` (รอบ Footer) | ตัววาด Footer ใหม่ (`FooterBody`) ใช้ร่วมหน้าแต่งหน้าเว็บ · `FooterPreview` + เส้นกริด / ป้ายแถว / เลือกคอลัมน์ / ลากปรับความกว้าง |
| `app/src/data/schema.ts` (รอบ Menu) | `SiteDoc.menu` (MenuItem: ชื่อ 4 ภาษา · ลิงก์ · layout none/normal/col1–3 · เมนูย่อย · Menu Collection · แสดงบนจอ) ตามต้นไม้ 1f/3b · ลบ `NAV_ITEMS` · `MENU_TYPES` 10 ประเภท · `CATEGORIES` จาก mockup |
| `app/src/data/store.ts` (รอบ Menu) | action `editMenu` · `diffSites` นับการแก้ Menu · **store version 4 → 5** |
| `app/src/components/storefront/Canvas.tsx` (รอบ Menu) | เมนูบน Header วาดจาก `site.menu` (แสดงตามจอ · ▾ เมื่อมีเมนูย่อย · ไอคอนค้นหา) |
| `app/src/versions/registry.ts` + ใหม่ `versions/screens.tsx` (รอบ Master V) | เวอร์ชันเป็นต้นไม้ หลัก/ย่อย (`parent` · `base`) · แต่ละเวอร์ชันประกาศหน้าจอของตัวเองใน `SCREEN_MAP` · **`READY` / `isReady` ย้ายไป screens.tsx · `REF` ใช้ `refOf()`** — task ที่แตกไว้ต้องใส่หน้าจอใหม่ใน `SCREEN_MAP` แทน `READY` ตอนรวม |
| `app/src/components/shell/Dock.tsx` (รอบ Master V) | เขียนใหม่เป็น Master V: รายการหลัก + ย่อย · แถบล่างมีแถวเวอร์ชันย่อยเมื่อมี · [ ] ไล่ตามลำดับต้นไม้ |
| `app/src/App.tsx` (รอบ Master V) | `Screen()` อ่านจาก `SCREEN_MAP` · หน้ารวมเวอร์ชันแสดงเวอร์ชันย่อย / ต่อยอดจาก |
| `app/src/components/storefront/Canvas.tsx` (รอบ V4) | prop ใหม่ `selBar="float"` = toolbar ไอคอนเล็กมุมขวาบนของ Section ตาม 3a (ค่าเดิม `bar` ของ V1–V3 ไม่เปลี่ยน) |
| `app/src/versions/screens.tsx` + `App.tsx` (รอบ V4) | เวอร์ชันมี sidebar ของตัวเองได้ (`SIDEBAR_MAP`) |
| `app/src/data/schema.ts` · `Canvas.tsx` · `index.css` (รอบสี) | `ROLE_STYLE.ai` = #D73226 / red-50 / red-700 (ทุกเวอร์ชันเห็นผล) · `--color-ai` · `.canvas-dots-cool` · ป้ายสิ่งที่เลือกใช้ส้มเข้ม · ลบใน toolbar ลอย = red-700 |
| `app/src/App.tsx` · `Dock.tsx` · `index.css` · `Canvas.tsx` (รอบ WCAG) | skip link · `<main id=cms-main>` · กล่อง `role=status` ถาวร (toast ใน Dock เป็น aria-hidden) · `--ket-grad` · วงโฟกัส orange-600 · placeholder ink-500 · ✦ ใน toolbar ลอย / แถบ "เนื้อหาหน้า" |
| `app/src/index.css` (รอบมาตรฐานตัวอักษร) | token ตัวอักษร 6 ขั้น `text-display/title/heading/body/meta/caption` (ใช้ได้ทุกเวอร์ชัน แต่ตอนนี้ใช้แค่ V4) |
| `app/src/components/shell/nav.ts` + `App.tsx` | สถานะ `rail` (sidebar ของเวอร์ชันย่อเหลือไอคอน · จำไว้ในเบราว์เซอร์) · ความกว้าง 72/240 |
| `app/src/index.css` | สี `warning-50` / `info-50` · สไตล์ hover ของ hot-zone |

## บันทึก (ใหม่อยู่บน)

| วันที่ | ทำอะไร | commit | ค้าง / ส่งต่อ |
|---|---|---|---|
| 2026-09-24 | V4 ชุดสีตาม CI + WCAG: พื้นเทาเย็น ink-50 (เลิกครีม) · แดง CI = ปุ่มหลักหน้าละ 1 + เมนูปัจจุบัน · ส้ม CI = การเลือก/โฟกัส (ป้ายตัวขาวใช้ส้มเข้ม #BE2413) · ผู้ช่วย = ไล่สี #B12629→#D73226 · อันตราย = red-700 + ไอคอน + คำ · สืบทอด/ตั้งทับ ฟ้า/อำพัน ทั้งระบบ · วัดซ้ำด้วย wcag-check: ทุกหน้า V4 ไม่เหลือจุดตก A/AA (เหลือสีหน้าร้านตัวอย่าง + ข้อที่เครื่องแจ้งผิด) | (commit นี้) | — |
| 2026-09-24 | V4 แก้ WCAG ตามผลตรวจ skill wcag-check: ข้อความรอง ink-500 · ขอบช่อง/ปุ่ม ≥ 3:1 · ปุ่มไล่สี #B12629→#D73226 · h1/h2 ทุกหน้า · skip link + ชื่อ nav · กล่องแจ้งสถานะอยู่ตลอด · ป้าย "ฉบับร่าง" แทนจุดสี · canvas/พื้นที่เลื่อนโฟกัสได้ · ปุ่ม ↑↓ / เมนูย่อย แทนการลาก (Menu, Footer, Menu Collection) · label ช่องกรอก Footer · วงโฟกัสสีส้ม CI · วัดซ้ำ: เหลือแต่ข้อที่เครื่องแจ้งผิด + สีหน้าร้านตัวอย่าง | 0b9ca23 | — |
| 2026-09-24 | V4 โคลนแผงขวาและชิ้นร่วมมาเป็นของตัวเอง (`versions/v4/panels.tsx` · `parts.tsx` · `shared.tsx`) แล้วใช้มาตรฐานตัวอักษร — ทั้ง V4 ใช้ 6 ขั้นแล้ว | 0699471 | — |
| 2026-09-24 | V4: มาตรฐานตัวอักษร 6 ขั้น (ไม่มีครึ่ง px) ใช้ทั้งชุด · sidebar เว้นก่อนหัวกลุ่ม 12px หัวกลุ่ม 11px สีอ่านง่ายขึ้น · sidebar ย่อเหลือไอคอน 72px ได้ (« / ») ชื่อขึ้นเมื่อชี้ จำสถานะไว้ | f0dd19f | — |
| 2026-09-24 | V4 ปรับระยะ/ตัวอักษรกลับไปตามตัวเลขใน mockup แนว C + Design System 0a (gridgeist): สเกลตัวอักษรลด 0.5–1px ทั้งชุด · ฐาน 13px · sidebar แถว 30px · หน้าเลือกแถวตาม 3f · หน้าแต่ง: toolbar ลอยเล็ก · คำอธิบายสีเป็นแคปซูลมุมซ้ายล่าง · panel 340 · canvas กว้างไม่เกิน 680 | d341ce3 | รายงานจุดที่ V1–V3 ไม่ตรง mockup ให้ผู้ใช้ (ส่งแล้ว) |
| 2026-09-24 | Master V รองรับเวอร์ชันหลัก/ย่อย · โคลน V3 ทั้งชุดเป็น V4 (`versions/v4/`) | 9bb00f9 | — |
| 2026-09-24 | Menu ครบ 3 เวอร์ชัน (1f · 1g · 3b) ตามขั้นตอน 3u: สร้างเมนู 10 ประเภท (สูงสุด 12) · ลากชิป/แถวต้นไม้เรียง + ลากซ้อนกลาง = เมนูย่อย · ชื่อ 4 ภาษา · ลิงก์ไปที่ · Menu Type Normal/Column 1–3 (V1 Dropdown/Mega/ไม่มี) · Menu Collection ลิงก์ + Banner · mega menu บน preview (V2 แก้ในที่) · มือถือ ☰ · ผู้ช่วยเสนอ (1g ยุบ AI SEARCH/ย้าย CONTACT · 3b เติมช่อง SALE) | ec01432 | แตกงานที่เหลือเป็น task แยก 4 ชิ้น (System Design · 1n + หน้าแต่ง · หน้าเลือก + sidebar · ระบบเดิม) |
| 2026-09-24 | Footer ครบ 3 เวอร์ชัน (1j · 1k · 3d) ตามขั้นตอน 3w: ภาษา TH/EN/JP/CN (ว่าง = เทา · โคลนจาก TH) · คลิกคอลัมน์ → toolbar ✦⚙ลบ + คุณสมบัติคอลัมน์ · ลิงก์ เพิ่มจากเมนู/ลากเรียง/ลบ · แถว ลากเรียง/ซ่อน/คัดลอก/ลบ · จำนวนคอลัมน์ · พื้นแถวสืบทอด/ตั้งทับ · ระยะบน–ล่าง · แสดงบนจอ · V2 ลากเส้นกริด · สร้างจากข้อมูลร้าน · แยก `screens/shared.tsx` | a82ab04 | — |
| 2026-09-24 | Header ครบ 3 เวอร์ชัน (1h · 1i · 3c) ตามขั้นตอน 3v: คลิกโซน → ไปที่ตั้งค่า · Layout 3 แบบ · สีสืบทอด/ตั้งทับ + คืน Token · toggle 3 ตัว · ฟอนต์/ขนาดเมนู · ลองแบบอื่น (V3 ลองชั่วคราว เทียบแล้วเลือก / V2 ใช้ทันที) · มือถือ · undo · เผยแพร่รวมการแก้ Header | 579dc61 | — |
| 2026-09-24 | ตรวจเทียบ mockup ครบ 50 ช่อง · จดรายการตกหล่นลง `STATUS.md` · ตั้งไฟล์ job นี้ + กติกา job ต่อ branch ใน `CLAUDE.md` | c3c9ef8 | เริ่ม Header ต่อ |
