// Beautiful custom SVG illustrations for empty states and decorative sections

export function EmptyCoursesIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background circles */}
      <circle cx="160" cy="110" r="90" fill="hsl(355 78% 48% / 0.04)" />
      <circle cx="160" cy="110" r="65" fill="hsl(355 78% 48% / 0.05)" />

      {/* Stack of books */}
      {/* Bottom book */}
      <rect x="80" y="140" width="160" height="22" rx="6" fill="hsl(355 78% 48% / 0.12)" />
      <rect x="80" y="140" width="18" height="22" rx="3" fill="hsl(355 78% 48% / 0.3)" />
      <rect x="102" y="144" width="50" height="3" rx="1.5" fill="hsl(355 78% 48% / 0.2)" />
      <rect x="102" y="151" width="36" height="3" rx="1.5" fill="hsl(355 78% 48% / 0.15)" />

      {/* Middle book */}
      <rect x="88" y="116" width="144" height="22" rx="6" fill="hsl(220 20% 11% / 0.07)" />
      <rect x="88" y="116" width="18" height="22" rx="3" fill="hsl(220 20% 11% / 0.18)" />
      <rect x="110" y="120" width="44" height="3" rx="1.5" fill="hsl(220 20% 11% / 0.12)" />
      <rect x="110" y="127" width="58" height="3" rx="1.5" fill="hsl(220 20% 11% / 0.08)" />

      {/* Top book (main) */}
      <rect x="96" y="90" width="128" height="24" rx="7" fill="white" stroke="hsl(220 13% 91%)" strokeWidth="1" />
      <rect x="96" y="90" width="20" height="24" rx="4" fill="hsl(355 78% 48% / 0.8)" />
      <rect x="120" y="95" width="48" height="3.5" rx="1.75" fill="hsl(222 20% 11% / 0.2)" />
      <rect x="120" y="102" width="64" height="3.5" rx="1.75" fill="hsl(222 20% 11% / 0.12)" />

      {/* Floating stars */}
      <g opacity="0.6">
        <path d="M68 72 L70 66 L72 72 L78 72 L73 76 L75 82 L70 78 L65 82 L67 76 L62 72 Z" fill="hsl(355 78% 48% / 0.3)" />
        <path d="M248 88 L250 83 L252 88 L257 88 L253 91 L254 96 L250 93 L246 96 L247 91 L243 88 Z" fill="hsl(355 78% 48% / 0.2)" />
        <circle cx="72" cy="130" r="3" fill="hsl(355 78% 48% / 0.2)" />
        <circle cx="252" cy="128" r="2" fill="hsl(355 78% 48% / 0.15)" />
        <circle cx="240" cy="68" r="4" fill="hsl(355 78% 48% / 0.12)" />
      </g>

      {/* Magnifier */}
      <circle cx="200" cy="78" r="18" fill="white" stroke="hsl(220 13% 91%)" strokeWidth="1.5" />
      <circle cx="200" cy="78" r="11" fill="hsl(355 78% 48% / 0.06)" stroke="hsl(355 78% 48% / 0.2)" strokeWidth="1" />
      <line x1="213" y1="91" x2="222" y2="100" stroke="hsl(220 20% 11% / 0.2)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="196" y1="75" x2="204" y2="75" stroke="hsl(355 78% 48% / 0.4)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="200" y1="71" x2="200" y2="79" stroke="hsl(355 78% 48% / 0.4)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyIntensivesIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="160" cy="110" r="90" fill="hsl(355 78% 48% / 0.04)" />
      <circle cx="160" cy="110" r="60" fill="hsl(355 78% 48% / 0.05)" />

      {/* Trophy body */}
      <path d="M130 70 h60 v50 q0 20 -30 28 q-30 -8 -30 -28 Z" fill="white" stroke="hsl(220 13% 91%)" strokeWidth="1.5" />
      <path d="M138 78 h44 v38 q0 15 -22 21 q-22 -6 -22 -21 Z" fill="hsl(355 78% 48% / 0.08)" />

      {/* Trophy handles */}
      <path d="M130 80 Q108 80 108 100 Q108 116 128 116" fill="none" stroke="hsl(220 13% 91%)" strokeWidth="6" strokeLinecap="round" />
      <path d="M190 80 Q212 80 212 100 Q212 116 192 116" fill="none" stroke="hsl(220 13% 91%)" strokeWidth="6" strokeLinecap="round" />

      {/* Trophy base */}
      <rect x="143" y="148" width="34" height="8" rx="2" fill="hsl(220 20% 11% / 0.1)" />
      <rect x="136" y="155" width="48" height="8" rx="4" fill="hsl(220 20% 11% / 0.12)" />

      {/* Star inside trophy */}
      <path d="M160 86 L162.5 93 L170 93 L164 97.5 L166.5 104.5 L160 100 L153.5 104.5 L156 97.5 L150 93 L157.5 93 Z"
        fill="hsl(355 78% 48% / 0.5)" />

      {/* Sparkle stars around */}
      <g opacity="0.7">
        <path d="M96 68 L97.5 63 L99 68 L104 68 L100 71 L101.5 76 L97.5 73 L93.5 76 L95 71 L91 68 Z"
          fill="hsl(355 78% 48% / 0.25)" />
        <path d="M228 88 L229.5 84 L231 88 L235 88 L232 90.5 L233 94.5 L229.5 92 L226 94.5 L227 90.5 L224 88 Z"
          fill="hsl(355 78% 48% / 0.2)" />
        <circle cx="235" cy="68" r="5" fill="hsl(355 78% 48% / 0.12)" />
        <circle cx="88" cy="128" r="4" fill="hsl(355 78% 48% / 0.12)" />
        <circle cx="232" cy="148" r="3" fill="hsl(355 78% 48% / 0.1)" />
      </g>

      {/* Podium steps */}
      <rect x="100" y="170" width="32" height="18" rx="4" fill="hsl(220 13% 91%)" />
      <rect x="136" y="160" width="48" height="28" rx="4" fill="hsl(355 78% 48% / 0.15)" />
      <rect x="188" y="174" width="32" height="14" rx="4" fill="hsl(220 13% 91%)" />
      <text x="152" y="179" textAnchor="middle" fontSize="11" fontWeight="700" fill="hsl(355 78% 48% / 0.7)">1</text>
      <text x="116" y="183" textAnchor="middle" fontSize="10" fontWeight="600" fill="hsl(220 20% 11% / 0.3)">2</text>
      <text x="204" y="185" textAnchor="middle" fontSize="10" fontWeight="600" fill="hsl(220 20% 11% / 0.3)">3</text>
    </svg>
  );
}

