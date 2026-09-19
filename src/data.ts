export interface Lesson {
  id: string;
  title: string;
  dur: number; // daqiqa
  type: "Video" | "Amaliyot" | "Jonli" | "Test";
  section?: string; // modul nomi
  video?: string; // YouTube yoki .mp4 havola (bo'sh qoldirilgan — o'qituvchi qo'shadi)
}

export interface Course {
  id: string;
  title: string;
  tag: string;
  category: "Dasturlash" | "AI" | "Til" | "Dizayn" | "Marketing";
  level: string;
  hours: number;
  students: number;
  color: string;
  desc: string;
  skills: string[];
  mentor: { name: string; role: string; exp: string };
  outcomes: string[];
  lessons: Lesson[];
}

export const COURSES: Course[] = [
  {
    id: "front-end",
    title: "Front-End Dasturlash",
    tag: "Eng talabchan",
    category: "Dasturlash",
    level: "Noldan → Junior",
    hours: 0,
    students: 5240,
    color: "#C9F158",
    desc: "Front-End dasturlash kursi — HTML, CSS, JavaScript va React. Admin tomonidan darslar qo'shiladi.",
    skills: ["HTML5", "CSS3", "JavaScript", "React JS", "Git & GitHub", "Flexbox & Grid"],
    mentor: { name: "Abdurazzoq Olimjonov", role: "Front-End o'qituvchisi", exp: "2 yillik tajriba" },
    outcomes: [
      "Istalgan dizayn-maketni HTML/CSS'da kodga aylantirish",
      "JavaScript'da dinamik va interaktiv ilovalar yozish",
      "React'da zamonaviy SPA (bir sahifali ilova) qurish",
      "Portfolio loyihasi bilan Junior darajaga chiqish",
    ],
    lessons: [],
  },
];

export const CATEGORIES = ["Barchasi", "Dasturlash"] as const;

export const TICKER = [
  "HTML & CSS", "JavaScript", "React", "Git & GitHub", "Front-End",
];

/* ================= AI bilimlar bazasi ================= */

export interface KBEntry {
  keys: string[];
  answer: string;
  answerEn?: string;
  answerRu?: string;
}

export const DICT: Record<string, string> = {
  hello: "salom", book: "kitob", water: "suv", learn: "o'rganmoq", study: "o'qimoq / tadqiq qilmoq",
  friend: "do'st", teacher: "o'qituvchi", computer: "kompyuter", time: "vaqt", day: "kun",
  night: "tun", good: "yaxshi", bad: "yomon", love: "sevgi / sevmoq", work: "ish / ishlamoq",
  question: "savol", answer: "javob", lesson: "dars", course: "kurs", money: "pul",
  life: "hayot", dream: "orzu", knowledge: "bilim", future: "kelajak", success: "muvaffaqiyat",
  "artificial intelligence": "sun'iy intellekt", language: "til", world: "dunyo", family: "oila",
  morning: "ertalab", evening: "kechqurun", help: "yordam", name: "ism", city: "shahar",
};

