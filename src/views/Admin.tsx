import React, { useEffect, useMemo, useRef, useState } from "react";
import { COURSES } from "../data";
import type { Msg, ProgressMap, CustomLesson } from "../store";
import { useApp } from "../store";
import { Icon, Kicker, Reveal } from "../components/ui";
import { parseVideo } from "./Courses";

/* ---------- IndexedDB yordamchi funksiyalari ---------- */
const DB_NAME = "RazzoqAcademyDB";
const DB_VERSION = 1;
const STORE_NAME = "videos";

const openVideoDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
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

const saveVideoToDB = async (db: IDBDatabase, id: string, file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    
    const videoData = {
      id,
      file,
      timestamp: Date.now(),
      size: file.size,
      type: file.type
    };
    
    const request = store.put(videoData);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

const getVideoFromDB = async (db: IDBDatabase, id: string): Promise<File | null> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.file : null);
    };
  });
};

const deleteVideoFromDB = async (db: IDBDatabase, id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

/* ---------- Haqiqiy AI API'ga ulanish ---------- */
const callRealAI = async (message: string, apiKey: string, provider: "gemini" | "qwen"): Promise<string> => {
  try {
    if (provider === "gemini") {
      // Google Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }],
          }),
        }
      );
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Javob olishda xatolik yuz berdi";
    } else if (provider === "qwen") {
      // Alibaba Qwen API (DashScope)
      const response = await fetch(
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "qwen-turbo",
            input: {
              messages: [{ role: "user", content: message }],
            },
          }),
        }
      );
      const data = await response.json();
      return data.output?.text || "Javob olishda xatolik yuz berdi";
    }
  } catch (error) {
    console.error("AI API xatosi:", error);
    return "AI xizmatiga ulanishda xatolik yuz berdi";
  }
  return "";
};

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("uz-UZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

type Tab = "umumiy" | "users" | "kurslar" | "darslar" | "ai" | "ai-settings" | "db";

export default function Admin() {
  const { user, users, navigate, deleteUser, setUserRole, showToast, videoLinks, setVideoLink, removeVideoLink, customCourses, addCustomCourse, removeCustomCourse, updateCustomCourse, addLessonToCourse, removeLessonFromCourse, updateLessonInCourse, aiConfig, setAiConfig } = useApp();
  const [tab, setTab] = useState<Tab>("umumiy");
  const [q, setQ] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  
  // Darslar boshqaruvi state
  const [selectedCourseId, setSelectedCourseId] = useState<string>(COURSES[0]?.id ?? "");
  const [videoDraft, setVideoDraft] = useState("");
  const [videoError, setVideoError] = useState("");
  
  // Yangi kurs qo'shish state
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [newCourseColor, setNewCourseColor] = useState("#C9F158");
  const [newCourseDuration, setNewCourseDuration] = useState(0);
  
  // Yangi dars qo'shish state
  const [showNewLesson, setShowNewLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonDur, setNewLessonDur] = useState(30);
  const [newLessonType, setNewLessonType] = useState<"Video" | "Amaliyot" | "Jonli" | "Test">("Video");
  
  // Tahrirlash state
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editCourseTitle, setEditCourseTitle] = useState("");
  const [editCourseDesc, setEditCourseDesc] = useState("");
  const [editCourseColor, setEditCourseColor] = useState("#C9F158");
  const [editCourseDuration, setEditCourseDuration] = useState(0);
  
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editLessonDur, setEditLessonDur] = useState(30);
  const [editLessonType, setEditLessonType] = useState<"Video" | "Amaliyot" | "Jonli" | "Test">("Video");
  const [showVideoForm, setShowVideoForm] = useState<string | null>(null);

  useEffect(() => {
    if (!user) navigate("/auth");
    else if (user.role !== "admin") navigate("/dashboard");
  }, [user, navigate]);
  if (!user || user.role !== "admin") return null;

  /* ---------- har foydalanuvchi uchun ma'lumot ---------- */
  const userRows = useMemo(
    () =>
      users.map((u) => {
        const prog: ProgressMap = (() => {
          try {
            return JSON.parse(localStorage.getItem(`razzoq_prog_${u.id}`) || "{}");
          } catch {
            return {};
          }
        })();
        const chat: Msg[] = (() => {
          try {
            return JSON.parse(localStorage.getItem(`razzoq_chat_${u.id}`) || "[]");
          } catch {
            return [];
          }
        })();
        const enrolled = Object.keys(prog);
        const totalDone = enrolled.reduce((s, c) => s + (prog[c]?.done.length ?? 0), 0);
        const totalLessons = enrolled.reduce((s, c) => s + (COURSES.find((x) => x.id === c)?.lessons.length ?? 0), 0);
        const pct = totalLessons ? Math.round((totalDone / totalLessons) * 100) : 0;
        const questions = chat.filter((m) => m.role === "user").length;
        return { u, prog, enrolled, totalDone, pct, questions };
      }),
    [users]
  );

  const filtered = userRows.filter(
    (r) =>
      r.u.name.toLowerCase().includes(q.toLowerCase()) ||
      r.u.email.toLowerCase().includes(q.toLowerCase())
  );

  /* ---------- umumiy statistika ---------- */
  const totalQuestions = userRows.reduce((s, r) => s + r.questions, 0);
  const totalDoneAll = userRows.reduce((s, r) => s + r.totalDone, 0);
  const admins = users.filter((u) => u.role === "admin").length;

  /* ---------- kurslar statistikasi ---------- */
  const courseStats = COURSES.map((c) => {
    const enrolledUsers = userRows.filter((r) => r.enrolled.includes(c.id));
    const doneInCourse = enrolledUsers.reduce((s, r) => s + (r.prog[c.id]?.done.length ?? 0), 0);
    const avg = enrolledUsers.length
      ? Math.round(
          (enrolledUsers.reduce((s, r) => s + (r.prog[c.id]?.done.length ?? 0) / c.lessons.length, 0) /
            enrolledUsers.length) *
            100
        )
      : 0;
    return { c, count: enrolledUsers.length, done: doneInCourse, avg };
  });

  /* ---------- AI statistikasi (eng ko'p so'ralgan kalit so'zlar) ---------- */
  const topicCount = useMemo(() => {
    const map = new Map<string, number>();
    const bump = (k: string) => map.set(k, (map.get(k) ?? 0) + 1);
    userRows.forEach((r) => {
      try {
        const chat: Msg[] = JSON.parse(localStorage.getItem(`razzoq_chat_${r.u.id}`) || "[]");
        chat
          .filter((m) => m.role === "user")
          .forEach((m) => {
            const t = m.text.toLowerCase();
            if (/front|html|css|react|javascript|flex|dom/.test(t)) bump("Front-End / dasturlash");
            else if (/tarjima/.test(t)) bump("Tarjima");
            else if (/ai|intellekt|prompt|chatgpt/.test(t)) bump("Sun'iy intellekt");
            else if (/python|bot/.test(t)) bump("Python");
            else if (/kurs|dars|ro'yxat|sertifikat|bepul/.test(t)) bump("Kurslar / tashkiliy");
            else bump("Boshqa");
          });
      } catch {
        /* ignore */
      }
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [userRows]);

  /* ---------- ma'lumotlar bazasi ---------- */
  const exportDb = () => {
    const db: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("razzoq_")) {
        try {
          db[k] = JSON.parse(localStorage.getItem(k) || "null");
        } catch {
          db[k] = localStorage.getItem(k);
        }
      }
    }
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `razzoq_academy_db_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("📥 Ma'lumotlar bazasi JSON ko'rinishida yuklab olindi");
  };

  const importDb = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const db = JSON.parse(String(reader.result)) as Record<string, unknown>;
        let n = 0;
        Object.entries(db).forEach(([k, v]) => {
          if (k.startsWith("razzoq_")) {
            localStorage.setItem(k, JSON.stringify(v));
            n++;
          }
        });
        showToast(`✅ ${n} ta yozuv import qilindi — sahifa yangilanmoqda`);
        window.setTimeout(() => window.location.reload(), 900);
      } catch {
        showToast("❌ Fayl o'qilmadi — to'g'ri JSON tanlang");
      }
    };
    reader.readAsText(file);
  };

  const clearDb = () => {
    if (!window.confirm("DIQQAT: barcha ma'lumotlar (foydalanuvchilar, progress, suhbatlar) o'chiriladi. Davom etasizmi?")) return;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("razzoq_")) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
    showToast("🗑 Ma'lumotlar bazasi tozalandi");
    window.setTimeout(() => window.location.reload(), 700);
  };

  const tabs: { id: Tab; t: string; i: string }[] = [
    { id: "umumiy", t: "Umumiy", i: "chart" },
    { id: "users", t: "Foydalanuvchilar", i: "users" },
    { id: "kurslar", t: "Kurslar", i: "book" },
    { id: "darslar", t: "Darslar & Video", i: "film" },
    { id: "ai", t: "AI statistika", i: "brain" },
    { id: "ai-settings", t: "AI Sozlamalari", i: "settings" },
    { id: "db", t: "Ma'lumotlar bazasi", i: "database" },
  ];

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 grid-bg [mask-image:linear-gradient(to_bottom,black,transparent_50%)]" />
      <div className="absolute -top-24 -left-32 w-[460px] h-[460px] glow-amber rounded-full" />
      <div className="relative max-w-7xl mx-auto px-5 lg:px-8 pt-12 pb-24">
        {/* sarlavha */}
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <Kicker color="var(--amber)">BOSHQARUV PANELI</Kicker>
            <h1 className="font-d font-black text-[clamp(1.6rem,3.4vw,2.6rem)] leading-tight flex items-center gap-3">
              <span className="inline-flex w-11 h-11 rounded-xl bg-[var(--amber)] items-center justify-center">
                <Icon name="shield" className="w-6 h-6 text-[var(--ink)]" />
              </span>
              Admin panel
            </h1>
            <p className="mt-3 text-[0.86rem] text-[var(--mut)]">
              Xush kelibsiz, <strong className="text-[var(--amber)]">{user.name}</strong> · akademiyaning barcha ma'lumotlari shu yerda
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate("/dashboard")} className="btn-ghost !py-3">KABINETIM</button>
            <button onClick={() => navigate("/")} className="btn-ghost !py-3">BOSH SAHIFA</button>
          </div>
        </div>

        {/* tablar */}
        <div className="mt-9 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`font-d text-[0.68rem] font-bold px-4 py-2.5 rounded-lg border flex items-center gap-2 transition-all cursor-pointer ${
                tab === t.id
                  ? "bg-[var(--amber)] text-[var(--ink)] border-[var(--amber)]"
                  : "border-[var(--line)] text-[var(--mut)] hover:border-[var(--amber)] hover:text-[var(--bone)]"
              }`}
            >
              <Icon name={t.i} className="w-4 h-4" /> {t.t}
            </button>
          ))}
        </div>

        {/* ===== UMUMIY ===== */}
        {tab === "umumiy" && (
          <div className="mt-9">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { i: "users", v: users.length, l: "foydalanuvchi", c: "var(--lime)" },
                { i: "shield", v: admins, l: "admin", c: "var(--amber)" },
                { i: "check", v: totalDoneAll, l: "bajarilgan dars", c: "var(--teal)" },
                { i: "brain", v: totalQuestions, l: "AI savoli", c: "var(--coral)" },
              ].map((s, i) => (
                <Reveal key={s.l} delay={i * 80}>
                  <div className="lift rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 h-full" style={{ ["--hover-c" as any]: s.c }}>
                    <Icon name={s.i} className="w-5 h-5 mb-3" />
                    <p className="font-d font-extrabold text-3xl" style={{ color: s.c }}>{s.v}</p>
                    <p className="text-[0.7rem] text-[var(--mut)] uppercase tracking-wide mt-1">{s.l}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={200}>
              <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6">
                <p className="font-d font-bold text-[0.95rem] mb-4">Oxirgi qo'shilgan o'quvchilar</p>
                <div className="space-y-2">
                  {[...userRows]
                    .sort((a, b) => b.u.joined.localeCompare(a.u.joined))
                    .slice(0, 5)
                    .map((r) => (
                      <div key={r.u.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line-soft)] bg-[var(--ink2)] px-4 py-2.5">
                        <span className="flex items-center gap-3 min-w-0">
                          <span className="w-8 h-8 rounded-lg bg-[var(--surface2)] flex items-center justify-center font-d font-bold text-[0.7rem] text-[var(--lime)] shrink-0">
                            {r.u.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <p className="text-[0.82rem] font-semibold truncate">{r.u.name}</p>
                            <p className="text-[0.66rem] font-mono text-[var(--dim)] truncate">{r.u.email}</p>
                          </span>
                        </span>
                        <span className="font-mono text-[0.64rem] text-[var(--mut)] shrink-0">{fmtDate(r.u.joined)}</span>
                      </div>
                    ))}
                </div>
              </div>
            </Reveal>
          </div>
        )}

        {/* ===== FOYDALANUVCHILAR ===== */}
        {tab === "users" && (
          <div className="mt-9">
            <div className="relative max-w-sm">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ism yoki email bo'yicha qidirish…" className="field !py-2.5 !pr-10 !text-[0.84rem]" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--dim)]">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {filtered.map((r, i) => (
                <Reveal key={r.u.id} delay={Math.min(i * 60, 300)}>
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="w-11 h-11 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center font-d font-bold text-[var(--lime)] shrink-0">
                        {r.u.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-[180px]">
                        <p className="font-d font-bold text-[0.92rem] flex items-center gap-2">
                          {r.u.name}
                          <span className={`chip !text-[0.58rem] ${r.u.role === "admin" ? "!text-[var(--amber)] !border-[rgba(255,154,60,0.5)]" : ""}`}>
                            {r.u.role === "admin" ? "ADMIN" : "O'QUVCHI"}
                          </span>
                        </p>
                        <p className="text-[0.7rem] font-mono text-[var(--dim)] mt-1">{r.u.email}</p>
                        <p className="text-[0.66rem] font-mono text-[var(--mut)] mt-1">
                          Ro'yxatdan: {fmtDate(r.u.joined)} · Oxirgi faollik: {fmtTime(r.u.lastActive)}
                        </p>
                      </div>
                      <div className="flex items-center gap-5 shrink-0 text-center">
                        <div><p className="font-d font-bold text-lg text-[var(--lime)]">{r.enrolled.length}</p><p className="text-[0.6rem] text-[var(--mut)] uppercase">kurs</p></div>
                        <div><p className="font-d font-bold text-lg text-[var(--teal)]">{r.pct}%</p><p className="text-[0.6rem] text-[var(--mut)] uppercase">progress</p></div>
                        <div><p className="font-d font-bold text-lg text-[var(--coral)]">{r.questions}</p><p className="text-[0.6rem] text-[var(--mut)] uppercase">savol</p></div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => { setUserRole(r.u.id, r.u.role === "admin" ? "user" : "admin"); showToast(`Rol o'zgartirildi: ${r.u.name}`); }}
                          className="btn-ghost !py-2 !px-3 !text-[0.6rem]"
                          disabled={r.u.id === user.id}
                          title={r.u.id === user.id ? "O'z rolingizni o'zgartira olmaysiz" : "Rolni almashtirish"}
                        >
                          <Icon name="shield" className="w-3.5 h-3.5" /> {r.u.role === "admin" ? "ADMIN'NI OLISH" : "ADMIN QILISH"}
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`${r.u.name} o'chirilsinmi? Bu amalni qaytarib bo'lmaydi.`)) { deleteUser(r.u.id); showToast("Foydalanuvchi o'chirildi"); } }}
                          className="btn-ghost !py-2 !px-3 !text-[0.6rem] !text-[var(--coral)] !border-[rgba(255,107,94,0.4)] hover:!bg-[rgba(255,107,94,0.1)]"
                          disabled={r.u.id === user.id}
                        >
                          <Icon name="trash" className="w-3.5 h-3.5" /> O'CHIRISH
                        </button>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
              {filtered.length === 0 && (
                <p className="text-center py-14 text-[var(--mut)]">Hech kim topilmadi 🤔</p>
              )}
            </div>
          </div>
        )}

        {/* ===== KURSLAR ===== */}
        {tab === "kurslar" && (
          <div className="mt-9">
            {/* Yangi kurs qo'shish tugmasi */}
            <div className="mb-6 flex justify-end">
              <button onClick={() => setShowNewCourse(true)} className="btn-lime !py-2.5 !px-5 !text-[0.68rem] group">
                <Icon name="plus" className="w-4 h-4" /> YANGI KURSQO'SHISH
              </button>
            </div>
            
            {/* Asosiy kurslar */}
            <p className="font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-4">Asosiy kurslar (o'chirib bo'lmaydi)</p>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {courseStats.map((s, i) => (
                <Reveal key={s.c.id} delay={Math.min(i * 70, 300)}>
                  <div className="lift rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 h-full" style={{ ["--hover-c" as any]: s.c.color }}>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-d font-bold text-[0.95rem]">{s.c.title}</h3>
                      <span className="chip" style={{ color: s.c.color, borderColor: `${s.c.color}55` }}>{s.c.lessons.length} dars</span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-lg bg-[var(--ink2)] border border-[var(--line-soft)] py-3">
                        <p className="font-d font-bold text-xl" style={{ color: s.c.color }}>{s.count}</p>
                        <p className="text-[0.6rem] text-[var(--mut)] uppercase mt-0.5">yozilgan</p>
                      </div>
                      <div className="rounded-lg bg-[var(--ink2)] border border-[var(--line-soft)] py-3">
                        <p className="font-d font-bold text-xl text-[var(--teal)]">{s.done}</p>
                        <p className="text-[0.6rem] text-[var(--mut)] uppercase mt-0.5">bajarilgan</p>
                      </div>
                      <div className="rounded-lg bg-[var(--ink2)] border border-[var(--line-soft)] py-3">
                        <p className="font-d font-bold text-xl text-[var(--lime)]">{s.avg}%</p>
                        <p className="text-[0.6rem] text-[var(--mut)] uppercase mt-0.5">o'rtacha</p>
                      </div>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-[var(--ink2)] overflow-hidden">
                      <div className="h-full rounded-full bar-grow" style={{ width: `${Math.max(s.avg, 2)}%`, background: s.c.color }} />
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            
            {/* Admin qo'shgan kurslar */}
            {Object.keys(customCourses).length > 0 && (
              <>
                <p className="font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-4">Siz qo'shgan kurslar</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.values(customCourses).map((c, i) => (
                    <Reveal key={c.id} delay={i * 70}>
                      <div className="lift rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 h-full" style={{ ["--hover-c" as any]: c.color }}>
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-d font-bold text-[0.95rem]">{c.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className="chip" style={{ color: c.color, borderColor: `${c.color}55` }}>{c.lessons.length} dars</span>
                            <button onClick={() => {
                              setEditingCourseId(c.id);
                              setEditCourseTitle(c.title);
                              setEditCourseDesc(c.desc);
                              setEditCourseColor(c.color);
                              setEditCourseDuration(c.duration || 0);
                            }} className="w-7 h-7 rounded-md border border-[var(--sky)] flex items-center justify-center text-[var(--sky)] hover:bg-[var(--sky)] hover:text-[var(--ink)] transition-colors cursor-pointer" title="Tahrirlash">
                              <Icon name="edit" className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { if (confirm(`"${c.title}" kursini o'chirishni xohlaysizmi?`)) { removeCustomCourse(c.id); showToast("Kurs o'chirildi"); } }} className="w-7 h-7 rounded-md border border-[var(--coral)] flex items-center justify-center text-[var(--coral)] hover:bg-[var(--coral)] hover:text-[var(--ink)] transition-colors cursor-pointer" title="O'chirish">
                              <Icon name="x" className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="mt-3 text-[0.78rem] text-[var(--mut)] line-clamp-2">{c.desc}</p>
                        <div className="mt-3 flex flex-wrap gap-3 text-[0.66rem] font-mono text-[var(--dim)]">
                          <span>Qo'shilgan: {fmtDate(c.createdAt)}</span>
                          {c.duration && <span>• Davomiylik: {c.duration} daqiqa</span>}
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </>
            )}
            
            {/* Yangi kurs formasi */}
            {showNewCourse && (
              <div className="mt-6 rounded-xl border border-[var(--lime)] bg-[rgba(201,241,88,0.05)] p-6">
                <p className="font-d font-bold text-[0.95rem] mb-4">Yangi kurs qo'shish</p>
                <div className="space-y-4">
                  <div>
                    <label className="block font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-2">Kurs nomi</label>
                    <input value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} placeholder="Masalan: Python Asoslari" className="field !py-2.5 !text-[0.85rem]" />
                  </div>
                  <div>
                    <label className="block font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-2">Tavsif</label>
                    <textarea value={newCourseDesc} onChange={(e) => setNewCourseDesc(e.target.value)} placeholder="Kurs haqida qisqacha..." className="field !py-2.5 !text-[0.85rem] resize-none" rows={3} />
                  </div>
                  <div>
                    <label className="block font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-2">Rang</label>
                    <div className="flex gap-2">
                      {["#C9F158", "#FF6B5E", "#FF9A3C", "#5FD8B8", "#7CC4FF", "#F2E86D"].map((c) => (
                        <button key={c} onClick={() => setNewCourseColor(c)} className={`w-8 h-8 rounded-lg border-2 transition-all ${newCourseColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-2">Umumiy davomiylik (daqiqa)</label>
                    <input type="number" value={newCourseDuration} onChange={(e) => setNewCourseDuration(Number(e.target.value))} placeholder="Masalan: 120" className="field !py-2.5 !text-[0.85rem]" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => {
                      if (!newCourseTitle.trim()) { showToast("Kurs nomini kiriting"); return; }
                      const id = `custom_${Date.now()}`;
                      addCustomCourse({ id, title: newCourseTitle.trim(), desc: newCourseDesc.trim(), color: newCourseColor, lessons: [], createdAt: new Date().toISOString(), duration: newCourseDuration });
                      setNewCourseTitle(""); setNewCourseDesc(""); setNewCourseDuration(0); setShowNewCourse(false);
                      showToast("✅ Yangi kurs qo'shildi!");
                    }} className="btn-lime !py-2.5 !px-5 !text-[0.68rem]">SAQLASH</button>
                    <button onClick={() => setShowNewCourse(false)} className="btn-ghost !py-2.5 !px-5 !text-[0.68rem]">BEKOR</button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Kursni tahrirlash formasi */}
            {editingCourseId && (
              <div className="mt-6 rounded-xl border border-[var(--sky)] bg-[rgba(124,196,255,0.05)] p-6">
                <p className="font-d font-bold text-[0.95rem] mb-4 flex items-center gap-2">
                  <Icon name="edit" className="w-5 h-5 text-[var(--sky)]" /> Kursni tahrirlash
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-2">Kurs nomi</label>
                    <input value={editCourseTitle} onChange={(e) => setEditCourseTitle(e.target.value)} className="field !py-2.5 !text-[0.85rem]" />
                  </div>
                  <div>
                    <label className="block font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-2">Tavsif</label>
                    <textarea value={editCourseDesc} onChange={(e) => setEditCourseDesc(e.target.value)} className="field !py-2.5 !text-[0.85rem] resize-none" rows={3} />
                  </div>
                  <div>
                    <label className="block font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-2">Rang</label>
                    <div className="flex gap-2">
                      {["#C9F158", "#FF6B5E", "#FF9A3C", "#5FD8B8", "#7CC4FF", "#F2E86D"].map((c) => (
                        <button key={c} onClick={() => setEditCourseColor(c)} className={`w-8 h-8 rounded-lg border-2 transition-all ${editCourseColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-2">Umumiy davomiylik (daqiqa)</label>
                    <input type="number" value={editCourseDuration} onChange={(e) => setEditCourseDuration(Number(e.target.value))} placeholder="Masalan: 120" className="field !py-2.5 !text-[0.85rem]" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => {
                      if (!editCourseTitle.trim()) { showToast("Kurs nomini kiriting"); return; }
                      updateCustomCourse(editingCourseId, { title: editCourseTitle.trim(), desc: editCourseDesc.trim(), color: editCourseColor, duration: editCourseDuration });
                      setEditingCourseId(null);
                      showToast("✅ Kurs yangilandi!");
                    }} className="btn-lime !py-2.5 !px-5 !text-[0.68rem]">SAQLASH</button>
                    <button onClick={() => setEditingCourseId(null)} className="btn-ghost !py-2.5 !px-5 !text-[0.68rem]">BEKOR</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== DARSLAR & VIDEO ===== */}
        {tab === "darslar" && (
          <div className="mt-9">
            {/* Kurs tanlash */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <label className="font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)]">Kursni tanlang:</label>
              <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="field !py-2 !text-[0.82rem] !w-auto min-w-[200px]">
                {COURSES.map((c) => {
                  const custom = customCourses[c.id];
                  const lessonCount = custom ? custom.lessons.length : c.lessons.length;
                  return <option key={c.id} value={c.id}>{c.title} ({lessonCount} dars)</option>;
                })}
                {Object.values(customCourses).filter(c => !COURSES.find(x => x.id === c.id)).map((c) => <option key={c.id} value={c.id}>{c.title} ({c.lessons.length} dars) — Custom</option>)}
              </select>
              <button onClick={() => setShowNewLesson(true)} className="btn-lime !py-2 !px-4 !text-[0.66rem] ml-auto">
                <Icon name="plus" className="w-3.5 h-3.5" /> YANGI DARS
              </button>
            </div>
            
            {/* Darslar ro'yxati */}
            {(() => {
              const course = customCourses[selectedCourseId] || COURSES.find((c) => c.id === selectedCourseId);
              if (!course) return <p className="text-[var(--mut)]">Kurs topilmadi</p>;
              const lessons = course.lessons;
              const lessonsWithVideo = lessons.filter((l) => videoLinks[l.id]);
              return (
                <div className="space-y-3">
                  <p className="font-mono text-[0.7rem] text-[var(--mut)]">
                    Jami: {lessons.length} dars · Video qo'yilgan: <span className="text-[var(--coral)] font-bold">{lessonsWithVideo.length}</span>
                  </p>
                  {lessons.map((l, i) => {
                    const hasVideo = !!videoLinks[l.id];
                    return (
                      <div key={l.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 flex flex-wrap items-center gap-4">
                        <span className="font-mono text-[0.7rem] text-[var(--dim)] w-8">{String(i + 1).padStart(2, "0")}</span>
                        <div className="flex-1 min-w-[150px]">
                          <p className="font-semibold text-[0.88rem]">{l.title}</p>
                          <p className="text-[0.68rem] font-mono text-[var(--mut)] mt-0.5">{l.dur} daqiqa · {l.type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => {
                            setEditingLessonId(l.id);
                            setEditLessonTitle(l.title);
                            setEditLessonDur(l.dur);
                            setEditLessonType(l.type);
                          }} className="w-7 h-7 rounded-md border border-[var(--sky)] flex items-center justify-center text-[var(--sky)] hover:bg-[var(--sky)] hover:text-[var(--ink)] transition-colors cursor-pointer" title="Tahrirlash">
                            <Icon name="edit" className="w-3.5 h-3.5" />
                          </button>
                          {customCourses[selectedCourseId] && (
                            <button onClick={() => { if (confirm(`"${l.title}" darsini o'chirishni xohlaysizmi?`)) { removeLessonFromCourse(selectedCourseId, l.id); showToast("Dars o'chirildi"); } }} className="w-7 h-7 rounded-md border border-[var(--coral)] flex items-center justify-center text-[var(--coral)] hover:bg-[var(--coral)] hover:text-[var(--ink)] transition-colors cursor-pointer" title="O'chirish">
                              <Icon name="x" className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {hasVideo ? (
                          <div className="flex items-center gap-2">
                            <span className="chip !text-[var(--coral)] !border-[rgba(255,107,94,0.4)]">🎬 Video bor</span>
                            <button onClick={() => { if (confirm("Video havolasini o'chirishni xohlaysizmi?")) { removeVideoLink(l.id); showToast("Video o'chirildi"); } }} className="w-7 h-7 rounded-md border border-[var(--coral)] flex items-center justify-center text-[var(--coral)] hover:bg-[var(--coral)] hover:text-[var(--ink)] transition-colors cursor-pointer" title="O'chirish">
                              <Icon name="x" className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setShowVideoForm(showVideoForm === l.id ? null : l.id); setVideoDraft(""); setVideoError(""); }} className="btn-ghost !py-2 !px-4 !text-[0.66rem]">
                            <Icon name="film" className="w-3.5 h-3.5" /> VIDEO QO'SHISH
                          </button>
                        )}
                        {/* Video qo'shish formasi (inline) */}
                        {!hasVideo && showVideoForm === l.id && (
                          <div className="w-full mt-3 pt-3 border-t border-[var(--line-soft)]">
                            <p className="font-mono text-[0.62rem] uppercase tracking-widest text-[var(--coral)] mb-2">Video qo'shish:</p>
                            <div className="flex flex-col gap-3">
                              {/* Video havolasi */}
                              <div>
                                <label className="block font-mono text-[0.6rem] text-[var(--mut)] mb-1">Video havolasi (YouTube, Vimeo, Google Drive, Dropbox yoki to'g'ridan-to'g'ri URL):</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <input 
                                    value={videoDraft} 
                                    onChange={(e) => { setVideoDraft(e.target.value); setVideoError(""); }} 
                                    placeholder="https://youtube.com/watch?v=... yoki https://drive.google.com/file/d/... yoki /videos/dars1.mp4" 
                                    className="field !py-2 !text-[0.82rem] flex-1" 
                                  />
                                  <button onClick={() => {
                                    const parsed = parseVideo(videoDraft);
                                    if (!parsed) { 
                                      setVideoError("Noto'g'ri havola. YouTube, Vimeo, Google Drive, Dropbox yoki .mp4/.webm URL kiriting"); 
                                      return; 
                                    }
                                    setVideoLink(l.id, videoDraft.trim());
                                    setVideoDraft("");
                                    setShowVideoForm(null);
                                    showToast("✅ Video qo'shildi! Barcha foydalanuvchilar ko'ra oladi");
                                  }} className="btn-lime !py-2 !px-4 !text-[0.66rem] whitespace-nowrap">HAVOLA QO'SHISH</button>
                                </div>
                                <div className="mt-2 space-y-1">
                                  <p className="text-[0.58rem] text-[var(--dim)]">
                                    <strong>Misollar:</strong>
                                  </p>
                                  <p className="text-[0.55rem] text-[var(--dim)]">• YouTube: https://youtube.com/watch?v=dQw4w9WgXcQ</p>
                                  <p className="text-[0.55rem] text-[var(--dim)]">• Google Drive: https://drive.google.com/file/d/FILE_ID/view</p>
                                  <p className="text-[0.55rem] text-[var(--dim)]">• Dropbox: https://www.dropbox.com/s/FILE_ID/video.mp4?dl=0</p>
                                  <p className="text-[0.55rem] text-[var(--dim)]">• To'g'ridan-to'g'ri: https://example.com/video.mp4</p>
                                  <p className="text-[0.55rem] text-[var(--dim)]">• Mahalliy fayl: /videos/dars1.mp4 (public/videos/ papkasiga joylangan)</p>
                                </div>
                              </div>
                              
                              {/* Fayl yuklash */}
                              <div>
                                <label className="block font-mono text-[0.6rem] text-[var(--mut)] mb-1">Yoki fayl yuklang:</label>
                                <div className="flex flex-col gap-3">
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="file" 
                                      accept="video/*" 
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        
                                        // Fayl hajmini tekshirish (max 1TB)
                                        if (file.size > 1024 * 1024 * 1024 * 1024) {
                                          setVideoError("Fayl hajmi 1TB dan oshmasligi kerak");
                                          return;
                                        }
                                        
                                        setVideoError("");
                                        showToast('📥 Fayl yuklanmoqda...');
                                        
                                        // Fayl nomini yaratish (lotin harflari va raqamlar)
                                        const originalName = file.name.split('.').slice(0, -1).join('.');
                                        const extension = file.name.split('.').pop();
                                        const safeName = originalName
                                          .toLowerCase()
                                          .replace(/[^a-z0-9]/g, '_')
                                          .replace(/_+/g, '_')
                                          .replace(/^_|_$/g, '');
                                        const fileName = `${l.id}_${safeName}.${extension}`;
                                        
                                        // Faylni yuklab olish
                                        const downloadLink = document.createElement('a');
                                        downloadLink.href = URL.createObjectURL(file);
                                        downloadLink.download = fileName;
                                        downloadLink.click();
                                        
                                        // VideoDraft'ga fayl nomini saqlash
                                        setVideoDraft(`/videos/${fileName}`);
                                        
                                        showToast(`📁 Fayl yuklab olindi: ${fileName}\n\nEndi quyidagi qadamlarni bajaring:\n1. Faylni public/videos/ papkasiga ko'chiring\n2. "HAVOLA QO'SHISH" tugmasini bosing`);
                                      }} 
                                      className="hidden" 
                                      id={`video-upload-${l.id}`} 
                                    />
                                    <label htmlFor={`video-upload-${l.id}`} className="btn-ghost !py-2 !px-4 !text-[0.66rem] cursor-pointer whitespace-nowrap hover:border-[var(--lime)] hover:text-[var(--lime)]">
                                      <Icon name="download" className="w-3.5 h-3.5" /> FAYL YUKLASH
                                    </label>
                                    <span className="text-[0.6rem] text-[var(--dim)]">MP4, WebM (max 1TB)</span>
                                  </div>
                                  
                                  <div className="rounded-lg border border-[var(--amber)] bg-[rgba(255,154,60,0.08)] p-4">
                                    <p className="text-[0.7rem] text-[var(--bone)] font-bold mb-3 flex items-center gap-2">
                                      <Icon name="bolt" className="w-4 h-4 text-[var(--amber)]" />
                                      📁 FAYLNI KOMPYUTERGA SAQLASH QO'LLANMASI
                                    </p>
                                    
                                    <div className="space-y-3 text-[0.65rem] text-[var(--mut)] leading-relaxed">
                                      <div className="flex gap-2">
                                        <span className="text-[var(--lime)] font-bold shrink-0">1.</span>
                                        <p>Yuqoridagi <strong className="text-[var(--bone)]">"FAYL YUKLASH"</strong> tugmasini bosing</p>
                                      </div>
                                      
                                      <div className="flex gap-2">
                                        <span className="text-[var(--lime)] font-bold shrink-0">2.</span>
                                        <p>Video faylni tanlang va <strong className="text-[var(--bone)]">"Ochish"</strong> tugmasini bosing</p>
                                      </div>
                                      
                                      <div className="flex gap-2">
                                        <span className="text-[var(--lime)] font-bold shrink-0">3.</span>
                                        <p>Fayl kompyuteringizga yuklab olinadi (odatda <strong className="text-[var(--bone)]">"Yuklamalar"</strong> yoki <strong className="text-[var(--bone)]">"Downloads"</strong> papkasiga)</p>
                                      </div>
                                      
                                      <div className="flex gap-2">
                                        <span className="text-[var(--lime)] font-bold shrink-0">4.</span>
                                        <p>
                                          Loyiha papkasini oching va <code className="text-[var(--amber)] bg-[var(--ink)] px-1.5 py-0.5 rounded text-[0.6rem]">public/videos/</code> papkasini toping
                                        </p>
                                      </div>
                                      
                                      <div className="flex gap-2">
                                        <span className="text-[var(--lime)] font-bold shrink-0">5.</span>
                                        <p>Yuklab olingan faylni <code className="text-[var(--amber)] bg-[var(--ink)] px-1.5 py-0.5 rounded text-[0.6rem]">public/videos/</code> papkasiga <strong className="text-[var(--bone)]">ko'chiring</strong> yoki <strong className="text-[var(--bone)]">nusxalang</strong></p>
                                      </div>
                                      
                                      <div className="flex gap-2">
                                        <span className="text-[var(--lime)] font-bold shrink-0">6.</span>
                                        <p>
                                          Yuqoridagi <strong className="text-[var(--bone)]">"Video havolasi"</strong> maydoniga havolani kiriting:<br/>
                                          <code className="text-[var(--amber)] bg-[var(--ink)] px-2 py-1 rounded text-[0.65rem] mt-1 inline-block">/videos/fayl_nomi.mp4</code>
                                        </p>
                                      </div>
                                      
                                      <div className="flex gap-2">
                                        <span className="text-[var(--lime)] font-bold shrink-0">7.</span>
                                        <p><strong className="text-[var(--bone)]">"HAVOLA QO'SHISH"</strong> tugmasini bosing</p>
                                      </div>
                                      
                                      <div className="pt-3 border-t border-[var(--line-soft)]">
                                        <p className="text-[var(--amber)] font-bold flex items-center gap-2">
                                          <span className="text-[var(--lime)]">✅</span> Tayyor! Barcha foydalanuvchilar videoni ko'ra oladi
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="mt-4 p-3 rounded bg-[var(--ink)] border border-[var(--line-soft)]">
                                      <p className="text-[0.6rem] text-[var(--dim)] mb-2">
                                        <strong className="text-[var(--coral)]">⚠️ Muhim eslatmalar:</strong>
                                      </p>
                                      <ul className="space-y-1 text-[0.58rem] text-[var(--dim)]">
                                        <li>• Fayl nomida <strong className="text-[var(--bone)]">lotin harflari</strong> va <strong className="text-[var(--bone)]">raqamlarni</strong> ishlating</li>
                                        <li>• Bo'sh joy uchun <code className="text-[var(--lime)]">_</code> belgisini qo'ying</li>
                                        <li>• Kirill harflari va maxsus belgilarni ishlatmang</li>
                                      </ul>
                                      <div className="mt-2 pt-2 border-t border-[var(--line-soft)]">
                                        <p className="text-[0.58rem] text-[var(--dim)]">
                                          <strong className="text-[var(--coral)]">❌ Noto'g'ri:</strong> dars 1.mp4, дарс.mp4, dars#1.mp4<br/>
                                          <strong className="text-[var(--lime)]">✅ To'g'ri:</strong> dars_1.mp4, lesson1.mp4, html_basics.mp4
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="mt-3 p-3 rounded bg-[rgba(201,241,88,0.08)] border border-[var(--lime)]">
                                      <p className="text-[0.6rem] text-[var(--bone)] font-bold mb-2">💡 Misol:</p>
                                      <div className="space-y-1 text-[0.58rem] text-[var(--mut)]">
                                        <p><strong>Fayl nomi:</strong> <code className="text-[var(--lime)]">lesson1_html_basics.mp4</code></p>
                                        <p><strong>Havola:</strong> <code className="text-[var(--lime)]">/videos/lesson1_html_basics.mp4</code></p>
                                        <p><strong>Qayerda saqlanadi:</strong> <code className="text-[var(--amber)]">public/videos/lesson1_html_basics.mp4</code></p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {videoError && <p className="mt-2 text-[0.72rem] text-[var(--coral)]">{videoError}</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            
            {/* Yangi dars formasi */}
            {showNewLesson && (
              <div className="mt-6 rounded-xl border border-[var(--lime)] bg-[rgba(201,241,88,0.05)] p-6">
                <p className="font-d font-bold text-[0.95rem] mb-4">Yangi dars qo'shish</p>
                <div className="space-y-4">
                  <div>
                    <label className="block font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-2">Dars nomi</label>
                    <input value={newLessonTitle} onChange={(e) => setNewLessonTitle(e.target.value)} placeholder="Masalan: Kirish" className="field !py-2.5 !text-[0.85rem]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-2">Davomiyligi (daqiqa)</label>
                      <input type="number" value={newLessonDur} onChange={(e) => setNewLessonDur(Number(e.target.value))} className="field !py-2.5 !text-[0.85rem]" />
                    </div>
                    <div>
                      <label className="block font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-2">Turi</label>
                      <select value={newLessonType} onChange={(e) => setNewLessonType(e.target.value as any)} className="field !py-2.5 !text-[0.85rem]">
                        <option value="Video">Video</option>
                        <option value="Amaliyot">Amaliyot</option>
                        <option value="Jonli">Jonli</option>
                        <option value="Test">Test</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => {
                      if (!newLessonTitle.trim()) { showToast("Dars nomini kiriting"); return; }
                      const lesson: CustomLesson = { id: `${selectedCourseId}_l${Date.now()}`, title: newLessonTitle.trim(), dur: newLessonDur, type: newLessonType };
                      addLessonToCourse(selectedCourseId, lesson);
                      setNewLessonTitle(""); setNewLessonDur(30); setNewLessonType("Video"); setShowNewLesson(false);
                      showToast("✅ Yangi dars qo'shildi!");
                    }} className="btn-lime !py-2.5 !px-5 !text-[0.68rem]">SAQLASH</button>
                    <button onClick={() => setShowNewLesson(false)} className="btn-ghost !py-2.5 !px-5 !text-[0.68rem]">BEKOR</button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Darsni tahrirlash formasi */}
            {editingLessonId && (
              <div className="mt-6 rounded-xl border border-[var(--sky)] bg-[rgba(124,196,255,0.05)] p-6">
                <p className="font-d font-bold text-[0.95rem] mb-4 flex items-center gap-2">
                  <Icon name="edit" className="w-5 h-5 text-[var(--sky)]" /> Darsni tahrirlash
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-2">Dars nomi</label>
                    <input value={editLessonTitle} onChange={(e) => setEditLessonTitle(e.target.value)} className="field !py-2.5 !text-[0.85rem]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-2">Davomiyligi (daqiqa)</label>
                      <input type="number" value={editLessonDur} onChange={(e) => setEditLessonDur(Number(e.target.value))} className="field !py-2.5 !text-[0.85rem]" />
                    </div>
                    <div>
                      <label className="block font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-2">Turi</label>
                      <select value={editLessonType} onChange={(e) => setEditLessonType(e.target.value as any)} className="field !py-2.5 !text-[0.85rem]">
                        <option value="Video">Video</option>
                        <option value="Amaliyot">Amaliyot</option>
                        <option value="Jonli">Jonli</option>
                        <option value="Test">Test</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => {
                      if (!editLessonTitle.trim()) { showToast("Dars nomini kiriting"); return; }
                      updateLessonInCourse(selectedCourseId, editingLessonId, { title: editLessonTitle.trim(), dur: editLessonDur, type: editLessonType });
                      setEditingLessonId(null);
                      showToast("✅ Dars yangilandi!");
                    }} className="btn-lime !py-2.5 !px-5 !text-[0.68rem]">SAQLASH</button>
                    <button onClick={() => setEditingLessonId(null)} className="btn-ghost !py-2.5 !px-5 !text-[0.68rem]">BEKOR</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== AI ===== */}
        {tab === "ai" && (
          <div className="mt-9 grid lg:grid-cols-2 gap-6">
            <Reveal>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6">
                <p className="font-d font-bold text-[0.95rem] mb-5">Mavzular bo'yicha savollar</p>
                <div className="space-y-4">
                  {topicCount.map(([topic, n]) => {
                    const max = topicCount[0][1] || 1;
                    return (
                      <div key={topic}>
                        <div className="flex justify-between text-[0.76rem] mb-1.5">
                          <span className="font-semibold">{topic}</span>
                          <span className="font-mono text-[var(--coral)]">{n}</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-[var(--ink2)] overflow-hidden">
                          <div className="h-full rounded-full bar-grow bg-[var(--coral)]" style={{ width: `${(n / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {topicCount.length === 0 && <p className="text-[var(--mut)] text-[0.84rem]">Hozircha savollar yo'q.</p>}
                </div>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6">
                <p className="font-d font-bold text-[0.95rem] mb-5">Eng faol o'quvchilar (savol bo'yicha)</p>
                <div className="space-y-2.5">
                  {[...userRows]
                    .sort((a, b) => b.questions - a.questions)
                    .slice(0, 6)
                    .map((r, i) => (
                      <div key={r.u.id} className="flex items-center gap-3 rounded-lg border border-[var(--line-soft)] bg-[var(--ink2)] px-4 py-2.5">
                        <span className="font-d font-bold text-[0.8rem] w-6 text-[var(--coral)]">#{i + 1}</span>
                        <span className="flex-1 text-[0.82rem] font-semibold truncate">{r.u.name}</span>
                        <span className="font-mono text-[0.7rem] text-[var(--mut)]">{r.questions} savol</span>
                      </div>
                    ))}
                </div>
              </div>
            </Reveal>
          </div>
        )}

        {/* ===== AI SOZLAMALARI ===== */}
        {tab === "ai-settings" && (
          <div className="mt-9">
            <Reveal>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Icon name="brain" className="w-8 h-8 text-[var(--lime)]" />
                  <div>
                    <p className="font-d font-bold text-[1.1rem]">AI Model Sozlamalari</p>
                    <p className="text-[0.78rem] text-[var(--mut)] mt-1">Haqiqiy AI modeliga ulanish uchun API kalitini kiriting</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Provider tanlash */}
                  <div>
                    <label className="block font-mono text-[0.68rem] uppercase tracking-widest text-[var(--mut)] mb-3">AI Provayder</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setAiConfig({ ...aiConfig, provider: "local" })}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          aiConfig.provider === "local"
                            ? "border-[var(--lime)] bg-[rgba(201,241,88,0.08)]"
                            : "border-[var(--line)] hover:border-[var(--lime)]"
                        }`}
                      >
                        <Icon name="brain" className={`w-6 h-6 mx-auto mb-2 ${aiConfig.provider === "local" ? "text-[var(--lime)]" : "text-[var(--mut)]"}`} />
                        <p className="font-d font-bold text-[0.82rem]">Mahalliy</p>
                        <p className="text-[0.66rem] text-[var(--mut)] mt-1">API kalitsiz</p>
                      </button>

                      <button
                        onClick={() => setAiConfig({ ...aiConfig, provider: "gemini" })}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          aiConfig.provider === "gemini"
                            ? "border-[var(--lime)] bg-[rgba(201,241,88,0.08)]"
                            : "border-[var(--line)] hover:border-[var(--lime)]"
                        }`}
                      >
                        <Icon name="spark" className={`w-6 h-6 mx-auto mb-2 ${aiConfig.provider === "gemini" ? "text-[var(--lime)]" : "text-[var(--mut)]"}`} />
                        <p className="font-d font-bold text-[0.82rem]">Gemini</p>
                        <p className="text-[0.66rem] text-[var(--mut)] mt-1">Google AI</p>
                      </button>

                      <button
                        onClick={() => setAiConfig({ ...aiConfig, provider: "qwen" })}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          aiConfig.provider === "qwen"
                            ? "border-[var(--lime)] bg-[rgba(201,241,88,0.08)]"
                            : "border-[var(--line)] hover:border-[var(--lime)]"
                        }`}
                      >
                        <Icon name="bolt" className={`w-6 h-6 mx-auto mb-2 ${aiConfig.provider === "qwen" ? "text-[var(--lime)]" : "text-[var(--mut)]"}`} />
                        <p className="font-d font-bold text-[0.82rem]">Qwen</p>
                        <p className="text-[0.66rem] text-[var(--mut)] mt-1">Alibaba AI</p>
                      </button>
                    </div>
                  </div>

                  {/* API Key */}
                  {aiConfig.provider !== "local" && (
                    <div>
                      <label className="block font-mono text-[0.68rem] uppercase tracking-widest text-[var(--mut)] mb-3">
                        API Kalit
                      </label>
                      <input
                        type="password"
                        value={aiConfig.apiKey}
                        onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                        placeholder={aiConfig.provider === "gemini" ? "AIzaSy..." : "sk-..."}
                        className="field !py-3 !text-[0.88rem]"
                      />
                      <p className="mt-2 text-[0.72rem] text-[var(--mut)]">
                        {aiConfig.provider === "gemini" && (
                          <>
                            Google AI Studio'dan API kalit oling:{" "}
                            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-[var(--lime)] hover:underline">
                              aistudio.google.com/apikey
                            </a>
                          </>
                        )}
                        {aiConfig.provider === "qwen" && (
                          <>
                            Alibaba Cloud DashScope'dan API kalit oling:{" "}
                            <a href="https://dashscope.console.aliyun.com/" target="_blank" rel="noopener noreferrer" className="text-[var(--lime)] hover:underline">
                              dashscope.console.aliyun.com
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Test tugmasi */}
                  {aiConfig.provider !== "local" && aiConfig.apiKey && (
                    <button
                      onClick={async () => {
                        showToast("AI bilan test qilinmoqda...");
                        try {
                          const testMsg = "Salom! Bu test xabari.";
                          const response = await callRealAI(testMsg, aiConfig.apiKey, aiConfig.provider as "gemini" | "qwen");
                          showToast(`✅ ${aiConfig.provider.toUpperCase()} muvaffaqiyatli ulandi!`);
                          console.log("AI javobi:", response);
                        } catch (error) {
                          showToast(`❌ ${aiConfig.provider.toUpperCase()} ga ulanishda xatolik`);
                        }
                      }}
                      className="btn-lime !py-3"
                    >
                      <Icon name="spark" className="w-4 h-4" /> TEST QILISH
                    </button>
                  )}

                  {/* Holat */}
                  <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--ink2)] p-4">
                    <p className="font-mono text-[0.68rem] uppercase tracking-widest text-[var(--mut)] mb-2">Joriy holat</p>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${aiConfig.provider !== "local" && aiConfig.apiKey ? "bg-[var(--lime)]" : "bg-[var(--amber)]"}`} />
                      <span className="text-[0.82rem] font-semibold">
                        {aiConfig.provider === "local" && "Mahalliy rejim (API kalitsiz)"}
                        {aiConfig.provider === "gemini" && !aiConfig.apiKey && "Gemini (API kalit kiritilmagan)"}
                        {aiConfig.provider === "gemini" && aiConfig.apiKey && "Gemini (Google AI) - Faol"}
                        {aiConfig.provider === "qwen" && !aiConfig.apiKey && "Qwen (API kalit kiritilmagan)"}
                        {aiConfig.provider === "qwen" && aiConfig.apiKey && "Qwen (Alibaba AI) - Faol"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        )}

        {/* ===== MA'LUMOTLAR BAZASI ===== */}
        {tab === "db" && (
          <div className="mt-9 grid md:grid-cols-3 gap-4">
            <Reveal>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 h-full">
                <Icon name="download" className="w-7 h-7 text-[var(--lime)]" />
                <p className="font-d font-bold text-[0.95rem] mt-4">Eksport (zaxira nusxa)</p>
                <p className="text-[0.8rem] text-[var(--mut)] mt-2 leading-relaxed">
                  Barcha ma'lumotlarni (foydalanuvchilar, progress, suhbatlar, video havolalar) JSON fayl ko'rinishida yuklab oling.
                </p>
                <button onClick={exportDb} className="btn-lime w-full justify-center mt-5 !py-3">JSON YUKLAB OLISH</button>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 h-full">
                <Icon name="database" className="w-7 h-7 text-[var(--amber)]" />
                <p className="font-d font-bold text-[0.95rem] mt-4">Import (tiklash)</p>
                <p className="text-[0.8rem] text-[var(--mut)] mt-2 leading-relaxed">
                  Oldin yuklab olingan JSON zaxira nusxani qayta yuklab, ma'lumotlarni tiklang. Sahifa avtomatik yangilanadi.
                </p>
                <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importDb(e.target.files[0])} />
                <button onClick={() => fileRef.current?.click()} className="btn-ghost w-full justify-center mt-5 !py-3">JSON FAYL TANLASH</button>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="rounded-xl border border-[rgba(255,107,94,0.4)] bg-[rgba(255,107,94,0.04)] p-6 h-full">
                <Icon name="trash" className="w-7 h-7 text-[var(--coral)]" />
                <p className="font-d font-bold text-[0.95rem] mt-4">Tozalash (xavfli)</p>
                <p className="text-[0.8rem] text-[var(--mut)] mt-2 leading-relaxed">
                  Barcha ma'lumotlarni butunlay o'chiradi: akkauntlar, progress, suhbatlar. Bu amalni qaytarib bo'lmaydi!
                </p>
                <button onClick={clearDb} className="w-full justify-center mt-5 !py-3 font-d text-[0.68rem] font-bold px-5 rounded-lg border border-[var(--coral)] text-[var(--coral)] hover:bg-[rgba(255,107,94,0.12)] transition-colors cursor-pointer">
                  HAMMASINI O'CHIRISH
                </button>
              </div>
            </Reveal>
            <Reveal delay={260}>
              <div className="md:col-span-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6">
                <p className="font-d font-bold text-[0.95rem] mb-3 flex items-center gap-2">
                  <Icon name="shield" className="w-5 h-5 text-[var(--teal)]" /> Kiberxavfsizlik holati
                </p>
                <ul className="grid md:grid-cols-3 gap-3 text-[0.8rem] text-[var(--mut)]">
                  <li className="flex items-start gap-2.5"><Icon name="check" className="w-4 h-4 text-[var(--teal)] shrink-0 mt-0.5" /> Parollar SHA-256 bilan xeshlangan (ochiq saqlanmaydi)</li>
                  <li className="flex items-start gap-2.5"><Icon name="check" className="w-4 h-4 text-[var(--teal)] shrink-0 mt-0.5" /> Brute-force himoyasi: 5 urinishdan keyin 60s bloklash</li>
                  <li className="flex items-start gap-2.5"><Icon name="check" className="w-4 h-4 text-[var(--teal)] shrink-0 mt-0.5" /> Admin panel faqat admin rolidagi foydalanuvchilarga ochiq</li>
                </ul>
              </div>
            </Reveal>
          </div>
        )}
      </div>
    </div>
  );
}
