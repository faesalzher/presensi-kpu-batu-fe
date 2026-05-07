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
const DEFAULT_MIN_SAMPLES = 7;

const useGpsStabilityValidation = ({
  enabled = true,
  maxSamples = DEFAULT_MAX_SAMPLES,
  minSamplesToValidate = DEFAULT_MIN_SAMPLES,
}: UseGpsStabilityValidationParams = {}): UseGpsStabilityValidationResult => {
  const watchIdRef = useRef<number | null>(null);

  const [gpsSamples, setGpsSamples] = useState<GpsSample[]>([]);
  const [gpsLooksNatural, setGpsLooksNatural] = useState<boolean>(false);
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

    if (gpsSamples.length < minSamplesToValidate) {
      setGpsValidationLoading(true);
      setGpsLooksNatural(false);
      setGpsValidationMessage("Memvalidasi kestabilan lokasi...");

      console.log("[GPS Validation] latest samples:", gpsSamples);
      console.log("[GPS Validation] current accuracy:", currentAccuracy);
      console.log("[GPS Validation] suspicious reason:", "insufficient_samples");
      console.log("[GPS Validation] gpsLooksNatural:", false);
      return;
    }

    const latest = gpsSamples.slice(-minSamplesToValidate);
    const first = latest[0];

    const allLatitudeIdentical = latest.every((sample) => sample.latitude === first.latitude);
    const allLongitudeIdentical = latest.every((sample) => sample.longitude === first.longitude);
    const allAccuracyIdentical = latest.every((sample) => sample.accuracy === first.accuracy);

    const suspiciousStaticPattern =
      allLatitudeIdentical && allLongitudeIdentical && allAccuracyIdentical;

    if (suspiciousStaticPattern) {
      setGpsValidationLoading(false);
      setGpsLooksNatural(false);
      setGpsValidationMessage("Sinyal lokasi belum stabil. Mohon aktifkan GPS dan coba lagi.");

      console.log("[GPS Validation] latest samples:", latest);
      console.log("[GPS Validation] current accuracy:", currentAccuracy);
      console.log("[GPS Validation] suspicious reason:", "identical_lat_lng_accuracy");
      console.log("[GPS Validation] gpsLooksNatural:", false);
      return;
    }

    setGpsValidationLoading(false);
    setGpsLooksNatural(true);
    setGpsValidationMessage("");

    console.log("[GPS Validation] latest samples:", latest);
    console.log("[GPS Validation] current accuracy:", currentAccuracy);
    console.log("[GPS Validation] suspicious reason:", "none");
    console.log("[GPS Validation] gpsLooksNatural:", true);
  }, [enabled, gpsSamples, currentAccuracy, minSamplesToValidate]);

  return {
    gpsSamples,
    gpsLooksNatural,
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
