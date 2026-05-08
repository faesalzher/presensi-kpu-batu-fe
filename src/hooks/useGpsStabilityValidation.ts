import { useCallback, useEffect, useRef, useState } from "react";

export interface GpsSample {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface UseGpsStabilityValidationParams {
  enabled?: boolean;
  maxSamples?: number;
  minSamplesToValidate?: number;
}

interface UseGpsStabilityValidationResult {
  gpsSamples: GpsSample[];
  gpsLooksNatural: boolean;
  gpsSuspicious: boolean;
  gpsValidationLoading: boolean;
  gpsValidationMessage: string;
  currentLatitude: number | null;
  currentLongitude: number | null;
  currentAccuracy: number | null;
  trackingActive: boolean;
  gpsLastUpdated: number | null;
  locationError: string | null;
  refreshTracking: () => void;
}

const DEFAULT_MAX_SAMPLES = 15;
const DEFAULT_MIN_SAMPLES = 3;
const IDENTICAL_STREAK_THRESHOLD = 6;
const VALIDATION_GRACE_MS = 20000;

const useGpsStabilityValidation = ({
  enabled = true,
  maxSamples = DEFAULT_MAX_SAMPLES,
  minSamplesToValidate = DEFAULT_MIN_SAMPLES,
}: UseGpsStabilityValidationParams = {}): UseGpsStabilityValidationResult => {
  const watchIdRef = useRef<number | null>(null);

  const [gpsSamples, setGpsSamples] = useState<GpsSample[]>([]);
  const [gpsLooksNatural, setGpsLooksNatural] = useState<boolean>(false);
  const [gpsSuspicious, setGpsSuspicious] = useState<boolean>(false);
  const [gpsValidationLoading, setGpsValidationLoading] = useState<boolean>(true);
  const [gpsValidationMessage, setGpsValidationMessage] = useState<string>(
    "Memvalidasi kestabilan lokasi..."
  );
  const [currentLatitude, setCurrentLatitude] = useState<number | null>(null);
  const [currentLongitude, setCurrentLongitude] = useState<number | null>(null);
  const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null);
  const [trackingActive, setTrackingActive] = useState<boolean>(false);
  const [gpsLastUpdated, setGpsLastUpdated] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const stopTracking = useCallback((reason: string) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTrackingActive(false);
    console.log("[GPS Tracker] tracking stopped:", reason);
  }, []);

  const startTracking = useCallback(() => {
    if (!enabled) return;
    if (document.visibilityState === "hidden") return;

    if (!navigator.geolocation) {
      const unsupportedMessage = "Geolocation tidak didukung browser ini.";
      setLocationError(unsupportedMessage);
      setGpsValidationLoading(false);
      setGpsLooksNatural(false);
      setGpsValidationMessage("Sinyal lokasi belum stabil. Mohon aktifkan GPS dan coba lagi.");
      return;
    }

    if (watchIdRef.current !== null) {
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const sample: GpsSample = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };

        setCurrentLatitude(sample.latitude);
        setCurrentLongitude(sample.longitude);
        setCurrentAccuracy(sample.accuracy);
        setGpsLastUpdated(sample.timestamp);
        setLocationError(null);

        setGpsSamples((prev) => {
          const next = [...prev, sample].slice(-maxSamples);

          const previous = prev.length > 0 ? prev[prev.length - 1] : null;
          const jitter = previous
            ? {
                latDelta: Math.abs(sample.latitude - previous.latitude),
                lngDelta: Math.abs(sample.longitude - previous.longitude),
                accuracyDelta: Math.abs(sample.accuracy - previous.accuracy),
                timestampDeltaMs: Math.abs(sample.timestamp - previous.timestamp),
              }
            : null;

          console.log("[GPS Tracker] live update:", sample);
          console.log("[GPS Tracker] accuracy:", sample.accuracy);
          console.log("[GPS Tracker] sample jitter:", jitter);

          return next;
        });
      },
      (err) => {
        let message = "Gagal mendapatkan lokasi. Aktifkan layanan lokasi di perangkat Anda.";
        if (err?.code === err.PERMISSION_DENIED) {
          message = "Akses lokasi ditolak. Silakan izinkan lokasi di browser.";
        } else if (err?.code === err.POSITION_UNAVAILABLE) {
          message = "Lokasi tidak tersedia. Coba nyalakan GPS lalu refresh lokasi.";
        } else if (err?.code === err.TIMEOUT) {
          message = "Timeout mendapatkan lokasi. Coba lagi.";
        }

        setLocationError(message);
        setGpsValidationLoading(false);
        setGpsLooksNatural(false);
        setGpsSuspicious(false);
        setGpsValidationMessage("Sinyal lokasi belum stabil. Mohon aktifkan GPS dan coba lagi.");
        setTrackingActive(false);
        console.log("[GPS Tracker] error:", message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    setTrackingActive(true);
    console.log("[GPS Tracker] tracking started");
  }, [enabled, maxSamples]);

  const refreshTracking = useCallback(() => {
    setGpsSamples([]);
    setGpsLooksNatural(false);
    setGpsSuspicious(false);
    setGpsValidationLoading(true);
    setGpsValidationMessage("Memvalidasi kestabilan lokasi...");
    setLocationError(null);
    stopTracking("manual_refresh");
    startTracking();
    console.log("[GPS Tracker] manual refresh triggered");
  }, [startTracking, stopTracking]);

  useEffect(() => {
    if (!enabled) {
      stopTracking("disabled");
      setGpsSamples([]);
      setGpsLooksNatural(false);
      setGpsSuspicious(false);
      setGpsValidationLoading(true);
      setGpsValidationMessage("Memvalidasi kestabilan lokasi...");
      setCurrentLatitude(null);
      setCurrentLongitude(null);
      setCurrentAccuracy(null);
      setGpsLastUpdated(null);
      setLocationError(null);
      return;
    }

    startTracking();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopTracking("visibility_hidden");
        return;
      }

      startTracking();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopTracking("unmount_or_dependency_change");
    };
  }, [enabled, startTracking, stopTracking]);

  useEffect(() => {
    if (!enabled) return;

    const latestSamples = gpsSamples;
    const sampleCount = latestSamples.length;

    const timestampDeltas = latestSamples
      .slice(1)
      .map((sample, index) => sample.timestamp - latestSamples[index].timestamp);

    const latestTimestampDeltaMs =
      timestampDeltas.length > 0 ? timestampDeltas[timestampDeltas.length - 1] : null;

    const firstTimestamp = latestSamples[0]?.timestamp ?? null;
    const latestTimestamp = latestSamples[sampleCount - 1]?.timestamp ?? null;
    const validationElapsedMs =
      firstTimestamp !== null && latestTimestamp !== null
        ? latestTimestamp - firstTimestamp
        : 0;

    if (gpsSamples.length < minSamplesToValidate) {
      const shouldUseGracefulFallback = sampleCount > 0 && validationElapsedMs >= VALIDATION_GRACE_MS;

      if (shouldUseGracefulFallback) {
        setGpsValidationLoading(false);
        setGpsLooksNatural(true);
        setGpsSuspicious(false);
        setGpsValidationMessage("");

        console.log("[GPS Validation] sample count:", sampleCount);
        console.log("[GPS Validation] latest timestamp delta ms:", latestTimestampDeltaMs);
        console.log("[GPS Validation] suspicious reason:", "fallback_timeout_allow");
        console.log("[GPS Validation] validation passed:", true);
        return;
      }

      setGpsValidationLoading(true);
      setGpsLooksNatural(false);
      setGpsSuspicious(false);
      setGpsValidationMessage("Memvalidasi kestabilan lokasi...");

      console.log("[GPS Validation] sample count:", sampleCount);
      console.log("[GPS Validation] latest timestamp delta ms:", latestTimestampDeltaMs);
      console.log("[GPS Validation] current accuracy:", currentAccuracy);
      console.log("[GPS Validation] suspicious reason:", "insufficient_samples");
      console.log("[GPS Validation] validation passed:", false);
      return;
    }

    let identicalStreakCount = 1;
    for (let i = latestSamples.length - 1; i > 0; i -= 1) {
      const current = latestSamples[i];
      const previous = latestSamples[i - 1];

      const identicalPoint =
        current.latitude === previous.latitude &&
        current.longitude === previous.longitude &&
        current.accuracy === previous.accuracy;

      if (!identicalPoint) break;
      identicalStreakCount += 1;
    }

    const suspiciousStaticPattern = identicalStreakCount >= IDENTICAL_STREAK_THRESHOLD;

    if (suspiciousStaticPattern) {
      setGpsValidationLoading(false);
      setGpsLooksNatural(false);
      setGpsSuspicious(true);
      setGpsValidationMessage("Sinyal lokasi belum stabil. Mohon aktifkan GPS dan coba lagi.");

      console.log("[GPS Validation] sample count:", sampleCount);
      console.log("[GPS Validation] latest timestamp delta ms:", latestTimestampDeltaMs);
      console.log("[GPS Validation] identical streak count:", identicalStreakCount);
      console.log("[GPS Validation] current accuracy:", currentAccuracy);
      console.log("[GPS Validation] suspicious reason:", "long_identical_lat_lng_accuracy_streak");
      console.log("[GPS Validation] validation passed:", false);
      return;
    }

    setGpsValidationLoading(false);
    setGpsLooksNatural(true);
    setGpsSuspicious(false);
    setGpsValidationMessage("");

    console.log("[GPS Validation] sample count:", sampleCount);
    console.log("[GPS Validation] latest timestamp delta ms:", latestTimestampDeltaMs);
    console.log("[GPS Validation] identical streak count:", identicalStreakCount);
    console.log("[GPS Validation] current accuracy:", currentAccuracy);
    console.log("[GPS Validation] suspicious reason:", "none");
    console.log("[GPS Validation] validation passed:", true);
  }, [enabled, gpsSamples, currentAccuracy, minSamplesToValidate]);

  return {
    gpsSamples,
    gpsLooksNatural,
    gpsSuspicious,
    gpsValidationLoading,
    gpsValidationMessage,
    currentLatitude,
    currentLongitude,
    currentAccuracy,
    trackingActive,
    gpsLastUpdated,
    locationError,
    refreshTracking,
  };
};

export default useGpsStabilityValidation;
