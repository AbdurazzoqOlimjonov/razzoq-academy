import React, { useEffect } from "react";
import { COURSES, TIPS } from "../data";
import { useApp } from "../store";
import { Icon, Kicker, Reveal } from "../components/ui";

/* ---------- sertifikatni PNG qilib chizish ---------- */
async function downloadCert(courseTitle: string, userName: string, dateStr: string) {
  try {
    // shriftlar canvas'ga tushishi uchun yuklanishini kutamiz
    if ((document as any).fonts?.ready) await (document as any).fonts.ready;
  } catch { /* muhim emas */ }

  const W = 1600;
  const H = 1130;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d");
  if (!x) return;

  // fon
  x.fillStyle = "#0c120e";
  x.fillRect(0, 0, W, H);
  x.strokeStyle = "rgba(237,235,224,0.045)";
  x.lineWidth = 1;
  for (let i = 0; i <= W; i += 54) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
  for (let i = 0; i <= H; i += 54) { x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke(); }

  // romka
  x.strokeStyle = "#c9f158";
  x.lineWidth = 6;
  x.strokeRect(48, 48, W - 96, H - 96);
  x.strokeStyle = "rgba(201,241,88,0.35)";
  x.lineWidth = 2;
  x.strokeRect(72, 72, W - 144, H - 144);

  x.textAlign = "center";
  x.textBaseline = "middle";

  // brend belgisi
  x.fillStyle = "#c9f158";
  x.fillRect(W / 2 - 30, 118, 60, 60);
  x.fillStyle = "#0c120e";
  x.font = "900 38px Unbounded, sans-serif";
  x.fillText("R", W / 2, 150);
  x.fillStyle = "#93a396";
  x.font = "600 23px 'JetBrains Mono', monospace";
  x.fillText("R A Z Z O Q   A C A D E M Y", W / 2, 222);

  // sarlavha
  x.fillStyle = "#edebe0";
  x.font = "900 104px Unbounded, sans-serif";
  x.fillText("SERTIFIKAT", W / 2, 340);
  x.fillStyle = "#93a396";
  x.font = "500 27px Manrope, sans-serif";
  x.fillText("ushbu hujjat quyidagi o'quvchiga topshiriladi", W / 2, 430);

  // ism (sig'masa kichraytiriladi)
  let size = 66;
  x.font = `800 ${size}px Unbounded, sans-serif`;
  while (x.measureText(userName).width > 1240 && size > 30) {
    size -= 3;
    x.font = `800 ${size}px Unbounded, sans-serif`;
  }
  x.fillStyle = "#c9f158";
  x.fillText(userName, W / 2, 525);
  x.strokeStyle = "rgba(201,241,88,0.5)";
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(W / 2 - 330, 575);
  x.lineTo(W / 2 + 330, 575);
  x.stroke();

  // kurs
  x.fillStyle = "#edebe0";
  x.font = "600 36px Manrope, sans-serif";
  x.fillText(`«${courseTitle}» kursini to'liq yakunlagani uchun`, W / 2, 650);
  x.fillStyle = "#93a396";
  x.font = "500 25px Manrope, sans-serif";
  x.fillText("barcha darslar, amaliy loyihalar va yakuniy imtihondan muvaffaqiyatli o'tdi", W / 2, 700);

  // muhr
  x.beginPath();
  x.arc(W / 2, 905, 64, 0, Math.PI * 2);
  x.strokeStyle = "#c9f158";
  x.lineWidth = 3;
  x.stroke();
  x.beginPath();
  x.arc(W / 2, 905, 52, 0, Math.PI * 2);
  x.strokeStyle = "rgba(201,241,88,0.4)";
  x.lineWidth = 1.5;
  x.stroke();
  x.fillStyle = "#c9f158";
  x.font = "900 42px Unbounded, sans-serif";
  x.fillText("R", W / 2, 907);

  // sana va imzo
  x.textAlign = "left";
  x.fillStyle = "#93a396";
  x.font = "600 21px 'JetBrains Mono', monospace";
  x.fillText("SANA", 150, 872);
  x.fillStyle = "#edebe0";
  x.font = "700 30px Manrope, sans-serif";
  x.fillText(dateStr, 150, 916);
  x.strokeStyle = "rgba(237,235,224,0.3)";
  x.beginPath();
  x.moveTo(150, 940);
  x.lineTo(470, 940);
  x.stroke();

  x.textAlign = "right";
  x.fillStyle = "#93a396";
  x.font = "600 21px 'JetBrains Mono', monospace";
  x.fillText("IMZO", W - 150, 872);
  x.fillStyle = "#edebe0";
  x.font = "italic 700 36px Manrope, sans-serif";
  x.fillText("A. Razzoqov", W - 150, 916);
  x.strokeStyle = "rgba(237,235,224,0.3)";
  x.beginPath();
  x.moveTo(W - 470, 940);
  x.lineTo(W - 150, 940);
  x.stroke();

  // yuklab olish
  const a = document.createElement("a");
  a.download = `razzoq-academy-sertifikat-${courseTitle.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.png`;
  a.href = c.toDataURL("image/png");
  a.click();
}

