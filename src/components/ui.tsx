import React, { useEffect, useRef, useState } from "react";
import { reducedMotion } from "../store";

/* ================= custom inline icons ================= */

const paths: Record<string, React.ReactNode> = {
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3M8.5 21h7" />
    </>
  ),
  send: (
    <>
      <path d="M4 12 20 4l-4.5 16-4-6.5L4 12Z" />
      <path d="m11.5 13.5 3.5-3.5" />
    </>
  ),
  play: <path d="M8 5.5v13l11-6.5L8 5.5Z" />,
  check: <path d="m4.5 12.5 5 5L19.5 7" />,
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
      <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
    </>
  ),
  code: (
    <>
      <path d="m8 8-5 4 5 4" />
      <path d="m16 8 5 4-5 4" />
      <path d="m13.5 5-3 14" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.8 2.4 4 5.2 4 8.5s-1.2 6.1-4 8.5c-2.8-2.4-4-5.2-4-8.5s1.2-6.1 4-8.5Z" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M12 8.5 13.4 11l2.6 1-2.6 1L12 15.5 10.6 13 8 12l2.6-1L12 8.5Z" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="m7.5 14.5 3.5-4 3 2.5 4.5-6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
    </>
  ),
  arrow: (
    <>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.5l3.5 2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="9" r="3.5" />
      <path d="M2.8 19.5c1-3 3.2-4.7 6.2-4.7s5.2 1.7 6.2 4.7" />
      <path d="M15.5 5.8a3.5 3.5 0 0 1 0 6.4M17.5 15c2 .7 3.3 2.2 3.8 4.5" />
    </>
  ),
  logout: (
    <>
      <path d="M14 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H14" />
      <path d="m16 8 4 4-4 4M20 12H9.5" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  bolt: <path d="M13 3 5 13.5h5.5L11 21l8-10.5h-5.5L13 3Z" />,
  award: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="m8.5 13.5-2 7 5.5-3 5.5 3-2-7" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.5 0 2.2-.9 2.2-2 0-1.4-1.2-1.8-1.2-3 0-1.2 1-2 2.4-2H17a3.5 3.5 0 0 0 3.5-3.5c0-3.5-4-6.5-8.5-6.5Z" />
      <circle cx="8" cy="10" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="10" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  mega: (
    <>
      <path d="M3.5 10.5v3A1.5 1.5 0 0 0 5 15h1.5l3 4h2v-4.5" />
      <path d="M3.5 10.5C8 10 14 6.5 19 4v16c-5-2.5-11-6-15.5-6.5" />
    </>
  ),
  brain: (
    <>
      <path d="M9.5 4A2.7 2.7 0 0 0 6.8 6.7 3.2 3.2 0 0 0 4 9.9c0 .8.3 1.6.8 2.1A3.4 3.4 0 0 0 4 14.2 3.3 3.3 0 0 0 7.3 17.5c.2 1.5 1.4 2.7 3 2.7 1 0 1.7-.4 1.7-.4V6.7S11.3 4 9.5 4Z" />
      <path d="M14.5 4a2.7 2.7 0 0 1 2.7 2.7A3.2 3.2 0 0 1 20 9.9c0 .8-.3 1.6-.8 2.1.5.6.8 1.4.8 2.2a3.3 3.3 0 0 1-3.3 3.3c-.2 1.5-1.4 2.7-3 2.7-1 0-1.7-.4-1.7-.4V6.7S12.7 4 14.5 4Z" />
    </>
  ),
  cap: (
    <>
      <path d="m12 4 10 4.5L12 13 2 8.5 12 4Z" />
      <path d="M6.5 10.8V16c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3v-5.2" />
      <path d="M22 8.5V14" />
    </>
  ),
  sound: (
    <>
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" />
    </>
  ),
  soundOff: (
    <>
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" />
      <path d="m16 9.5 5 5M21 9.5l-5 5" />
    </>
  ),
  trash: (
    <>
      <path d="M5 7h14M10 7V5h4v2M6.5 7l1 13h9l1-13" />
      <path d="M10 11v5.5M14 11v5.5" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.8" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  plus: <path d="M12 5v14M5 12h14" />,
  film: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 5v14M17 5v14M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4.2 4.2 0 0 0 6.1.4l2.6-2.6a4.2 4.2 0 1 0-6-6L11.4 7.2" />
      <path d="M14 10a4.2 4.2 0 0 0-6.1-.4l-2.6 2.6a4.2 4.2 0 1 0 6 6l1.4-1.4" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11" />
      <path d="m7 11 5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 5.5v5.2c0 4.4 2.9 7.6 7 9.3 4.1-1.7 7-4.9 7-9.3V5.5L12 3Z" />
      <path d="m9 11.5 2.2 2.2L15.5 9" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5.5" rx="7" ry="2.8" />
      <path d="M5 5.5v13c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-13" />
      <path d="M5 12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  quote: <path d="M5 13c0-4 2.5-7 6-8l.8 1.6C9.6 7.7 8.5 9.4 8.4 11H11v6H5v-4Zm9 0c0-4 2.5-7 6-8l.8 1.6c-2.2 1.1-3.3 2.8-3.4 4.4H20v6h-6v-4Z" />,
};

export function Icon({ name, className = "w-5 h-5" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {paths[name] ?? paths.spark}
    </svg>
  );
}

/* ================= scramble text ================= */

const GLYPHS = "▚▞▟░▒#<>/{}[]*+=RZQAI01";

export function Scramble({ text, delay = 0, className = "" }: { text: string; delay?: number; className?: string }) {
  const [out, setOut] = useState(() => (reducedMotion() ? text : "\u00A0"));
  useEffect(() => {
    if (reducedMotion()) {
      setOut(text);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const per = 46; // ms per char
    const tick = (ts: number) => {
      if (start === null) start = ts + delay;
      const el = ts - start;
      if (el < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const solved = Math.floor(el / per);
      if (solved >= text.length) {
        setOut(text);
        return;
      }
      let s = text.slice(0, solved);
      for (let i = solved; i < text.length; i++) {
        s += text[i] === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      setOut(s);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, delay]);
  return <span className={className}>{out}</span>;
}

/* ================= reveal on scroll ================= */

export function Reveal({
  children, className = "", delay = 0, variant = "", as: Tag = "div",
}: {
  children: React.ReactNode; className?: string; delay?: number; variant?: "left" | "right" | "scale" | ""; as?: any;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (setInView(true), io.disconnect())),
      // threshold: 0 — juda baland bloklar (mas. 89 darslik Front-End) ham
      // ekranga kirishi bilan ko'rinsin (0.12 baland elementlarda ishlamasdi)
      { threshold: 0, rootMargin: "0px 0px -30px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const v = variant === "left" ? "rv-left" : variant === "right" ? "rv-right" : variant === "scale" ? "rv-scale" : "";
  return (
    <Tag ref={ref} className={`rv ${v} ${inView ? "is-in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

/* ================= animated counter ================= */

export function Counter({ to, suffix = "", prefix = "" }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(reducedMotion() ? to : 0);
  useEffect(() => {
    if (reducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const dur = 1400;
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          const e = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(to * e));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return (
    <span ref={ref}>
      {prefix}
      {val.toLocaleString("en-US").replace(/,/g, " ")}
      {suffix}
    </span>
  );
}

/* ================= marquee ================= */

export function Marquee({ items }: { items: string[] }) {
  const row = (key: string) => (
    <div key={key} className="flex items-center shrink-0" aria-hidden={key === "b"}>
      {items.map((it, i) => (
        <span key={i} className="flex items-center">
          <span className="font-d text-sm font-medium tracking-wide px-6 py-4 whitespace-nowrap text-[var(--mut)]">
            {it}
          </span>
          <svg viewBox="0 0 8 8" className="w-2 h-2 text-[var(--lime)]"><circle cx="4" cy="4" r="3" fill="currentColor" /></svg>
        </span>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden border-y border-[var(--line-soft)] bg-[var(--ink2)]">
      <div className="marquee-track flex w-max">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}

/* ================= waveform ================= */

export function Wave({ active, bars = 18, color = "var(--lime)", className = "" }: { active: boolean; bars?: number; color?: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-[3px] ${className}`} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full ${active ? "wave-bar" : ""}`}
          style={{
            height: active ? `${10 + ((i * 7) % 18)}px` : "4px",
            background: color,
            animationDelay: `${(i % 7) * 0.09}s`,
            transition: "height .3s ease",
          }}
        />
      ))}
    </div>
  );
}

/* ================= section kicker ================= */

export function Kicker({ children, color = "var(--lime)" }: { children: React.ReactNode; color?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="w-8 h-[2px]" style={{ background: color }} />
      <span className="font-d text-[0.65rem] font-semibold tracking-[0.28em] uppercase" style={{ color }}>
        {children}
      </span>
    </div>
  );
}
