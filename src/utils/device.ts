export interface MobileDeviceDetectionResult {
  isMobileLikeDevice: boolean;
  isTabletLikeDevice: boolean;
  isPhoneLikeDevice: boolean;
  isDesktopLikeDevice: boolean;
  deviceTypeLabel: "phone" | "tablet" | "desktop" | "unknown";
  uaSummary: string;
  signals: {
    hasMobileUserAgent: boolean;
    hasTabletUserAgent: boolean;
    hasDesktopUserAgent: boolean;
    isIpadDesktopMode: boolean;
    touchCapable: boolean;
    coarsePointer: boolean;
    smallOrTabletScreen: boolean;
  };
}

export type NormalizedBrowserName =
  | "Chrome"
  | "Edge"
  | "Firefox"
  | "Safari"
  | "Samsung Internet"
  | "Unknown";

export type NormalizedPlatformName =
  | "Android"
  | "iOS"
  | "Windows"
  | "MacOS"
  | "Linux"
  | "Unknown";

export interface DeviceAnalytics {
  fingerprint: string;
  deviceType: MobileDeviceDetectionResult["deviceTypeLabel"];
  platform: NormalizedPlatformName;
  browser: NormalizedBrowserName;
  userAgentSummary: string;
  screenWidth: number | null;
  screenHeight: number | null;
  touchCapable: boolean;
  timezone: string;
  language: string;
  hardwareConcurrency: number | null;
}

const MOBILE_UA_REGEX = /android|iphone|ipod|iemobile|opera mini|mobile/i;
const TABLET_UA_REGEX = /ipad|tablet|playbook|silk|kindle|nexus 7|nexus 9|sm-t/i;
const DESKTOP_UA_REGEX = /windows nt|macintosh|x11|cros|linux/i;

const NON_ALPHANUMERIC_REGEX = /[^a-z0-9]+/gi;

const simpleStableHash = (input: string): string => {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const summarizeUserAgent = (ua: string): string => {
  if (!ua) return "unknown";
  const normalized = ua.replace(/\s+/g, " ").trim();
  return normalized.length > 120 ? `${normalized.slice(0, 117)}...` : normalized;
};

export const detectBrowser = (userAgent?: string): NormalizedBrowserName => {
  const ua = String(userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : "")).toLowerCase();

  if (!ua) return "Unknown";
  if (ua.includes("samsungbrowser")) return "Samsung Internet";
  if (ua.includes("edg/") || ua.includes("edge/")) return "Edge";
  if (ua.includes("firefox/")) return "Firefox";
  if (ua.includes("chrome/") || ua.includes("crios/")) return "Chrome";
  if (ua.includes("safari/") && !ua.includes("chrome/") && !ua.includes("crios/")) {
    return "Safari";
  }
  return "Unknown";
};

export const detectPlatform = (userAgent?: string, platform?: string): NormalizedPlatformName => {
  const ua = String(userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : "")).toLowerCase();
  const navPlatform = String(platform ?? (typeof navigator !== "undefined" ? navigator.platform : "")).toLowerCase();

  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "iOS";
  if (navPlatform.includes("iphone") || navPlatform.includes("ipad") || navPlatform.includes("ipod")) {
    return "iOS";
  }
  if (ua.includes("windows") || navPlatform.includes("win")) return "Windows";
  if (ua.includes("mac os") || ua.includes("macintosh") || navPlatform.includes("mac")) return "MacOS";
  if (ua.includes("linux") || navPlatform.includes("linux") || ua.includes("x11")) return "Linux";
  return "Unknown";
};

export const generateDeviceFingerprint = (): string => {
  if (typeof window === "undefined" || typeof navigator === "undefined") return "unknown";

  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const language = navigator.language || "unknown";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown";
  const width = typeof screen !== "undefined" ? screen.width : 0;
  const height = typeof screen !== "undefined" ? screen.height : 0;
  const hardwareConcurrency = navigator.hardwareConcurrency ?? 0;
  const deviceMemory =
    typeof navigator === "object" && "deviceMemory" in navigator
      ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 0
      : 0;
  const maxTouchPoints = navigator.maxTouchPoints ?? 0;
  const touchCapable = maxTouchPoints > 0 || "ontouchstart" in window;

  const rawFingerprint = [
    ua,
    platform,
    language,
    timezone,
    `${width}x${height}`,
    String(hardwareConcurrency),
    String(deviceMemory),
    String(touchCapable),
    String(maxTouchPoints),
  ].join("|");

  return simpleStableHash(rawFingerprint);
};

