declare const __APP_BUILD_ID__: string;

const BUILD_VERSION_ENDPOINT = "/version.json";
const VERSION_CHECK_INTERVAL_MS = 15000;
const VERSION_STORAGE_KEY = "app_build_reload_at";

const getCurrentBuildId = () => __APP_BUILD_ID__;

const shouldReloadNow = () => {
  if (typeof window === "undefined") return false;
  const lastReloadAt = Number(sessionStorage.getItem(VERSION_STORAGE_KEY) || 0);
  return Date.now() - lastReloadAt > 5000;
};

const markReload = () => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(VERSION_STORAGE_KEY, String(Date.now()));
};

const refreshForNewVersion = async () => {
  if (typeof window === "undefined") return;

  try {
    const response = await fetch(`${BUILD_VERSION_ENDPOINT}?t=${Date.now()}`, {
      cache: "no-store",
      headers: {
        "cache-control": "no-cache",
      },
    });

    if (!response.ok) return;

    const data = (await response.json()) as { buildId?: string };
    if (!data.buildId || data.buildId === getCurrentBuildId() || !shouldReloadNow()) return;

    markReload();
    window.location.reload();
  } catch {
    // Ignore transient network/cache errors.
  }
};

export const setupBuildVersionWatcher = () => {
  if (typeof window === "undefined") return () => {};

  const intervalId = window.setInterval(refreshForNewVersion, VERSION_CHECK_INTERVAL_MS);
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      void refreshForNewVersion();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("focus", handleVisibilityChange);
  void refreshForNewVersion();

  return () => {
    window.clearInterval(intervalId);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("focus", handleVisibilityChange);
  };
};
