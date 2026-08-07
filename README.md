# บันทึกรายรับ-รายจ่าย

เว็บแอปสำหรับบันทึกรายรับ-รายจ่ายส่วนตัว แนบรูปใบเสร็จได้ และดาวน์โหลดรายงานเป็น PDF รายเดือน/รายปี
ข้อมูลเก็บบน Firebase (Firestore + Storage) ทำให้เปิดดูและบันทึกได้จากทุกอุปกรณ์ผ่านลิงก์เดียวกัน โดยไม่ต้อง login

> **ข้อควรทราบเรื่องความปลอดภัย**: แอปนี้ตั้งใจไม่มีหน้า login เพื่อความสะดวก (ตามที่เลือกไว้)
> ใครก็ตามที่มีลิงก์เว็บนี้จะสามารถดู เพิ่ม แก้ไข หรือลบข้อมูลได้ทั้งหมด จึง **ไม่ควรแชร์ลิงก์นี้ให้คนอื่น**
> ถ้าต้องการความปลอดภัยเพิ่มเติมในอนาคต (เช่น ใส่รหัสผ่าน หรือ Google Sign-In) สามารถแจ้งให้เพิ่มได้ภายหลัง

## โครงสร้างเทคโนโลยี

- **Frontend**: React + Vite + Tailwind CSS
- **ฐานข้อมูล/พื้นที่เก็บรูป**: Firebase Firestore + Firebase Storage
- **สร้าง PDF**: jsPDF + jspdf-autotable (ฝังฟอนต์ไทย Sarabun ไว้ในตัวแอปแล้ว)
- **Deploy**: GitHub Actions -> GitHub Pages

---

## ขั้นตอนที่ 1: สร้างโปรเจกต์ Firebase

1. เข้า https://console.firebase.google.com แล้วกด **Add project** สร้างโปรเจกต์ใหม่ (ปิด Google Analytics ก็ได้ ไม่จำเป็น)
2. เมื่อเข้าหน้าโปรเจกต์แล้ว กดไอคอน **</>** (Web) เพื่อเพิ่มแอปเว็บ ตั้งชื่อแอปอะไรก็ได้ แล้วกด **Register app**
3. คัดลอกค่า `firebaseConfig` ที่ปรากฏ (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId) เก็บไว้ใช้ในขั้นตอนถัดไป

### เปิดใช้งาน Authentication (Anonymous)

1. เมนูซ้าย > **Build > Authentication** > **Get started**
2. แท็บ **Sign-in method** > เลือก **Anonymous** > เปิดใช้งาน (Enable) > Save

### เปิดใช้งาน Firestore

1. เมนูซ้าย > **Build > Firestore Database** > **Create database**
2. เลือกโหมด **Production mode** แล้วเลือก location ที่ใกล้ (เช่น `asia-southeast1`)
3. ไปที่แท็บ **Rules** แล้ววางกฎจากไฟล์ [`firebase-rules/firestore.rules`](./firebase-rules/firestore.rules) ในโปรเจกต์นี้ แทนที่กฎเดิม แล้วกด **Publish**

### เปิดใช้งาน Storage

1. เมนูซ้าย > **Build > Storage** > **Get started** (เลือก location เดียวกับ Firestore)
2. ไปที่แท็บ **Rules** แล้ววางกฎจากไฟล์ [`firebase-rules/storage.rules`](./firebase-rules/storage.rules) แทนที่กฎเดิม แล้วกด **Publish**

---

## ขั้นตอนที่ 2: รันบนเครื่องตัวเอง (ทดสอบก่อน deploy)

```bash
npm install
cp .env.example .env
```

เปิดไฟล์ `.env` แล้วใส่ค่าที่คัดลอกมาจาก Firebase (`firebaseConfig`) ให้ครบทุกบรรทัด จากนั้นรัน:

```bash
npm run dev
```

เปิดเบราว์เซอร์ตามลิงก์ที่ปรากฏ (ปกติ `http://localhost:5173`) ทดลองเพิ่มรายการ แนบรูป และลองกดดาวน์โหลด PDF

---

## ขั้นตอนที่ 3: อัปโหลดขึ้น GitHub

```bash
git init
git add .
git commit -m "Initial commit: budget tracker app"
git branch -M main
git remote add origin https://github.com/<ชื่อผู้ใช้>/<ชื่อ repo>.git
git push -u origin main
```

## ขั้นตอนที่ 4: ตั้งค่า GitHub Secrets

ที่หน้า repo บน GitHub ไปที่ **Settings > Secrets and variables > Actions > New repository secret**
เพิ่ม secret ทั้ง 6 ตัวนี้ (ค่าจาก `firebaseConfig` เดียวกับที่ใส่ใน `.env`):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## ขั้นตอนที่ 5: เปิดใช้งาน GitHub Pages

1. ไปที่ **Settings > Pages**
2. ที่หัวข้อ **Build and deployment > Source** เลือก **GitHub Actions**
3. กลับไปที่แท็บ **Actions** จะเห็น workflow "Deploy to GitHub Pages" กำลังรัน (หรือ push commit ใหม่เพื่อ trigger)
4. เมื่อรันสำเร็จ ลิงก์เว็บจะอยู่ที่ `https://<ชื่อผู้ใช้>.github.io/<ชื่อ repo>/`
   (ลิงก์เดียวกันนี้จะแสดงในหน้า Settings > Pages ด้วย)

ทุกครั้งที่ push โค้ดใหม่เข้า branch `main` เว็บจะ build และ deploy ให้อัตโนมัติ

---

## การใช้งานแอป

- กดปุ่ม **+** มุมล่างขวา เพื่อเพิ่มรายการ เลือกรายรับ/รายจ่าย ใส่จำนวนเงิน หมวดหมู่ วันที่ รายละเอียด และแนบรูปใบเสร็จได้ (ไม่บังคับ)
- เลือกเดือน/ปีด้านบนเพื่อดูสรุปยอดและรายการของช่วงเวลานั้น
- กด **ดาวน์โหลด PDF (รายเดือน)** หรือ **ดาวน์โหลด PDF (รายปี)** เพื่อสร้างรายงานตามช่วงที่เลือกไว้
- กด **แก้ไข**/**ลบ** ที่แต่ละรายการเพื่อจัดการข้อมูล

## หมายเหตุ

- แอปนี้ไม่มีระบบ login แต่ยังคง "sign in anonymously" กับ Firebase อยู่เบื้องหลัง (ไม่มี UI ให้เห็น) เพื่อให้เป็นไปตามเงื่อนไขความปลอดภัยของ Firestore/Storage rules เท่านั้น ไม่ได้แยกข้อมูลรายบุคคล — ทุกคนที่เข้าเว็บนี้ใช้ข้อมูลชุดเดียวกัน
- ไฟล์รูปที่แนบจะถูกอัปโหลดไป Firebase Storage และลบออกจาก Storage อัตโนมัติเมื่อกดลบรายการนั้น
- Firebase มี free tier (Spark plan) ที่เพียงพอสำหรับการใช้งานส่วนตัว