export const getDeviceAnalytics = (): DeviceAnalytics => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      fingerprint: "unknown",
      deviceType: "unknown",
      platform: "Unknown",
      browser: "Unknown",
      userAgentSummary: "unknown",
      screenWidth: null,
      screenHeight: null,
      touchCapable: false,
      timezone: "unknown",
      language: "unknown",
      hardwareConcurrency: null,
    };
  }

  const device = detectMobileLikeDevice();
  const userAgent = navigator.userAgent || "";
  const language = navigator.language || "unknown";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown";
  const screenWidth = typeof screen !== "undefined" ? screen.width : null;
  const screenHeight = typeof screen !== "undefined" ? screen.height : null;

  return {
    fingerprint: generateDeviceFingerprint(),
    deviceType: device.deviceTypeLabel,
    platform: detectPlatform(userAgent, navigator.platform),
    browser: detectBrowser(userAgent),
    userAgentSummary: summarizeUserAgent(userAgent),
    screenWidth,
    screenHeight,
    touchCapable: device.signals.touchCapable,
    timezone,
    language,
    hardwareConcurrency: navigator.hardwareConcurrency ?? null,
  };
};

export const getFingerprintSummary = (fingerprint: string): string => {
  const normalized = String(fingerprint || "").replace(NON_ALPHANUMERIC_REGEX, "").toLowerCase();
  if (!normalized) return "unknown";
  if (normalized.length <= 8) return normalized;
  return `${normalized.slice(0, 4)}...${normalized.slice(-4)}`;
};

export const detectMobileLikeDevice = (): MobileDeviceDetectionResult => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      isMobileLikeDevice: true,
      isTabletLikeDevice: false,
      isPhoneLikeDevice: false,
      isDesktopLikeDevice: false,
      deviceTypeLabel: "unknown",
      uaSummary: "unknown",
      signals: {
        hasMobileUserAgent: false,
        hasTabletUserAgent: false,
        hasDesktopUserAgent: false,
        isIpadDesktopMode: false,
        touchCapable: false,
        coarsePointer: false,
        smallOrTabletScreen: false,
      },
    };
  }

  const ua = navigator.userAgent || "";
  const lowerUa = ua.toLowerCase();

  const hasAndroid = lowerUa.includes("android");
  const hasIphone = lowerUa.includes("iphone");
  const hasIpod = lowerUa.includes("ipod");
  const hasIpad = lowerUa.includes("ipad");
  const hasMobileUserAgent = MOBILE_UA_REGEX.test(lowerUa);
  const hasTabletUserAgent = TABLET_UA_REGEX.test(lowerUa) || (hasAndroid && !lowerUa.includes("mobile"));
  const hasDesktopUserAgent = DESKTOP_UA_REGEX.test(lowerUa);

  const touchCapable =
    (typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 0) ||
    "ontouchstart" in window;

  const coarsePointer =
    typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;

  const viewportWidth = Math.min(window.innerWidth || Number.MAX_SAFE_INTEGER, screen.width || Number.MAX_SAFE_INTEGER);
  const viewportHeight = Math.min(window.innerHeight || Number.MAX_SAFE_INTEGER, screen.height || Number.MAX_SAFE_INTEGER);
  const smallestSide = Math.min(viewportWidth, viewportHeight);
  const largestSide = Math.max(viewportWidth, viewportHeight);
  const smallOrTabletScreen = smallestSide <= 900 && largestSide <= 1600;

  // iPadOS Safari can expose "Macintosh" UA while still being a touch tablet.
  const isIpadDesktopMode = !hasIpad && lowerUa.includes("macintosh") && touchCapable;

  const looksLikePhone = hasIphone || hasIpod || (hasAndroid && lowerUa.includes("mobile"));
  const looksLikeTablet = hasIpad || hasTabletUserAgent || isIpadDesktopMode;

  const isStrongMobileSignal = looksLikePhone || looksLikeTablet;
  const isWeakMobileSignal = touchCapable && coarsePointer && smallOrTabletScreen;

  const isDesktopLikeDevice =
    hasDesktopUserAgent && !isStrongMobileSignal && !(isWeakMobileSignal && !lowerUa.includes("windows nt"));

  const isMobileLikeDevice = !isDesktopLikeDevice && (isStrongMobileSignal || isWeakMobileSignal);
  const isTabletLikeDevice = isMobileLikeDevice && looksLikeTablet;
  const isPhoneLikeDevice = isMobileLikeDevice && !isTabletLikeDevice;

  const deviceTypeLabel: MobileDeviceDetectionResult["deviceTypeLabel"] = isMobileLikeDevice
    ? isTabletLikeDevice
      ? "tablet"
      : "phone"
    : isDesktopLikeDevice
      ? "desktop"
      : "unknown";

  return {
    isMobileLikeDevice,
    isTabletLikeDevice,
    isPhoneLikeDevice,
    isDesktopLikeDevice,
    deviceTypeLabel,
    uaSummary: summarizeUserAgent(ua),
    signals: {
      hasMobileUserAgent,
      hasTabletUserAgent,
      hasDesktopUserAgent,
      isIpadDesktopMode,
      touchCapable,
      coarsePointer,
      smallOrTabletScreen,
    },
  };
};

export default detectMobileLikeDevice;