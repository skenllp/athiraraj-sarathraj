import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from "framer-motion";

/* ═══════════════════════════════════════════════════
   CONSTANTS & CONFIGURATION
═══════════════════════════════════════════════════ */
const SITE_URL = "https://athiraraj-sarathraj.vercel.app/";
const MAP_LOCATION_URL = "https://maps.google.com/?q=11.042263,75.858437";
const MAP_EMBED_URL = "https://maps.google.com/maps?q=11.042263,75.858437&hl=en&z=15&output=embed";

const PRELOAD_IMAGES = [
  "/couple1.jpg",
  "/couple2.jpg",
];

/* ═══════════════════════════════════════════════════
   PHOTO LOADER – elegant spinner until images ready
═══════════════════════════════════════════════════ */
function PhotoLoader({ onComplete }: { onComplete: () => void }) {
  const [loaded, setLoaded] = useState(0);
  const total = PRELOAD_IMAGES.length;
  const countRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const fallback = setTimeout(() => {
      if (!doneRef.current) { doneRef.current = true; onComplete(); }
    }, 4500);

    countRef.current = 0;
    PRELOAD_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
      const done = () => {
        countRef.current += 1;
        setLoaded(countRef.current);
        if (countRef.current >= total && !doneRef.current) {
          doneRef.current = true;
          clearTimeout(fallback);
          setTimeout(onComplete, 400);
        }
      };
      img.onload = done;
      img.onerror = done;
    });

    return () => clearTimeout(fallback);
  }, [onComplete]);

  const pct = Math.round((loaded / total) * 100);
  const circumference = 2 * Math.PI * 36;

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg,#fffdf9 0%,#f7f1e8 60%,#ede8df 100%)" }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
    >
      {/* Falling petals behind loader */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-0 pointer-events-none"
          style={{ left: `${i * 12 + 4}%`, width: 10, height: 10 }}
          initial={{ y: -10, opacity: 0.7, rotate: 0 }}
          animate={{ y: "105vh", opacity: [0.7, 0.5, 0], rotate: 360 }}
          transition={{ duration: 5 + i * 0.5, delay: i * 0.3, ease: "linear", repeat: Infinity }}
        >
          <svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="6" ry="11" fill="#D4AF37" fillOpacity="0.45" transform="rotate(30 12 12)" /></svg>
        </motion.div>
      ))}

      <motion.div
        className="text-4xl sm:text-5xl mb-6"
        animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        💍
      </motion.div>

      {/* Circular progress ring */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-5">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#f0e8d8" strokeWidth="5" />
          <motion.circle
            cx="40" cy="40" r="36" fill="none"
            stroke="#D4AF37" strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference - (pct / 100) * circumference }}
            transition={{ duration: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs sm:text-sm font-medium text-[#4F5D2A]">{pct}%</span>
        </div>
      </div>

      <p className="font-serif text-xl sm:text-2xl text-[#4F5D2A] mb-1.5 text-center">Athira Raj &amp; Sarath Raj</p>
      <p className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[#b89a63] text-center">Loading your invitation…</p>

      {/* Bar */}
      <div className="mt-5 w-40 sm:w-48 h-1 rounded-full bg-[#e8ddc8] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#f5e6b0]"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   RIPPLE EFFECT
═══════════════════════════════════════════════════ */
function useRipple() {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const trigger = useCallback((e: React.MouseEvent | React.TouchEvent, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const id = Date.now();
    setRipples((r) => [...r, { x: clientX - rect.left, y: clientY - rect.top, id }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 700);
  }, []);
  return { ripples, trigger };
}

/* ═══════════════════════════════════════════════════
   TILT CARD – 3D tilt on hover / touch
═══════════════════════════════════════════════════ */
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 200, damping: 25 });

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) / rect.width - 0.5;
    const y = (clientY - rect.top) / rect.height - 0.5;
    rotateY.set(x * 10);
    rotateX.set(-y * 10);
  };

  const handleLeave = () => { rotateX.set(0); rotateY.set(0); };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onTouchMove={handleMove}
      onTouchEnd={handleLeave}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   FALLING PETALS & FLOATING HEARTS
═══════════════════════════════════════════════════ */
function Petal({ delay }: { delay: number }) {
  const left = Math.random() * 100;
  const size = 8 + Math.random() * 12;
  const dur = 4.5 + Math.random() * 3.5;
  return (
    <motion.div className="absolute top-0 pointer-events-none"
      style={{ left: `${left}%`, width: size, height: size }}
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{ y: "110vh", opacity: [1, 1, 0], rotate: 360 }}
      transition={{ duration: dur, delay, ease: "linear", repeat: Infinity, repeatDelay: Math.random() * 5 }}
    >
      <svg viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="12" rx="6" ry="11" fill="#D4AF37" fillOpacity="0.5" transform="rotate(30 12 12)" />
      </svg>
    </motion.div>
  );
}

