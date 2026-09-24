# Job · branch `Mark`

- **คนรับผิดชอบ:** Mark
- **เริ่ม:** 2026-09-24
- **สถานะ:** กำลังทำ
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
| `app/src/index.css` | สี `warning-50` / `info-50` · สไตล์ hover ของ hot-zone |

## บันทึก (ใหม่อยู่บน)

| วันที่ | ทำอะไร | commit | ค้าง / ส่งต่อ |
|---|---|---|---|
| 2026-09-24 | Footer ครบ 3 เวอร์ชัน (1j · 1k · 3d) ตามขั้นตอน 3w: ภาษา TH/EN/JP/CN (ว่าง = เทา · โคลนจาก TH) · คลิกคอลัมน์ → toolbar ✦⚙ลบ + คุณสมบัติคอลัมน์ · ลิงก์ เพิ่มจากเมนู/ลากเรียง/ลบ · แถว ลากเรียง/ซ่อน/คัดลอก/ลบ · จำนวนคอลัมน์ · พื้นแถวสืบทอด/ตั้งทับ · ระยะบน–ล่าง · แสดงบนจอ · V2 ลากเส้นกริด · สร้างจากข้อมูลร้าน · แยก `screens/shared.tsx` | (commit นี้) | ต่อ Menu |
| 2026-09-24 | Header ครบ 3 เวอร์ชัน (1h · 1i · 3c) ตามขั้นตอน 3v: คลิกโซน → ไปที่ตั้งค่า · Layout 3 แบบ · สีสืบทอด/ตั้งทับ + คืน Token · toggle 3 ตัว · ฟอนต์/ขนาดเมนู · ลองแบบอื่น (V3 ลองชั่วคราว เทียบแล้วเลือก / V2 ใช้ทันที) · มือถือ · undo · เผยแพร่รวมการแก้ Header | 579dc61 | — |
| 2026-09-24 | ตรวจเทียบ mockup ครบ 50 ช่อง · จดรายการตกหล่นลง `STATUS.md` · ตั้งไฟล์ job นี้ + กติกา job ต่อ branch ใน `CLAUDE.md` | c3c9ef8 | เริ่ม Header ต่อ |
