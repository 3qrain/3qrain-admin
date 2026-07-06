import { useAppStore } from "~/stores/app";
import { getConfig, updateConfig } from "~/api/config";

export type Theme = "light" | "dark" | "system";

function resolve(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

function apply(resolved: "light" | "dark") {
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.classList.toggle("light", resolved === "light");
}

export function getTheme(): Theme {
  return useAppStore().theme;
}

export function setTheme(theme: Theme) {
  useAppStore().theme = theme;
  apply(resolve(theme));
  updateConfig("appearance", { theme }).catch(() => {});
}

export async function syncThemeFromServer() {
  try {
    const config = await getConfig();
    const serverTheme = config.appearance.theme;
    if (serverTheme !== getTheme()) {
      useAppStore().theme = serverTheme;
      apply(resolve(serverTheme));
    }
    useAppStore().emailEnabled = config.emailEnabled ?? false
  } catch { /* use local */ }
}

export function initTheme() {
  apply(resolve(getTheme()));

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getTheme() === "system") apply(resolve("system"));
  });
}