function FloatingHeart({ delay, x }: { delay: number; x: string }) {
  return (
    <motion.div className="absolute bottom-0 text-rose-400/35 text-xl sm:text-2xl pointer-events-none select-none"
      style={{ left: x }}
      initial={{ y: 0, opacity: 0 }}
      animate={{ y: -280, opacity: [0, 0.7, 0] }}
      transition={{ duration: 6, delay, ease: "easeOut", repeat: Infinity, repeatDelay: 3 }}
    >♥</motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   FADE SECTION
═══════════════════════════════════════════════════ */
function FadeSection({ children, className = "", style }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <motion.div className={className} style={style}
      initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >{children}</motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   GOLD ORNAMENT DIVIDER
═══════════════════════════════════════════════════ */
function Ornament() {
  return (
    <div className="flex items-center justify-center gap-2.5 my-5">
      <div className="h-px w-14 sm:w-20 bg-gradient-to-r from-transparent to-[#D4AF37]/60" />
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#D4AF37]">
        <path d="M12 2 L14 9 L21 9 L15.5 13.5 L17.5 21 L12 16.5 L6.5 21 L8.5 13.5 L3 9 L10 9 Z" fill="#D4AF37" fillOpacity="0.75" />
      </svg>
      <div className="h-px w-14 sm:w-20 bg-gradient-to-l from-transparent to-[#D4AF37]/60" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SECTION TITLE with animated underline
═══════════════════════════════════════════════════ */
function SectionTitle({ children, accent = "gold" }: { children: React.ReactNode; accent?: "gold" | "ceremony" | "reception" }) {
  const underline = accent === "ceremony"
    ? "linear-gradient(90deg, transparent, #6B7D3A, #D4AF37, transparent)"
    : accent === "reception"
      ? "linear-gradient(90deg, transparent, #c4717a, #D4AF37, #e8b4b8, transparent)"
      : "linear-gradient(90deg, transparent, #D4AF37, transparent)";
  return (
    <div className="text-center mb-1">
      <motion.h2
        className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#4F5D2A] inline-block cursor-default leading-tight"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      >{children}</motion.h2>
      <motion.div className="h-0.5 mx-auto mt-2.5 rounded-full"
        style={{ background: underline }}
        initial={{ width: 0, opacity: 0 }}
        whileInView={{ width: 120, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   EVENT CARD with theme + ripple + maps link
═══════════════════════════════════════════════════ */
type EventTheme = "ceremony" | "reception";
const eventThemes: Record<EventTheme, { hoverBg: string; hoverBorder: string; hoverShadow: string }> = {
  ceremony: {
    hoverBg: "linear-gradient(135deg,rgba(107,125,58,0.12) 0%,rgba(212,175,55,0.18) 50%,rgba(255,253,249,0.95) 100%)",
    hoverBorder: "rgba(107,125,58,0.6)",
    hoverShadow: "0 20px 45px rgba(107,125,58,0.18)",
  },
  reception: {
    hoverBg: "linear-gradient(135deg,rgba(196,113,122,0.12) 0%,rgba(212,175,55,0.18) 45%,rgba(255,248,245,0.95) 100%)",
    hoverBorder: "rgba(196,113,122,0.55)",
    hoverShadow: "0 20px 45px rgba(196,113,122,0.18)",
  },
};

function EventCard({
  icon,
  title,
  body,
  theme,
  index,
  link,
  linkText,
}: {
  icon: string;
  title: string;
  body: string;
  theme: EventTheme;
  index: number;
  link?: string;
  linkText?: string;
}) {
  const t = eventThemes[theme];
  const ref = useRef<HTMLDivElement>(null);
  const { ripples, trigger } = useRipple();

  const handleCardClick = (e: React.MouseEvent | React.TouchEvent) => {
    trigger(e, ref.current!);
    if (link && !(e.target as HTMLElement).closest("a")) {
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <motion.div
        ref={ref}
        className={`group relative h-full flex flex-col justify-between overflow-hidden rounded-2xl border border-[#D4AF37]/25 bg-white/80 p-6 sm:p-7 text-center shadow-md backdrop-blur-sm ${link ? "cursor-pointer" : "cursor-default"}`}
        whileHover={{ y: -6, scale: 1.02, borderColor: t.hoverBorder, boxShadow: t.hoverShadow }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 280, damping: 20 }}
        onClick={handleCardClick}
        onTouchStart={handleCardClick}
      >
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: t.hoverBg }} />
        <div>
          <motion.span className="relative z-10 mb-2.5 inline-block text-3xl sm:text-4xl"
            whileHover={{ scale: 1.15, rotate: [-5, 5, 0] }}
            transition={{ duration: 0.35 }}
          >{icon}</motion.span>
          <h3 className="relative z-10 mb-1.5 font-serif text-xl sm:text-2xl text-[#4F5D2A]">{title}</h3>
          <p className="relative z-10 text-xs sm:text-sm leading-relaxed text-[#7A7266]">{body}</p>
        </div>
        {link && (
          <div className="relative z-20 mt-4 pt-1">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-wider uppercase bg-[#D4AF37]/15 text-[#4F5D2A] border border-[#D4AF37]/40 hover:bg-[#D4AF37] hover:text-white transition-all duration-300 shadow-sm"
            >
              <span>📍</span>
              <span>{linkText || "Get Directions"}</span>
            </a>
          </div>
        )}
        <div className="absolute bottom-0 left-1/2 h-1 w-0 -translate-x-1/2 rounded-full opacity-0 transition-all duration-300 group-hover:w-[45%] group-hover:opacity-100" style={{ background: t.hoverBorder }} />
        {ripples.map((r) => (
          <motion.span key={r.id}
            className="pointer-events-none absolute rounded-full bg-white/40"
            style={{ left: r.x - 30, top: r.y - 30, width: 60, height: 60 }}
            initial={{ scale: 0, opacity: 0.7 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   AMBIENT GLOW BLOB
═══════════════════════════════════════════════════ */
function AmbientGlow({ colors }: { colors: string }) {
  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-1/2 h-[350px] sm:h-[500px] w-[350px] sm:w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
      style={{ background: colors }}
      animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/* ═══════════════════════════════════════════════════
   COUNTDOWN BOX (Responsive)
═══════════════════════════════════════════════════ */
function CountBox({ value, label }: { value: string | number; label: string }) {
  return (
    <motion.div className="group flex flex-col items-center"
      whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl bg-white/90 backdrop-blur-sm border border-[#D4AF37]/35 shadow-md flex items-center justify-center transition-all duration-300 group-hover:border-[#D4AF37]/70 group-hover:shadow-[0_0_20px_rgba(212,175,55,0.35)]">
        <span className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#4F5D2A] tabular-nums font-semibold">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-1.5 text-[10px] sm:text-xs tracking-widest uppercase text-[#7A7266] font-medium">{label}</span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   MUSIC BUTTON
═══════════════════════════════════════════════════ */
function MusicButton({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <motion.button onClick={onToggle}
      className="fixed bottom-5 right-5 z-50 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 backdrop-blur-sm border border-[#D4AF37]/50 shadow-xl flex items-center justify-center text-[#4F5D2A] active:scale-90 transition-transform cursor-pointer"
      whileHover={{ scale: 1.12, boxShadow: "0 0 20px rgba(212,175,55,0.45)" }}
      whileTap={{ scale: 0.88 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.5, type: "spring" }}
      aria-label={muted ? "Unmute music" : "Mute music"}
    >
      {muted ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════
   SECTION ARROW – mobile scroll guide
═══════════════════════════════════════════════════ */
function SectionArrow({ nextId }: { nextId: string }) {
  const scrollToNext = () => {
    const el = document.getElementById(nextId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="flex justify-center pt-6 pb-1 md:hidden">
      <motion.button
        onClick={scrollToNext}
        aria-label="Scroll to next section"
        className="flex flex-col items-center gap-1 text-[#b89a63] active:scale-90"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        whileTap={{ scale: 0.85 }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </motion.button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
export default function Home() {
  const [imagesReady, setImagesReady] = useState(false);
  const [phase, setPhase] = useState<"typing" | "hold" | "done">("typing");
  const [displayedText, setDisplayedText] = useState("");
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, arrived: false });
  const [muted, setMuted] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [burst, setBurst] = useState<{ id: number; x: number; y: number }[]>([]);
  const [invitationHighlight, setInvitationHighlight] = useState(false);
  const [copied, setCopied] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const invitationRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleImagesLoaded = useCallback(() => setImagesReady(true), []);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroBgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  /* Typing splash */
  useEffect(() => {
    const text = "Our Journey of Love Begins Here";
    let i = 0;
    const type = () => {
      if (i <= text.length) { setDisplayedText(text.slice(0, i)); i++; setTimeout(type, 70); }
      else { setPhase("hold"); setTimeout(() => setPhase("done"), 1200); }
    };
    setTimeout(type, 300);
  }, []);

  /* Music autoplay with fallback */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = 0.35;

    el.muted = false;
    el.play()
      .then(() => setNeedsGesture(false))
      .catch(() => {
        el.muted = true;
        el.play().catch(() => {});
        setNeedsGesture(true);
      });
  }, []);

  useEffect(() => {
    if (!needsGesture) return;
    const unlock = () => {
      const el = audioRef.current;
      if (!el) return;
      el.muted = false;
      if (el.paused) el.play().catch(() => {});
      setNeedsGesture(false);
    };
    document.addEventListener("touchstart", unlock, { once: true, passive: true });
    document.addEventListener("click", unlock, { once: true });
    return () => {
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("click", unlock);
    };
  }, [needsGesture]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.muted = muted;
    if (!muted && el.paused) el.play().catch(() => {});
  }, [muted]);

  /* Countdown timer */
  useEffect(() => {
    const target = new Date("September 13, 2026 07:00:00").getTime();
    const tick = () => {
      const dist = target - Date.now();
      if (dist <= 0) setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, arrived: true });
      else setCountdown({
        days: Math.floor(dist / 86400000),
        hours: Math.floor((dist % 86400000) / 3600000),
        minutes: Math.floor((dist % 3600000) / 60000),
        seconds: Math.floor((dist % 60000) / 1000),
        arrived: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* View invitation button action */
  const handleViewInvitation = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const id = Date.now();
      setBurst([{ id, x: cx, y: cy }]);
      setTimeout(() => setBurst([]), 1200);
    }
    setTimeout(() => {
      invitationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    setTimeout(() => {
      setInvitationHighlight(true);
      setTimeout(() => setInvitationHighlight(false), 2400);
    }, 600);
  }, []);

  /* Copy link handler */
  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(SITE_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    });
  }, []);

  const petals = Array.from({ length: 16 }, (_, i) => i);
  const hearts = ["10%", "25%", "45%", "65%", "85%"];

  return (
    <div className="min-h-screen overflow-x-hidden text-[#4F5D2A]" style={{ background: "linear-gradient(180deg,#fdfbf7 0%,#f8f3eb 100%)" }}>

      <audio ref={audioRef} src="/audio/wedsong.mp3" loop preload="auto" playsInline autoPlay muted />

      {/* ── PHOTO LOADER ── */}
      <AnimatePresence mode="wait">
        {!imagesReady && <PhotoLoader key="loader" onComplete={handleImagesLoaded} />}
      </AnimatePresence>

      {/* ── OPENING SPLASH ── */}
      <AnimatePresence>
        {imagesReady && phase !== "done" && (
          <motion.div
            key="splash"
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden cursor-pointer px-4"
            style={{ background: "linear-gradient(135deg,#fffdf9 0%,#f7f1e8 50%,#ede8df 100%)" }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            {petals.map((i) => <Petal key={i} delay={i * 0.3} />)}
            {hearts.map((x, i) => <FloatingHeart key={i} delay={i * 0.8} x={x} />)}
            <div className="text-center px-4 relative z-10 max-w-lg mx-auto">
              <motion.div className="text-4xl sm:text-5xl mb-5"
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
              >💍</motion.div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif text-[#4F5D2A] min-h-[50px] sm:min-h-[60px] leading-tight">
                {displayedText}
                <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }}
                  className="inline-block w-0.5 h-6 sm:h-8 md:h-10 bg-[#6B7D3A] ml-1 align-middle"
                />
              </h1>
              <motion.p className="mt-3.5 text-xs sm:text-sm tracking-[0.25em] uppercase text-[#7A7266]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: phase === "hold" ? 1 : 0, y: phase === "hold" ? 0 : 10 }}
                transition={{ duration: 0.5 }}
              >Wedding Invitation · Athira Raj &amp; Sarath Raj</motion.p>
              {needsGesture && (
                <motion.div
                  className="mt-6 flex items-center gap-2 justify-center text-xs tracking-widest uppercase text-[#b89a63]"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span>🎵</span><span>Tap anywhere to start music</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: imagesReady && phase === "done" ? 1 : 0 }} transition={{ duration: 0.9 }}>

        {/* ═══════════ HERO SECTION (HIGH VISIBILITY SPOTLIGHT) ═══════════ */}
        <section ref={heroRef} className="relative min-h-screen flex flex-col justify-between items-center px-4 pt-12 pb-10 sm:pt-16 sm:pb-12 overflow-hidden">
          {/* Subtle warm ambient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#fbf8f2] via-[#f7f2e8] to-[#f4ede0]" />
          <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: "radial-gradient(circle, #6B7D3A 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
          
          <AmbientGlow colors="radial-gradient(circle, rgba(212,175,55,0.22) 0%, rgba(107,125,58,0.12) 50%, transparent 75%)" />

          {/* Falling decorative petals */}
          {[...Array(6)].map((_, i) => (
            <Petal key={i} delay={i * 0.7} />
          ))}

          <motion.div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center my-auto" style={{ opacity: heroOpacity }}>
            
            {/* Top Invocation & Tagline */}
            <motion.p className="text-[11px] sm:text-xs md:text-sm tracking-[0.35em] uppercase text-[#b89a63] font-medium mb-3"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
            >
              || Om Shree Ganeshay Namah ||
            </motion.p>

            <motion.p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-[#7A7266] mb-4 sm:mb-6 font-light"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
            >
              We are getting Married
            </motion.p>

            {/* Names Title */}
            <motion.h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif text-[#4F5D2A] leading-tight mb-6 sm:mb-8"
              initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <span>Athira Raj</span>
              <span className="text-[#D4AF37] mx-2.5 sm:mx-4 font-normal">&amp;</span>
              <span>Sarath Raj</span>
            </motion.h1>

            {/* ── CENTRAL COUPLE SPOTLIGHT (CLEAR VISIBILITY ON MOBILE & DESKTOP) ── */}
            <motion.div
              className="relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-[380px] lg:max-w-[420px] mx-auto my-2 group"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{ y: heroBgY }}
            >
              {/* Outer decorative gold frame */}
              <div className="relative rounded-[2rem] p-2 sm:p-2.5 bg-gradient-to-b from-[#e8d7ab] via-[#fdfbf7] to-[#d4af37] shadow-2xl transition-transform duration-500 group-hover:scale-[1.015]">
                {/* Inner shadow & photo wrapper */}
                <div className="relative overflow-hidden rounded-[1.6rem] bg-[#ede5d8] aspect-[3/4] shadow-inner">
                  <img
                    src="/couple2.jpg"
                    alt="Athira Raj & Sarath Raj"
                    className="w-full h-full object-cover object-[center_20%] transition-transform duration-700 group-hover:scale-105"
                    loading="eager"
                  />
                  {/* Subtle edge vignette that keeps center faces 100% bright and clear */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Ornate corner flourishes */}
              <div className="absolute -top-3 -left-3 text-[#D4AF37] text-xl pointer-events-none select-none">✦</div>
              <div className="absolute -top-3 -right-3 text-[#D4AF37] text-xl pointer-events-none select-none">✦</div>
              <div className="absolute -bottom-3 -left-3 text-[#D4AF37] text-xl pointer-events-none select-none">✦</div>
              <div className="absolute -bottom-3 -right-3 text-[#D4AF37] text-xl pointer-events-none select-none">✦</div>
            </motion.div>

            {/* Date & Subtitle */}
            <motion.p className="text-base sm:text-xl md:text-2xl text-[#6B7D3A] font-serif tracking-wider mt-6 sm:mt-7 mb-6"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.7 }}
            >
              Sunday · 13 September 2026
            </motion.p>

            {/* View Invitation Button */}
            <motion.button
              ref={buttonRef}
              onClick={handleViewInvitation}
              className="relative inline-flex items-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-[#D4AF37] text-white font-medium text-xs sm:text-sm tracking-[0.2em] uppercase shadow-lg overflow-hidden group cursor-pointer"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95, duration: 0.6 }}
              whileHover={{ scale: 1.06, boxShadow: "0 0 35px rgba(212,175,55,0.65)" }}
              whileTap={{ scale: 0.92 }}
            >
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.8, ease: "easeInOut" }}
              />
              <span className="relative z-10">View Invitation</span>
              <motion.span className="relative z-10 text-base sm:text-lg"
                animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.25, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >💍</motion.span>
            </motion.button>

          </motion.div>

          {/* Scroll Down Indicator */}
          <motion.div className="relative z-10 mt-6 flex flex-col items-center gap-1.5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
          >
            <motion.div className="w-px h-8 sm:h-10 bg-[#D4AF37]/60"
              animate={{ scaleY: [0, 1, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-[#b89a63] text-[10px] sm:text-xs tracking-widest uppercase font-medium">Scroll</span>
          </motion.div>
        </section>

        {/* ═══════════ COUNTDOWN SECTION ═══════════ */}
        <section id="countdown" className="py-16 sm:py-20 px-4 bg-gradient-to-b from-[#f4ede0] to-[#fcfaf6]">
          <FadeSection className="max-w-3xl mx-auto text-center">
            <p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-[#7A7266] mb-6 sm:mb-8 font-medium">
              {countdown.arrived ? "The wedding day has arrived 💍" : "Counting down to forever"}
            </p>
            {!countdown.arrived && (
              <div className="flex items-start justify-center gap-2.5 sm:gap-5 md:gap-8">
                <CountBox value={countdown.days} label="Days" />
                <span className="text-2xl sm:text-3xl text-[#D4AF37] mt-3 sm:mt-4 font-semibold">:</span>
                <CountBox value={countdown.hours} label="Hours" />
                <span className="text-2xl sm:text-3xl text-[#D4AF37] mt-3 sm:mt-4 font-semibold">:</span>
                <CountBox value={countdown.minutes} label="Mins" />
                <span className="text-2xl sm:text-3xl text-[#D4AF37] mt-3 sm:mt-4 font-semibold">:</span>
                <CountBox value={countdown.seconds} label="Secs" />
              </div>
            )}
          </FadeSection>
          <SectionArrow nextId="invitation" />
        </section>

        {/* ═══════════ INVITATION VERSE SECTION ═══════════ */}
        <section ref={invitationRef} id="invitation" className="py-20 sm:py-24 px-4 relative overflow-hidden">
          <AnimatePresence>
            {invitationHighlight && (
              <motion.div
                className="pointer-events-none absolute inset-0 z-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {[0, 0.15, 0.3].map((delay) => (
                  <motion.div key={delay}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#D4AF37]/60"
                    initial={{ width: 0, height: 0, opacity: 0.9 }}
                    animate={{ width: "140vw", height: "140vw", opacity: 0 }}
                    transition={{ duration: 1.2, delay, ease: "easeOut" }}
                  />
                ))}
                <motion.div
                  className="absolute inset-0 rounded-3xl"
                  style={{ background: "radial-gradient(ellipse at center, rgba(212,175,55,0.18) 0%, transparent 70%)" }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle, #6B7D3A 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
          
          <FadeSection className="max-w-3xl mx-auto relative z-10">
            <SectionTitle accent="gold">Invitation</SectionTitle>
            <Ornament />
            
            <motion.div className="mt-8 sm:mt-10 relative" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <div className="absolute -top-6 -left-3 sm:-left-4 text-7xl sm:text-8xl text-[#D4AF37]/20 font-serif leading-none select-none">"</div>
              <TiltCard>
                <motion.div
                  className="bg-white/80 backdrop-blur-sm border border-[#D4AF37]/25 rounded-3xl p-7 sm:p-12 md:p-14 text-center shadow-lg relative z-10 group cursor-default"
                  animate={invitationHighlight
                    ? { scale: [0.97, 1.02, 1], boxShadow: ["0 0 0px transparent", "0 0 50px rgba(212,175,55,0.45)", "0 15px 40px rgba(107,125,58,0.12)"], borderColor: ["rgba(212,175,55,0.2)", "rgba(212,175,55,0.7)", "rgba(212,175,55,0.3)"] }
                    : {}
                  }
                  whileHover={{ boxShadow: "0 25px 60px rgba(107,125,58,0.15)", borderColor: "rgba(212,175,55,0.45)" }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                >
                  <p className="text-base sm:text-lg md:text-xl text-[#4F5D2A] font-serif leading-relaxed mb-5 sm:mb-6 italic">
                    With hearts entwined in love and souls bound by destiny, we invite you to witness the beginning of our forever and seek the blessings of the Almighty.
                  </p>
                  <Ornament />
                  <p className="text-[#7A7266] text-xs sm:text-sm tracking-widest uppercase mt-3 sm:mt-4 font-medium leading-relaxed">
                    The families of Athira Raj &amp; Sarath Raj joyfully request your gracious presence
                  </p>
                </motion.div>
              </TiltCard>
              <div className="absolute -bottom-6 -right-3 sm:-right-4 text-7xl sm:text-8xl text-[#D4AF37]/20 font-serif leading-none select-none rotate-180">"</div>
            </motion.div>
          </FadeSection>
          <SectionArrow nextId="couple" />
        </section>

        {/* ═══════════ THE COUPLE SECTION (HIGH CLARITY CLOSE-UP SPOTLIGHT) ═══════════ */}
        <section id="couple" className="py-20 sm:py-24 px-4 bg-gradient-to-b from-[#fcfaf6] to-[#f6f1e8]">
          <FadeSection className="max-w-4xl mx-auto text-center">
            <SectionTitle accent="ceremony">The Couple</SectionTitle>
            <Ornament />
            <p className="text-xs sm:text-sm tracking-widest uppercase text-[#7A7266] max-w-lg mx-auto mb-10 sm:mb-12">
              Two lives, two hearts, joined together in friendship, united forever in love
            </p>
          </FadeSection>

          {/* Unified Couple Feature Card */}
          <div className="max-w-4xl mx-auto">
            <FadeSection>
              <div className="overflow-hidden rounded-3xl border border-[#D4AF37]/30 bg-white/85 shadow-xl backdrop-blur-md grid grid-cols-1 md:grid-cols-12 gap-0">
                
                {/* Photo Column */}
                <div className="md:col-span-6 relative aspect-[3/4] md:aspect-auto overflow-hidden bg-[#ede5d8]">
                  <img
                    src="/couple1.jpg"
                    alt="Sarath Raj & Athira Raj"
                    className="w-full h-full object-cover object-[center_28%] transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/35 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 text-white md:hidden">
                    <p className="text-xs tracking-[0.25em] uppercase text-[#D4AF37] font-semibold">Sarath &amp; Athira</p>
                    <p className="font-serif text-lg">Moments of Love</p>
                  </div>
                </div>

                {/* Details Column */}
                <div className="md:col-span-6 p-7 sm:p-10 flex flex-col justify-center text-center md:text-left bg-gradient-to-br from-white/90 to-[#fdfbf7]">
                  
                  {/* Groom Details */}
                  <div className="mb-6 pb-6 border-b border-[#D4AF37]/20">
                    <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-[#b89a63]">The Groom</span>
                    <h3 className="text-2xl sm:text-3xl font-serif text-[#4F5D2A] mt-1 mb-1">Sarath Raj</h3>
                    <p className="text-xs sm:text-sm text-[#7A7266] leading-relaxed">
                      Son of <strong className="text-[#4F5D2A] font-medium">Mr. Rajan TK</strong> &amp; <strong className="text-[#4F5D2A] font-medium">Mrs. Sasikala</strong>
                    </p>
                  </div>

                  {/* Bride Details */}
                  <div className="mb-6">
                    <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-[#b89a63]">The Bride</span>
                    <h3 className="text-2xl sm:text-3xl font-serif text-[#4F5D2A] mt-1 mb-1">Athira Raj</h3>
                    <p className="text-xs sm:text-sm text-[#7A7266] leading-relaxed">
                      Daughter of <strong className="text-[#4F5D2A] font-medium">Mr. Rajan M</strong> &amp; <strong className="text-[#4F5D2A] font-medium">Mrs. Bindhu</strong>
                    </p>
                  </div>

                  {/* Auspicious note */}
                  <div className="pt-2">
                    <p className="text-xs text-[#b89a63] italic font-serif">
                      "Seeking the gracious presence and warm blessings of our loved ones"
                    </p>
                  </div>

                </div>

              </div>
            </FadeSection>
          </div>

          <SectionArrow nextId="events" />
        </section>

        {/* ═══════════ WEDDING CEREMONY SECTION ═══════════ */}
        <section id="events" className="relative overflow-hidden py-20 sm:py-24 px-4 bg-gradient-to-b from-[#f6f1e8] to-[#fdfbf7]">
          <AmbientGlow colors="radial-gradient(circle, rgba(107,125,58,0.15) 0%, transparent 70%)" />
          <FadeSection className="relative z-10">
            <SectionTitle accent="ceremony">Wedding Ceremony</SectionTitle>
            <Ornament />
          </FadeSection>
          <div className="relative z-10 mx-auto mt-10 sm:mt-12 grid max-w-4xl gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2">
            {[
              { icon: "📅", title: "Date", body: "13 September 2026 · Sunday" },
              { icon: "✨", title: "Muhurtham", body: "07:00 AM – 08:00 AM" },
              { icon: "🛕", title: "Venue", body: "Wedding Venue", link: MAP_LOCATION_URL, linkText: "Get Directions 📍" },
              { icon: "🍽️", title: "Lunch", body: "Traditional Sadhya Feast to follow" },
            ].map((item, i) => (
              <EventCard key={item.title} {...item} theme="ceremony" index={i} />
            ))}
          </div>
          <SectionArrow nextId="reception" />
        </section>

        {/* ═══════════ RECEPTION SECTION ═══════════ */}
        <section id="reception" className="relative overflow-hidden py-20 sm:py-24 px-4">
          <AmbientGlow colors="radial-gradient(circle, rgba(196,113,122,0.14) 0%, rgba(212,175,55,0.1) 40%, transparent 70%)" />
          <FadeSection className="relative z-10">
            <SectionTitle accent="reception">Reception</SectionTitle>
            <Ornament />
          </FadeSection>
          <div className="relative z-10 mx-auto mt-10 sm:mt-12 grid max-w-4xl gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-3">
            {[
              { icon: "📅", title: "Date", body: "13 September 2026 · Sunday" },
              { icon: "🕔", title: "Time", body: "5:00 PM – 9:00 PM" },
              { icon: "🏛️", title: "Venue", body: "Reception Hall", link: MAP_LOCATION_URL, linkText: "Get Directions 📍" },
            ].map((item, i) => (
              <EventCard key={item.title} {...item} theme="reception" index={i} />
            ))}
          </div>
          <SectionArrow nextId="location" />
        </section>

        {/* ═══════════ VENUE & LOCATION (GOOGLE MAPS) ═══════════ */}
        <section id="location" className="relative overflow-hidden py-20 sm:py-24 px-4 bg-gradient-to-b from-[#fdfbf7] to-[#f6f1e8]">
          <AmbientGlow colors="radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)" />
          <FadeSection className="relative z-10 max-w-4xl mx-auto text-center">
            <SectionTitle accent="gold">Venue &amp; Location</SectionTitle>
            <Ornament />
            <p className="text-[#7A7266] text-xs sm:text-sm md:text-base max-w-xl mx-auto mb-8 sm:mb-10">
              Join us on our special day. Find directions and route details to the venue below.
            </p>

            <div className="overflow-hidden rounded-3xl border border-[#D4AF37]/30 bg-white/80 shadow-2xl backdrop-blur-md">
              {/* Map embed */}
              <div className="relative w-full h-64 sm:h-80 md:h-96">
                <iframe
                  title="Wedding Venue Location"
                  src={MAP_EMBED_URL}
                  className="w-full h-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Location info bar & direct link button */}
              <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-5 bg-gradient-to-r from-[#fffdfa] via-[#fbf8f2] to-[#fffdfa]">
                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 text-[#4F5D2A] font-serif text-lg sm:text-2xl mb-1">
                    <span>📍</span>
                    <span>Wedding &amp; Reception Venue</span>
                  </div>
                  <p className="text-[#7A7266] text-xs sm:text-sm">
                    Coordinates: <span className="font-mono text-[#4F5D2A] font-medium">11.042263, 75.858437</span>
                  </p>
                </div>

                <a
                  href={MAP_LOCATION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto group relative inline-flex items-center justify-center gap-2.5 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full bg-[#D4AF37] text-white font-medium text-xs sm:text-sm tracking-[0.15em] uppercase shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden cursor-pointer"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span className="relative z-10">Open in Google Maps</span>
                </a>
              </div>
            </div>
          </FadeSection>
          <SectionArrow nextId="share" />
        </section>

        {/* ═══════════ SHARE & INVITATION LINK SECTION ═══════════ */}
        <section id="share" className="py-16 sm:py-20 px-4 bg-gradient-to-b from-[#f6f1e8] to-[#fdfbf7]">
          <FadeSection className="max-w-3xl mx-auto text-center">
            <SectionTitle accent="gold">Share Invitation</SectionTitle>
            <Ornament />
            <p className="text-xs sm:text-sm text-[#7A7266] max-w-lg mx-auto mb-8">
              Share the joy with family &amp; friends
            </p>

            <div className="bg-white/80 backdrop-blur-sm border border-[#D4AF37]/30 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left w-full sm:w-auto">
                <p className="text-[11px] uppercase tracking-widest text-[#b89a63] font-semibold">Official Invitation Link</p>
                <p className="text-sm sm:text-base font-mono text-[#4F5D2A] mt-0.5 truncate max-w-[280px] sm:max-w-none">
                  {SITE_URL}
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
                {/* WhatsApp Share */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent("💍 You are cordially invited to the wedding celebration of Athira Raj & Sarath Raj! View invitation: " + SITE_URL)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] text-white text-xs sm:text-sm font-medium shadow hover:opacity-90 active:scale-95 transition-transform cursor-pointer"
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </a>

                {/* Copy Link Button */}
                <button
                  onClick={handleCopyLink}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#D4AF37] text-white text-xs sm:text-sm font-medium shadow hover:bg-[#c29e2f] active:scale-95 transition-transform cursor-pointer"
                >
                  <span>{copied ? "✓" : "📋"}</span>
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </button>
              </div>
            </div>
          </FadeSection>
        </section>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer className="bg-[#fdfbf7] border-t border-[#D4AF37]/20 py-14 sm:py-16 px-4 text-center">
          <motion.div className="text-3xl sm:text-4xl mb-3"
            animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >💍</motion.div>
          <p className="text-2xl sm:text-3xl font-serif text-[#4F5D2A] mb-2">We look forward to your gracious presence</p>
          <Ornament />
          <p className="text-[#7A7266] tracking-widest text-xs sm:text-sm uppercase mt-3 font-medium">
            Athira Raj &amp; Sarath Raj · 13 September 2026
          </p>
          <p className="text-[11px] text-[#b89a63] mt-2 font-mono">
            athiraraj-sarathraj.vercel.app
          </p>
        </footer>

      </motion.div>

      <MusicButton muted={muted || needsGesture} onToggle={() => {
        if (needsGesture) {
          const el = audioRef.current;
          if (el) { el.muted = false; el.play().catch(() => {}); }
          setNeedsGesture(false);
        } else {
          setMuted((m) => !m);
        }
      }} />

      {/* ── BURST PARTICLES ── */}
      <AnimatePresence>
        {burst.map(({ id, x, y }) => (
          <div key={id} className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => {
              const angle = (i / 20) * 360;
              const dist = 70 + Math.random() * 140;
              const rad = (angle * Math.PI) / 180;
              const tx = Math.cos(rad) * dist;
              const ty = Math.sin(rad) * dist;
              const emojis = ["💍", "✿", "♥", "✨", "🌸", "⭐"];
              const emoji = emojis[i % emojis.length];
              const size = 12 + Math.floor(Math.random() * 12);
              return (
                <motion.div key={i}
                  className="absolute select-none"
                  style={{ left: x, top: y, fontSize: size }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.3 }}
                  animate={{ x: tx, y: ty, opacity: 0, scale: 1.2 }}
                  transition={{ duration: 0.9 + Math.random() * 0.4, ease: "easeOut" }}
                >{emoji}</motion.div>
              );
            })}
            {[0, 0.1, 0.22].map((delay, i) => (
              <motion.div key={i}
                className="absolute rounded-full border-2 border-[#D4AF37]"
                style={{ left: x, top: y, translateX: "-50%", translateY: "-50%" }}
                initial={{ width: 10, height: 10, opacity: 0.9 }}
                animate={{ width: 280 + i * 70, height: 280 + i * 70, opacity: 0 }}
                transition={{ duration: 0.8, delay, ease: "easeOut" }}
              />
            ))}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
