/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(220 13% 91%)",
        background: "hsl(220 14% 96%)",
        foreground: "hsl(222 18% 13%)",
        muted: "hsl(225 7% 48%)",
        card: "hsl(0 0% 100%)",
        primary: "hsl(355 78% 48%)",
        accent: "hsl(355 86% 56%)",
        ink: "hsl(222 20% 11%)",
        surface: "hsl(220 20% 97%)",
        line: "hsl(220 13% 91%)",
        "primary-dark": "hsl(355 78% 40%)",
        "primary-light": "hsl(355 78% 97%)",
        "dark-bg": "hsl(222 25% 9%)",
        "dark-card": "hsl(222 20% 13%)",
        "dark-border": "hsl(222 15% 20%)",
      },
      boxShadow: {
        soft: "0 18px 44px rgba(25, 28, 34, 0.08)",
        panel: "0 1px 3px rgba(25, 28, 34, 0.06), 0 8px 24px rgba(25, 28, 34, 0.05)",
        card: "0 1px 2px rgba(25, 28, 34, 0.05), 0 4px 16px rgba(25, 28, 34, 0.06)",
        hero: "0 24px 64px rgba(200, 30, 50, 0.2), 0 4px 16px rgba(200, 30, 50, 0.1)",
        glow: "0 0 40px rgba(200, 30, 50, 0.28)",
        "red-sm": "0 2px 8px rgba(200, 30, 50, 0.3)",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, hsl(222 25% 9%) 0%, hsl(350 35% 14%) 55%, hsl(222 22% 8%) 100%)",
        "red-gradient": "linear-gradient(135deg, hsl(355 78% 52%) 0%, hsl(355 78% 40%) 100%)",
        "card-shine": "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 60%)",
        "surface-gradient": "linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(220 20% 98%) 100%)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        "scale-in": "scaleIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        "float": "float 6s ease-in-out infinite",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(20px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        scaleIn: { from: { opacity: "0", transform: "scale(0.94)" }, to: { opacity: "1", transform: "scale(1)" } },
        float: { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-8px)" } },
        glowPulse: { "0%, 100%": { opacity: "0.6" }, "50%": { opacity: "1" } },
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