export const KB: KBEntry[] = [
  {
    keys: ["salom", "assalomu", "assalom", "hi ", "hello", "hey", "zdravst"],
    answer: "Assalomu alaykum! 👋 Men Razzoq AI — akademiyamizning ovozli va yozma yordamchisiman. Kurslar, ro'yxatdan o'tish, darslar haqida bemalol so'rang. Mikrofonga bosib ovozli ham gaplashishingiz mumkin!",
  },
  {
    keys: ["qanday yordam", "nima qila olasan", "imkoniyat", "qanday ishlaydi", "yordam ber"],
    answer: "Men quyidagilarda yordam beraman:\n• Barcha kurslar haqida ma'lumot\n• Ro'yxatdan o'tish va kabinet bilan bog'liq savollar\n• Dasturlash atamalarini oddiy tushuntirish (masalan: 'funksiya nima?')\n• Inglizcha so'zlar tarjimasi ('book tarjimasi')\n• Motivatsiya va maslahat 😊",
  },
  {
    keys: ["kurs", "course", "yo'nalish", "yonalish", "nimalar bor", "katalog"],
    answer: "Bizda Front-End Dasturlash kursi bor va u 100% bepul:\n• Front-End Dasturlash — HTML, CSS, JavaScript, React\n\n'Kurslar' bo'limiga o'tib, boshlang!",
  },
  {
    keys: ["front-end", "frontend", "front end", "veb", "web sayt", "react", "html", "css", "javascript"],
    answer: "Front-End kursimiz — akademiyadagi eng talabchan yo'nalish! HTML, CSS, JavaScript va React'ni o'rganasiz. Mentor: Abdurazzoq Olimjonov (2 yillik tajriba).\n\nDarslar admin tomonidan qo'shiladi. Kurs sahifasiga o'ting va yangilangan darslarni ko'ring!",
  },
  {
    keys: ["ro'yxat", "royxat", "registr", "qanday o'taman", "qanday otaman", "akkaunt", "profil yarat"],
    answer: "Ro'yxatdan o'tish 1 daqiqa oladi: yuqoridagi 'Kirish' tugmasini bosing → 'Ro'yxatdan o'tish' bo'limiga o'ting → ism, email va parol kiriting. Bas! Shaxsiy kabinet ochiladi, istalgan kursga bepul yozilasiz va progress'ingiz saqlanadi. Hech qanday to'lov yoki karta so'ralmaydi.",
  },
  {
    keys: ["bepul", "tekin", "pul", "narx", "to'lov", "tolov", "qancha turadi", "pullik", "card", "karta"],
    answer: "Barcha kurslarimiz 100% bepul — bu Razzoq Academy'ning asosiy qoidasi. ✅ Hech qanday yashirin to'lov, obuna yoki karta talab qilinmaydi. Darslar, AI yordamchi, sertifikat — hammasi tekin. Biz bilim hammaga tegishli deb hisoblaymiz.",
  },
  {
    keys: ["sertifikat", "diplom", "certificate"],
    answer: "Har bir kurs yakunida imtihondan o'tasiz va muvaffaqiyatli topshirsangiz, Razzoq Academy sertifikatini olasiz. Uni LinkedIn va CV'ingizga qo'shishingiz mumkin. Sertifikat ham bepul! 🏆",
  },
  {
    keys: ["ovoz", "ovozli", "mikrofon", "gaplash", "suhbat", "voice", "eshit"],
    answer: "Ovozli suhbat uchun AI Yordamchi sahifasida mikrofon tugmasini bosing va savolingizni ayting — men uni yozuvga aylantirib, javobni ham ovozli o'qib beraman. Yaxshi ishlashi uchun Chrome brauzeri tavsiya etiladi. Xuddi telefon'dagi yordamchi bilan gaplashgandek! 🎙️",
  },
  {
    keys: ["dars", "lesson", "mashg'ulot", "mashgulot", "qanday o'tiladi", "format"],
    answer: "Har bir kurs 4 xil formatdagi darslardan iborat:\n• Video darslar — istalgan vaqtda ko'rasiz\n• Amaliyotlar — real loyihalar\n• Jonli sessiyalar — mentor bilan savol-javob\n• Testlar — bilimni mustahkamlash\n\nProgress'ingiz kabinetda saqlanadi, to'xtagan joyingizdan davom etasiz.",
  },
  {
    keys: ["funksiya", "function"],
    answer: "Funksiya — bu ma'lum bir vazifani bajaradigan, qayta-qayta chaqirish mumkin bo'lgan kod bloki. Misol: `function salom(ism) { return \"Salom, \" + ism; }` — bu funksiya har chaqirilganda salomlashadi. Bir marta yozasiz, istalgancha ishlatasiz. Dasturlashdagi eng muhim tushunchalardan biri!",
  },
  {
    keys: ["o'zgaruvchi", "ozgaruvchi", "variable", "var nima"],
    answer: "O'zgaruvchi (variable) — ma'lumot saqlaydigan 'quti'. Masalan: `let yosh = 20;` — bu yerda 'yosh' qutisiga 20 soni solindi. JavaScript'da let va const bilan e'lon qilinadi. const — o'zgarmas, let — keyin o'zgartirsa bo'ladi.",
  },
  {
    keys: ["massiv", "array"],
    answer: "Massiv (array) — bir nechta qiymatni bitta o'zgaruvchida saqlaydigan ro'yxat: `let mevalar = [\"olma\", \"anor\", \"uzum\"]`. Elementlar 0 dan boshlab raqamlanadi: mevalar[0] — bu \"olma\". for tsikli bilan aylanib chiqish juda qulay.",
  },
  {
    keys: ["react nima", "react haqida"],
    answer: "React — Facebook (Meta) yaratgan UI kutubxonasi. Interfeysni kichik komponentlarga bo'lib quradi: `<Button />`, `<Card />` kabi. State o'zgarsa, faqat kerakli qism qayta chiziladi — shuning uchun tez. Zamonaviy front-end bozorining №1 talabi!",
  },
  {
    keys: ["motivatsiya", "ruhlant", "zerik", "charchadim", "qiyin", "epplay olma"],
    answer: "Eshiting: har bir expert bir paytlar beginner bo'lgan. Kuniga 30 daqiqa — yiliga 180 soat. Siz hozir shu 30 daqiqani boshladingiz, bu allaqachon ko'pchilikdan oldinda degani. Kichik qadamlar, lekin har kuni. Men siz bilanman — savolingiz bo'lsa, ovozli ham, yozma ham javob beraman. 💪🔥",
  },
  {
    keys: ["rahmat", "raxmat", "thanks", "spasibo"],
    answer: "Arzimaydi! Sizga yordam berish — mening asosiy vazifam. Yana savollar bo'lsa, tortinmay so'rang. O'qishda omad, Razzoq Academy doim yoningizda! ⚡",
  },
  {
    keys: ["mentor", "o'qituvchi", "oqituvchi", "ustoz", "kim o'rgatadi", "kim orgatadi"],
    answer: "Front-End kursida amaliyotchi mentor bor:\n• Front-End — Abdurazzoq Olimjonov (2 yillik tajriba)\n\nSavollaringizni kurs sahifasidagi AI yordamchidan ham so'rashingiz mumkin!",
  },
  {
    keys: ["vaqt", "necha soat", "qancha davom", "jadval", "grafik"],
    answer: "Darslar o'zingizga qulay vaqtda — video va amaliyotlar 24/7 ochiq. Jonli sessiyalar haftasiga 1 marta, odatda kechqurun. Bir kurs o'rtacha 2–4 oyda tugaydi (kuniga ~1 soat bilan). Shoshilmang, asosiysi — muntazamlik!",
  },
  {
    keys: ["admin", "boshqaruv", "panel", "administrator", "admin kodi"],
    answer: "Admin panel — sayt egasi uchun boshqaruv markazi. Unga kirish uchun ro'yxatdan o'tayotganda 'Admin kodi' maydoniga maxsus kodni kiritish kerak (kodni sayt egasi biladi). Admin panelida: foydalanuvchilar ro'yxati, kurslar statistikasi, AI savollari tahlili va ma'lumotlar bazasini eksport/import qilish mumkin. Oddiy o'quvchilar bu panelni ko'rmaydi.",
  },
];

