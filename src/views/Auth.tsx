import React, { useState } from "react";
import { useApp, validatePasswordStrength } from "../store";
import { Icon, Kicker, Reveal } from "../components/ui";

export default function Auth() {
  const { register, login, navigate, showToast, users } = useApp();
  const [mode, setMode] = useState<"reg" | "login">("reg");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(0);

  const fail = (errs: Record<string, string>) => {
    setErrors(errs);
    setShake((s) => s + 1);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (mode === "reg" && name.trim().length < 2) errs.name = "Ismingizni kiriting (kamida 2 harf)";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) errs.email = "To'g'ri email manzil kiriting";
    if (pass.length < 6) errs.pass = "Parol kamida 6 ta belgidan iborat bo'lsin";
    if (!/[0-9]/.test(pass)) errs.pass = "Parolda kamida 1 ta raqam bo'lishi kerak";
    if (mode === "reg" && pass !== pass2) errs.pass2 = "Parollar bir xil emas";
    if (Object.keys(errs).length) return fail(errs);

    setLoading(true);
    const err = mode === "reg" ? await register(name, email, pass) : await login(email, pass);
    setLoading(false);
    if (err) return fail({ form: err });

    // Login/register dan keyin user ni users ro'yxatidan topish
    const em = email.trim().toLowerCase();
    const currentUser = users.find((u) => u.email === em);
    const isAdmin = currentUser?.role === "admin";

    showToast(
      isAdmin
        ? `🛡 Xush kelibsiz, ${currentUser?.name || name.trim()}! Siz ADMIN sifatida kirdingiz.`
        : mode === "reg"
        ? `🎉 Xush kelibsiz, ${name.trim()}! Akkauntingiz tayyor.`
        : `👋 Qaytganingizdan xursandmiz!`
    );
    navigate(isAdmin ? "/admin" : "/dashboard");
  };

  const perks = [
    { i: "bolt", t: "1 daqiqada ro'yxatdan o'tish", d: "Karta, to'lov yoki kutish — hech biri yo'q." },
    { i: "book", t: "Barcha kurslar — hammasi bepul", d: "Front-End va boshqa yo'nalishlar." },
    { i: "mic", t: "Shaxsiy AI yordamchi 24/7", d: "Ovozli va yozma suhbat, darhol javob." },
    { i: "chart", t: "Progress va sertifikatlar", d: "Har bir qadamingiz kabinetingizda saqlanadi." },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute -top-40 -right-40 w-[560px] h-[560px] glow-lime rounded-full" />
      <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] glow-amber rounded-full" />

      <div className="relative max-w-6xl mx-auto px-5 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-14 items-center min-h-[80vh]">
        {/* chap panel */}
        <div>
          <Reveal>
            <Kicker>SHAXSIY KABINET</Kicker>
            <h1 className="font-d font-black text-[clamp(1.8rem,3.6vw,2.9rem)] leading-tight">
              Bilim sari <span className="text-[var(--lime)]">birinchi qadam</span>
            </h1>
            <p className="mt-5 max-w-md text-[0.95rem] text-[var(--mut)] leading-relaxed">
              Akkaunt oching — kurslarga yoziling, AI bilan suhbatlaringizni saqlang va progress'ingizni kuzating.
              Hammasi <strong className="text-[var(--bone)]">bepul</strong>.
            </p>
          </Reveal>
          <div className="mt-10 space-y-5">
            {perks.map((p, i) => (
              <Reveal key={p.t} delay={i * 90}>
                <div className="flex items-start gap-4 group">
                  <span className="shrink-0 w-11 h-11 rounded-xl border border-[var(--line)] bg-[var(--surface)] flex items-center justify-center text-[var(--lime)] group-hover:bg-[var(--lime)] group-hover:text-[var(--ink)] group-hover:border-[var(--lime)] transition-colors">
                    <Icon name={p.i} className="w-5 h-5" />
                  </span>
                  <span>
                    <p className="font-d font-bold text-[0.9rem]">{p.t}</p>
                    <p className="text-[0.82rem] text-[var(--mut)] mt-1">{p.d}</p>
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={380}>
            <div className="mt-10 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 relative">
              <Icon name="quote" className="w-6 h-6 text-[var(--amber)] absolute -top-3 left-5 bg-[var(--ink)] px-0.5" />
              <p className="text-[0.86rem] leading-relaxed text-[var(--mut)]">
                "Ro'yxatdan o'tish rostdan ham 30 soniya oldi. Kechqurun AI'ga ovozli savol berib, ertalab darslarni davom ettiryapman — progress'im saqlanib turadi."
              </p>
              <p className="mt-3 font-d font-bold text-[0.72rem] text-[var(--lime)]">DILNOZA · FRONT-END O'QUVCHISI</p>
            </div>
          </Reveal>
        </div>

        {/* forma */}
        <Reveal variant="right" delay={150}>
          <div key={shake} className={`rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-7 lg:p-9 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] ${shake ? "shake" : ""}`}>
            <div className="flex rounded-xl border border-[var(--line)] bg-[var(--ink2)] p-1 mb-8">
              {(["reg", "login"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setErrors({}); }}
                  className={`flex-1 font-d text-[0.7rem] font-bold py-3 rounded-lg transition-all cursor-pointer ${
                    mode === m ? "bg-[var(--lime)] text-[var(--ink)]" : "text-[var(--mut)] hover:text-[var(--bone)]"
                  }`}
                >
                  {m === "reg" ? "RO'YXATDAN O'TISH" : "KIRISH"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-5" noValidate>
              {errors.form && (
                <div className="rounded-lg border border-[var(--coral)] bg-[rgba(255,107,94,0.08)] px-4 py-3 text-[0.8rem] text-[var(--coral)] flex items-center gap-2">
                  <Icon name="x" className="w-4 h-4 shrink-0" /> {errors.form}
                </div>
              )}
              {mode === "reg" && (
                <div>
                  <label className="block font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-2">Ismingiz</label>
                  <div className="relative">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Aziz" className="field !pl-11" />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--dim)]"><Icon name="user" className="w-4 h-4" /></span>
                  </div>
                  {errors.name && <p className="mt-1.5 text-[0.72rem] text-[var(--coral)]">{errors.name}</p>}
                </div>
              )}
              <div>
                <label className="block font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-2">Email</label>
                <div className="relative">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="siz@example.com" className="field !pl-11" />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--dim)]">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
                  </span>
                </div>
                {errors.email && <p className="mt-1.5 text-[0.72rem] text-[var(--coral)]">{errors.email}</p>}
              </div>
              <div>
                <label className="block font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-2">Parol</label>
                <div className="relative">
                  <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" className="field !pl-11" />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--dim)]">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10.5" width="14" height="9.5" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>
                  </span>
                </div>
                {errors.pass && <p className="mt-1.5 text-[0.72rem] text-[var(--coral)]">{errors.pass}</p>}
              </div>
              {mode === "reg" && (
                <div>
                  <label className="block font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-2">Parolni tasdiqlang</label>
                  <input type="password" value={pass2} onChange={(e) => setPass2(e.target.value)} placeholder="••••••••" className="field" />
                  {errors.pass2 && <p className="mt-1.5 text-[0.72rem] text-[var(--coral)]">{errors.pass2}</p>}
                  
                  {/* Parol kuchi ko'rsatkichi */}
                  {pass && (
                    <div className="mt-3 p-3 rounded-lg border border-[var(--line)] bg-[var(--ink2)]">
                      <p className="font-mono text-[0.64rem] uppercase tracking-widest text-[var(--mut)] mb-2">Parol kuchi:</p>
                      {(() => {
                        const check = validatePasswordStrength(pass);
                        const strength = 
                          pass.length >= 8 && /[A-Z]/.test(pass) && /[a-z]/.test(pass) && /[0-9]/.test(pass) && /[!@#$%^&*]/.test(pass) ? 2 :
                          pass.length >= 6 && /[0-9]/.test(pass) ? 1 : 0;
                        
                        const colors = ['var(--coral)', 'var(--amber)', 'var(--lime)'];
                        const labels = ['Zaif', 'O\'rtacha', 'Kuchli'];
                        
                        return (
                          <>
                            <div className="flex gap-1 mb-2">
                              {[1, 2].map((i) => (
                                <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i <= strength ? colors[strength] : 'var(--line)' }} />
                              ))}
                            </div>
                            <p className="text-[0.68rem]" style={{ color: colors[strength] }}>{labels[strength]}</p>
                            {!check.valid && <p className="mt-1 text-[0.66rem] text-[var(--coral)]">{check.message}</p>}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-lime w-full justify-center !py-4 group disabled:opacity-60">
                {loading ? "TEKSHIRILMOQDA…" : mode === "reg" ? "AKKAUNT OCHISH — BEPUL" : "KABINETGA KIRISH"}
                {!loading && <Icon name="arrow" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>
              <p className="text-center text-[0.72rem] text-[var(--dim)] leading-relaxed">
                {mode === "reg" ? "Ro'yxatdan o'tish orqali siz bepul ta'lim shartlariga rozilik bildirasiz." : "Akkauntingiz yo'qmi? Yuqoridagi tab'dan ro'yxatdan o'ting."}
              </p>
            </form>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