export function EmptyDashboardIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="140" cy="100" r="80" fill="hsl(355 78% 48% / 0.04)" />

      {/* Person studying */}
      {/* Desk */}
      <rect x="50" y="148" width="180" height="8" rx="4" fill="hsl(220 13% 91%)" />

      {/* Laptop */}
      <rect x="90" y="110" width="100" height="70" rx="6" fill="white" stroke="hsl(220 13% 91%)" strokeWidth="1.5" />
      <rect x="90" y="110" width="100" height="52" rx="4" fill="hsl(220 20% 11% / 0.06)" />
      {/* Screen content lines */}
      <rect x="100" y="120" width="40" height="4" rx="2" fill="hsl(355 78% 48% / 0.3)" />
      <rect x="100" y="128" width="60" height="3" rx="1.5" fill="hsl(220 20% 11% / 0.15)" />
      <rect x="100" y="134" width="48" height="3" rx="1.5" fill="hsl(220 20% 11% / 0.1)" />
      <rect x="100" y="142" width="54" height="3" rx="1.5" fill="hsl(220 20% 11% / 0.1)" />
      {/* Progress bar on screen */}
      <rect x="100" y="152" width="72" height="5" rx="2.5" fill="hsl(220 13% 91%)" />
      <rect x="100" y="152" width="45" height="5" rx="2.5" fill="hsl(355 78% 48% / 0.5)" />

      {/* Person head */}
      <circle cx="140" cy="82" r="20" fill="white" stroke="hsl(220 13% 91%)" strokeWidth="1.5" />
      <circle cx="133" cy="79" r="2.5" fill="hsl(222 20% 11% / 0.4)" />
      <circle cx="147" cy="79" r="2.5" fill="hsl(222 20% 11% / 0.4)" />
      <path d="M134 87 Q140 92 146 87" fill="none" stroke="hsl(355 78% 48% / 0.6)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Hair */}
      <path d="M120 76 Q124 60 140 62 Q156 60 160 76" fill="hsl(222 20% 11% / 0.15)" />

      {/* Floating badge */}
      <rect x="172" y="64" width="72" height="28" rx="8" fill="white" stroke="hsl(220 13% 91%)" strokeWidth="1" />
      <circle cx="184" cy="78" r="8" fill="hsl(355 78% 48% / 0.15)" />
      <path d="M181 78 L183.5 80.5 L187 76" stroke="hsl(355 78% 48% / 0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="196" y="73" width="36" height="3.5" rx="1.75" fill="hsl(220 20% 11% / 0.18)" />
      <rect x="196" y="79.5" width="24" height="3" rx="1.5" fill="hsl(220 20% 11% / 0.1)" />

      {/* Floating star */}
      <path d="M60 76 L62 70 L64 76 L70 76 L65.5 80 L67 86 L62 82.5 L57 86 L58.5 80 L54 76 Z"
        fill="hsl(355 78% 48% / 0.2)" />

      {/* Dots decoration */}
      <circle cx="220" cy="112" r="3" fill="hsl(355 78% 48% / 0.15)" />
      <circle cx="228" cy="120" r="2" fill="hsl(355 78% 48% / 0.1)" />
      <circle cx="60" cy="125" r="2.5" fill="hsl(355 78% 48% / 0.12)" />
    </svg>
  );
}

export function EmptyNotificationsIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="100" cy="80" r="60" fill="hsl(355 78% 48% / 0.04)" />
      {/* Bell */}
      <path d="M100 30 Q100 25 105 25 Q110 25 110 30 L110 35 Q128 40 128 62 L128 82 L72 82 L72 62 Q72 40 90 35 L90 30 Q90 25 95 25 Q100 25 100 30 Z"
        fill="white" stroke="hsl(220 13% 91%)" strokeWidth="1.5" />
      {/* Bell clapper */}
      <path d="M92 82 Q92 90 100 90 Q108 90 108 82" fill="white" stroke="hsl(220 13% 91%)" strokeWidth="1.5" />
      {/* ZZZ */}
      <text x="128" y="50" fontSize="12" fontWeight="700" fill="hsl(355 78% 48% / 0.3)">z</text>
      <text x="136" y="38" fontSize="10" fontWeight="700" fill="hsl(355 78% 48% / 0.2)">z</text>
      <text x="142" y="28" fontSize="8" fontWeight="700" fill="hsl(355 78% 48% / 0.15)">z</text>
    </svg>
  );
}
