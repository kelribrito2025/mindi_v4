/**
 * Shared Google Maps script loader.
 * Both Map.tsx and DeliveryAddressPicker/AddressMapPicker must use this single loader
 * to avoid conflicts from multiple script tags.
 *
 * Production preference for Mindi is a dedicated Google Maps API key exposed only as
 * a browser-restricted Vite variable (`VITE_GOOGLE_MAPS_API_KEY`). When that key is
 * absent, older Forge/Manus proxy paths remain available as fallbacks.
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
const FRONTEND_API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.butterfly-effect.dev";
const MAPS_LIBRARIES = "marker,places,geocoding,geometry";
const DIRECT_PROXY_MAPS_URL = `${FORGE_BASE_URL}/v1/maps/proxy/maps/api/js?key=${FRONTEND_API_KEY}&v=weekly&libraries=${MAPS_LIBRARIES}`;
const INTERNAL_MAPS_URL = `/api/maps/js?v=weekly&libraries=${MAPS_LIBRARIES}`;
const MAPS_FETCH_TIMEOUT_MS = 12000;
const MAPS_SCRIPT_ID = "mindi-google-maps-sdk";

type MapsLoadSource =
  | { kind: "external-script"; url: string }
  | { kind: "inline-fetch"; url: string };

let loadPromise: Promise<void> | null = null;

function getDirectGoogleMapsUrl() {
  const url = new URL("https://maps.googleapis.com/maps/api/js");
  url.searchParams.set("key", GOOGLE_MAPS_API_KEY || "");
  url.searchParams.set("v", "weekly");
  url.searchParams.set("libraries", MAPS_LIBRARIES);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("region", "BR");
  return url.toString();
}

function getMapsLoadSource(): MapsLoadSource {
  if (GOOGLE_MAPS_API_KEY) {
    return { kind: "external-script", url: getDirectGoogleMapsUrl() };
  }

  return {
    kind: "inline-fetch",
    url: FRONTEND_API_KEY ? DIRECT_PROXY_MAPS_URL : INTERNAL_MAPS_URL,
  };
}

function loadExternalScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).google?.maps?.Map) {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps script")), { once: true });
      return;
    }

    const scriptEl = document.createElement("script");
    scriptEl.id = MAPS_SCRIPT_ID;
    scriptEl.src = url;
    scriptEl.async = true;
    scriptEl.defer = true;
    scriptEl.addEventListener("load", () => resolve(), { once: true });
    scriptEl.addEventListener("error", () => reject(new Error("Failed to load Google Maps script")), { once: true });
    document.head.appendChild(scriptEl);
  });
}

async function fetchAndInjectScript(url: string) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), MAPS_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/javascript,text/javascript,*/*" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Maps: ${response.status}`);
    }

    const scriptText = await response.text();
    const scriptEl = document.createElement("script");
    scriptEl.id = MAPS_SCRIPT_ID;
    scriptEl.textContent = scriptText;
    document.head.appendChild(scriptEl);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * Load the Google Maps JavaScript API exactly once.
 * Returns a promise that resolves when google.maps is available.
 * Safe to call multiple times — subsequent calls return the same promise.
 */
export function loadGoogleMapsScript(): Promise<void> {
  // Already loaded
  if ((window as any).google?.maps?.Map) {
    return Promise.resolve();
  }

  // Already loading
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      const source = getMapsLoadSource();

      if (source.kind === "external-script") {
        await loadExternalScript(source.url);
      } else {
        await fetchAndInjectScript(source.url);
      }

      // Wait for google.maps to initialize
      await waitForGoogleMaps(8000);

      if (!(window as any).google?.maps?.Map) {
        throw new Error("Google Maps did not initialize after script injection");
      }
    } catch (e) {
      // Reset so next call can retry
      loadPromise = null;
      throw e;
    }
  })();

  return loadPromise;
}

/**
 * Poll for google.maps.Map to become available.
 */
function waitForGoogleMaps(maxWait: number): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).google?.maps?.Map) {
      resolve();
      return;
    }

    const start = Date.now();
    const interval = setInterval(() => {
      if ((window as any).google?.maps?.Map || Date.now() - start > maxWait) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}
