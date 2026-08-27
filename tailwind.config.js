/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "inverse-primary": "#5d5f5f",
        "error-container": "#93000a",
        "surface-tint": "#c6c6c7",
        "secondary-container": "#3131c0",
        "tertiary-container": "#e5e2e1",
        "error": "#ffb4ab",
        "on-primary-fixed": "#1a1c1c",
        "surface-container-highest": "#353534",
        "tertiary": "#ffffff",
        "surface-container-lowest": "#0e0e0e",
        "on-secondary-container": "#b0b2ff",
        "secondary-fixed-dim": "#c0c1ff",
        "on-tertiary": "#303030",
        "surface-variant": "#353534",
        "primary-fixed": "#e2e2e2",
        "surface-dim": "#131313",
        "outline-variant": "#444748",
        "on-secondary": "#1000a9",
        "on-tertiary-fixed": "#1b1b1c",
        "inverse-surface": "#e5e2e1",
        "on-tertiary-fixed-variant": "#474746",
        "on-secondary-fixed": "#07006c",
        "tertiary-fixed-dim": "#c8c6c5",
        "on-surface-variant": "#c4c7c8",
        "surface-container": "#201f1f",
        "on-error": "#690005",
        "outline": "#8e9192",
        "surface-container-high": "#2a2a2a",
        "on-tertiary-container": "#656464",
        "on-primary": "#2f3131",
        "on-background": "#e5e2e1",
        "on-error-container": "#ffdad6",
        "surface": "#131313",
        "on-secondary-fixed-variant": "#2f2ebe",
        "secondary": "#c0c1ff",
        "secondary-fixed": "#e1e0ff",
        "primary-container": "#e2e2e2",
        "on-surface": "#e5e2e1",
        "surface-bright": "#393939",
        "surface-container-low": "#1c1b1b",
        "primary-fixed-dim": "#c6c6c7",
        "primary": "#ffffff",
        "on-primary-fixed-variant": "#454747",
        "on-primary-container": "#636565",
        "tertiary-fixed": "#e5e2e1",
        "inverse-on-surface": "#313030",
        "background": "#131313"
      },
      borderRadius: {
        "DEFAULT": "1rem",
        "lg": "2rem",
        "xl": "3rem",
        "full": "9999px"
      },
      spacing: {
        "container-max": "1280px",
        "gutter": "24px",
        "unit": "8px",
        "margin-mobile": "16px",
        "margin-desktop": "40px"
      },
      fontFamily: {
        "headline-lg": ["Plus Jakarta Sans", "sans-serif"],
        "label-sm": ["Plus Jakarta Sans", "sans-serif"],
        "display-lg": ["Plus Jakarta Sans", "sans-serif"],
        "headline-lg-mobile": ["Plus Jakarta Sans", "sans-serif"],
        "body-md": ["Inter", "sans-serif"]
      },
      fontSize: {
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "label-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "500" }],
        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "-0.04em", fontWeight: "700" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "24px", letterSpacing: "0em", fontWeight: "400" }]
      }
    },
  },
  plugins: [],
}
