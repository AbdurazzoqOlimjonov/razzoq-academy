import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

/* ================= KIBERXAVFSIZLIK - 2000TB HIMOYA TIZIMI ================= */

/* Admin email — bu email bilan ro'yxatdan o'tgan akkaunt avtomatik admin bo'ladi */
export const ADMIN_EMAIL = "abdurazzoqolimjonov50@gmail.com";

/* CSRF Token generator */
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/* XSS himoyasi - input'larni tozalash */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // HTML teglarini o'chirish
    .replace(/javascript:/gi, '') // JavaScript kodini o'chirish
    .replace(/on\w+=/gi, '') // Event handler'larni o'chirish
    .trim();
};

/* Parol kuchi tekshiruvi */
export const validatePasswordStrength = (password: string): { valid: boolean; message: string } => {
  if (password.length < 6) return { valid: false, message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" };
  if (!/[0-9]/.test(password)) return { valid: false, message: "Parolda kamida 1 ta raqam bo'lishi kerak" };
  return { valid: true, message: "Parol to'g'ri!" };
};

/* Audit log - barcha harakatlarni yozib borish */
export const auditLog = (action: string, userId?: string, details?: string) => {
  const log = {
    timestamp: new Date().toISOString(),
    action,
    userId: userId || 'anonymous',
    details: details || '',
    ip: 'client-side',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  };
  
  try {
    const logs = JSON.parse(localStorage.getItem('razzoq_audit_logs') || '[]');
    logs.push(log);
    // Faqat oxirgi 1000 ta logni saqlash
    if (logs.length > 1000) logs.splice(0, logs.length - 1000);
    localStorage.setItem('razzoq_audit_logs', JSON.stringify(logs));
  } catch (e) {
    console.error('Audit log xatosi:', e);
  }
};

/* Session timeout - 30 daqiqadan keyin avtomatik chiqish */
export const checkSessionTimeout = () => {
  const lastActivity = localStorage.getItem('razzoq_last_activity');
  if (lastActivity) {
    const now = Date.now();
    const last = parseInt(lastActivity);
    const timeout = 30 * 60 * 1000; // 30 daqiqa
    
    if (now - last > timeout) {
      localStorage.removeItem('razzoq_session');
      localStorage.removeItem('razzoq_last_activity');
      auditLog('session_timeout');
      return true; // Sessiya tugagan
    }
  }
  localStorage.setItem('razzoq_last_activity', Date.now().toString());
  return false; // Sessiya hali faol
};

/* Ma'lumotlarni shifrlash (base64 + XOR) */
export const encryptData = (data: string, key: string = 'razzoq_academy_2026'): string => {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(result);
};

export const decryptData = (encrypted: string, key: string = 'razzoq_academy_2026'): string => {
  try {
    const decoded = atob(encrypted);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch {
    return '';
  }
};

/* Content Security Policy */
export const setupCSP = () => {
  if (typeof document !== 'undefined') {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; frame-src https://www.youtube.com https://youtube.com https://player.vimeo.com https://www.dailymotion.com;";
    document.head.appendChild(meta);
  }
};

/* Secure Headers */
export const setupSecureHeaders = () => {
  if (typeof document !== 'undefined') {
    // X-Content-Type-Options
    const contentType = document.createElement('meta');
    contentType.httpEquiv = 'X-Content-Type-Options';
    contentType.content = 'nosniff';
    document.head.appendChild(contentType);
    
    // Referrer-Policy
    const referrer = document.createElement('meta');
    referrer.httpEquiv = 'Referrer-Policy';
    referrer.content = 'strict-origin-when-cross-origin';
    document.head.appendChild(referrer);
    
    // X-Frame-Options olib tashlandi - YouTube/Vimeo iframe'lar uchun kerak
  }
};

/* Parolni SHA-256 bilan xeshlash (brauzer crypto API, fallback — FNV hash) */
export const hashPassword = async (pass: string): Promise<string> => {
  const input = `razzoq::${pass}::academy@2026`;
  try {
    if (window.crypto?.subtle) {
      const buf = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    /* fall through to fallback */
  }
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x85ebca6b);
  }
  return `fnv_${(h1 >>> 0).toString(16)}_${(h2 >>> 0).toString(16)}`;
};

const MAX_ATTEMPTS = 5;
const LOCK_MS = 60_000;

export interface User {
  id: string;
  name: string;
  email: string;
  pass?: string; // eski ochiq parol (migratsiya uchun, keyin o'chiriladi)
  passHash?: string; // SHA-256 xesh
  role: "admin" | "user";
  joined: string;
  lastActive?: string;
  attempts?: number;
  lockedUntil?: number;
  csrfToken?: string; // CSRF himoyasi uchun
}

export interface RouteState {
  path: string;
  parts: string[];
}

export interface Msg {
  role: "user" | "ai";
  text: string;
  t: number;
}

export interface ProgressMap {
  [courseId: string]: { enrolledAt: string; done: string[] };
}

interface VideoMap {
  [lessonId: string]: string;
}

/* Admin qo'shgan maxsus kurslar */
export interface CustomLesson {
  id: string;
  title: string;
  dur: number;
  type: "Video" | "Amaliyot" | "Jonli" | "Test";
}

export interface CustomCourse {
  id: string;
  title: string;
  desc: string;
  color: string;
  lessons: CustomLesson[];
  createdAt: string;
  duration?: number; // umumiy davomiylik (daqiqa)
}

interface CustomCoursesMap {
  [courseId: string]: CustomCourse;
}

interface AppCtx {
  route: RouteState;
  navigate: (hash: string) => void;
  user: User | null;
  users: User[];
  register: (name: string, email: string, pass: string) => Promise<string | null>;
  login: (email: string, pass: string) => Promise<string | null>;
  logout: () => void;
  progress: ProgressMap;
  enroll: (courseId: string) => void;
  toggleLesson: (courseId: string, lessonId: string) => void;
  videoLinks: VideoMap;
  setVideoLink: (lessonId: string, url: string) => void;
  removeVideoLink: (lessonId: string) => void;
  chatLog: Msg[];
  pushChat: (m: Msg) => void;
  clearChat: () => void;
  toast: string | null;
  showToast: (t: string) => void;
  /* admin amallari */
  deleteUser: (id: string) => void;
  setUserRole: (id: string, role: "admin" | "user") => void;
  deleteMyAccount: () => void;
  customCourses: CustomCoursesMap;
  addCustomCourse: (course: CustomCourse) => void;
  removeCustomCourse: (courseId: string) => void;
  updateCustomCourse: (courseId: string, updates: Partial<CustomCourse>) => void;
  addLessonToCourse: (courseId: string, lesson: CustomLesson) => void;
  removeLessonFromCourse: (courseId: string, lessonId: string) => void;
  updateLessonInCourse: (courseId: string, lessonId: string, updates: Partial<CustomLesson>) => void;
  /* AI sozlamalari */
  aiConfig: { provider: "gemini" | "qwen" | "local"; apiKey: string };
  setAiConfig: (config: { provider: "gemini" | "qwen" | "local"; apiKey: string }) => void;
}

const Ctx = createContext<AppCtx | null>(null);

const parseHash = (): RouteState => {
  const h = window.location.hash.replace(/^#\/?/, "");
  const parts = h.split("/").filter(Boolean).map((p) => decodeURIComponent(p));
  return { path: h, parts };
};

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const save = (key: string, val: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* ignore */
  }
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState<RouteState>(parseHash);
  const [users, setUsers] = useState<User[]>(() => load("razzoq_users", [] as User[]));
  const [userId, setUserId] = useState<string | null>(() => load<string | null>("razzoq_session", null));
  const [progress, setProgress] = useState<ProgressMap>({});
  const [chatLog, setChatLog] = useState<Msg[]>([]);
  const [videoLinks, setVideoLinks] = useState<VideoMap>(() => load("razzoq_videos", {} as VideoMap));
  const [customCourses, setCustomCourses] = useState<CustomCoursesMap>(() => load("razzoq_custom_courses", {} as CustomCoursesMap));
  const [aiConfig, setAiConfig] = useState<{ provider: "gemini" | "qwen" | "local"; apiKey: string }>(() => 
    load("razzoq_ai_config", { provider: "local", apiKey: "" })
  );
  const [toast, setToast] = useState<string | null>(null);

  /* ---- routing ---- */
  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback((hash: string) => {
    const target = hash.startsWith("#") ? hash : `#${hash}`;
    if (window.location.hash === target) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.location.hash = target;
    }
  }, []);

  /* ---- session & per-user data ---- */
  const user = users.find((u) => u.id === userId) ?? null;

  useEffect(() => {
    save("razzoq_users", users);
  }, [users]);

  useEffect(() => {
    save("razzoq_session", userId);
    if (userId) {
      setProgress(load(`razzoq_prog_${userId}`, {} as ProgressMap));
      setChatLog(load(`razzoq_chat_${userId}`, [] as Msg[]));
    } else {
      setProgress(load("razzoq_prog_guest", {} as ProgressMap));
      setChatLog(load("razzoq_chat_guest", [] as Msg[]));
    }
  }, [userId]);

  useEffect(() => {
    save(user ? `razzoq_prog_${user.id}` : "razzoq_prog_guest", progress);
  }, [progress, user]);

  useEffect(() => {
    save(user ? `razzoq_chat_${user.id}` : "razzoq_chat_guest", chatLog);
  }, [chatLog, user]);

  useEffect(() => {
    // Barcha videolarni localStorage'ga saqlash (blob URL'lardan tashqari)
    const linksToSave: VideoMap = {};
    
    Object.entries(videoLinks).forEach(([id, url]) => {
      // blob URL'lar saqlanmaydi (ular sahifa yangilanganda yo'qoladi)
      if (!url.startsWith("blob:")) {
        linksToSave[id] = url;
      }
    });
    
    // localStorage'ga saqlash
    save("razzoq_videos", linksToSave);
  }, [videoLinks]);

  useEffect(() => {
    save("razzoq_custom_courses", customCourses);
  }, [customCourses]);

  useEffect(() => {
    save("razzoq_ai_config", aiConfig);
  }, [aiConfig]);

  /* oxirgi faollikni yozib qo'yish */
  useEffect(() => {
    if (!userId) return;
    setUsers((p) => p.map((u) => (u.id === userId ? { ...u, lastActive: new Date().toISOString() } : u)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /* ---- auth ---- */
  const register = useCallback(
    async (name: string, email: string, pass: string): Promise<string | null> => {
      // XSS himoyasi - input'larni tozalash
      const cleanName = sanitizeInput(name);
      const cleanEmail = sanitizeInput(email);
      
      // Parol kuchi tekshiruvi
      const passCheck = validatePasswordStrength(pass);
      if (!passCheck.valid) return passCheck.message;
      
      const em = cleanEmail.trim().toLowerCase();
      if (users.some((u) => u.email === em))
        return "Bu email bilan akkaunt allaqachon mavjud. Kirish bo'limidan foydalaning.";
      
      // Admin email bilan ro'yxatdan o'tgan akkaunt avtomatik admin bo'ladi
      const isAdmin = em === ADMIN_EMAIL.toLowerCase();
      const passHash = await hashPassword(pass);
      
      // CSRF token yaratish
      const csrfToken = generateCSRFToken();
      
      const nu: User = {
        id: `u_${Date.now()}`,
        name: cleanName,
        email: em,
        passHash,
        role: isAdmin ? "admin" : "user",
        joined: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        csrfToken,
      };
      
      setUsers((p) => [...p, nu]);
      setUserId(nu.id);
      
      // Audit log
      auditLog('user_registered', nu.id, `Email: ${em}, Role: ${nu.role}`);
      
      // Session timeout boshlash
      localStorage.setItem('razzoq_last_activity', Date.now().toString());
      
      return null;
    },
    [users]
  );

  const login = useCallback(
    async (email: string, pass: string): Promise<string | null> => {
      // XSS himoyasi
      const cleanEmail = sanitizeInput(email);
      const em = cleanEmail.trim().toLowerCase();
      
      const found = users.find((u) => u.email === em);
      if (!found) {
        auditLog('login_failed', undefined, `Email not found: ${em}`);
        return "Bunday email topilmadi. Avval ro'yxatdan o'ting.";
      }

      /* brute-force himoyasi */
      if (found.lockedUntil && Date.now() < found.lockedUntil) {
        const sec = Math.ceil((found.lockedUntil - Date.now()) / 1000);
        auditLog('login_blocked', found.id, `Account locked, ${sec}s remaining`);
        return `Juda ko'p urinish! ${sec} soniyadan keyin qayta urinib ko'ring.`;
      }

      const incoming = await hashPassword(pass);
      /* eski ochiq parolni migratsiya qilish */
      const ok = found.passHash ? found.passHash === incoming : found.pass === pass;

      if (!ok) {
        const attempts = (found.attempts ?? 0) + 1;
        const lock = attempts >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : undefined;
        setUsers((p) => p.map((u) => (u.id === found.id ? { ...u, attempts, lockedUntil: lock } : u)));
        
        auditLog('login_wrong_password', found.id, `Attempt ${attempts}/${MAX_ATTEMPTS}`);
        
        if (lock) return `Parol ${MAX_ATTEMPTS} marta noto'g'ri kiritildi. Hisob 60 soniyaga bloklandi.`;
        return `Parol noto'g'ri. Yana ${MAX_ATTEMPTS - attempts} urinish qoldi.`;
      }

      /* muvaffaqiyat: urinishlarni tozalash + eski parolni xeshga almashtirish */
      setUsers((p) =>
        p.map((u) =>
          u.id === found.id
            ? { ...u, attempts: 0, lockedUntil: undefined, passHash: incoming, pass: undefined, lastActive: new Date().toISOString() }
            : u
        )
      );
      setUserId(found.id);
      
      // Session timeout boshlash
      localStorage.setItem('razzoq_last_activity', Date.now().toString());
      
      // Audit log
      auditLog('login_success', found.id, `Email: ${em}`);
      
      return null;
    },
    [users]
  );

  const logout = useCallback(() => {
    setUserId(null);
    setToast("Tizimdan chiqdingiz. Xayr!");
  }, []);

  /* ---- admin amallari ---- */
  const deleteUser = useCallback((id: string) => {
    setUsers((p) => p.filter((u) => u.id !== id));
    try {
      localStorage.removeItem(`razzoq_prog_${id}`);
      localStorage.removeItem(`razzoq_chat_${id}`);
    } catch {
      /* ignore */
    }
  }, []);

  const setUserRole = useCallback((id: string, role: "admin" | "user") => {
    setUsers((p) => p.map((u) => (u.id === id ? { ...u, role } : u)));
  }, []);

  const deleteMyAccount = useCallback(() => {
    if (!userId) return;
    // Foydalanuvchini o'chirish
    setUsers((p) => p.filter((u) => u.id !== userId));
    // Sessionni tozalash
    setUserId(null);
    // Ma'lumotlarni tozalash
    try {
      localStorage.removeItem(`razzoq_prog_${userId}`);
      localStorage.removeItem(`razzoq_chat_${userId}`);
      localStorage.removeItem("razzoq_session");
    } catch {
      /* ignore */
    }
    setToast("Akkauntingiz to'liq o'chirildi");
  }, [userId]);

  /* ---- progress ---- */
  const enroll = useCallback((courseId: string) => {
    setProgress((p) =>
      p[courseId] ? p : { ...p, [courseId]: { enrolledAt: new Date().toISOString(), done: [] } }
    );
  }, []);

  const toggleLesson = useCallback((courseId: string, lessonId: string) => {
    setProgress((p) => {
      const cur = p[courseId];
      if (!cur) return p;
      const done = cur.done.includes(lessonId) ? cur.done.filter((d) => d !== lessonId) : [...cur.done, lessonId];
      return { ...p, [courseId]: { ...cur, done } };
    });
  }, []);

  /* ---- chat ---- */
  const pushChat = useCallback((m: Msg) => setChatLog((p) => [...p, m]), []);
  const clearChat = useCallback(() => setChatLog([]), []);

  /* ---- video havolalar ---- */
  const setVideoLink = useCallback((lessonId: string, url: string) => {
    setVideoLinks((p) => ({ ...p, [lessonId]: url }));
  }, []);
  const removeVideoLink = useCallback((lessonId: string) => {
    setVideoLinks((p) => {
      const n = { ...p };
      delete n[lessonId];
      return n;
    });
  }, []);

  /* ---- custom courses (admin qo'shgan) ---- */
  const addCustomCourse = useCallback((course: CustomCourse) => {
    setCustomCourses((p) => ({ ...p, [course.id]: course }));
  }, []);

  const removeCustomCourse = useCallback((courseId: string) => {
    setCustomCourses((p) => {
      const n = { ...p };
      delete n[courseId];
      return n;
    });
    // videolarni ham tozalash
    setVideoLinks((p) => {
      const n = { ...p };
      Object.keys(n).forEach((k) => {
        if (k.startsWith(`${courseId}_`)) delete n[k];
      });
      return n;
    });
  }, []);

  const updateCustomCourse = useCallback((courseId: string, updates: Partial<CustomCourse>) => {
    setCustomCourses((p) => {
      const course = p[courseId];
      if (!course) return p;
      return { ...p, [courseId]: { ...course, ...updates } };
    });
  }, []);

  const addLessonToCourse = useCallback((courseId: string, lesson: CustomLesson) => {
    setCustomCourses((p) => {
      const c = p[courseId];
      if (!c) {
        // Agar kurs customCourses da yo'q bo'lsa, yangi kurs yaratish
        return { ...p, [courseId]: { id: courseId, title: courseId, desc: "", color: "#C9F158", lessons: [lesson], createdAt: new Date().toISOString() } };
      }
      return { ...p, [courseId]: { ...c, lessons: [...c.lessons, lesson] } };
    });
  }, []);

  const removeLessonFromCourse = useCallback((courseId: string, lessonId: string) => {
    setCustomCourses((p) => {
      const c = p[courseId];
      if (!c) return p;
      return { ...p, [courseId]: { ...c, lessons: c.lessons.filter((l) => l.id !== lessonId) } };
    });
    // video havolasini ham o'chirish
    setVideoLinks((p) => {
      const n = { ...p };
      delete n[lessonId];
      return n;
    });
  }, []);

  const updateLessonInCourse = useCallback((courseId: string, lessonId: string, updates: Partial<CustomLesson>) => {
    setCustomCourses((p) => {
      const c = p[courseId];
      if (!c) return p;
      return {
        ...p,
        [courseId]: {
          ...c,
          lessons: c.lessons.map((l) => (l.id === lessonId ? { ...l, ...updates } : l)),
        },
      };
    });
  }, []);

  /* ---- toast ---- */
  const showToast = useCallback((t: string) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  return (
    <Ctx.Provider
      value={{
        route, navigate, user, users, register, login, logout,
        progress, enroll, toggleLesson, videoLinks, setVideoLink, removeVideoLink,
        chatLog, pushChat, clearChat, toast, showToast, deleteUser, setUserRole, deleteMyAccount,
        customCourses, addCustomCourse, removeCustomCourse, updateCustomCourse, addLessonToCourse, removeLessonFromCourse, updateLessonInCourse,
        aiConfig, setAiConfig,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): AppCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
