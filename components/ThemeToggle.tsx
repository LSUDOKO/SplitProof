"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { getThemeChoice, isDarkNow, setThemeChoice, type ThemeChoice } from "@/lib/theme";
import { IconButton, Segmented } from "./ui";

/** Full System / Light / Dark control for Settings and onboarding. */
export function ThemeSegmented() {
  const [choice, setChoice] = useState<ThemeChoice>("system");
  useEffect(() => {
    // localStorage only exists after mount, so the saved value can't be the initial state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChoice(getThemeChoice());
  }, []);
  return (
    <Segmented
      label="Theme"
      value={choice}
      options={[
        { value: "system", label: "System" },
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ]}
      onChange={(c) => {
        setChoice(c);
        setThemeChoice(c);
      }}
    />
  );
}

/** Quick sun/moon button for headers. */
export function ThemeIconButton() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(isDarkNow());
  }, []);
  return (
    <IconButton
      label={dark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => {
        setThemeChoice(dark ? "light" : "dark");
        setDark(!dark);
      }}
    >
      {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </IconButton>
  );
}