export const SUGGESTIONS = [
  "Kurslar haqida aytib ber",
  "Ro'yxatdan qanday o'taman?",
  "Funksiya nima?",
  "Knowledge tarjimasi",
  "Motivatsiya ber",
  "Sertifikat bormi?",
];

export const FAQS = [
  {
    q: "Kurslar rostdan ham bepulmi?",
    a: "Ha, 100% bepul. Darslar, amaliy loyihalar, jonli sessiyalar, AI yordamchi va sertifikat — hech biri uchun pul so'ralmaydi. Ro'yxatdan o'tish ham tekin va 1 daqiqa oladi.",
  },
  {
    q: "AI bilan ovozli suhbat qanday ishlaydi?",
    a: "AI Yordamchi sahifasida mikrofon tugmasini bosib savolingizni aytasiz — tizim ovozingizni matnga aylantiradi, AI javob tayyorlaydi va uni ovozli o'qib beradi. Yozma savol ham xuddi shunday ishlaydi.",
  },
  {
    q: "Bir vaqtda nechta kurs o'qisam bo'ladi?",
    a: "Cheklov yo'q — istaganingizcha kursga yoziling. Lekin maslahatimiz: bir vaqtda 1–2 ta kursga e'tibor qarating, natija sifatliroq bo'ladi.",
  },
  {
    q: "Telefondan kirish mumkinmi?",
    a: "Albatta! Sayt barcha qurilmalarga moslashgan. Darslarni telefonda ko'rasiz, AI bilan ovozli ham suhbatlashasiz. Ovozli funksiyalar uchun Chrome brauzeri tavsiya etiladi.",
  },
  {
    q: "Sertifikat qanday olinadi?",
    a: "Kursdagi barcha darslarni tugatib, oxirgi imtihon testini topshirasiz. Natija ijobiy bo'lsa, shaxsiy sertifikatingiz kabinetga tushadi — uni yuklab olib, CV'ingizga qo'shasiz.",
  },
];

export const TIPS = [
  "Kuniga 30 daqiqa — yiliga 180 soat o'qish degani. Muntazamlik iste'doddan kuchliroq.",
  "Yangi mavzuni o'rgangach, uni birovga tushuntirib ko'ring — eng yaxshi mustahkamlash usuli.",
  "Xato qilishdan qo'rqmang: har bir xato — tushunishga bir qadam yaqinroq.",
  "Darsdan keyin 10 daqiqa AI yordamchi bilan mavzuni takrorlang — bilim 2 baravar mustahkam bo'ladi.",
  "Konspekt yozing: qo'l bilan yozilgan bilim xotirada 3 baravar uzoq qoladi.",
];
