import React, { useEffect, useMemo, useState, useRef } from "react";
import { CATEGORIES, COURSES, type Course, type Lesson } from "../data";
import { NOTES } from "../lessonNotes";
import { useApp } from "../store";
import { Icon, Kicker, Reveal } from "../components/ui";

/* ---------- video havolani tahlil qilish ---------- */
type ParsedVideo = 
  | { type: "youtube"; id: string }
  | { type: "vimeo"; id: string }
  | { type: "dailymotion"; id: string }
  | { type: "file"; src: string }
  | null;

export function parseVideo(url: string): ParsedVideo {
  const u = url.trim();
  if (!u) return null;
  
  // YouTube - barcha formatlar
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://youtube.com/watch?v=VIDEO_ID
  // https://www.youtube.com/embed/VIDEO_ID
  // https://www.youtube.com/shorts/VIDEO_ID
  const ytPatterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.+&v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    /(?:youtube\.com\/live\/)([\w-]{11})/,
  ];
  
  for (const pattern of ytPatterns) {
    const match = u.match(pattern);
    if (match) return { type: "youtube", id: match[1] };
  }
  
  // Vimeo
  const vimeo = u.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return { type: "vimeo", id: vimeo[1] };
  
  // Dailymotion
  const dm = u.match(/dailymotion\.com\/video\/([a-z0-9]+)/i);
  if (dm) return { type: "dailymotion", id: dm[1] };
  
  // Google Drive - https://drive.google.com/file/d/FILE_ID/view
  const gdrive = u.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdrive) {
    return { type: "file", src: `https://drive.google.com/file/d/${gdrive[1]}/preview` };
  }
  
  // Dropbox - https://www.dropbox.com/s/FILE_ID/filename.mp4?dl=0
  if (u.includes("dropbox.com")) {
    const dropboxUrl = u.replace(/\?dl=\d+$/, "?raw=1").replace(/dropbox\.com/, "dl.dropboxusercontent.com");
    return { type: "file", src: dropboxUrl };
  }
  
  // /videos/ papkasidagi fayllar (public/videos/)
  if (u.startsWith("/videos/")) {
    return { type: "file", src: u };
  }
  
  // IndexedDB'dan yuklangan video
  if (u.startsWith("indexeddb://")) {
    return { type: "file", src: u };
  }
  
  // To'g'ridan-to'g'ri video fayl (URL, base64 yoki blob)
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(u) || u.startsWith("data:video/") || u.startsWith("blob:")) {
    return { type: "file", src: u };
  }
  
  // Boshqa to'g'ridan-to'g'ri video URL'lar
  if (u.startsWith("http") && /\.(mp4|webm|ogg|mov|m3u8)(\?|$)/i.test(u)) {
    return { type: "file", src: u };
  }
  
  return null;
}

/* ---------- IndexedDB yordamchi funksiyalari ---------- */
const DB_NAME = "RazzoqAcademyDB";
const STORE_NAME = "videos";

const openVideoDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
};

const getVideoFromDB = async (id: string): Promise<string | null> => {
  try {
    const db = await openVideoDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.file) {
          const url = URL.createObjectURL(result.file);
          resolve(url);
        } else {
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error('IndexedDB xatosi:', error);
    return null;
  }
};

/* ---------- modullar meta ---------- */
const MODULE_META: Record<string, { icon: string; color: string; desc: string }> = {
  HTML: { icon: "code", color: "var(--coral)", desc: "Sahifa skeleti" },
  CSS: { icon: "palette", color: "var(--sky)", desc: "Dizayn va layout" },
  JavaScript: { icon: "bolt", color: "var(--amber)", desc: "Dinamika va mantiq" },
  "React JS": { icon: "spark", color: "var(--teal)", desc: "Zamonaviy ilovalar" },
};

const catIcon: Record<string, string> = {
  Dasturlash: "code",
  AI: "brain",
  Til: "globe",
  Dizayn: "palette",
  Marketing: "mega",
};

