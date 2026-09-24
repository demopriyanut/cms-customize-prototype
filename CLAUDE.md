# CMS ปรับแต่ง Prototype — กติกาสำหรับทุก session

ไฟล์นี้ Claude ทุก session อ่านอัตโนมัติ ทุกคนในทีมทำงานคนละ session คนละเครื่อง แต่ใช้ repo นี้ร่วมกัน
แต่ละ session **ไม่เห็นแชทของกัน** — สื่อสารผ่านไฟล์ใน repo เท่านั้น (`STATUS.md`, `WORKLOG.md`)

## งานนี้คืออะไร

Prototype หลังบ้าน Ketshopweb ฝั่ง **"ปรับแต่ง"** (ตกแต่งหน้าเว็บ) ไว้ลองไอเดียและเทียบกันระยะยาว
- ข้อกำหนดหลัก: `references/2026-09-23_cms-customize-prototype-ref-redesign-blueprint-v0.3.html` (Blueprint v0.3)
- หน้าตาต้นแบบ: `references/2026-09-23_cms-customize-prototype-ref-cms-ui-mockups/Ketshopweb CMS Mockups.dc.html` (แนว A / B / C) + ภาพหน้าจอ CMS จริงใน `uploads/`
- ถ้า Blueprint กับ mockup ขัดกัน: **พฤติกรรมยึด Blueprint**, หน้าตา/ตำแหน่งยึด mockup — ขัดกันเรื่องไหนให้บอกผู้ใช้ ไม่ตัดสินเอง

## กติกาที่ห้ามพลาด

1. **1 เวอร์ชัน = หลังบ้านทั้งชุด** (sidebar + ทุกหน้า) ในแนวคิดเดียว — V1 = แนว A ปลอดภัย · V2 = แนว B กล้า · V3 = แนว C ลูกผสม
   ห้ามทำ A/B/C แยกรายหน้า · ไอเดียใหม่ทั้งชุด = เวอร์ชันใหม่ (V4, V5 …) ห้ามแก้ทับเวอร์ชันเดิม
2. **แถบล่างกลาง (Dock) = เครื่องมือของผู้ออกแบบ** ไว้สลับเทียบเวอร์ชัน ไม่ใช่ส่วนของระบบ CMS · สลับแล้วต้องอยู่หน้าเดิม
3. **ห้ามแต่งข้อมูล** — ชื่อร้าน สินค้า ราคา เบอร์ ที่อยู่ ตัวเลข ใช้ของที่อยู่ใน mockup / Blueprint เท่านั้น (ร้านตัวอย่าง GIRLY CLOSET) ไม่มีข้อมูล = ใส่ `[รอข้อมูล]`
4. **ยึดโครงหน้าจอจาก mockup / ภาพหน้าจอจริง** แล้วแทรกเฉพาะของใหม่ — ห้ามจัด IA ใหม่เอง ถ้าคิดว่าโครงเดิมมีปัญหา ให้เสนอแยก
5. **ทำเฉพาะที่ผู้ใช้สั่ง** ทีละขั้นแล้วหยุด · คำสั่งกำกวม = ถามก่อน · แท็บ/ส่วนที่ mockup ไม่มีเนื้อหา = ปล่อยว่าง "ยังไม่มีใน mockup" ไม่ออกแบบเพิ่มเอง
6. **แก้เฉพาะส่วนที่ตัวเองรับผิดชอบ** ตามตารางใน `STATUS.md` · ส่วนที่ใช้ร่วมทุกเวอร์ชัน (`app/src/data/`, `app/src/components/storefront/`, `app/src/components/editor/`) แก้แล้วกระทบทุกคน — จดใน `WORKLOG.md` และบอกผู้ใช้
7. **CI / สี / ฟอนต์** ใช้ token จาก `app/src/ketshopweb-ds-tokens.css` (มาจาก `_ds` ของ mockup) ห้ามใส่สีดิบเพิ่ม · เรื่องสีแดง (ล็อก vs ปุ่มหลัก) ยังรอตัดสิน — อย่าเปลี่ยนเอง

