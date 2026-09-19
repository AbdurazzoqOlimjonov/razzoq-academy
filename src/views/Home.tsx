import React, { useEffect, useState } from "react";
import { COURSES, FAQS, TICKER } from "../data";
import { reducedMotion, useApp } from "../store";
import { Counter, Icon, Kicker, Marquee, Reveal, Scramble, Wave } from "../components/ui";

/* ---------- hero'dagi jonli suhbat demosu ---------- */
const SCRIPT: { role: "user" | "ai"; text: string }[] = [
  { role: "user", text: "Front-End kursida nimalarni o'rganaman?" },
  { role: "ai", text: "HTML, CSS, JavaScript va React — 20 amaliy dars va 4 real loyiha. Yakunida Junior portfolio! Hammasi 100% bepul 🚀" },
  { role: "user", text: "Ovozli ham gaplashsam bo'ladimi?" },
  { role: "ai", text: "Albatta! Mikrofon tugmasini bosib savolingizni ayting — men yozuvga aylantirib, ovozli javob beraman 🎙️" },
];

function DemoChat() {
  const [count, setCount] = useState(reducedMotion() ? SCRIPT.length : 0);
  const [typing, setTyping] = useState(false);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (reducedMotion()) return;
    let alive = true;
    const timers: number[] = [];
    const guarded = (fn: () => void, ms: number) => {
      timers.push(
        window.setTimeout(() => {
          if (alive) fn();
        }, ms)
      );
    };
    const loop = () => {
      guarded(() => setTyping(true), 600);
      guarded(() => { setTyping(false); setCount(1); }, 1700);
      guarded(() => setTyping(true), 4200);
      guarded(() => { setTyping(false); setCount(2); }, 5300);
      guarded(() => setTyping(true), 7600);
      guarded(() => { setTyping(false); setCount(3); }, 8700);
      guarded(() => setTyping(true), 11000);
      guarded(() => { setTyping(false); setCount(4); }, 12100);
      guarded(loop, 15500);
    };
    loop();
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    const iv = window.setInterval(() => setActive((a) => !a), 2600);
    return () => clearInterval(iv);
  }, []);

  const shown = SCRIPT.slice(0, Math.min(count, SCRIPT.length));

  return (
    <div className="relative rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line-soft)]">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-lg bg-[var(--lime)] flex items-center justify-center">
            <Icon name="brain" className="w-5 h-5 text-[var(--ink)]" />
          </div>
          <div>
            <p className="font-d text-[0.7rem] font-bold tracking-wide">RAZZOQ AI</p>
            <p className="flex items-center gap-1.5 text-[0.68rem] text-[var(--mut)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--lime)] pulse-dot" /> onlayn · ovozli rejim
            </p>
          </div>
        </div>
        <Wave active={active} bars={9} className="h-5" />
      </div>

      <div className="p-5 space-y-3 min-h-[280px]">
        {shown.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-[0.82rem] leading-relaxed ${
                m.role === "user"
                  ? "bg-[var(--lime)] text-[var(--ink)] font-semibold rounded-br-sm"
                  : "bg-[var(--surface2)] border border-[var(--line-soft)] rounded-bl-sm"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-[var(--surface2)] border border-[var(--line-soft)] rounded-xl rounded-bl-sm px-4 py-3.5 flex gap-1.5">
              {[0, 1, 2].map((d) => (
                <span key={d} className="tdot w-1.5 h-1.5 rounded-full bg-[var(--lime)]" style={{ animationDelay: `${d * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 pb-5">
        <a href="#/assistant" className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--ink2)] px-4 py-3.5 group hover:border-[var(--lime)] transition-colors">
          <span className="flex items-center gap-3 text-[0.82rem] text-[var(--mut)]">
            <span className="w-8 h-8 rounded-lg bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center group-hover:bg-[var(--lime)] group-hover:text-[var(--ink)] transition-colors">
              <Icon name="mic" className="w-4 h-4" />
            </span>
            Savolingizni yozing yoki ayting…
          </span>
          <Icon name="arrow" className="w-4 h-4 text-[var(--lime)] group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </div>
  );
}

/* ---------- FAQ accordion ---------- */
function FaqItem({ q, a, i }: { q: string; a: string; i: number }) {
  const [open, setOpen] = useState(i === 0);
  return (
    <Reveal delay={i * 70}>
      <div className={`border rounded-xl overflow-hidden transition-colors ${open ? "border-[var(--lime)] bg-[var(--surface)]" : "border-[var(--line)] bg-[var(--ink2)]"}`}>
        <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer">
          <span className="font-d text-[0.82rem] font-semibold">{q}</span>
          <span className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center transition-transform duration-300 ${open ? "rotate-180 bg-[var(--lime)] text-[var(--ink)] border-[var(--lime)]" : "border-[var(--line)] text-[var(--mut)]"}`}>
            <Icon name="chevron" className="w-4 h-4" />
          </span>
        </button>
        <div className={`acc-body ${open ? "open" : ""}`}>
          <div className="acc-inner">
            <p className="px-5 pb-5 text-[0.88rem] leading-relaxed text-[var(--mut)]">{a}</p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ================= HOME ================= */
export default function Home() {
  const { navigate, customCourses, users, progress } = useApp();
  
  // Dinamik kurslar soni (asosiy + custom)
  const allCoursesCount = COURSES.length + Object.keys(customCourses).filter(id => !COURSES.find(c => c.id === id)).length;
  const totalLessons = COURSES.reduce((s, c) => s + c.lessons.length, 0) + 
    Object.values(customCourses).reduce((s, c) => s + c.lessons.length, 0);
  
  // Haqiqiy o'quvchilar soni (kamida 1 ta darsni bajargan foydalanuvchilar)
  const totalStudents = users.filter(u => {
    const userProgress = JSON.parse(localStorage.getItem(`razzoq_prog_${u.id}`) || '{}');
    return Object.keys(userProgress).length > 0;
  }).length;

  return (
    <div>
      {/* ---------- HERO: AI suhbat bilan ochilish ---------- */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute -top-40 -left-40 w-[560px] h-[560px] glow-lime rounded-full" />
        <div className="absolute top-1/3 -right-52 w-[520px] h-[520px] glow-amber rounded-full" />
        <div className="relative max-w-7xl mx-auto px-5 lg:px-8 pt-16 lg:pt-24 pb-20">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-14 items-center">
            <div>
              <Reveal>
                <span className="chip mb-7">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--lime)] pulse-dot" />
                  AI YORDAMCHI HOZIR ONLAYN — OVOZLI VA YOZMA
                </span>
              </Reveal>
              <h1 className="font-d font-black leading-[1.04] text-[clamp(2rem,5.2vw,4.1rem)] tracking-tight">
                <Scramble text="SUN'IY INTELLEKT" />
                <br />
                <span className="text-[var(--lime)]">
                  <Scramble text="BILAN O'RGANING" delay={500} />
                </span>
                <span className="caret text-[var(--lime)]">_</span>
              </h1>
              <Reveal delay={200}>
                <p className="mt-7 max-w-xl text-[1.02rem] leading-relaxed text-[var(--mut)]">
                  Razzoq Academy'da savolingizni <strong className="text-[var(--bone)] font-semibold">ovozli ayting yoki yozing</strong> — AI
                  bir necha soniyada javob beradi. Front-End va boshqa yirik kurslar
                  <strong className="text-[var(--lime)] font-semibold"> bitta joyda, 100% bepul</strong>.
                </p>
              </Reveal>
              <Reveal delay={320}>
                <div className="mt-9 flex flex-wrap gap-4">
                  <a href="#/courses" className="btn-lime group">
                    KURSLARNI BOSHLASH
                    <Icon name="arrow" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <a href="#/assistant" className="btn-ghost group">
                    <Icon name="mic" className="w-4 h-4 text-[var(--lime)]" />
                    AI BILAN GAPLASHISH
                  </a>
                </div>
              </Reveal>
              <Reveal delay={430}>
                <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-xl">
                  {[
                    { v: allCoursesCount, s: "", label: "yirik kurs" },
                    { v: totalLessons, s: "", label: "video + yozma dars" },
                    { v: totalStudents, s: "", label: "faol o'quvchi" },
                    { v: 100, s: "%", label: "bepul" },
                  ].map((st, i) => (
                    <div key={i} className="border-l-2 border-[var(--line)] pl-4 hover:border-[var(--lime)] transition-colors">
                      <p className="font-d text-xl lg:text-2xl font-extrabold text-[var(--bone)]">
                        <Counter to={st.v} suffix={st.s} />
                      </p>
                      <p className="text-[0.72rem] text-[var(--mut)] mt-1 tracking-wide uppercase">{st.label}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            <Reveal variant="right" delay={250} className="relative">
              <div className="absolute -inset-6 border border-dashed border-[var(--line)] rounded-2xl spin-slow pointer-events-none" style={{ animationDuration: "60s" }} />
              <div className="floaty absolute -top-5 -left-6 z-10 chip !bg-[var(--ink)]" style={{ ["--rot" as any]: "-6deg" }}>
                <Icon name="bolt" className="w-3.5 h-3.5 text-[var(--amber)]" /> javob ~3 soniya
              </div>
              <div className="floaty absolute -bottom-5 -right-4 z-10 chip !bg-[var(--ink)]" style={{ ["--rot" as any]: "4deg", animationDelay: "1.4s" }}>
                <Icon name="mic" className="w-3.5 h-3.5 text-[var(--coral)]" /> ovozli rejim
              </div>
              <div
                className="absolute -top-9 -right-9 z-10 w-24 h-24 rounded-full bg-[var(--coral)] text-[var(--ink)] flex items-center justify-center text-center font-d font-black text-[0.62rem] leading-tight rotate-12 shadow-lg"
              >
                100%<br />BEPUL
              </div>
              <DemoChat />
            </Reveal>
          </div>
        </div>
        <Marquee items={TICKER} />
      </section>

      {/* ---------- NEGA RAZZOQ — bento ---------- */}
      <section className="relative py-24">
        <div className="absolute top-0 right-0 w-[480px] h-[480px] glow-teal rounded-full" />
        <div className="relative max-w-7xl mx-auto px-5 lg:px-8">
          <div className="max-w-2xl mb-14">
            <Kicker>NEGA AYNAN BIZ</Kicker>
            <h2 className="font-d font-extrabold text-[clamp(1.5rem,3.4vw,2.6rem)] leading-tight">
              O'quvchi uchun <span className="text-[var(--lime)]">hamma narsa</span> — bitta platformada
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* katta karta — ovozli AI ustoz */}
            <Reveal className="md:row-span-2">
              <div className="lift h-full rounded-xl border border-[var(--line)] bg-gradient-to-b from-[var(--surface2)] to-[var(--surface)] p-7 flex flex-col" style={{ ["--hover-c" as any]: "var(--lime)" }}>
                <div className="w-12 h-12 rounded-xl bg-[var(--lime)] text-[var(--ink)] flex items-center justify-center mb-6">
                  <Icon name="brain" className="w-6 h-6" />
                </div>
                <h3 className="font-d font-bold text-lg leading-snug">Ovozli AI ustoz — 24/7 yoningizda</h3>
                <p className="mt-3 text-[0.88rem] text-[var(--mut)] leading-relaxed flex-1">
                  Tushunmagan mavzuni so'rang — AI ovozli yoki yozma javob beradi. Yarim kechasi ham, imtihon oldidan ham.
                  Har bir o'quvchining shaxsiy yordamchisi o'ziga xizmat qiladi.
                </p>
                <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--ink2)] p-4">
                  <Wave active bars={24} className="h-8" />
                  <div className="mt-3 flex items-center justify-between text-[0.7rem] font-mono text-[var(--mut)]">
                    <span>● REC — "funksiya nima?"</span>
                    <span className="text-[var(--lime)]">javob tayyorlanmoqda…</span>
                  </div>
                </div>
                <a href="#/assistant" className="btn-lime mt-6 justify-center !py-3 group">
                  SINAB KO'RISH <Icon name="mic" className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </a>
              </div>
            </Reveal>

            <Reveal delay={90}>
              <div className="lift h-full rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6" style={{ ["--hover-c" as any]: "var(--amber)" }}>
                <div className="w-10 h-10 rounded-lg bg-[rgba(255,154,60,0.15)] text-[var(--amber)] flex items-center justify-center mb-4">
                  <Icon name="bolt" className="w-5 h-5" />
                </div>
                <h3 className="font-d font-bold text-[0.95rem]">Yozma javob — soniyalarda</h3>
                <p className="mt-2 text-[0.84rem] text-[var(--mut)] leading-relaxed">
                  Savolni yozing: dars tushuntirishidan inglizcha tarjimagacha, darhol tushunarli javob.
                </p>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div className="lift h-full rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6" style={{ ["--hover-c" as any]: "var(--coral)" }}>
                <div className="w-10 h-10 rounded-lg bg-[rgba(255,107,94,0.15)] text-[var(--coral)] flex items-center justify-center mb-4">
                  <Icon name="user" className="w-5 h-5" />
                </div>
                <h3 className="font-d font-bold text-[0.95rem]">Shaxsiy kabinet</h3>
                <p className="mt-2 text-[0.84rem] text-[var(--mut)] leading-relaxed">
                  Ro'yxatdan o'ting — kurslaringiz, progress va sertifikatlaringiz bir joyda saqlanadi.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="h-1.5 rounded-full bg-[var(--ink2)] overflow-hidden"><div className="h-full w-[72%] bg-[var(--coral)] bar-grow rounded-full" /></div>
                  <div className="h-1.5 rounded-full bg-[var(--ink2)] overflow-hidden"><div className="h-full w-[45%] bg-[var(--lime)] bar-grow rounded-full" style={{ animationDelay: "0.2s" }} /></div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="lift h-full rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6" style={{ ["--hover-c" as any]: "var(--teal)" }}>
                <div className="w-10 h-10 rounded-lg bg-[rgba(95,216,184,0.15)] text-[var(--teal)] flex items-center justify-center mb-4">
                  <Icon name="code" className="w-5 h-5" />
                </div>
                <h3 className="font-d font-bold text-[0.95rem]">Amaliy loyihalar</h3>
                <p className="mt-2 text-[0.84rem] text-[var(--mut)] leading-relaxed">
                  Har kursda real loyihalar: landing, bot, ilova UI. Portfolio'ngiz o'zi gapiradi.
                </p>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="lift h-full rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6" style={{ ["--hover-c" as any]: "var(--sun)" }}>
                <div className="w-10 h-10 rounded-lg bg-[rgba(242,232,109,0.15)] text-[var(--sun)] flex items-center justify-center mb-4">
                  <Icon name="award" className="w-5 h-5" />
                </div>
                <h3 className="font-d font-bold text-[0.95rem]">Sertifikat — bepul</h3>
                <p className="mt-2 text-[0.84rem] text-[var(--mut)] leading-relaxed">
                  Kursni yakunlab imtihondan o'ting — sertifikatingiz kabinetga tushadi.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- KURSLAR — sticky ikki ustun ---------- */}
      <section className="relative py-24 border-t border-[var(--line-soft)] bg-[var(--ink2)]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-[0.9fr_1.1fr] gap-14">
          <div className="lg:sticky lg:top-28 self-start">
            <Kicker color="var(--amber)">KURSLAR KATALOGI</Kicker>
            <h2 className="font-d font-extrabold text-[clamp(1.5rem,3.2vw,2.5rem)] leading-tight">
              Eng talabchan yo'nalishlar — <span className="text-[var(--amber)]">bitta joyda jamlangan</span>
            </h2>
            <p className="mt-5 text-[0.95rem] text-[var(--mut)] leading-relaxed">
              Front-End va boshqa yo'nalishlar — bozorda eng ko'p so'raladigan kurslar
              bitta platformaga yig'dik. Istalganini tanlang, bepul o'qing, progress'ingiz saqlanadi.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#/courses" className="btn-lime group">
                BUTUN KATALOG <Icon name="arrow" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
            <p className="mt-6 flex items-center gap-2 text-[0.78rem] font-mono text-[var(--mut)]">
              <Icon name="check" className="w-4 h-4 text-[var(--lime)]" /> barcha kurslar ochiq va bepul — ro'yxatdan o'tish kifoya
            </p>
          </div>

          <div className="space-y-4">
            {COURSES.map((c, i) => (
              <Reveal key={c.id} delay={i * 60}>
                <a
                  href={`#/course/${c.id}`}
                  className="lift group flex items-center gap-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 lg:p-6"
                  style={{ ["--hover-c" as any]: c.color }}
                >
                  <span className="font-d font-black text-2xl lg:text-3xl text-outline select-none hidden sm:block w-12">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="w-1 self-stretch rounded-full" style={{ background: c.color }} />
                  <span className="flex-1 min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <h3 className="font-d font-bold text-[0.98rem] lg:text-base group-hover:text-[var(--lime)] transition-colors">{c.title}</h3>
                      <span className="chip" style={{ color: c.color, borderColor: `${c.color}55` }}>{c.tag}</span>
                    </span>
                    <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.74rem] font-mono text-[var(--mut)]">
                      <span className="flex items-center gap-1.5"><Icon name="book" className="w-3.5 h-3.5" /> {c.lessons.length} dars</span>
                      <span className="flex items-center gap-1.5"><Icon name="clock" className="w-3.5 h-3.5" /> {c.hours} soat</span>
                      <span className="flex items-center gap-1.5"><Icon name="users" className="w-3.5 h-3.5" /> {c.students.toLocaleString().replace(/,/g, " ")}</span>
                      <span className="flex items-center gap-1.5"><Icon name="chart" className="w-3.5 h-3.5" /> {c.level}</span>
                    </span>
                  </span>
                  <span className="shrink-0 w-10 h-10 rounded-lg border border-[var(--line)] flex items-center justify-center group-hover:bg-[var(--lime)] group-hover:text-[var(--ink)] group-hover:border-[var(--lime)] transition-all group-hover:translate-x-1">
                    <Icon name="arrow" className="w-4 h-4" />
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- QANDAY ISHLAYDI ---------- */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] glow-lime rounded-full" />
        <div className="relative max-w-7xl mx-auto px-5 lg:px-8">
          <div className="max-w-2xl mb-16">
            <Kicker>3 QADAM — BOSHLANDI</Kicker>
            <h2 className="font-d font-extrabold text-[clamp(1.5rem,3.2vw,2.5rem)] leading-tight">
              Qanday ishlaydi?
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-7 left-[12%] right-[12%] dash-line" />
            {[
              { n: "01", icon: "user", title: "Ro'yxatdan o'ting", txt: "Ism, email, parol — 30 soniya. Karta so'ralmaydi.", col: "var(--lime)" },
              { n: "02", icon: "target", title: "Yo'nalishni tanlang", txt: "Katalogdan o'zingizga mos kursni oling — bepul.", col: "var(--amber)" },
              { n: "03", icon: "mic", title: "AI bilan o'qing", txt: "Tushunmagan joyingizni ovozli so'rang, darhol javob.", col: "var(--coral)" },
              { n: "04", icon: "award", title: "Sertifikat oling", txt: "Imtihondan o'ting — sertifikat kabinetga tushadi.", col: "var(--teal)" },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 120}>
                <div className="relative">
                  <div className="relative z-10 w-14 h-14 rounded-xl border border-[var(--line)] bg-[var(--surface)] flex items-center justify-center mb-5" style={{ color: s.col }}>
                    <Icon name={s.icon} className="w-6 h-6" />
                    <span className="absolute -top-2 -right-2 font-d text-[0.58rem] font-bold px-1.5 py-0.5 rounded bg-[var(--ink)] border border-[var(--line)] text-[var(--mut)]">{s.n}</span>
                  </div>
                  <h3 className="font-d font-bold text-[0.95rem]">{s.title}</h3>
                  <p className="mt-2 text-[0.84rem] text-[var(--mut)] leading-relaxed">{s.txt}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- MENTORLAR ---------- */}
      <section className="relative py-24 border-t border-[var(--line-soft)] overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[460px] h-[460px] glow-amber rounded-full" />
        <div className="relative max-w-7xl mx-auto px-5 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <Kicker color="var(--teal)">MENTORLAR JAMOASI</Kicker>
              <h2 className="font-d font-extrabold text-[clamp(1.5rem,3.2vw,2.5rem)] leading-tight">
                Sizni nazariyotchilar emas, <span className="text-[var(--teal)]">amaliyotchilar</span> o'rgatadi
              </h2>
              <p className="mt-5 text-[0.95rem] text-[var(--mut)] leading-relaxed">
                Har bir kurs ortida real loyihalarda ishlagan mentor turadi. Jonli sessiyalarda savolingizga bevosita javob olasiz.
              </p>
            </div>
            <p className="font-mono text-[0.7rem] text-[var(--dim)] flex items-center gap-2">
              <Icon name="arrow" className="w-4 h-4 text-[var(--teal)]" /> suring — 6 mentor
            </p>
          </div>

          <div className="scroll-strip flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 lg:mx-0 lg:px-0">
            {COURSES.map((c, i) => (
              <Reveal key={c.id} delay={i * 70} className="shrink-0 w-[276px]">
                <a href={`#/course/${c.id}`} className="lift group block h-full rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6" style={{ ["--hover-c" as any]: c.color }}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="w-14 h-14 rounded-xl flex items-center justify-center font-d font-black text-lg" style={{ background: `${c.color}1f`, color: c.color }}>
                      {c.mentor.name.split(" ").map((w) => w[0]).join("")}
                    </span>
                    <span className="chip" style={{ color: c.color, borderColor: `${c.color}55` }}>{c.category}</span>
                  </div>
                  <h3 className="font-d font-bold text-[0.95rem] mt-5 group-hover:text-[var(--lime)] transition-colors">{c.mentor.name}</h3>
                  <p className="text-[0.76rem] text-[var(--mut)] mt-1">{c.mentor.role}</p>
                  <p className="font-mono text-[0.68rem] mt-2" style={{ color: c.color }}>{c.mentor.exp}</p>
                  <div className="mt-5 pt-4 border-t border-[var(--line-soft)] flex items-center justify-between">
                    <span className="text-[0.74rem] text-[var(--mut)] truncate pr-2">«{c.title}» kursi</span>
                    <Icon name="arrow" className="w-4 h-4 shrink-0 text-[var(--dim)] group-hover:text-[var(--lime)] group-hover:translate-x-1 transition-all" />
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="py-24 border-t border-[var(--line-soft)] bg-[var(--ink2)]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-[0.8fr_1.2fr] gap-14">
          <div>
            <Kicker color="var(--coral)">SAVOL-JAVOB</Kicker>
            <h2 className="font-d font-extrabold text-[clamp(1.4rem,3vw,2.3rem)] leading-tight">
              Ko'p beriladigan savollar
            </h2>
            <p className="mt-5 text-[0.92rem] text-[var(--mut)] leading-relaxed">
              Javob topa olmadingizmi? AI yordamchimiz har qanday savolga — ovozli ham, yozma ham — javob berishga tayyor.
            </p>
            <a href="#/assistant" className="btn-ghost mt-8 group">
              <Icon name="brain" className="w-4 h-4 text-[var(--coral)]" /> AI'DAN SO'RASH
            </a>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} i={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <Reveal variant="scale">
            <div className="relative overflow-hidden rounded-2xl bg-[var(--lime)] text-[var(--ink)] px-8 py-14 lg:px-16 lg:py-16">
              <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full border-[22px] border-[rgba(12,18,14,0.08)]" />
              <div className="absolute right-24 -bottom-20 w-56 h-56 rounded-full border-[16px] border-[rgba(12,18,14,0.06)]" />
              <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
                <div>
                  <p className="font-d font-black text-[clamp(1.5rem,3.4vw,2.6rem)] leading-tight">
                    Bilim — bepul.<br />Boshlash — hozir.
                  </p>
                  <p className="mt-4 max-w-md font-semibold text-[0.95rem] text-[rgba(12,18,14,0.75)]">
                    Ro'yxatdan o'ting, yo'nalishingizni tanlang va AI ustozingiz bilan birinchi darsni bugun o'ting.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 lg:justify-end">
                  <button onClick={() => navigate("/auth")} className="font-d font-bold text-[0.8rem] bg-[var(--ink)] text-[var(--lime)] px-7 py-4 rounded-lg hover:-translate-y-0.5 hover:shadow-xl transition-all cursor-pointer inline-flex items-center gap-2">
                    RO'YXATDAN O'TISH <Icon name="arrow" className="w-4 h-4" />
                  </button>
                  <button onClick={() => navigate("/courses")} className="font-d font-bold text-[0.8rem] border-2 border-[var(--ink)] px-7 py-4 rounded-lg hover:bg-[rgba(12,18,14,0.08)] transition-colors cursor-pointer">
                    KURSLAR
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