/* ================= KATALOG ================= */
export function CourseCatalog() {
  const [cat, setCat] = useState<string>("Barchasi");
  const [q, setQ] = useState("");
  const { progress, user, navigate, customCourses, users } = useApp();
  
  // Har bir kurs uchun haqiqiy o'quvchilar sonini hisoblash
  const getCourseStudents = (courseId: string): number => {
    return users.filter(u => {
      const userProgress = JSON.parse(localStorage.getItem(`razzoq_prog_${u.id}`) || '{}');
      return userProgress[courseId] !== undefined;
    }).length;
  };

  const list = useMemo(() => {
    // Asosiy kurslarni customCourses bilan birlashtirish
    const allCourses = COURSES.map((c) => {
      const custom = customCourses[c.id];
      if (custom) {
        return { ...c, lessons: custom.lessons, hours: Math.round(custom.lessons.reduce((s, l) => s + l.dur, 0) / 60) };
      }
      return c;
    });
    
    // Custom kurslarni ham qo'shish (asosiy kurslarda yo'q bo'lsa)
    Object.values(customCourses).forEach((custom) => {
      if (!COURSES.find((c) => c.id === custom.id)) {
        allCourses.push({
          id: custom.id,
          title: custom.title,
          tag: "Yangi",
          category: "Dasturlash",
          level: "Noldan",
          hours: Math.round(custom.lessons.reduce((s, l) => s + l.dur, 0) / 60),
          students: 0,
          color: custom.color,
          desc: custom.desc,
          skills: [],
          mentor: { name: "Admin", role: "O'qituvchi", exp: "" },
          outcomes: [],
          lessons: custom.lessons,
        });
      }
    });
    
    return allCourses.filter(
      (c) =>
        (cat === "Barchasi" || c.category === cat) &&
        (q.trim() === "" ||
          c.title.toLowerCase().includes(q.toLowerCase()) ||
          c.skills.some((s) => s.toLowerCase().includes(q.toLowerCase())))
    );
  }, [cat, q, customCourses]);

  return (
    <div className="relative">
      <div className="absolute inset-0 grid-bg [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
      <div className="absolute -top-32 right-0 w-[500px] h-[500px] glow-amber rounded-full" />
      <div className="relative max-w-7xl mx-auto px-5 lg:px-8 pt-16 pb-24">
        <Kicker color="var(--amber)">KURSLAR KATALOGI</Kicker>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h1 className="font-d font-black text-[clamp(1.8rem,4vw,3.2rem)] leading-tight">
            Yirik kurslar —<br />
            <span className="text-[var(--amber)]">hammasi bepul</span>
          </h1>
          <p className="max-w-sm text-[0.9rem] text-[var(--mut)] leading-relaxed">
            {user ? `${user.name}, o'zingizga mos yo'nalishni tanlang — progress kabinetingizda saqlanadi.` : "Ro'yxatdan o'ting va istalgan kursga bir bosishda yoziling. Hech qanday to'lov yo'q."}
          </p>
        </div>

        {/* filter */}
        <div className="mt-10 flex flex-wrap items-center gap-3">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`font-d text-[0.7rem] font-semibold px-4 py-2.5 rounded-lg border transition-all cursor-pointer ${
                cat === c
                  ? "bg-[var(--lime)] text-[var(--ink)] border-[var(--lime)]"
                  : "border-[var(--line)] text-[var(--mut)] hover:border-[var(--lime)] hover:text-[var(--bone)]"
              }`}
            >
              {c}
            </button>
          ))}
          <div className="ml-auto relative w-full sm:w-auto">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Qidirish: React, IELTS, Figma…"
              className="field !w-full sm:!w-64 !py-2.5 !pr-10 !text-[0.85rem]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--dim)]">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            </span>
          </div>
        </div>

        {/* grid */}
        <div className="mt-10 grid md:grid-cols-2 gap-5">
          {list.map((c, i) => {
            const prog = progress[c.id];
            const pct = prog ? Math.round((prog.done.length / c.lessons.length) * 100) : null;
            return (
              <Reveal key={c.id} delay={(i % 2) * 90}>
                <a
                  href={`#/course/${c.id}`}
                  className="lift group block rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden h-full"
                  style={{ ["--hover-c" as any]: c.color }}
                >
                  <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${c.color}, ${c.color}33)` }} />
                  <div className="p-6 lg:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${c.color}1f`, color: c.color }}>
                        <Icon name={catIcon[c.category]} className="w-6 h-6" />
                      </div>
                      <div className="flex gap-2">
                        {prog && <span className="chip !text-[var(--lime)] !border-[rgba(201,241,88,0.4)]">✓ {pct}%</span>}
                        <span className="chip" style={{ color: c.color, borderColor: `${c.color}55` }}>{c.tag}</span>
                      </div>
                    </div>
                    <h3 className="font-d font-bold text-lg mt-5 group-hover:text-[var(--lime)] transition-colors">{c.title}</h3>
                    <p className="mt-2.5 text-[0.86rem] text-[var(--mut)] leading-relaxed line-clamp-2">{c.desc}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {c.skills.slice(0, 4).map((s) => (
                        <span key={s} className="font-mono text-[0.66rem] text-[var(--mut)] bg-[var(--ink2)] border border-[var(--line-soft)] px-2.5 py-1 rounded-md">{s}</span>
                      ))}
                    </div>
                    <div className="mt-6 pt-5 border-t border-[var(--line-soft)] flex items-center justify-between">
                      <span className="flex flex-wrap gap-x-4 gap-y-1 text-[0.72rem] font-mono text-[var(--mut)]">
                        <span className="flex items-center gap-1.5"><Icon name="book" className="w-3.5 h-3.5" />{c.lessons.length} dars</span>
                        <span className="flex items-center gap-1.5"><Icon name="clock" className="w-3.5 h-3.5" />{c.hours} soat</span>
                        <span className="flex items-center gap-1.5"><Icon name="users" className="w-3.5 h-3.5" />{getCourseStudents(c.id)} o'quvchi</span>
                      </span>
                      <span className="shrink-0 w-9 h-9 rounded-lg border border-[var(--line)] flex items-center justify-center group-hover:bg-[var(--lime)] group-hover:text-[var(--ink)] group-hover:border-[var(--lime)] transition-all">
                        <Icon name="arrow" className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </a>
              </Reveal>
            );
          })}
        </div>
        {list.length === 0 && (
          <div className="mt-16 text-center py-16 border border-dashed border-[var(--line)] rounded-xl">
            <p className="font-d font-bold text-lg">Hech narsa topilmadi 🤔</p>
            <p className="mt-2 text-[0.88rem] text-[var(--mut)]">Qidiruv so'zini o'zgartiring yoki AI yordamchidan so'rang.</p>
            <button onClick={() => navigate("/assistant")} className="btn-ghost mt-6">AI'DAN SO'RASH</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= QUIZ MODAL ================= */
function QuizModal({
  lesson, onClose, onComplete,
}: {
  lesson: Lesson;
  onClose: () => void;
  onComplete: (score: number, passed: boolean) => void;
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  if (!lesson.quiz || lesson.quiz.length === 0) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[rgba(6,10,7,0.95)] backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-2xl rounded-xl bg-[var(--surface)] p-8 text-center">
          <Icon name="alert" className="w-16 h-16 text-[var(--amber)] mx-auto mb-4" />
          <p className="text-[var(--bone)] text-lg font-bold mb-2">Test mavjud emas</p>
          <p className="text-[var(--mut)] mb-6">Bu dars uchun test savollari qo'shilmagan.</p>
          <button onClick={onClose} className="btn-lime">YOPISH</button>
        </div>
      </div>
    );
  }

  const questions = lesson.quiz;
  const question = questions[currentQuestion];

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Test tugadi, natijani hisoblash
      const correct = newAnswers.filter((ans, idx) => ans === questions[idx].correctAnswer).length;
      const finalScore = Math.round((correct / questions.length) * 100);
      const passed = finalScore >= 70; // 70% dan yuqori bo'lsa o'tgan
      
      setScore(finalScore);
      setShowResult(true);
      onComplete(finalScore, passed);
    }
  };

  if (showResult) {
    const passed = score >= 70;
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[rgba(6,10,7,0.95)] backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-2xl rounded-xl bg-[var(--surface)] p-8 text-center" onClick={(e) => e.stopPropagation()}>
          {passed ? (
            <>
              <div className="w-20 h-20 rounded-full bg-[var(--lime)] flex items-center justify-center mx-auto mb-4">
                <Icon name="check" className="w-12 h-12 text-[var(--ink)]" />
              </div>
              <p className="text-[var(--lime)] text-2xl font-bold mb-2">Tabriklaymiz! 🎉</p>
              <p className="text-[var(--bone)] text-lg mb-4">Test muvaffaqiyatli topshirildi!</p>
              <p className="text-[var(--mut)] mb-6">Sizning natijangiz: <span className="text-[var(--lime)] font-bold">{score}%</span></p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-[var(--coral)] flex items-center justify-center mx-auto mb-4">
                <Icon name="x" className="w-12 h-12 text-[var(--ink)]" />
              </div>
              <p className="text-[var(--coral)] text-2xl font-bold mb-2">Afsuski... 😔</p>
              <p className="text-[var(--bone)] text-lg mb-4">Test topshirilmadi</p>
              <p className="text-[var(--mut)] mb-6">Sizning natijangiz: <span className="text-[var(--coral)] font-bold">{score}%</span></p>
              <p className="text-[var(--mut)] text-sm mb-6">O'tish uchun kamida 70% kerak. Darsni qayta ko'rib chiqing va qaytadan urinib ko'ring.</p>
            </>
          )}
          <button onClick={onClose} className="btn-lime">YOPISH</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[rgba(6,10,7,0.95)] backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl bg-[var(--surface)] p-8" onClick={(e) => e.stopPropagation()}>
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[var(--mut)] text-sm">Savol {currentQuestion + 1} / {questions.length}</span>
            <span className="text-[var(--lime)] text-sm font-bold">{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-[var(--ink2)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--lime)] transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Savol */}
        <h3 className="text-[var(--bone)] text-xl font-bold mb-6">{question.question}</h3>

        {/* Javoblar */}
        <div className="space-y-3 mb-8">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedAnswer(idx)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedAnswer === idx
                  ? "border-[var(--lime)] bg-[rgba(201,241,88,0.1)] text-[var(--bone)]"
                  : "border-[var(--line)] bg-[var(--ink2)] text-[var(--mut)] hover:border-[var(--lime)]"
              }`}
            >
              <span className="font-bold mr-3">{String.fromCharCode(65 + idx)}.</span>
              {option}
            </button>
          ))}
        </div>

        {/* Tugmalar */}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">BEKOR QILISH</button>
          <button 
            onClick={handleNext} 
            disabled={selectedAnswer === null}
            className="btn-lime flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentQuestion < questions.length - 1 ? "KEYINGI" : "YAKUNLASH"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= FINAL EXAM MODAL ================= */
function FinalExamModal({
  course, onClose, onComplete,
}: {
  course: Course;
  onClose: () => void;
  onComplete: (score: number, passed: boolean) => void;
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  if (!course.finalExam || course.finalExam.questions.length === 0) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[rgba(6,10,7,0.95)] backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-2xl rounded-xl bg-[var(--surface)] p-8 text-center">
          <Icon name="alert" className="w-16 h-16 text-[var(--amber)] mx-auto mb-4" />
          <p className="text-[var(--bone)] text-lg font-bold mb-2">Yakuniy imtihon mavjud emas</p>
          <p className="text-[var(--mut)] mb-6">Bu kurs uchun yakuniy imtihon qo'shilmagan.</p>
          <button onClick={onClose} className="btn-lime">YOPISH</button>
        </div>
      </div>
    );
  }

  const questions = course.finalExam.questions;
  const passingScore = course.finalExam.passingScore;
  const question = questions[currentQuestion];

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const correct = newAnswers.filter((ans, idx) => ans === questions[idx].correctAnswer).length;
      const finalScore = Math.round((correct / questions.length) * 100);
      const passed = finalScore >= passingScore;
      
      setScore(finalScore);
      setShowResult(true);
      onComplete(finalScore, passed);
    }
  };

  if (showResult) {
    const passed = score >= passingScore;
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[rgba(6,10,7,0.95)] backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-2xl rounded-xl bg-[var(--surface)] p-8 text-center" onClick={(e) => e.stopPropagation()}>
          {passed ? (
            <>
              <div className="w-24 h-24 rounded-full bg-[var(--lime)] flex items-center justify-center mx-auto mb-4">
                <Icon name="award" className="w-14 h-14 text-[var(--ink)]" />
              </div>
              <p className="text-[var(--lime)] text-3xl font-bold mb-2">Tabriklaymiz! 🎉</p>
              <p className="text-[var(--bone)] text-xl mb-4">Yakuniy imtihon muvaffaqiyatli topshirildi!</p>
              <p className="text-[var(--mut)] mb-2">Sizning natijangiz: <span className="text-[var(--lime)] font-bold text-2xl">{score}%</span></p>
              <p className="text-[var(--mut)] mb-6">Endi sertifikatingizni olishingiz mumkin!</p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-[var(--coral)] flex items-center justify-center mx-auto mb-4">
                <Icon name="x" className="w-14 h-14 text-[var(--ink)]" />
              </div>
              <p className="text-[var(--coral)] text-3xl font-bold mb-2">Afsuski... 😔</p>
              <p className="text-[var(--bone)] text-xl mb-4">Yakuniy imtihon topshirilmadi</p>
              <p className="text-[var(--mut)] mb-2">Sizning natijangiz: <span className="text-[var(--coral)] font-bold text-2xl">{score}%</span></p>
              <p className="text-[var(--mut)] text-sm mb-6">O'tish uchun kamida {passingScore}% kerak. Darslarni qayta ko'rib chiqing va qaytadan urinib ko'ring.</p>
            </>
          )}
          <button onClick={onClose} className="btn-lime">YOPISH</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[rgba(6,10,7,0.95)] backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl bg-[var(--surface)] p-8" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="text-center mb-6">
          <Icon name="award" className="w-12 h-12 text-[var(--amber)] mx-auto mb-2" />
          <h2 className="text-[var(--bone)] text-2xl font-bold">Yakuniy Imtihon</h2>
          <p className="text-[var(--mut)] text-sm">{course.title}</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[var(--mut)] text-sm">Savol {currentQuestion + 1} / {questions.length}</span>
            <span className="text-[var(--lime)] text-sm font-bold">{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-[var(--ink2)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--lime)] transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Savol */}
        <h3 className="text-[var(--bone)] text-xl font-bold mb-6">{question.question}</h3>

        {/* Javoblar */}
        <div className="space-y-3 mb-8">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedAnswer(idx)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedAnswer === idx
                  ? "border-[var(--lime)] bg-[rgba(201,241,88,0.1)] text-[var(--bone)]"
                  : "border-[var(--line)] bg-[var(--ink2)] text-[var(--mut)] hover:border-[var(--lime)]"
              }`}
            >
              <span className="font-bold mr-3">{String.fromCharCode(65 + idx)}.</span>
              {option}
            </button>
          ))}
        </div>

        {/* Tugmalar */}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">BEKOR QILISH</button>
          <button 
            onClick={handleNext} 
            disabled={selectedAnswer === null}
            className="btn-lime flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentQuestion < questions.length - 1 ? "KEYINGI" : "YAKUNLASH"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= VIDEO MODAL ================= */
