# CMS ปรับแต่ง Prototype

Prototype หลังบ้าน Ketshopweb ฝั่ง "ปรับแต่ง" (ตกแต่งหน้าเว็บ) สำหรับลองและเทียบไอเดีย 3 เวอร์ชัน
V1 ปลอดภัย · V2 กล้า · V3 ลูกผสม — อิง Blueprint v0.3 และชุด mockup ใน `references/`

ลิงก์ดูออนไลน์ (Artifact): https://claude.ai/artifact/UXQMyyxAezCq9CX6tZnQD7

## เริ่มใช้บนเครื่องใหม่

ต้องมี [Node.js](https://nodejs.org) 20+ และ Git

```
git clone https://github.com/AchirawichSanjaikla/cms-customize-prototype.git
cd cms-customize-prototype/app
npm install
npm run dev
```

เปิด http://localhost:4175

## โฟลเดอร์

| ที่ | คืออะไร |
|---|---|
| `app/` | ตัว prototype (Vite + React + TypeScript + Tailwind v4 + shadcn) |
| `references/` | Blueprint v0.3 + ชุด mockup ต้นฉบับ + ภาพหน้าจอ CMS จริง (เอกสารภายใน — repo ต้องเป็น Private) |
| `legacy/round-1-html/` | prototype รอบแรก (HTML ไฟล์เดียว) เก็บไว้อ้างอิง |
| `CLAUDE.md` | กติกาของงาน — Claude ทุก session อ่านอัตโนมัติ |
| `STATUS.md` | ทำอะไรแล้ว ใครรับผิดชอบอะไร อะไรค้าง |
| `WORKLOG.md` | บันทึกส่งต่องานระหว่าง session |

## ทำงานร่วมกัน

1. ก่อนเริ่ม: `git pull` แล้วอ่าน `STATUS.md` + `WORKLOG.md`
2. แตก branch ของตัวเอง `ชื่อ/เรื่อง` (เช่น `nui/v2-header`) และจดชื่อไว้ในตารางคนรับผิดชอบของ `STATUS.md`
3. จบงาน: เขียน `WORKLOG.md` · `npm run build` ให้ผ่าน · push · เปิด Pull Request เข้า `main`
4. ลิงก์ Artifact อัปเดตจาก `main` เท่านั้น (`npm run build:artifact` แล้วสั่ง Claude เผยแพร่ที่ลิงก์เดิม)

ใช้ Claude Code ได้ทั้งบนเครื่องตัวเอง และบนเว็บที่ claude.ai/code — ทุก session อ่านกติกาจาก `CLAUDE.md` เหมือนกัน
