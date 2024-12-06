export const TW_SCREENS = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px"
} as const;

export function getTailwindBreakpoint(breakpoint: keyof typeof TW_SCREENS) {
  return parseInt(TW_SCREENS[breakpoint].replace("px", ""));
}