function VideoModal({
  lesson, url, isCustom, onClose, onEdit, onRemove,
}: {
  lesson: Lesson; url: string; isCustom: boolean;
  onClose: () => void; onEdit: () => void; onRemove: () => void;
}) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === "ArrowLeft") seek(-5);
      if (e.key === "ArrowRight") seek(5);
      if (e.key === "m" || e.key === "M") toggleMute();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // IndexedDB'dan videoni yuklab olish
  useEffect(() => {
    if (url.startsWith("indexeddb://")) {
      setLoading(true);
      const videoId = url.replace("indexeddb://", "");
      getVideoFromDB(videoId).then((src) => {
        setVideoSrc(src);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    } else {
      setVideoSrc(url);
    }
  }, [url]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const seek = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Number(e.target.value);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const replay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const v = parseVideo(videoSrc || url);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[rgba(6,10,7,0.95)] backdrop-blur-sm" onClick={onClose}>
      <div className="toast-in w-full max-w-4xl rounded-xl overflow-hidden shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]" onClick={(e) => e.stopPropagation()}>
        {/* Sarlavha - faqat yopish tugmasi */}
        <div className="flex items-center justify-end gap-4 px-3 py-2 bg-black">
          <button onClick={onClose} aria-label="Yopish" className="shrink-0 w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.1)] flex items-center justify-center text-white hover:bg-[rgba(255,255,255,0.2)] transition-colors cursor-pointer">
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>
        <div className="aspect-video bg-black relative group">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-[var(--mut)]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--lime)]"></div>
              <p className="text-[0.85rem]">Video yuklanmoqda...</p>
            </div>
          ) : v?.type === "youtube" ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${v.id}?autoplay=1&rel=0&modestbranding=1&showinfo=0&controls=0&iv_load_policy=3&disablekb=1&enablejsapi=1&playlist=${v.id}&loop=1&origin=${window.location.origin}`}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ border: 'none' }}
            />
          ) : v?.type === "vimeo" ? (
            <iframe
              className="w-full h-full"
              src={`https://player.vimeo.com/video/${v.id}?autoplay=1&title=0&byline=0&portrait=0&badge=0&controls=0`}
              title={lesson.title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              style={{ border: 'none' }}
            />
          ) : v?.type === "dailymotion" ? (
            <iframe
              className="w-full h-full"
              src={`https://www.dailymotion.com/embed/video/${v.id}?autoplay=1&logo=0&info=0&controls=0`}
              title={lesson.title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              style={{ border: 'none' }}
            />
          ) : v?.type === "file" && videoSrc ? (
            <>
              <video 
                ref={videoRef}
                className="w-full h-full" 
                src={videoSrc} 
                autoPlay
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onEnded={() => setIsPlaying(false)}
                onClick={togglePlay}
              />
              
              {/* Custom Video Controls */}
              <div 
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
              >
                {/* Progress Bar */}
                <div className="mb-3">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--lime)]"
                    style={{ background: `linear-gradient(to right, var(--lime) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%)` }}
                  />
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    {/* Replay Button */}
                    <button onClick={replay} className="hover:text-[var(--lime)] transition-colors cursor-pointer" title="Qayta ko'rish">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>

                    {/* Play/Pause Button */}
                    <button onClick={togglePlay} className="hover:text-[var(--lime)] transition-colors cursor-pointer" title={isPlaying ? "Pauza" : "Ijro"}>
                      {isPlaying ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>

                    {/* Skip Backward */}
                    <button onClick={() => seek(-5)} className="hover:text-[var(--lime)] transition-colors cursor-pointer" title="5 soniya orqaga">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                      </svg>
                    </button>

                    {/* Skip Forward */}
                    <button onClick={() => seek(5)} className="hover:text-[var(--lime)] transition-colors cursor-pointer" title="5 soniya oldinga">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                      </svg>
                    </button>

                    {/* Time Display */}
                    <span className="text-sm font-mono">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Volume Control */}
                    <div className="flex items-center gap-2">
                      <button onClick={toggleMute} className="hover:text-[var(--lime)] transition-colors cursor-pointer" title={isMuted ? "Ovozli" : "Ovozsiz"}>
                        {isMuted || volume === 0 ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-[var(--mut)] px-6 text-center">
              <Icon name="film" className="w-10 h-10 text-[var(--dim)]" />
              <p className="text-[0.85rem]">Video yuklanmadi yoki mavjud emas.</p>
            </div>
          )}
        </div>
        {/* Admin tugmalari olib tashlandi - faqat video ko'rinadi */}
      </div>
    </div>
  );
}