export default function Dashboard() {
  const { user, progress, navigate, logout, chatLog, showToast, deleteMyAccount, certificates } = useApp();

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);
  if (!user) return null;

  const enrolled = COURSES.filter((c) => progress[c.id]);
  const certs = enrolled.filter((c) => Math.round((progress[c.id].done.length / c.lessons.length) * 100) === 100);
  const totalLessons = enrolled.reduce((s, c) => s + progress[c.id].done.length, 0);
  const totalMinutes = enrolled.reduce((s, c) => s + c.lessons.filter((l) => progress[c.id].done.includes(l.id)).reduce((a, l) => a + l.dur, 0), 0);
  const avgPct = enrolled.length ? Math.round(enrolled.reduce((s, c) => s + progress[c.id].done.length / c.lessons.length, 0) / enrolled.length * 100) : 0;
  const tip = TIPS[new Date().getDate() % TIPS.length];
  const joined = new Date(user.joined).toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" });
  const firstName = user.name.split(" ")[0];

  const clearMyData = () => {
    if (!window.confirm("DIQQAT: Barcha progress, darslar va AI suhbatlari o'chiriladi. Akkauntingiz saqlanib qoladi. Davom etasizmi?")) return;
    try {
      localStorage.removeItem(`razzoq_prog_${user.id}`);
      localStorage.removeItem(`razzoq_chat_${user.id}`);
      showToast("✅ Ma'lumotlaringiz tozalandi");
      window.setTimeout(() => window.location.reload(), 700);
    } catch {
      showToast("❌ Xatolik yuz berdi");
    }
  };

  const deleteAccount = () => {
    if (!window.confirm("⚠️ AKKAUNTNI O'CHIRISH\n\nBu amalni qaytarib bo'lmaydi!\n\nO'chiriladi:\n• Akkauntingiz\n• Barcha progress va darslar\n• AI suhbatlar\n• Sertifikatlar\n\nDavom etasizmi?")) return;
    if (!window.confirm("Oxirgi tasdiq: Haqiqatan ham akkauntingizni o'chirmoqchimisiz?")) return;
    deleteMyAccount();
    navigate("/");
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 grid-bg [mask-image:linear-gradient(to_bottom,black,transparent_55%)]" />
      <div className="absolute -top-24 -right-32 w-[480px] h-[480px] glow-teal rounded-full" />
      <div className="relative max-w-7xl mx-auto px-5 lg:px-8 pt-14 pb-24">
        {/* sarlavha */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Kicker color="var(--teal)">SHAXSIY KABINET</Kicker>
            <h1 className="font-d font-black text-[clamp(1.6rem,3.4vw,2.7rem)] leading-tight">
              Xush kelibsiz, <span className="text-[var(--teal)]">{firstName}</span> 👋
            </h1>
            <p className="mt-3 text-[0.88rem] text-[var(--mut)]">
              Akademiyadasiz: {joined} dan beri · {chatLog.length} ta savol AI'ga berilgan
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate("/assistant")} className="btn-lime !py-3 group">
              <Icon name="brain" className="w-4 h-4" /> AI'DAN SO'RASH
            </button>
            <button onClick={logout} className="btn-ghost !py-3 !px-4" aria-label="Chiqish">
              <Icon name="logout" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* statistika */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { i: "book", v: `${enrolled.length}`, l: "faol kurs", c: "var(--lime)" },
            { i: "check", v: `${totalLessons}`, l: "bajarilgan dars", c: "var(--teal)" },
            { i: "clock", v: `${Math.round(totalMinutes / 6) / 10}`, l: "soat o'qildi", c: "var(--amber)" },
            { i: "chart", v: `${avgPct}%`, l: "o'rtacha progress", c: "var(--coral)" },
          ].map((s, i) => (
            <Reveal key={s.l} delay={i * 80}>
              <div className="lift rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 h-full" style={{ ["--hover-c" as any]: s.c }}>
                <Icon name={s.i} className="w-5 h-5 mb-3" />
                <p className="font-d font-extrabold text-2xl" style={{ color: s.c }}>{s.v}</p>
                <p className="text-[0.7rem] text-[var(--mut)] uppercase tracking-wide mt-1">{s.l}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* sertifikatlar */}
        <div className="mt-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-d font-bold text-xl">Sertifikatlarim</h2>
            <span className="font-mono text-[0.72rem] text-[var(--mut)]">{certificates.length} ta olingan</span>
          </div>
          {certificates.length === 0 ? (
            <Reveal>
              <div className="flex flex-wrap items-center gap-5 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-7">
                <div className="w-14 h-14 rounded-xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center shrink-0">
                  <Icon name="award" className="w-6 h-6 text-[var(--dim)]" />
                </div>
                <div className="flex-1 min-w-[220px]">
                  <p className="font-d font-bold text-[0.95rem]">Hozircha sertifikat yo'q</p>
                  <p className="text-[0.82rem] text-[var(--mut)] mt-1 leading-relaxed">
                    Kursni 100% yakunlang va yakuniy imtihondan o'ting — shaxsiy sertifikatingiz shu yerda paydo bo'ladi.
                  </p>
                </div>
                <button onClick={() => navigate("/courses")} className="btn-ghost !py-3 shrink-0">KURS TANLASH</button>
              </div>
            </Reveal>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map((cert, i) => {
                const when = new Date(cert.completedAt).toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" });
                return (
                  <Reveal key={cert.id} delay={i * 90}>
                    <div className="lift group rounded-xl border border-[var(--lime)] bg-[var(--surface)] p-6 h-full">
                      <div className="flex items-center justify-between gap-3">
                        <span className="w-12 h-12 rounded-xl flex items-center justify-center bg-[rgba(201,241,88,0.15)] text-[var(--lime)]">
                          <Icon name="award" className="w-6 h-6" />
                        </span>
                        <span className="chip !text-[var(--lime)] !border-[rgba(201,241,88,0.4)]">TASDIQLANGAN</span>
                      </div>
                      <h3 className="font-d font-bold text-[0.92rem] mt-4">{cert.courseTitle}</h3>
                      <p className="font-mono text-[0.7rem] text-[var(--mut)] mt-1.5">{when} · Natija: {cert.score}%</p>
                      <p className="font-mono text-[0.6rem] text-[var(--dim)] mt-1">ID: {cert.certificateId}</p>
                      <button
                        onClick={() => { downloadCert(cert.courseTitle, cert.userName, when); showToast("📥 Sertifikat PNG ko'rinishida yuklab olindi!"); }}
                        className="btn-lime w-full justify-center !py-3 mt-5"
                      >
                        <Icon name="download" className="w-4 h-4" /> PNG YUKLAB OLISH
                      </button>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-14 grid lg:grid-cols-[1.5fr_1fr] gap-10">
          {/* kurslarim */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-d font-bold text-xl">Kurslarim</h2>
              <button onClick={() => navigate("/courses")} className="font-mono text-[0.72rem] text-[var(--lime)] hover:underline cursor-pointer flex items-center gap-1.5">
                <Icon name="plus" className="w-3.5 h-3.5" /> yana kurs qo'shish
              </button>
            </div>

            {enrolled.length === 0 ? (
              <Reveal>
                <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-10 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--surface2)] border border-[var(--line)] flex items-center justify-center mx-auto mb-5">
                    <Icon name="target" className="w-7 h-7 text-[var(--amber)]" />
                  </div>
                  <p className="font-d font-bold text-lg">Hozircha kursga yozilmagansiz</p>
                  <p className="mt-2 max-w-sm mx-auto text-[0.86rem] text-[var(--mut)] leading-relaxed">
                    Katalogdan yo'nalishingizni tanlang — hammasi bepul, bir bosishda ochiladi.
                  </p>
                  <button onClick={() => navigate("/courses")} className="btn-lime mt-7 group">
                    KATALOgni KO'RISH <Icon name="arrow" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </Reveal>
            ) : (
              <div className="space-y-4">
                {enrolled.map((c, i) => {
                  const p = progress[c.id];
                  const pct = Math.round((p.done.length / c.lessons.length) * 100);
                  const next = c.lessons.find((l) => !p.done.includes(l.id));
                  return (
                    <Reveal key={c.id} delay={i * 90}>
                      <div className="lift group rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6" style={{ ["--hover-c" as any]: c.color }}>
                        <div className="flex flex-wrap items-center gap-4">
                          <span className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${c.color}1f`, color: c.color }}>
                            <Icon name={pct === 100 ? "award" : "book"} className="w-6 h-6" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-d font-bold text-[0.98rem]">{c.title}</h3>
                              {pct === 100 && <span className="chip !text-[var(--lime)] !border-[rgba(201,241,88,0.4)]">🏆 YAKUNLANDI</span>}
                            </div>
                            <p className="text-[0.74rem] font-mono text-[var(--mut)] mt-1.5">
                              {p.done.length}/{c.lessons.length} dars · {pct}%
                            </p>
                          </div>
                          <a href={`#/course/${c.id}`} className="shrink-0 font-d text-[0.66rem] font-bold px-4 py-2.5 rounded-lg border border-[var(--line)] hover:bg-[var(--lime)] hover:text-[var(--ink)] hover:border-[var(--lime)] transition-colors inline-flex items-center gap-2">
                            DAVOM ETISH <Icon name="arrow" className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <div className="mt-4 h-2 rounded-full bg-[var(--ink2)] overflow-hidden">
                          <div className="h-full rounded-full bar-grow" style={{ width: `${Math.max(pct, 2)}%`, background: `linear-gradient(90deg, ${c.color}88, ${c.color})` }} />
                        </div>
                        {next && (
                          <p className="mt-3 text-[0.76rem] text-[var(--mut)] flex items-center gap-2">
                            <Icon name="play" className="w-3.5 h-3.5 text-[var(--lime)]" />
                            Keyingi dars: <strong className="text-[var(--bone)] font-semibold">{next.title}</strong> · {next.dur} daqiqa
                          </p>
                        )}
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            )}
          </div>

          {/* yon panel */}
          <div className="space-y-5">
            <Reveal variant="right">
              <div className="rounded-xl border border-[var(--lime)] bg-[rgba(201,241,88,0.05)] p-6">
                <p className="flex items-center gap-2 font-d font-bold text-[0.9rem]">
                  <Icon name="bolt" className="w-4 h-4 text-[var(--lime)]" /> Bugungi tavsiya
                </p>
                <p className="mt-3 text-[0.88rem] leading-relaxed text-[var(--mut)]">{tip}</p>
              </div>
            </Reveal>

            <Reveal variant="right" delay={100}>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6">
                <p className="font-mono text-[0.66rem] uppercase tracking-widest text-[var(--mut)] mb-4">Tez amallar</p>
                <div className="space-y-2.5">
                  {[
                    { i: "mic", t: "AI bilan ovozli suhbat", to: "/assistant", c: "var(--coral)" },
                    { i: "book", t: "Kurslar katalogi", to: "/courses", c: "var(--lime)" },
                    { i: "globe", t: "Inglizcha so'z tarjimasi", to: "/assistant", c: "var(--sky)" },
                    { i: "user", t: "Profil: " + user.email, to: "/dashboard", c: "var(--amber)" },
                  ].map((a) => (
                    <button
                      key={a.t}
                      onClick={() => navigate(a.to)}
                      className="w-full flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--ink2)] px-4 py-3 text-[0.82rem] font-semibold hover:border-[var(--lime)] hover:-translate-y-0.5 transition-all cursor-pointer text-left"
                    >
                      <Icon name={a.i} className="w-4 h-4 shrink-0" />
                      <span className="flex-1 truncate">{a.t}</span>
                      <Icon name="arrow" className="w-3.5 h-3.5 text-[var(--dim)]" />
                    </button>
                  ))}
                  <button
                    onClick={clearMyData}
                    className="w-full flex items-center gap-3 rounded-lg border border-[var(--coral)] bg-[rgba(255,107,94,0.05)] px-4 py-3 text-[0.82rem] font-semibold text-[var(--coral)] hover:bg-[var(--coral)] hover:text-[var(--ink)] transition-all cursor-pointer text-left"
                  >
                    <Icon name="trash" className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">Ma'lumotlarimni tozalash</span>
                  </button>
                  <button
                    onClick={deleteAccount}
                    className="w-full flex items-center gap-3 rounded-lg border border-[rgba(255,107,94,0.6)] bg-[rgba(255,107,94,0.1)] px-4 py-3 text-[0.82rem] font-bold text-[var(--coral)] hover:bg-[var(--coral)] hover:text-[var(--ink)] transition-all cursor-pointer text-left"
                  >
                    <Icon name="x" className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">Akkauntimni o'chirish</span>
                  </button>
                </div>
              </div>
            </Reveal>

            <Reveal variant="right" delay={180}>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-[rgba(255,154,60,0.1)]" />
                <p className="font-d font-bold text-[0.95rem]">Do'stingizni taklif qiling 🤝</p>
                <p className="mt-2 text-[0.82rem] text-[var(--mut)] leading-relaxed">
                  Bilim ulashilganda ko'payadi. Sayt havolasini do'stingizga yuboring — u ham bepul o'qisin.
                </p>
                <button
                  onClick={() => { navigator.clipboard?.writeText(window.location.origin + window.location.pathname).catch(() => {}); }}
                  className="btn-ghost !py-2.5 !px-4 mt-4 !text-[0.66rem]"
                >
                  HAVOLANI NUSXALASH
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}
