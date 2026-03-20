import { useDarkMode } from "../hooks/useDarkMode";

export default function DarkModeToggle() {
  const { toggle, theme } = useDarkMode();

  return (
    <button
      type="button"
      className="btn btn-sm position-fixed bottom-0 end-0 m-3"
      style={{
        zIndex: 1030,
        background: theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.05)",
        border: theme === "dark" ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(0,0,0,0.1)",
      }}
      onClick={toggle}
      aria-label="Toggle dark mode"
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}

