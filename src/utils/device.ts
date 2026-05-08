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

const MOBILE_UA_REGEX = /android|iphone|ipod|iemobile|opera mini|mobile/i;
const TABLET_UA_REGEX = /ipad|tablet|playbook|silk|kindle|nexus 7|nexus 9|sm-t/i;
const DESKTOP_UA_REGEX = /windows nt|macintosh|x11|cros|linux/i;

const summarizeUserAgent = (ua: string): string => {
  if (!ua) return "unknown";
  const normalized = ua.replace(/\s+/g, " ").trim();
  return normalized.length > 120 ? `${normalized.slice(0, 117)}...` : normalized;
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