## ทุก session ต้องทำ

- **เริ่มงาน:** `git pull` → อ่าน `STATUS.md` และ 10 รายการล่าสุดใน `WORKLOG.md`
- **ทำงาน:** ใน branch ของตัวเอง `ชื่อ/เรื่อง` เช่น `nui/v2-header` · commit ย่อย ๆ
- **จบงาน:** เพิ่มบรรทัดใน `WORKLOG.md` (วันที่ · ชื่อ · branch · ทำอะไร · ค้างอะไร) · อัปเดต `STATUS.md` ถ้าสถานะเปลี่ยน · `npm run build` ต้องผ่าน · push แล้วเปิด PR / รวมเข้า `main`
- **ไม่ push ตรงเข้า `main`** ถ้าไม่ได้ตกลงกัน

## รัน / build / เผยแพร่

```
cd app
npm install
npm run dev              # http://localhost:4175
npm run build            # ต้องผ่านก่อน push
npm run build:artifact   # ทำชุดไฟล์สำหรับลิงก์ Artifact ใน app/dist-artifact/
```

**ลิงก์ Artifact ของทีม (ลิงก์เดียว):** https://claude.ai/artifact/UXQMyyxAezCq9CX6tZnQD7
- อัปเดตจาก `main` เท่านั้น
- เผยแพร่ใหม่ที่ **ลิงก์เดิม**: publish `app/dist-artifact/cms-customize-prototype.html` โดยส่ง `url` = ลิงก์ข้างบน, `root` = `app/dist-artifact`, `files` = รายการใน `app/dist-artifact/artifact-files.json`
- ถ้าระบบบอกว่ามีเวอร์ชันใหม่กว่าที่คนอื่นเผยแพร่ไว้ ให้ `git pull` แล้ว build ใหม่ก่อน ห้ามบังคับทับ
- ไอเดียที่ยังไม่รวมเข้า `main` ถ้าอยากให้คนอื่นดู ให้เผยแพร่เป็นลิงก์ใหม่แยก (ไม่ส่ง `url`)

## โครงโค้ด (`app/src`)

| ที่ | คืออะไร |
|---|---|
| `data/schema.ts` | Page Schema จำลองตาม Blueprint D2/D3: ร้าน → token → Header/Footer (ใช้ร่วมทุกหน้า) → หน้า (ระดับล็อก L0–L3) → zone → section |
| `data/store.ts` | store กลาง: ฉบับร่าง / ฉบับเผยแพร่ / undo-redo / ประวัติ / การแก้ทุกแบบ · เก็บใน localStorage ของแต่ละเบราว์เซอร์ |
| `versions/registry.ts` | รายการเวอร์ชัน · หน้าจอ · รหัส mockup · หน้าที่ทำแล้ว (`READY`) · เมนู sidebar |
| `components/shell/` | Sidebars (safe / bold), Dock, route |
| `components/storefront/Canvas.tsx` | หน้าร้านจำลองจาก schema + กรอบเลือก / ลาก / วาง / แก้ข้อความในที่ |
| `components/editor/` | ชิ้นร่วม: รายการ section, คลัง, คุณสมบัติ, ประวัติ, เผยแพร่, คีย์ลัด, การลาก |
| `screens/entry.tsx` · `screens/page-editor.tsx` | หน้าเลือก (1d / 1e / 3f) · หน้าแต่ง (1b / 1c / 3a) |

**เพิ่มเวอร์ชันใหม่:** เพิ่มใน `VERSIONS` / `REF` / `READY` ของ `versions/registry.ts` → ทำหน้าจอใน `screens/` → ต่อใน `Screen()` ของ `App.tsx` → ขึ้นใน Dock อัตโนมัติ
