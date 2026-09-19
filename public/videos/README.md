# 📹 Video fayllar saqlash qo'llanmasi

## 🎯 Qanday ishlaydi?

Video fayllarni kompyuteringizga saqlab, saytdan ko'rsatish uchun quyidagi qadamlarni bajaring:

---

## 📁 1-QADAM: Faylni qayerga saqlash kerak?

Barcha video fayllarni quyidagi papkaga joylashtiring:

```
📂 public/
   └── 📂 videos/
       ├── 📄 lesson1.mp4
       ├── 📄 lesson2.mp4
       └── 📂 module1/
           └── 📄 advanced.mp4
```

**To'liq yo'l:** `public/videos/`

---

## 🚀 2-QADAM: Faylni qanday joylashtirish?

### **Usul 1: Admin paneldan yuklab olish (OSON)**

1. **Admin panel** → **Darslar & Video** bo'limiga kiring
2. Darsni toping → **VIDEO QO'SHISH** tugmasini bosing
3. **FAYL YUKLASH** tugmasini bosing
4. Video faylni tanlang
5. Fayl avtomatik yuklab olinadi (kompyuteringizga)
6. Yuklab olingan faylni `public/videos/` papkasiga ko'chiring
7. Admin panelda havolani kiriting: `/videos/fayl_nomi.mp4`

### **Usul 2: Qo'lda joylashtirish**

1. Video faylni kompyuteringizdan toping
2. Faylni `public/videos/` papkasiga nusxalang yoki ko'chiring
3. Fayl nomini eslab qoling (masalan: `lesson1.mp4`)
4. Admin panelda havolani kiriting: `/videos/lesson1.mp4`

---

## 🔗 3-QADAM: Havolani qanday kiritish?

Admin panelda **HAVOLA QO'SHISH** tugmasini bosing va quyidagi formatda yozing:

```
/videos/fayl_nomi.mp4
```

### **Misollar:**

```
✅ /videos/intro.mp4
✅ /videos/lesson1.mp4
✅ /videos/lesson2.webm
✅ /videos/module1/advanced.mp4
✅ /videos/html_basics.mp4
✅ /videos/css_grid_tutorial.mp4
```

---

## 📋 To'liq qadamlar (Rasm bilan):

```
1. Admin panelga kiring
   ↓
2. "Darslar & Video" bo'limini tanlang
   ↓
3. Kursni tanlang (masalan: Front-End)
   ↓
4. Darsni toping → "VIDEO QO'SHISH" tugmasini bosing
   ↓
5. "FAYL YUKLASH" tugmasini bosing
   ↓
6. Video faylni tanlang → "Ochish" tugmasini bosing
   ↓
7. Fayl yuklab olinadi (kompyuteringizga)
   ↓
8. Yuklab olingan faylni public/videos/ papkasiga ko'chiring
   ↓
9. Admin panelda havolani kiriting: /videos/fayl_nomi.mp4
   ↓
10. "HAVOLA QO'SHISH" tugmasini bosing
   ↓
11. ✅ Tayyor! Barcha foydalanuvchilar videoni ko'ra oladi
```

---

## 💡 Muhim eslatmalar:

### ✅ **Nima qilish kerak:**
- Fayllarni `public/videos/` papkasiga joylashtiring
- Havolani `/videos/fayl_nomi.mp4` formatida kiriting
- Fayl nomida lotin harflari va raqamlarni ishlating
- Fayl nomida bo'sh joy bo'lmasin (bo'sh joy uchun `_` ishlating)

### ❌ **Nima qilmaslik kerak:**
- Fayl nomida kirill harflari ishlatmang (masalan: `дарс1.mp4` ❌)
- Fayl nomida bo'sh joy qoldirmang (masalan: `dars 1.mp4` ❌)
- Fayl nomida maxsus belgilar ishlatmang (masalan: `dars#1.mp4` ❌)

---

## 🎬 Qo'llab-quvvatlanadigan formatlar:

- ✅ **MP4** (eng keng tarqalgan)
- ✅ **WebM** (zamonaviy format)
- ✅ **OGG** (ochiq kodli format)
- ✅ **MOV** (Apple formati)

---

## 📊 Fayl hajmi:

- **Cheklov yo'q** - istalgan hajmdagi fayllarni joylashtirishingiz mumkin
- **Tavsiya:** Katta fayllar (>100MB) uchun YouTube/Vimeo havolasini ishlating

---

## 🌐 Barcha foydalanuvchilar ko'ra oladi:

`public/videos/` papkasidagi fayllar:
- ✅ Barcha foydalanuvchilarga ko'rinadi
- ✅ Sahifani yangilashda ham ishlaydi
- ✅ Boshqa kompyuterlarda ham ishlaydi
- ✅ Eng ishonchli usul

---

## 🔧 Muammolar yuzaga kelsa:

### **Video ko'rinmayapti:**
1. Fayl `public/videos/` papkasida bormi? Tekshiring
2. Fayl nomi to'g'rimi? (katta-kichik harflar muhim)
3. Havola to'g'rimi? `/videos/fayl.mp4` formatida bo'lsin
4. Saytni qayta quring: `npm run build`

### **Fayl yuklab olinmayapti:**
1. Brauzer sozlamalarini tekshiring
2. Boshqa brauzerda sinab ko'ring
3. Faylni qo'lda `public/videos/` papkasiga ko'chiring

---

## 📞 Yordam kerakmi?

Agar savollaringiz bo'lsa, admin panelda AI yordamchidan so'rang yoki texnik hujjatlarni o'qing.

---

**Muvaqqiyatlar! 🚀**