/* ================= KURS SAHIFASI ================= */
export function CourseDetail({ id }: { id: string }) {
  const { user, progress, enroll, toggleLesson, navigate, showToast, videoLinks, setVideoLink, removeVideoLink, customCourses, users, mentorMaps, quizResults, saveQuizResult, certificates, addCertificate, hasCertificate, quizMap, finalExamMap } = useApp();
  const [quizLesson, setQuizLesson] = useState<Lesson | null>(null);
  const [showFinalExam, setShowFinalExam] = useState(false);
  
  // Asosiy kurs yoki custom kursni topish
  const baseCourse = COURSES.find((c) => c.id === id);
  const customCourse = customCourses[id];
  
  // Haqiqiy o'quvchilar sonini hisoblash
  const courseStudents = users.filter(u => {
    const userProgress = JSON.parse(localStorage.getItem(`razzoq_prog_${u.id}`) || '{}');
    return userProgress[id] !== undefined;
  }).length;
  
  // Agar custom kurs bo'lsa, uni asosiy kurs bilan birlashtirish
  const course: Course | undefined = useMemo(() => {
    // Mentor ma'lumotlarini aniqlash
    const getMentor = () => {
      if (customCourse?.mentor) return customCourse.mentor;
      if (mentorMaps[id]) return mentorMaps[id];
      if (baseCourse) return baseCourse.mentor;
      return { name: "Admin", role: "O'qituvchi", exp: "" };
    };
    
    if (customCourse && baseCourse) {
      return { 
        ...baseCourse, 
        lessons: customCourse.lessons, 
        hours: Math.round(customCourse.lessons.reduce((s, l) => s + l.dur, 0) / 60),
        mentor: getMentor()
      };
    } else if (customCourse) {
      return { 
        id: customCourse.id, 
        title: customCourse.title, 
        tag: "Custom", 
        category: "Dasturlash", 
        level: "Noldan", 
        hours: Math.round(customCourse.lessons.reduce((s, l) => s + l.dur, 0) / 60), 
        students: courseStudents, 
        color: customCourse.color, 
        desc: customCourse.desc, 
        skills: [], 
        mentor: getMentor(), 
        outcomes: [], 
        lessons: customCourse.lessons 
      };
    }
    if (baseCourse) {
      return { ...baseCourse, mentor: getMentor() };
    }
    return undefined;
  }, [baseCourse, customCourse, customCourses, courseStudents, mentorMaps, id]);
  
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [videoLesson, setVideoLesson] = useState<Lesson | null>(null);
  const [addingVideo, setAddingVideo] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [urlError, setUrlError] = useState("");

  if (!course) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-32 text-center">
        <p className="font-d font-black text-3xl">Kurs topilmadi</p>
        <a href="#/courses" className="btn-lime mt-8 inline-flex">KATALOGGA QAYTISH</a>
      </div>
    );
  }

  const prog = progress[course.id];
  const done = prog?.done ?? [];
  const pct = Math.round((done.length / course.lessons.length) * 100);
  const doneMinutes = course.lessons.filter((l) => done.includes(l.id)).reduce((s, l) => s + l.dur, 0);

  /* darslarni modullarga guruhlash */
  const sections = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    course.lessons.forEach((l) => {
      const key = l.section ?? "Umumiy";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    });
    return [...map.entries()];
  }, [course, course.lessons]);

  const saveVideo = (lid: string) => {
    if (!parseVideo(urlDraft)) {
      setUrlError("Havola formati noto'g'ri — YouTube (youtube.com/watch?v=… yoki youtu.be/…) yoki to'g'ridan-to'g'ri video (.mp4, .webm) havolasini kiriting");
      return;
    }
    setVideoLink(lid, urlDraft.trim());
    setAddingVideo(null);
    setUrlDraft("");
    setUrlError("");
    showToast("🎬 Video darslik qo'shildi — endi film belgisidan ochiladi!");
  };

  const openVideoOrForm = (l: Lesson) => {
    const url = l.video || videoLinks[l.id] || "";
    
    // Debug: console.log qilish
    console.log("Video URL:", url, "Lesson ID:", l.id, "videoLinks:", videoLinks);
    
    if (url) {
      // Video mavjud - ochish
      setVideoLesson(l);
    } else if (user?.role === "admin") {
      // Admin video qo'sha oladi
      setAddingVideo(addingVideo === l.id ? null : l.id);
      setUrlDraft("");
      setUrlError("");
    } else {
      // Foydalanuvchi - video yo'q
      showToast("📚 Video hali qo'shilmagan. Admin panelda video qo'shiladi.");
    }
  };

  const handleEnroll = () => {
    if (!user) {
      showToast("Kursga yozilish uchun avval ro'yxatdan o'ting");
      navigate("/auth");
      return;
    }
    enroll(course.id);
    showToast(`🎉 "${course.title}" kursiga yozildingiz — bepul!`);
  };

  const handleToggle = (lid: string) => {
    if (!prog) return;
    toggleLesson(course.id, lid);
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 grid-bg [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" />
      <div className="absolute -top-24 -left-32 w-[460px] h-[460px] rounded-full" style={{ background: `radial-gradient(circle, ${course.color}1c, transparent 65%)` }} />
      <div className="relative max-w-7xl mx-auto px-5 lg:px-8 pt-12 pb-24">
        <a href="#/courses" className="inline-flex items-center gap-2 text-[0.78rem] font-mono text-[var(--mut)] hover:text-[var(--lime)] transition-colors">
          <Icon name="arrow" className="w-4 h-4 rotate-180" /> katalogga qaytish
        </a>

        {/* hero */}
        <div className="mt-8 grid lg:grid-cols-[1.5fr_1fr] gap-10">
          <div>
            <Reveal>
              <div className="flex flex-wrap items-center gap-3">
                <span className="chip" style={{ color: course.color, borderColor: `${course.color}55` }}>{course.tag}</span>
                <span className="chip">{course.category}</span>
                <span className="chip !text-[var(--lime)] !border-[rgba(201,241,88,0.4)]">100% BEPUL</span>
              </div>
              <h1 className="font-d font-black text-[clamp(1.7rem,3.8vw,3rem)] leading-tight mt-5">
                {course.title}
              </h1>
              <p className="mt-5 max-w-xl text-[0.98rem] text-[var(--mut)] leading-relaxed">{course.desc}</p>
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: "book", v: `${course.lessons.length}`, l: "dars" },
                  { icon: "clock", v: `${course.hours}`, l: "soat" },
                  { icon: "users", v: courseStudents, l: "o'quvchi" },
                  { icon: "chart", v: course.level.split(" ")[0], l: "daraja" },
                ].map((m, i) => (
                  <div key={i} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 hover:border-[var(--lime)] transition-colors">
                    <Icon name={m.icon} className="w-5 h-5 mb-2" />
                    <p className="font-d font-bold text-lg" style={{ color: course.color }}>{m.v}</p>
                    <p className="text-[0.68rem] text-[var(--mut)] uppercase tracking-wide mt-0.5">{m.l}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="mt-8 flex flex-wrap gap-2">
                {course.skills.map((s) => (
                  <span key={s} className="font-mono text-[0.7rem] px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--ink2)] text-[var(--mut)] hover:text-[var(--bone)] hover:border-[var(--line)] transition-colors">{s}</span>
                ))}
              </div>
            </Reveal>

            {/* darslar ro'yxati */}
            <Reveal delay={260}>
              <div className="mt-12">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <h2 className="font-d font-bold text-lg">Darslar dasturi</h2>
                  {prog ? (
                    <span className="font-mono text-[0.74rem] text-[var(--lime)]">
                      {done.length}/{course.lessons.length} bajarildi · {Math.round(doneMinutes / 60 * 10) / 10} soat o'zlashtirildi
                    </span>
                  ) : (
                    <span className="font-mono text-[0.68rem] text-[var(--dim)] flex items-center gap-2">
                      <Icon name="film" className="w-3.5 h-3.5 text-[var(--coral)]" /> film belgisi — video ·
                      <Icon name="book" className="w-3.5 h-3.5 text-[var(--teal)]" /> kitobcha — yozma darslik
                    </span>
                  )}
                </div>
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-dashed border-[var(--amber)] bg-[rgba(255,154,60,0.06)] px-5 py-4">
                  <Icon name="film" className="w-5 h-5 text-[var(--amber)] shrink-0 mt-0.5" />
                  <p className="text-[0.84rem] text-[var(--mut)] leading-relaxed">
                    Har darsga <strong className="text-[var(--bone)]">video qo'yish mumkin</strong>: film belgisini bosib YouTube yoki .mp4 havolani kiriting — havola saqlanadi va dars shu yerda ochiladi.{" "}
                    {!prog && <>Darslarni belgilab borish uchun kursga <strong className="text-[var(--bone)]">bepul</strong> yoziling — progress'ingiz kabinetingizda saqlanadi.</>}
                  </p>
                </div>
                <div className="space-y-9">
                  {sections.map(([secName, lessons], si) => {
                    const meta = MODULE_META[secName] ?? { icon: "book", color: course.color, desc: "qo'shimcha" };
                    const secDone = lessons.filter((x) => done.includes(x.id)).length;
                    const secPct = Math.round((secDone / lessons.length) * 100);
                    return (
                      <div key={secName}>
                        {/* modul sarlavhasi */}
                        <div className="mb-3 rounded-xl border border-[var(--line)] bg-[var(--ink2)] px-4 sm:px-5 py-4 flex flex-wrap items-center gap-4">
                          <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${meta.color} 15%, transparent)`, color: meta.color }}>
                            <Icon name={meta.icon} className="w-5 h-5" />
                          </span>
                          <div className="flex-1 min-w-[150px]">
                            <p className="font-mono text-[0.6rem] tracking-[0.22em] uppercase" style={{ color: meta.color }}>
                              Modul {String(si + 1).padStart(2, "0")} · {lessons.length} ta dars
                            </p>
                            <h3 className="font-d font-bold text-[0.95rem] mt-1">
                              {secName} <span className="font-mono text-[0.66rem] font-normal text-[var(--dim)]">— {meta.desc}</span>
                            </h3>
                          </div>
                          <div className="flex items-center gap-3 shrink-0" title={`${secDone} ta dars bajarildi`}>
                            <div className="w-24 h-1.5 rounded-full bg-[var(--surface2)] overflow-hidden hidden sm:block">
                              <div className="h-full rounded-full bar-grow" style={{ width: `${Math.max(secPct, 2)}%`, background: meta.color }} />
                            </div>
                            <span className="font-mono text-[0.68rem] text-[var(--mut)]">{secDone}/{lessons.length}</span>
                          </div>
                        </div>

                        {/* modul darslari */}
                        <div className="space-y-2">
                          {lessons.map((l, li) => {
                            const checked = done.includes(l.id);
                            const interactive = !!prog;
                            const isVideo = l.type === "Video";
                            const hasNote = !!NOTES[l.id];
                            const noteOpen = openNote === l.id;
                            const addOpen = addingVideo === l.id;
                            const rowOpen = noteOpen || addOpen;
                            const videoUrl = l.video || videoLinks[l.id] || "";
                            return (
                      <div key={l.id}>
                        <div
                          className={`flex items-center gap-3 sm:gap-4 rounded-xl border px-3.5 sm:px-4 py-3.5 transition-colors ${
                            checked ? "border-[rgba(201,241,88,0.4)] bg-[rgba(201,241,88,0.05)]" : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line)] hover:bg-[var(--surface2)]"
                          } ${rowOpen ? "rounded-b-none border-b-transparent" : ""}`}
                        >
                          <button
                            onClick={() => interactive && handleToggle(l.id)}
                            disabled={!interactive}
                            aria-label={`${l.title} bajarildi deb belgilash`}
                            className={`shrink-0 w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                              !interactive
                                ? "border-[var(--line)] opacity-40 cursor-not-allowed"
                                : checked
                                ? "bg-[var(--lime)] border-[var(--lime)] text-[var(--ink)] cursor-pointer"
                                : "border-[var(--line)] hover:border-[var(--lime)] cursor-pointer"
                            }`}
                          >
                            {checked && <Icon name="check" className="w-3.5 h-3.5" />}
                          </button>
                          <span className="font-mono text-[0.7rem] text-[var(--dim)] w-6 sm:w-7">{String(li + 1).padStart(2, "0")}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[0.86rem] sm:text-[0.88rem] font-semibold truncate ${checked ? "line-through text-[var(--mut)]" : ""}`}>{l.title}</p>
                            <p className="text-[0.66rem] sm:text-[0.68rem] font-mono text-[var(--dim)] mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                              <span>{l.dur} daqiqa</span>
                              <span style={{ color: l.type === "Jonli" ? "var(--coral)" : l.type === "Amaliyot" ? "var(--amber)" : l.type === "Test" ? "var(--teal)" : "var(--mut)" }}>{l.type}</span>
                              {hasNote && <span className="text-[var(--teal)] hidden sm:inline">yozma darslik</span>}
                              {videoUrl && <span className="text-[var(--coral)] hidden sm:inline">video bor</span>}
                            </p>
                          </div>
                                  {/* video tugmasi */}
                                  <button
                                    onClick={() => openVideoOrForm(l)}
                                    aria-label={videoUrl ? "Video darslikni ochish" : "Video darslik qo'shish"}
                                    title={videoUrl ? "Video darslikni ochish" : "Video qo'shish (YouTube / .mp4 havola)"}
                                    className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                                      videoUrl
                                        ? "border-[rgba(255,107,94,0.5)] text-[var(--coral)] bg-[rgba(255,107,94,0.08)] hover:bg-[rgba(255,107,94,0.18)]"
                                        : addOpen
                                        ? "border-[var(--coral)] text-[var(--coral)] bg-[rgba(255,107,94,0.12)]"
                                        : "border-dashed border-[var(--line)] text-[var(--dim)] hover:text-[var(--coral)] hover:border-[var(--coral)]"
                                    }`}
                                  >
                                    <Icon name={videoUrl ? "play" : "film"} className="w-3.5 h-3.5" />
                                  </button>
                                  {/* yozma darslik tugmasi */}
                                  {hasNote && (
                                    <button
                                      onClick={() => setOpenNote(noteOpen ? null : l.id)}
                                      aria-label={noteOpen ? "Darslikni yopish" : "Yozma darslikni ochish"}
                                      aria-expanded={noteOpen}
                                      className="shrink-0 w-8 h-8 rounded-lg border border-[var(--line)] flex items-center justify-center text-[var(--mut)] hover:text-[var(--teal)] hover:border-[var(--teal)] transition-colors cursor-pointer"
                                      style={noteOpen ? { color: "var(--teal)", borderColor: "var(--teal)", background: "rgba(95,216,184,0.08)" } : checked ? { color: course.color, borderColor: `${course.color}55` } : {}}
                                    >
                                      <Icon name={noteOpen ? "chevron" : "book"} className={`w-3.5 h-3.5 transition-transform ${noteOpen ? "rotate-180" : ""}`} />
                                    </button>
                                  )}
                                  {/* test tugmasi */}
                                  {(quizMap[l.id] || l.quiz) && (quizMap[l.id] || l.quiz).length > 0 && (
                                    <button
                                      onClick={() => {
                                        // quizMap'dan yoki lesson.quiz'dan savollarni olish
                                        const quiz = quizMap[l.id] || l.quiz || [];
                                        const lessonWithQuiz = { ...l, quiz };
                                        setQuizLesson(lessonWithQuiz);
                                      }}
                                      aria-label="Test topshirish"
                                      title="Test topshirish"
                                      className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                                        quizResults[l.id]?.passed
                                          ? "border-[rgba(201,241,88,0.5)] text-[var(--lime)] bg-[rgba(201,241,88,0.08)]"
                                          : quizResults[l.id]
                                          ? "border-[rgba(255,107,94,0.5)] text-[var(--coral)] bg-[rgba(255,107,94,0.08)]"
                                          : "border-[var(--amber)] text-[var(--amber)] hover:bg-[rgba(255,154,60,0.12)]"
                                      }`}
                                    >
                                      <Icon name="target" className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                {/* video qo'shish formasi */}
                                {addOpen && (
                                  <div className="toast-in rounded-b-xl border border-t-0 border-[var(--coral)] bg-[rgba(255,107,94,0.04)] px-4 sm:px-5 py-4">
                                    <p className="flex items-center gap-2 font-mono text-[0.62rem] sm:text-[0.64rem] uppercase tracking-widest text-[var(--coral)] mb-3">
                                      <Icon name="film" className="w-3.5 h-3.5 shrink-0" /> Video darslik qo'shish
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <input
                                        value={urlDraft}
                                        onChange={(e) => { setUrlDraft(e.target.value); setUrlError(""); }}
                                        onKeyDown={(e) => e.key === "Enter" && saveVideo(l.id)}
                                        placeholder="YouTube havola (youtube.com/watch?v=… yoki youtu.be/…) yoki .mp4 fayl URL"
                                        className="field !py-2.5 !text-[0.82rem]"
                                        autoFocus
                                      />
                                      <div className="flex gap-2 shrink-0">
                                        <button onClick={() => saveVideo(l.id)} className="btn-lime !py-2.5 !px-4 !text-[0.62rem]">SAQLASH</button>
                                        <button onClick={() => setAddingVideo(null)} className="btn-ghost !py-2.5 !px-4 !text-[0.62rem]">BEKOR</button>
                                      </div>
                                    </div>
                                    {urlError && <p className="mt-2 text-[0.72rem] text-[var(--coral)] leading-snug">{urlError}</p>}
                                    <p className="mt-2 text-[0.66rem] font-mono text-[var(--dim)]">Havola brauzeringizda saqlanadi — dars endi shu yerda ochiladi.</p>
                                  </div>
                                )}
                                {/* yozma darslik */}
                                {hasNote && (
                                  <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${noteOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                                    <div className="overflow-hidden">
                                      <div className="rounded-b-xl border border-t-0 border-[var(--teal)] bg-[rgba(95,216,184,0.04)] px-4 sm:px-5 py-4">
                                        <p className="flex items-center gap-2 font-mono text-[0.62rem] sm:text-[0.66rem] uppercase tracking-widest text-[var(--teal)] mb-3">
                                          <Icon name="book" className="w-3.5 h-3.5 shrink-0" />{" "}
                                          {isVideo ? "Video dars — yozma darslik" : l.type === "Amaliyot" ? "Amaliyot — topshiriq va yechim yo'li" : l.type === "Jonli" ? "Jonli sessiya — reja va materiallar" : "Imtihon — mavzular va tayyorgarlik"}
                                        </p>
                                        <p className="text-[0.85rem] leading-relaxed text-[var(--bone)] whitespace-pre-line">{NOTES[l.id]}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          </div>

          {/* sidebar */}
          <div className="space-y-5 lg:sticky lg:top-28 self-start">
            <Reveal variant="right">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6">
                {prog ? (
                  <>
                    <p className="font-mono text-[0.7rem] text-[var(--mut)] uppercase tracking-widest">Sizning progress</p>
                    <p className="font-d font-black text-4xl mt-3" style={{ color: course.color }}>{pct}%</p>
                    <div className="mt-4 h-2.5 rounded-full bg-[var(--ink2)] overflow-hidden">
                      <div className="h-full rounded-full bar-grow" style={{ width: `${Math.max(pct, 3)}%`, background: course.color }} />
                    </div>
                    <p className="mt-3 text-[0.78rem] text-[var(--mut)]">{done.length} / {course.lessons.length} dars bajarildi</p>
                    
                    {/* Yakuniy imtihon tugmasi - faqat barcha darslar bajarilganda */}
                    {pct === 100 && (finalExamMap[course.id] || course.finalExam) && !hasCertificate(course.id) && (
                      <button 
                        onClick={() => setShowFinalExam(true)}
                        className="w-full mt-5 py-4 rounded-xl bg-gradient-to-r from-[var(--amber)] to-[var(--coral)] text-[var(--ink)] font-d font-bold text-[0.85rem] hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Icon name="award" className="w-5 h-5" /> YAKUNIY IMTIHON TOPSHIRISH
                      </button>
                    )}
                    
                    {/* Sertifikat - faqat imtihondan o'tganda */}
                    {hasCertificate(course.id) && (
                      <div className="mt-5 rounded-xl bg-[rgba(201,241,88,0.1)] border border-[rgba(201,241,88,0.4)] p-4 flex items-center gap-3">
                        <Icon name="award" className="w-7 h-7 text-[var(--lime)]" />
                        <div>
                          <p className="text-[0.82rem] font-semibold text-[var(--lime)]">Sertifikat olindi! 🏆</p>
                          <p className="text-[0.7rem] text-[var(--mut)]">Kabinetdan yuklab olishingiz mumkin</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Darslar ko'rilishi kerakligi haqida ogohlantirish */}
                    {pct < 100 && (
                      <div className="mt-5 rounded-xl bg-[rgba(255,154,60,0.08)] border border-[rgba(255,154,60,0.3)] p-4">
                        <p className="text-[0.78rem] text-[var(--amber)] font-semibold mb-2">📚 Sertifikat olish uchun:</p>
                        <ul className="text-[0.72rem] text-[var(--mut)] space-y-1">
                          <li>• Barcha darslarni ko'rib chiqing ({done.length}/{course.lessons.length})</li>
                          <li>• Har bir dars testini topshiring</li>
                          <li>• Yakuniy imtihondan o'ting (70%+)</li>
                        </ul>
                      </div>
                    )}
                    
                    <button onClick={() => navigate("/assistant")} className="btn-ghost w-full justify-center mt-5 group">
                      <Icon name="brain" className="w-4 h-4 text-[var(--lime)]" /> AI'DAN SAVOL SO'RASH
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-d font-bold text-lg leading-snug">Kursga bepul yoziling</p>
                    <p className="mt-2 text-[0.84rem] text-[var(--mut)] leading-relaxed">
                      {user ? "Bir bosishda yozilasiz — to'lov, karta, kutish yo'q." : "Avval ro'yxatdan o'ting (30 soniya), so'ng kurs ochiladi."}
                    </p>
                    <button onClick={handleEnroll} className="btn-lime w-full justify-center mt-5 group">
                      {user ? "KURSGA YOZILISH" : "RO'YXATDAN O'TISH"}
                      <Icon name="arrow" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <ul className="mt-6 space-y-2.5">
                      {["Barcha darslar darhol ochiladi", "AI yordamchi bilan birga", "Sertifikat — bepul", "Istalgan vaqtda to'xtatib qo'yish mumkin"].map((b) => (
                        <li key={b} className="flex items-center gap-2.5 text-[0.8rem] text-[var(--mut)]">
                          <Icon name="check" className="w-4 h-4 shrink-0 text-[var(--lime)]" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </Reveal>

            <Reveal variant="right" delay={120}>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6">
                <p className="font-mono text-[0.7rem] text-[var(--mut)] uppercase tracking-widest mb-4">Mentor</p>
                <div className="flex items-center gap-4">
                  <div className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center font-d font-black text-lg" style={{ background: `${course.color}1f`, color: course.color }}>
                    {course.mentor.name.split(" ").map((w) => w[0]).join("")}
                  </div>
                  <div>
                    <p className="font-d font-bold text-[0.92rem]">{course.mentor.name}</p>
                    <p className="text-[0.76rem] text-[var(--mut)] mt-0.5">{course.mentor.role}</p>
                    <p className="text-[0.7rem] font-mono mt-1" style={{ color: course.color }}>{course.mentor.exp}</p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal variant="right" delay={200}>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6">
                <p className="font-mono text-[0.7rem] text-[var(--mut)] uppercase tracking-widest mb-4">Nima o'rganasiz</p>
                <ul className="space-y-3">
                  {course.outcomes.map((o) => (
                    <li key={o} className="flex items-start gap-2.5 text-[0.84rem] leading-snug">
                      <Icon name="target" className="w-4 h-4 shrink-0 mt-0.5 text-[var(--amber)]" />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* video pleyer oynasi */}
      {videoLesson &&
        (() => {
          const url = videoLesson.video || videoLinks[videoLesson.id] || "";
          // Faqat admin uchun tahrirlash tugmalari ko'rinsin
          const isAdmin = user?.role === "admin";
          const isCustom = isAdmin && !videoLesson.video && !!videoLinks[videoLesson.id];
          return (
            <VideoModal
              lesson={videoLesson}
              url={url}
              isCustom={isCustom}
              onClose={() => setVideoLesson(null)}
              onEdit={() => {
                setUrlDraft(url);
                setUrlError("");
                setAddingVideo(videoLesson.id);
                setVideoLesson(null);
              }}
              onRemove={() => {
                removeVideoLink(videoLesson.id);
                setVideoLesson(null);
                showToast("Video havola o'chirildi");
              }}
            />
          );
        })()}
      
      {/* test oynasi */}
      {quizLesson && (
        <QuizModal
          lesson={quizLesson}
          onClose={() => setQuizLesson(null)}
          onComplete={(score, passed) => {
            saveQuizResult(quizLesson.id, score, passed);
            if (passed) {
              showToast(`✅ Test muvaffaqiyatli topshirildi! Natija: ${score}%`);
              // Darsni bajarilgan deb belgilash
              if (prog && !done.includes(quizLesson.id)) {
                toggleLesson(course.id, quizLesson.id);
              }
            } else {
              showToast(`❌ Test topshirilmadi. Natija: ${score}%. Qaytadan urinib ko'ring.`);
            }
          }}
        />
      )}
      
      {/* yakuniy imtihon oynasi */}
      {showFinalExam && course && (
        <FinalExamModal
          course={{
            ...course,
            finalExam: finalExamMap[course.id] || course.finalExam
          }}
          onClose={() => setShowFinalExam(false)}
          onComplete={(score, passed) => {
            if (passed && user) {
              // Sertifikat yaratish
              const certId = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
              addCertificate({
                id: certId,
                courseId: course.id,
                courseTitle: course.title,
                userName: user.name,
                userEmail: user.email,
                score: score,
                completedAt: new Date().toISOString(),
                certificateId: certId
              });
              showToast(`🏆 Tabriklaymiz! Sertifikat olindi! ID: ${certId}`);
            } else {
              showToast(`❌ Imtihon topshirilmadi. Natija: ${score}%. Qaytadan urinib ko'ring.`);
            }
          }}
        />
      )}
    </div>
  );
}
