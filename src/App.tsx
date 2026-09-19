import React, { useEffect, useState } from "react";
import { AppProvider, reducedMotion, useApp, setupCSP, setupSecureHeaders, checkSessionTimeout, auditLog } from "./store";
import { Icon } from "./components/ui";
import Home from "./views/Home";
import { CourseCatalog, CourseDetail } from "./views/Courses";
import Assistant from "./views/Assistant";
import Auth from "./views/Auth";
import Dashboard from "./views/Dashboard";
import Admin from "./views/Admin";
import { COURSES } from "./data";

/* ================= LOGO ================= */
function Logo() {
  return (
    <a href="#/" className="flex items-center gap-2.5 group">
      <span className="w-9 h-9 rounded-lg bg-[var(--lime)] flex items-center justify-center transition-transform group-hover:rotate-6">
        <span className="font-d font-black text-[var(--ink)] text-lg leading-none">R</span>
      </span>
      <span className="font-d font-bold text-[0.7rem] sm:text-[0.85rem] tracking-tight leading-none whitespace-nowrap">
        RAZZOQ<span className="text-[var(--lime)]">_</span>ACADEMY
      </span>
    </a>
  );
}

/* ================= NAV ================= */
function Nav() {
  const { route, user, logout, navigate } = useApp();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const active = route.parts[0] ?? "";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [route.path]);

  const links = [
    { to: "/", label: "Bosh sahifa", key: "" },
    { to: "/courses", label: "Kurslar", key: "courses" },
    { to: "/assistant", label: "AI Yordamchi", key: "assistant" },
    { to: "/dashboard", label: "Kabinet", key: "dashboard" },
  ];

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-[rgba(12,18,14,0.86)] backdrop-blur-md border-b border-[var(--line-soft)]" : "bg-transparent border-b border-transparent"}`}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Logo />
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.to}
              href={`#${l.to}`}
              className={`font-d text-[0.68rem] font-semibold tracking-wide px-4 py-2 rounded-lg transition-colors ${
                active === l.key && !(active === "" && l.to !== "/")
                  ? "text-[var(--lime)] bg-[rgba(201,241,88,0.08)]"
                  : "text-[var(--mut)] hover:text-[var(--bone)]"
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <a href="#/dashboard" className="flex items-center gap-2.5 rounded-lg border border-[var(--line)] pl-2 pr-3.5 py-1.5 hover:border-[var(--lime)] transition-colors">
                <span className="w-7 h-7 rounded-md bg-[var(--teal)] text-[var(--ink)] font-d font-bold text-[0.7rem] flex items-center justify-center">
                  {user.name[0]?.toUpperCase()}
                </span>
                <span className="text-[0.78rem] font-semibold max-w-[110px] truncate">{user.name.split(" ")[0]}</span>
                {user.role === "admin" && <Icon name="shield" className="w-3.5 h-3.5 text-[var(--amber)]" />}
              </a>
              {user.role === "admin" && (
                <a href="#/admin" title="Admin panel" className="w-9 h-9 rounded-lg border border-[rgba(255,154,60,0.5)] flex items-center justify-center text-[var(--amber)] hover:bg-[rgba(255,154,60,0.12)] transition-colors">
                  <Icon name="shield" className="w-4 h-4" />
                </a>
              )}
              <button onClick={() => { logout(); navigate("/"); }} aria-label="Chiqish" className="w-9 h-9 rounded-lg border border-[var(--line)] flex items-center justify-center text-[var(--mut)] hover:text-[var(--coral)] hover:border-[var(--coral)] transition-colors cursor-pointer">
                <Icon name="logout" className="w-4 h-4" />
              </button>
            </>
          ) : (
            <a href="#/auth" className="btn-lime !py-2.5 !px-5 !text-[0.68rem]">
              KIRISH <Icon name="arrow" className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden w-10 h-10 rounded-lg border border-[var(--line)] flex items-center justify-center cursor-pointer" aria-label="Menyu">
          <Icon name={open ? "x" : "menu"} className="w-5 h-5" />
        </button>
      </div>
      {/* mobil menyu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 bg-[rgba(12,18,14,0.97)] backdrop-blur-md border-b border-[var(--line-soft)] ${open ? "max-h-96" : "max-h-0"}`}>
        <div className="px-5 py-4 space-y-1.5">
          {links.map((l) => (
            <a key={l.to} href={`#${l.to}`} className={`block font-d text-[0.75rem] font-semibold px-4 py-3 rounded-lg ${active === l.key ? "text-[var(--lime)] bg-[rgba(201,241,88,0.08)]" : "text-[var(--mut)]"}`}>
              {l.label}
            </a>
          ))}
          <div className="pt-2 border-t border-[var(--line-soft)] mt-2">
            {user ? (
              <>
                {user.role === "admin" && (
                  <a href="#/admin" className="flex items-center gap-2 font-d text-[0.75rem] font-semibold px-4 py-3 rounded-lg text-[var(--amber)]">
                    <Icon name="shield" className="w-4 h-4" /> ADMIN PANEL
                  </a>
                )}
                <button onClick={() => { logout(); setOpen(false); navigate("/"); }} className="w-full text-left font-d text-[0.75rem] font-semibold px-4 py-3 rounded-lg text-[var(--coral)] cursor-pointer">
                  CHIQISH — {user.name.split(" ")[0]}
                </button>
              </>
            ) : (
              <a href="#/auth" className="block font-d text-[0.75rem] font-semibold px-4 py-3 rounded-lg bg-[var(--lime)] text-[var(--ink)] text-center">
                KIRISH / RO'YXATDAN O'TISH
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ================= FOOTER ================= */
function Footer() {
  return (
    <footer className="relative border-t border-[var(--line-soft)] bg-[var(--ink2)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-16 pb-8 relative">
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-[0.84rem] text-[var(--mut)] leading-relaxed">
              Sun'iy intellekt bilan ovozli va yozma suhbat orqali bepul ta'lim. Har bir inson o'z bilimi uchun o'zi mas'ul — biz esa eng yaxshi vositalarni beramiz.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { label: "Telegram — @razzoq_academy", href: "https://t.me/razzoq_academy", hover: "var(--sky)", d: "M21.9 4.6c.2-1-.8-1.8-1.7-1.5L2.7 9.9c-1 .4-.9 1.8.1 2.1l4.6 1.4 1.7 5.4c.3 1 1.6 1.2 2.2.4l2.4-3 4.5 3.3c.8.6 1.9.2 2.1-.8l1.6-14.1ZM8.4 13.1l9.2-6.8-7.2 8.1-.3 3-1.7-4.3Z" },
                { label: "Instagram — @razzoq_academy", href: "https://instagram.com/razzoq_academy", hover: "var(--coral)", d: "M12 3.5c2.3 0 2.6 0 3.5.1 2.4.1 3.6 1.3 3.7 3.7 0 .9.1 1.2.1 3.5s0 2.6-.1 3.5c-.1 2.4-1.3 3.6-3.7 3.7-.9 0-1.2.1-3.5.1s-2.6 0-3.5-.1c-2.4-.1-3.6-1.3-3.7-3.7 0-.9-.1-1.2-.1-3.5s0-2.6.1-3.5c.1-2.4 1.3-3.6 3.7-3.7.9-.1 1.2-.1 3.5-.1ZM12 7.6a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8Zm0 1.8a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2Zm4.6-2.9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" },
                { label: "YouTube — @razzoqai", href: "https://youtube.com/@razzoqai", hover: "var(--coral)", d: "M21.6 7.2c-.2-1.3-.9-2-2.2-2.2C17.6 4.7 12 4.7 12 4.7s-5.6 0-7.4.3C3.3 5.2 2.6 5.9 2.4 7.2 2.2 8.9 2.2 12 2.2 12s0 3.1.2 4.8c.2 1.3.9 2 2.2 2.2 1.8.3 7.4.3 7.4.3s5.6 0 7.4-.3c1.3-.2 2-.9 2.2-2.2.2-1.7.2-4.8.2-4.8s0-3.1-.2-4.8ZM10 15.2V8.8l5.5 3.2-5.5 3.2Z" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className="group w-10 h-10 rounded-lg border border-[var(--line)] flex items-center justify-center text-[var(--mut)] hover:-translate-y-1 hover:shadow-lg transition-all"
                  style={{ ["--hover-c" as any]: s.hover }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = s.hover;
                    e.currentTarget.style.borderColor = s.hover;
                    e.currentTarget.style.boxShadow = `0 12px 28px -12px ${s.hover}66`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "";
                    e.currentTarget.style.borderColor = "";
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 transition-transform group-hover:scale-110" fill="currentColor"><path d={s.d} /></svg>
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="font-d font-bold text-[0.72rem] tracking-widest uppercase text-[var(--mut)] mb-5">Kurslar</p>
            <ul className="space-y-2.5">
              {COURSES.map((c) => (
                <li key={c.id}>
                  <a href={`#/course/${c.id}`} className="text-[0.84rem] text-[var(--mut)] hover:text-[var(--lime)] transition-colors inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} /> {c.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-d font-bold text-[0.72rem] tracking-widest uppercase text-[var(--mut)] mb-5">Platforma</p>
            <ul className="space-y-2.5">
              {[
                { to: "#/", t: "Bosh sahifa" },
                { to: "#/courses", t: "Kurslar katalogi" },
                { to: "#/assistant", t: "AI Yordamchi" },
                { to: "#/auth", t: "Ro'yxatdan o'tish" },
                { to: "#/dashboard", t: "Shaxsiy kabinet" },
              ].map((l) => (
                <li key={l.to}>
                  <a href={l.to} className="text-[0.84rem] text-[var(--mut)] hover:text-[var(--lime)] transition-colors">{l.t}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-d font-bold text-[0.72rem] tracking-widest uppercase text-[var(--mut)] mb-5">Aloqa</p>
            <ul className="space-y-3 text-[0.84rem] text-[var(--mut)]">
              <li className="flex items-center gap-2.5"><Icon name="sound" className="w-4 h-4 text-[var(--lime)] shrink-0" /> +998 90 123 45 67</li>
              <li className="flex items-center gap-2.5">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-[var(--lime)] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
                abdurazzoqolimjonov50@gmail.com
              </li>
              <li className="flex items-center gap-2.5"><Icon name="globe" className="w-4 h-4 text-[var(--lime)] shrink-0" /> Andijon, O'zbekiston</li>
              <li className="flex items-center gap-2.5"><Icon name="clock" className="w-4 h-4 text-[var(--lime)] shrink-0" /> AI yordamchi: 24/7</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 select-none overflow-hidden" aria-hidden="true">
          <p className="font-d font-black text-outline leading-[0.98] md:leading-none text-center md:whitespace-nowrap text-[clamp(2.7rem,13.5vw,6rem)] md:text-[clamp(4rem,8.6vw,7rem)]">
            <span className="block md:inline">RAZZOQ</span>{" "}
            <span className="block md:inline">ACADEMY</span>
          </p>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--line-soft)] flex flex-wrap items-center justify-between gap-4 text-[0.72rem] font-mono text-[var(--dim)]">
          <p>© 2026 Razzoq Academy — Barcha kurslar 100% bepul</p>
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--lime)] pulse-dot" /> AI tizim onlayn · bilim hammaga tegishli
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ================= SCROLL PROGRESS ================= */
function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[3px] pointer-events-none" aria-hidden="true">
      <div className="h-full bg-[var(--lime)]" style={{ width: `${p * 100}%`, boxShadow: p > 0 ? "0 0 12px rgba(201,241,88,0.55)" : "none" }} />
    </div>
  );
}

/* ================= BACK TO TOP ================= */
function BackTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 700);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" })}
      aria-label="Yuqoriga qaytish"
      className={`fixed bottom-6 right-6 z-[75] w-11 h-11 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-[var(--lime)] flex items-center justify-center transition-all duration-300 cursor-pointer hover:border-[var(--lime)] hover:-translate-y-1 shadow-lg ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <Icon name="arrow" className="w-5 h-5 -rotate-90" />
    </button>
  );
}

/* ================= TOAST ================= */
function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] toast-in">
      <div className="flex items-center gap-3 rounded-xl border border-[var(--lime)] bg-[var(--surface)] px-5 py-3.5 shadow-[0_20px_60px_-15px_rgba(201,241,88,0.35)]">
        <span className="w-6 h-6 rounded-md bg-[var(--lime)] flex items-center justify-center shrink-0">
          <Icon name="check" className="w-3.5 h-3.5 text-[var(--ink)]" />
        </span>
        <p className="text-[0.84rem] font-semibold whitespace-nowrap">{toast}</p>
      </div>
    </div>
  );
}

/* ================= ROUTER ================= */
function Router() {
  const { route } = useApp();
  const [page] = route.parts;
  switch (page) {
    case "courses":
      return <CourseCatalog />;
    case "course":
      return <CourseDetail id={route.parts[1] ?? ""} />;
    case "assistant":
      return <Assistant />;
    case "auth":
      return <Auth />;
    case "dashboard":
      return <Dashboard />;
    case "admin":
      return <Admin />;
    default:
      return <Home />;
  }
}

export default function App() {
  // Xavfsizlik tizimini ishga tushirish
  useEffect(() => {
    setupCSP();
    setupSecureHeaders();
    auditLog('app_initialized');
    
    // Session timeout tekshiruvi (har 60 soniyada)
    const interval = setInterval(() => {
      if (checkSessionTimeout()) {
        window.location.hash = '#/auth';
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <AppProvider>
      <div className="min-h-screen bg-[var(--ink)] text-[var(--bone)]">
        <div className="noise-layer" aria-hidden="true" />
        <ScrollProgress />
        <Nav />
        <main className="pt-16">
          <Router />
        </main>
        <Footer />
        <Toast />
        <BackTop />
      </div>
    </AppProvider>
  );
}
