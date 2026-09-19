import React, { useEffect, useRef, useState } from "react";
import { DICT, KB, SUGGESTIONS } from "../data";
import { reducedMotion, useApp, type Msg } from "../store";
import { Icon, Kicker, Wave } from "../components/ui";

/* ---------- tilni aniqlash ---------- */
function detectLanguage(text: string): "uz" | "en" | "ru" {
  const t = text.toLowerCase();
  // Rus tili belgilari
  if (/[а-яё]/.test(t) || /\b(привет|здравствуй|как|дела|спасибо|пожалуйста|да|нет|хорошо|плохо)\b/.test(t)) {
    return "ru";
  }
  // Ingliz tili belgilari
  if (/^[a-z\s.,!?'"-]+$/.test(t) && /\b(hello|hi|how|are|you|what|is|the|and|for|with|thank|please|yes|no|good|bad)\b/.test(t)) {
    return "en";
  }
  // O'zbek tili (default)
  return "uz";
}

/* ---------- javob mexanizmi (ko'p tilli) ---------- */
function think(raw: string): string {
  const t = raw.toLowerCase().trim();
  const lang = detectLanguage(raw);

  // Tarjima rejimi
  const trMatch = t.match(/(?:tarjima(?:si|sini)?|translate|перевод)\s*[:\-]?\s*([a-zа-яё' ]+)/i) || t.match(/([a-zа-яё' ]+)\s+(?:tarjima|translation|перевод)/i);
  if (trMatch) {
    const word = trMatch[1].trim();
    if (DICT[word]) {
      if (lang === "en") return `🇬🇧 ${word[0].toUpperCase() + word.slice(1)} → 🇺🇿 ${DICT[word]}. More words? Just ask!`;
      if (lang === "ru") return `🇬🇧 ${word[0].toUpperCase() + word.slice(1)} → 🇺🇿 ${DICT[word]}. Ещё слова? Спрашивайте!`;
      return `🇬🇧 ${word[0].toUpperCase() + word.slice(1)} → 🇺🇿 ${DICT[word]}. Yana so'zlar bo'lsa, so'rang — lug'atimda 30 dan ortiq so'z bor!`;
    }
  }

  // Yagona inglizcha so'z
  if (/^[a-z' ]{2,28}$/.test(t) && DICT[t]) {
    if (lang === "en") return `🇬🇧 ${t[0].toUpperCase() + t.slice(1)} → 🇺🇿 ${DICT[t]}. Need more translations? Just ask!`;
    if (lang === "ru") return `🇬🇧 ${t[0].toUpperCase() + t.slice(1)} → 🇺🇿 ${DICT[t]}. Нужны ещё переводы? Спрашивайте!`;
    return `🇬🇧 ${t[0].toUpperCase() + t.slice(1)} → 🇺🇿 ${DICT[t]}. Yana so'zlar bo'lsa, so'rang — tarjima qilib beraman 😉`;
  }

  // Bilimlar bazasidan qidirish
  for (const e of KB) {
    if (e.keys.some((k) => t.includes(k))) {
      // Ko'p tilli javoblar
      if (lang === "en" && e.answerEn) return e.answerEn;
      if (lang === "ru" && e.answerRu) return e.answerRu;
      return e.answer;
    }
  }

  // Default javob (tillarga mos)
  if (lang === "en") {
    return `Hmm, I don't have a specific answer for "${raw.slice(0, 60)}" yet 🤔 But I'm strong in:\n• Courses, registration, certificates\n• Programming terms: "what is function?", "what is array?"\n• English translation: "knowledge translation"\n• Need motivation? Just ask!\nTry rephrasing your question?`;
  }
  if (lang === "ru") {
    return `Хм, у меня пока нет точного ответа на "${raw.slice(0, 60)}" 🤔 Но я силен в:\n• Курсы, регистрация, сертификаты\n• Термины программирования: "что такое функция?", "что такое массив?"\n• Перевод с английского: "knowledge перевод"\n• Нужна мотивация? Просто спросите!\nПопробуйте переформулировать вопрос?`;
  }
  return `Hmm, "${raw.slice(0, 60)}" bo'yicha aniq javobim hozircha yo'q 🤔 Lekin men quyidagilarda kuchliman:\n• Kurslar, ro'yxatdan o'tish, sertifikatlar\n• Dasturlash atamalari: "funksiya nima?", "massiv nima?"\n• So'zlar tarjimasi: "knowledge tarjimasi"\n• Motivatsiya kerak bo'lsa — shuni ham ayting!\nSavolni boshqacha ifodalab ko'rasizmi?`;
}

const speak = (text: string, enabled: boolean, lang: "uz" | "en" | "ru" = "uz") => {
  if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const clean = text.replace(/[•🎙️🚀💪🔥🤔😉🏆⚡👋🇬🇧🇺🇿🇷🇺`#*_]/g, " ").replace(/\s+/g, " ");
    const u = new SpeechSynthesisUtterance(clean);
    // Tilga mos ovoz
    if (lang === "en") {
      u.lang = "en-US";
      u.rate = 1.0;
    } else if (lang === "ru") {
      u.lang = "ru-RU";
      u.rate = 1.0;
    } else {
      u.lang = "uz-UZ";
      u.rate = 1.02;
    }
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch {
    /* ovoz bo'lmasa ham matn ko'rinadi */
  }
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

/* ================= ASSISTANT SAHIFASI ================= */
export default function Assistant() {
  const { chatLog, pushChat, clearChat, user, navigate, aiConfig } = useApp();
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [voiceReply, setVoiceReply] = useState(true);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const voiceRef = useRef(voiceReply);
  voiceRef.current = voiceReply;

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatLog, typing]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || typing) return;
    setInput("");
    pushChat({ role: "user", text: msg, t: Date.now() });
    setTyping(true);
    
    // Haqiqiy AI API ishlatish
    if (aiConfig.provider !== "local" && aiConfig.apiKey) {
      try {
        const answer = await callRealAI(msg, aiConfig.apiKey, aiConfig.provider);
        const lang = detectLanguage(msg);
        pushChat({ role: "ai", text: answer, t: Date.now() });
        setTyping(false);
        if (voiceRef.current && "speechSynthesis" in window) {
          setSpeaking(true);
          speak(answer, true, lang);
          const est = Math.min(14000, 1200 + answer.length * 55);
          window.setTimeout(() => setSpeaking(false), est);
        }
      } catch (error) {
        pushChat({ role: "ai", text: "AI xizmatiga ulanishda xatolik. Mahalliy rejimga o'tildi.", t: Date.now() });
        setTyping(false);
      }
    } else {
      // Mahalliy rejim (fallback)
      const delay = reducedMotion() ? 200 : 800 + Math.min(1400, msg.length * 22);
      window.setTimeout(() => {
        const answer = think(msg);
        const lang = detectLanguage(msg);
        pushChat({ role: "ai", text: answer, t: Date.now() });
        setTyping(false);
        if (voiceRef.current && "speechSynthesis" in window) {
          setSpeaking(true);
          speak(answer, true, lang);
          const est = Math.min(14000, 1200 + answer.length * 55);
          window.setTimeout(() => setSpeaking(false), est);
        }
      }, delay);
    }
  };

  /* ---------- ovozli kiritish ---------- */
  const toggleMic = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setVoiceSupported(false);
      return;
    }
    const rec = new SR();
    rec.lang = "uz-UZ";
    rec.interimResults = true;
    rec.continuous = false;
    let final = "";
    rec.onresult = (ev: any) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      setInput(final || interim);
    };
    rec.onend = () => {
      setListening(false);
      if (final.trim()) window.setTimeout(() => send(final), 250);
    };
    rec.onerror = () => {
      setListening(false);
      setVoiceSupported(false);
    };
    recRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  };

  useEffect(() => () => { try { recRef.current?.abort(); window.speechSynthesis?.cancel(); } catch { /* noop */ } }, []);

  const empty = chatLog.length === 0;

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 grid-bg [mask-image:linear-gradient(to_bottom,black,transparent_50%)]" />
      <div className="absolute -top-20 left-1/3 w-[480px] h-[480px] glow-lime rounded-full" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-5 lg:px-8 pt-6 sm:pt-10 lg:pt-12 pb-10 lg:pb-16">
        {/* ---------- mobil ixcham boshqaruv ---------- */}
        <div className="lg:hidden mb-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="relative shrink-0">
                <span className="w-9 h-9 rounded-lg bg-[var(--lime)] flex items-center justify-center">
                  <Icon name="brain" className="w-5 h-5 text-[var(--ink)]" />
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--lime)] border-2 border-[var(--surface)] pulse-dot" />
              </span>
              <div className="min-w-0">
                <p className="font-d text-[0.72rem] font-bold">RAZZOQ AI</p>
                <p className="text-[0.62rem] text-[var(--mut)] truncate">
                  {typing ? "yozmoqda…" : speaking ? "ovozli javob…" : listening ? "tinglayapman…" : "onlayn"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setVoiceReply((v) => { if (v) window.speechSynthesis?.cancel(); return !v; })}
                aria-label="Ovozli javob"
                className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${voiceReply ? "border-[var(--lime)] text-[var(--lime)] bg-[rgba(201,241,88,0.08)]" : "border-[var(--line)] text-[var(--mut)]"}`}
              >
                <Icon name={voiceReply ? "sound" : "soundOff"} className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowPanel((s) => !s)}
                aria-label="Boshqaruv panelini ochish"
                aria-expanded={showPanel}
                className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${showPanel ? "border-[var(--lime)] text-[var(--lime)] bg-[rgba(201,241,88,0.08)]" : "border-[var(--line)] text-[var(--mut)]"}`}
              >
                <Icon name="chevron" className={`w-4 h-4 transition-transform duration-300 ${showPanel ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>
          {showPanel && (
            <div className="mt-3 grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 toast-in">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[0.76rem] font-semibold">
                  <Icon name="mic" className="w-4 h-4 text-[var(--coral)]" /> Ovozli savol
                </span>
                <span className={`font-mono text-[0.6rem] px-2 py-1 rounded ${listening ? "text-[var(--coral)] bg-[rgba(255,107,94,0.12)]" : "text-[var(--mut)] bg-[var(--ink2)]"}`}>
                  {listening ? "● TINGLAYAPMAN" : "TAYYOR"}
                </span>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[0.76rem] font-semibold">
                  <Icon name="bolt" className="w-4 h-4 text-[var(--lime)]" /> Savollar
                </span>
                <span className="font-d font-extrabold text-lg text-[var(--lime)]">{chatLog.filter((m) => m.role === "user").length}</span>
              </div>
              {chatLog.length > 0 && (
                <button onClick={clearChat} className="min-[420px]:col-span-2 w-full flex items-center justify-center gap-2 text-[0.7rem] font-mono text-[var(--mut)] border border-[var(--line)] rounded-lg py-2.5 hover:text-[var(--coral)] hover:border-[var(--coral)] transition-colors cursor-pointer">
                  <Icon name="trash" className="w-3.5 h-3.5" /> tarixni tozalash
                </button>
              )}
            </div>
          )}
        </div>

        <div className="lg:grid lg:grid-cols-[300px_1fr] gap-8">
          {/* ---------- yon panel (desktop) ---------- */}
          <aside className="hidden lg:block space-y-5">
            <div>
              <Kicker>SHAXSIY AI USTOZ</Kicker>
              <h1 className="font-d font-black text-[clamp(1.4rem,2.6vw,2rem)] leading-tight">
                Razzoq <span className="text-[var(--lime)]">AI</span>
              </h1>
              <p className="mt-3 text-[0.84rem] text-[var(--mut)] leading-relaxed">
                {user ? `${user.name}, savolingizni ayting yoki yozing.` : "Ro'yxatdan o'tsangiz, suhbat tarixi kabinetingizda saqlanadi."}
              </p>
              {!user && (
                <button onClick={() => navigate("/auth")} className="btn-ghost !py-2.5 !px-4 mt-4 !text-[0.68rem]">
                  <Icon name="user" className="w-3.5 h-3.5 text-[var(--lime)]" /> HISP OCHISH — 30 SONIYA
                </button>
              )}
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2.5 text-[0.8rem] font-semibold">
                  <Icon name="sound" className="w-4 h-4 text-[var(--lime)]" /> Ovozli javob
                </span>
                <button
                  onClick={() => setVoiceReply((v) => { if (v) window.speechSynthesis?.cancel(); return !v; })}
                  className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${voiceReply ? "bg-[var(--lime)]" : "bg-[var(--line)]"}`}
                  aria-label="Ovozli javobni yoqish/o'chirish"
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-[var(--ink)] transition-all ${voiceReply ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2.5 text-[0.8rem] font-semibold">
                  <Icon name="mic" className="w-4 h-4 text-[var(--coral)]" /> Ovozli savol
                </span>
                <span className={`font-mono text-[0.64rem] px-2 py-1 rounded ${listening ? "text-[var(--coral)] bg-[rgba(255,107,94,0.12)]" : "text-[var(--mut)] bg-[var(--ink2)]"}`}>
                  {listening ? "● TINGLAYAPMAN" : "TAYYOR"}
                </span>
              </div>
              {chatLog.length > 0 && (
                <button onClick={clearChat} className="w-full flex items-center justify-center gap-2 text-[0.74rem] font-mono text-[var(--mut)] border border-[var(--line)] rounded-lg py-2.5 hover:text-[var(--coral)] hover:border-[var(--coral)] transition-colors cursor-pointer">
                  <Icon name="trash" className="w-3.5 h-3.5" /> tarixni tozalash
                </button>
              )}
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 flex items-center justify-between gap-3">
              <div>
                <p className="font-d font-extrabold text-2xl text-[var(--lime)]">{chatLog.filter((m) => m.role === "user").length}</p>
                <p className="text-[0.66rem] text-[var(--mut)] uppercase tracking-wide mt-1">savol berdingiz</p>
              </div>
              <Wave active={typing || speaking || listening} bars={10} className="h-6" />
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <p className="font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-3.5">Nimalarni so'rashingiz mumkin</p>
              <ul className="space-y-2.5">
                {[
                  { i: "book", t: "Kurslar va darslar haqida" },
                  { i: "code", t: "Dasturlash atamalari" },
                  { i: "globe", t: "Inglizcha so'z tarjimasi" },
                  { i: "award", t: "Sertifikat va imtihonlar" },
                  { i: "bolt", t: "Motivatsiya va maslahat" },
                ].map((x) => (
                  <li key={x.t} className="flex items-center gap-2.5 text-[0.8rem] text-[var(--mut)]">
                    <Icon name={x.i} className="w-4 h-4 text-[var(--lime)] shrink-0" /> {x.t}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-[0.68rem] font-mono text-[var(--dim)] leading-relaxed px-1">
              * Ovozli funksiyalar uchun Chrome brauzeri va mikrofon ruxsati tavsiya etiladi.
            </p>
          </aside>

          {/* ---------- suhbat oynasi ---------- */}
          <div className="flex flex-col rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden h-[calc(100dvh-190px)] min-h-[480px] lg:h-[calc(100dvh-180px)] lg:min-h-[540px]">
            {/* header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line-soft)] bg-[var(--ink2)]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-[var(--lime)] flex items-center justify-center">
                    <Icon name="brain" className="w-5 h-5 text-[var(--ink)]" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[var(--lime)] border-2 border-[var(--ink2)] pulse-dot" />
                </div>
                <div>
                  <p className="font-d text-[0.75rem] font-bold">RAZZOQ AI YORDAMCHI</p>
                  <p className="text-[0.68rem] text-[var(--mut)]">
                    {typing ? "yozmoqda…" : speaking ? "ovozli javob bermoqda…" : listening ? "sizni tinglayapman…" : "onlayn · javob ~3 soniya"}
                  </p>
                </div>
              </div>
              <Wave active={listening || speaking || typing} bars={14} color={listening ? "var(--coral)" : "var(--lime)"} className="h-6 hidden sm:flex" />
            </div>

            {/* xabarlar */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
              {empty && !typing && (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center">
                      <Icon name="brain" className="w-9 h-9 text-[var(--lime)]" />
                    </div>
                    <span className="absolute inset-0 rounded-2xl border border-[var(--lime)] ring-ping" />
                  </div>
                  <p className="font-d font-bold text-lg">Assalomu alaykum{user ? `, ${user.name}` : ""}! 👋</p>
                  <p className="mt-2 max-w-sm text-[0.86rem] text-[var(--mut)] leading-relaxed">
                    Men Razzoq AI — ovozli va yozma yordamchingizman. Quyidagilardan birini tanlang yoki o'z savolingizni bering:
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-md">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} onClick={() => send(s)} className="chip !py-2.5 !px-4 !text-[0.74rem] hover:!border-[var(--lime)] hover:!text-[var(--lime)] transition-colors cursor-pointer">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatLog.map((m: Msg, i: number) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "ai" && (
                    <span className="shrink-0 w-8 h-8 rounded-lg bg-[var(--lime)] flex items-center justify-center mr-3 mt-1">
                      <Icon name="brain" className="w-4 h-4 text-[var(--ink)]" />
                    </span>
                  )}
                  <div className="max-w-[80%]">
                    <div className={`rounded-xl px-4 py-3 text-[0.88rem] leading-relaxed whitespace-pre-line ${
                      m.role === "user"
                        ? "bg-[var(--lime)] text-[var(--ink)] font-semibold rounded-br-sm"
                        : "bg-[var(--surface2)] border border-[var(--line-soft)] rounded-tl-sm"
                    }`}>
                      {m.text}
                    </div>
                    {m.role === "ai" && (
                      <div className="mt-1.5 flex items-center gap-1 pl-1">
                        <button
                          onClick={() => { setSpeaking(true); speak(m.text, true); window.setTimeout(() => setSpeaking(false), Math.min(12000, 1200 + m.text.length * 55)); }}
                          className="p-1.5 rounded-md text-[var(--dim)] hover:text-[var(--lime)] hover:bg-[rgba(201,241,88,0.08)] transition-colors cursor-pointer"
                          aria-label="Javobni ovozli eshitish"
                          title="Ovozli eshitish"
                        >
                          <Icon name="sound" className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const done = () => { setCopied(i); window.setTimeout(() => setCopied(null), 1600); };
                            if (navigator.clipboard?.writeText) navigator.clipboard.writeText(m.text).then(done).catch(done);
                            else done();
                          }}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${copied === i ? "text-[var(--lime)] bg-[rgba(201,241,88,0.12)]" : "text-[var(--dim)] hover:text-[var(--lime)] hover:bg-[rgba(201,241,88,0.08)]"}`}
                          aria-label="Javobni nusxalash"
                          title="Nusxalash"
                        >
                          <Icon name={copied === i ? "check" : "copy"} className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono text-[0.6rem] text-[var(--dim)] ml-1.5">
                          {new Date(m.t).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {typing && (
                <div className="flex justify-start">
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-[var(--lime)] flex items-center justify-center mr-3 mt-1">
                    <Icon name="brain" className="w-4 h-4 text-[var(--ink)]" />
                  </span>
                  <div className="bg-[var(--surface2)] border border-[var(--line-soft)] rounded-xl rounded-tl-sm px-4 py-3.5 flex gap-1.5">
                    {[0, 1, 2].map((d) => (
                      <span key={d} className="tdot w-1.5 h-1.5 rounded-full bg-[var(--lime)]" style={{ animationDelay: `${d * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ovozli kiritish indikatori */}
            {listening && (
              <div className="px-5 py-3 border-t border-[var(--line-soft)] bg-[rgba(255,107,94,0.05)] flex items-center gap-4">
                <div className="relative">
                  <span className="w-9 h-9 rounded-full bg-[var(--coral)] flex items-center justify-center relative z-10">
                    <Icon name="mic" className="w-4 h-4 text-[var(--ink)]" />
                  </span>
                  <span className="absolute inset-0 rounded-full bg-[var(--coral)] ring-ping" />
                </div>
                <Wave active bars={22} color="var(--coral)" className="h-7 flex-1" />
                <button onClick={toggleMic} className="font-mono text-[0.68rem] text-[var(--coral)] hover:opacity-70 transition-opacity cursor-pointer">TO'XTATISH</button>
              </div>
            )}

            {!voiceSupported && (
              <div className="px-5 py-2.5 border-t border-[var(--line-soft)] bg-[rgba(255,154,60,0.07)] text-[0.72rem] font-mono text-[var(--amber)]">
                ⚠ Brauzeringiz ovozli kiritishni qo'llab-quvvatlamaydi — yozma savol bering yoki Chrome'da oching.
              </div>
            )}

            {/* input */}
            <div className="p-4 border-t border-[var(--line-soft)] bg-[var(--ink2)]">
              <div className={`flex items-center gap-3 rounded-xl border bg-[var(--surface)] px-3 py-2 transition-colors ${listening ? "border-[var(--coral)]" : "border-[var(--line)] focus-within:border-[var(--lime)]"}`}>
                <button
                  onClick={toggleMic}
                  aria-label="Ovozli savol berish"
                  className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    listening ? "bg-[var(--coral)] text-[var(--ink)]" : "bg-[var(--surface2)] border border-[var(--line)] text-[var(--mut)] hover:text-[var(--coral)] hover:border-[var(--coral)]"
                  }`}
                >
                  <Icon name="mic" className="w-5 h-5" />
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder={listening ? "Gapiravering…" : "Savolingizni yozing… (masalan: Front-End kursi haqida)"}
                  className="flex-1 bg-transparent text-[0.9rem] placeholder:text-[var(--dim)]"
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || typing}
                  aria-label="Yuborish"
                  className="shrink-0 w-10 h-10 rounded-lg bg-[var(--lime)] text-[var(--ink)] flex items-center justify-center transition-all cursor-pointer hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Icon name="send" className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-2.5 text-center text-[0.64rem] font-mono text-[var(--dim)]">
                Razzoq AI xato qilishi mumkin — muhim ma'lumotni kurs sahifasidan tekshiring
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
