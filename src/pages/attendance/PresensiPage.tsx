import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  IconButton,
  Typography,
  Paper,
  Container,
  Button,
  // CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  // Tooltip,
  // Fab,
  Divider,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { MapContainer, TileLayer, Circle, Marker, Popup, Tooltip } from "react-leaflet";
import {
  ArrowBack,
  LocationOff,
  Assignment,
  LogoutRounded,
  SendRounded,
  MyLocation,
  // GpsFixed,
  // LocationSearching,
} from "@mui/icons-material";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useAttendance } from "../../contexts/AttendanceContext";
import { useSystem } from "../../contexts/SystemContext.tsx";
import SystemService from "../../services/SystemService";
import { CheckInDto, CheckOutDto } from "../../types/attendance";
import { formatDate, formatTime, getNow } from "../../constant/time.constant";
import BottomNav from "../../components/BottomNav";

// Fix Leaflet icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const PresensiPage: React.FC = () => {
    // Lokasi kantor (bisa diambil dari backend/general_setting, hardcode fallback)
    const [officeLocation, setOfficeLocation] = useState<[number, number]>([-7.880554548953023, 112.52737963655478]); // fallback: KPU Batu
    const [radius, setRadius] = useState<number>(500); // default 500m
  const [isGeofenceEnabled, setIsGeofenceEnabled] = useState<boolean | null>(null);
  const [lateToleranceMinutes, setLateToleranceMinutes] = useState<number>(0);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [distanceToOffice, setDistanceToOffice] = useState<number | null>(null);
    const [isWithinRadius, setIsWithinRadius] = useState<boolean>(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isRefreshingLocation, setIsRefreshingLocation] = useState<boolean>(false);
    // Haversine formula
    const haversine = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ): number => {
      const R = 6371e3;
      const toRad = (d: number) => (d * Math.PI) / 180;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
          Math.cos(toRad(lat2)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };
    // Fetch radius absen dan lokasi kantor dari backend
    // general_setting:
    // - LATITUDE_LONGITUDE: "-7.870000;112.525000"
    // - MAX_RADIUS: "100" (meter)
    // - IS_LOCATION_GEOFENCE_ENABLED: "ON" | "OFF" (atau "true/false", "1/0")
    // - LATE_TOLERANCE_MINUTES: "10" (menit)
    useEffect(() => {
      const fetchSettings = async () => {
        const [geofenceResult, radiusResult, officeResult, lateToleranceResult] = await Promise.allSettled([
          SystemService.getGeneralSetting("IS_LOCATION_GEOFENCE_ENABLED"),
          SystemService.getGeneralSetting("MAX_RADIUS"),
          SystemService.getGeneralSetting("LATITUDE_LONGITUDE"),
          SystemService.getGeneralSetting("LATE_TOLERANCE_MINUTES"),
        ]);

        // Geofence enabled
        if (geofenceResult.status === "fulfilled") {
          const raw = String(geofenceResult.value).trim().toLowerCase();
          const isOff = raw === "off" || raw === "false" || raw === "0" || raw === "no";
          const isOn = raw === "on" || raw === "true" || raw === "1" || raw === "yes";
          setIsGeofenceEnabled(isOff ? false : isOn ? true : true);
        } else {
          // default aman: aktifkan validasi jika setting gagal dibaca
          setIsGeofenceEnabled(true);
        }

        // Radius
        if (radiusResult.status === "fulfilled") {
          const parsedRadius = Number(String(radiusResult.value).trim());
          if (!Number.isNaN(parsedRadius) && parsedRadius > 0) {
            setRadius(parsedRadius);
          }
        }

        // Office location
        if (officeResult.status === "fulfilled") {
          const raw = String(officeResult.value).trim();
          const parts = raw.split(",").map((p) => p.trim());
          if (parts.length === 2) {
            const lat = Number(parts[0]);
            const lng = Number(parts[1]);
            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
              setOfficeLocation([lat, lng]);
            }
          }
        }

        // Late tolerance (minutes)
        if (lateToleranceResult.status === "fulfilled") {
          const parsed = Number(String(lateToleranceResult.value).trim());
          if (!Number.isNaN(parsed) && parsed >= 0) {
            setLateToleranceMinutes(parsed);
          }
        }
      };

      fetchSettings();
    }, []);

    // Fetch lokasi user
    useEffect(() => {
      // Kalau geofence dimatikan, jangan minta izin lokasi & reset state.
      if (isGeofenceEnabled === false) {
        setUserLocation(null);
        setDistanceToOffice(null);
        setIsWithinRadius(false);
        setLocationError(null);
        return;
      }

      // Belum tahu settingnya (loading) => jangan minta izin lokasi dulu.
      if (isGeofenceEnabled === null) {
        return;
      }

      if (!navigator.geolocation) {
        setLocationError("Geolocation tidak didukung browser ini.");
        return;
      }
      const geoSuccess = (pos: GeolocationPosition) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);
        setLocationError(null);
      };
      const geoError = (_err: GeolocationPositionError) => {
        setLocationError("Gagal mendapatkan lokasi. Aktifkan layanan lokasi di perangkat Anda.");
        setUserLocation(null);
      };
      const watchId = navigator.geolocation.watchPosition(geoSuccess, geoError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
      return () => navigator.geolocation.clearWatch(watchId);
    }, [isGeofenceEnabled]);

    const refreshLocation = () => {
      if (isGeofenceEnabled !== true) return;
      if (!navigator.geolocation) {
        setLocationError("Geolocation tidak didukung browser ini.");
        return;
      }

      setIsRefreshingLocation(true);
      setLocationError(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation([latitude, longitude]);
          setLocationError(null);
          setIsRefreshingLocation(false);
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
          setIsRefreshingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    };
    // Hitung jarak ke kantor & validasi radius
    useEffect(() => {
      if (isGeofenceEnabled !== true) {
        setDistanceToOffice(null);
        setIsWithinRadius(false);
        return;
      }

      if (userLocation) {
        const dist = haversine(userLocation[0], userLocation[1], officeLocation[0], officeLocation[1]);
        setDistanceToOffice(dist);
        setIsWithinRadius(dist <= radius);
      } else {
        setDistanceToOffice(null);
        setIsWithinRadius(false);
      }
    }, [userLocation, officeLocation, radius, isGeofenceEnabled]);
  const navigate = useNavigate();
  const {
    checkIn,
    checkOut,
    todayAttendance,
    loading: attendanceLoading,
    error: attendanceError,
    fetchTodayAttendance
  } = useAttendance();

  const {
    workingDayToday,
    loading: systemLoading,
    error: systemError,
    fetchWorkingDayToday
  } = useSystem();

  const [now, setNow] = useState(getNow());

  // const [userLocation, setUserLocation] = useState<[number, number] | null>(
  //   null
  // );
  // const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const theme = useTheme();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState<"success" | "error">(
    "success"
  );
  // const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  // const [isWithinRadius, setIsWithinRadius] = useState<boolean | null>(null);
  // const [distanceToOffice, setDistanceToOffice] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionLocked, setActionLocked] = useState<boolean>(false);
  const [pendingRedirect, setPendingRedirect] = useState<boolean>(false);
  const redirectTimerRef = useRef<number | null>(null);
  const redirectedRef = useRef<boolean>(false);
  // const [imageFile, setImageFile] = useState<File | null>(null);
  const [isCheckOut, setIsCheckOut] = useState<boolean>(false);
  const [showOutsideRadiusDialog, setShowOutsideRadiusDialog] = useState(false);
  // const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  // const [isGettingLocation, setIsGettingLocation] = useState(false);
  // const [isHighAccuracy, setIsHighAccuracy] = useState(false);

  // const videoRef = useRef<HTMLVideoElement | null>(null);
  const isMounted = useRef<boolean>(true);
  // // const isInitializing = useRef<boolean>(false);
  // const mapRef = useRef<L.Map | null>(null);

  // const officeLocation: [number, number] = [
  //   parseFloat(import.meta.env.VITE_OFFICE_LAT),
  //   parseFloat(import.meta.env.VITE_OFFICE_LNG),
  // ];

  // const maxRadius = parseInt(import.meta.env.VITE_MAX_RADIUS, 10);

  // // Stop the camera stream function
  // const stopCameraStream = () => {
  //   if (videoStream) {
  //     videoStream.getTracks().forEach((track) => {
  //       if (track.readyState === "live") {
  //         track.stop();
  //       }
  //     });
  //     setVideoStream(null);
  //     if (videoRef.current) {
  //       videoRef.current.srcObject = null;
  //     }
  //   }
  // };

  // // Initialize the camera
  // const initializeCamera = async () => {
  //   if (!isMounted.current) {
  //     return;
  //   }

  //   if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  //     showNotification("Your browser does not support camera access.", "error");
  //     return;
  //   }

  //   if (videoStream || isInitializing.current) {
  //     return;
  //   }

  //   isInitializing.current = true;

  //   try {
  //     const stream = await navigator.mediaDevices.getUserMedia({
  //       video: {
  //         facingMode: "user", // Use front camera
  //         width: { ideal: 1280 },
  //         height: { ideal: 720 },
  //       },
  //     });
  //     setVideoStream(stream);

  //     if (videoRef.current && isMounted.current) {
  //       videoRef.current.srcObject = stream;
  //       const playPromise = videoRef.current.play();
  //       if (playPromise !== undefined) {
  //         playPromise
  //           .then(() => {
  //             // Video playback started successfully
  //           })
  //           .catch((error) => {
  //             if (!(error.name === "AbortError")) {
  //               showNotification("Error playing camera stream.", "error");
  //             }
  //           });
  //       }
  //     }
  //   } catch (error) {
  //     showNotification(
  //       "Unable to access camera. Please allow camera permissions in your browser settings.",
  //       "error"
  //     );
  //   } finally {
  //     isInitializing.current = false;
  //   }
  // };

  // // Get user location with options
  // const getUserLocation = (enableHighAccuracy: boolean = false) => {
  //   if (!navigator.geolocation) {
  //     showNotification(
  //       "Geolocation is not supported by this browser.",
  //       "error"
  //     );
  //     return;
  //   }

  //   setIsGettingLocation(true);
  //   setIsHighAccuracy(enableHighAccuracy);

  //   const options: PositionOptions = {
  //     enableHighAccuracy,
  //     timeout: enableHighAccuracy ? 30000 : 10000, // 30s for high accuracy, 10s for normal
  //     maximumAge: enableHighAccuracy ? 0 : 30000, // No cache for high accuracy
  //   };

  //   navigator.geolocation.getCurrentPosition(
  //     (position) => {
  //       const userLoc: [number, number] = [
  //         position.coords.latitude,
  //         position.coords.longitude,
  //       ];
  //       setUserLocation(userLoc);
  //       setLocationAccuracy(position.coords.accuracy);

  //       const distance = calculateDistance(
  //         userLoc[0],
  //         userLoc[1],
  //         officeLocation[0],
  //         officeLocation[1]
  //       );
  //       setDistanceToOffice(distance);
  //       setIsWithinRadius(distance <= maxRadius);
  //       setIsGettingLocation(false);

  //       // Pan map to new location if map is available
  //       if (mapRef.current) {
  //         mapRef.current.setView(userLoc, 16);
  //       }

  //       showNotification(
  //         `Location updated ${enableHighAccuracy ? "(High Accuracy)" : ""
  //         }. Accuracy: ${Math.round(position.coords.accuracy)}m`,
  //         "success"
  //       );
  //     },
  //     (error) => {
  //       setIsGettingLocation(false);
  //       let errorMessage = "Error accessing your location.";

  //       switch (error.code) {
  //         case error.PERMISSION_DENIED:
  //           errorMessage =
  //             "Location access denied. Please enable location services.";
  //           break;
  //         case error.POSITION_UNAVAILABLE:
  //           errorMessage = "Location information is unavailable.";
  //           break;
  //         case error.TIMEOUT:
  //           errorMessage = "Location request timed out. Please try again.";
  //           break;
  //       }

  //       showNotification(errorMessage, "error");
  //     },
  //     options
  //   );
  // };

  // // Handle location button click
  // const handleLocationButtonClick = () => {
  //   getUserLocation(true); // Always use high accuracy when manually requested
  // };

  // Consolidated useEffect for initialization and cleanup
  useEffect(() => {
    // isMounted.current = true;

    // Fetch attendance and get initial location
    fetchTodayAttendance();
    fetchWorkingDayToday();
    // getUserLocation(false); // Start with normal accuracy

    // // Initialize camera only if no captured image
    // if (!capturedImage) {
    //   initializeCamera();
    // }

    return () => {
      // isMounted.current = false;
      // stopCameraStream();
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, []);

  // Check if user has already checked in and set the mode
  useEffect(() => {
    if ((todayAttendance?.checkInTime || todayAttendance?.isForgotCheckIn) && !todayAttendance?.checkOutTime) {
      setIsCheckOut(true);
    } else {
      setIsCheckOut(false);
    }
  }, [todayAttendance]);

  // Show error notification from attendance context
  useEffect(() => {
    if (attendanceError) {
      showNotification(attendanceError, "error");
    }
  }, [attendanceError]);

    // Show error notification from system context
  useEffect(() => {
    if (systemError) {
      showNotification(systemError, "error");
    }
  }, [systemError]);

  useEffect(() => {
    const timer = setInterval(() => setNow(getNow), 1000);
    return () => clearInterval(timer);
  }, []);

  // // Show dialog when user is outside radius and has captured image
  // useEffect(() => {
  //   if (capturedImage && isWithinRadius === false) {
  //     setShowOutsideRadiusDialog(true);
  //   }
  // }, [capturedImage, isWithinRadius]);

  // // Calculate distance between two points using the Haversine formula
  // const calculateDistance = (
  //   lat1: number,
  //   lon1: number,
  //   lat2: number,
  //   lon2: number
  // ): number => {
  //   const R = 6371e3; // Earth's radius in meters
  //   const φ1 = (lat1 * Math.PI) / 180;
  //   const φ2 = (lat2 * Math.PI) / 180;
  //   const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  //   const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  //   const a =
  //     Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
  //     Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  //   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  //   return R * c; // Distance in meters
  // };

  const showNotification = (message: string, severity: "success" | "error") => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setShowAlert(true);
  };

  const TOAST_DURATION_MS = 4000;

  const redirectOnce = () => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;

    if (redirectTimerRef.current !== null) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }

    setPendingRedirect(false);
    if (isMounted.current) {
      navigate("/dashboard");
    }
  };

  const handleToastClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") return;
    setShowAlert(false);

    if (pendingRedirect) {
      redirectOnce();
    }
  };

  const handleBackClick = () => {
    // stopCameraStream();
    navigate("/dashboard");
  };

  // const handleCameraCapture = () => {
  //   if (!videoStream || !videoRef.current) {
  //     showNotification("No camera stream available.", "error");
  //     return;
  //   }

  //   const canvas = document.createElement("canvas");
  //   const context = canvas.getContext("2d");
  //   if (!context) {
  //     showNotification("Failed to capture image.", "error");
  //     return;
  //   }

  //   const videoElement = videoRef.current;
  //   canvas.width = videoElement.videoWidth;
  //   canvas.height = videoElement.videoHeight;

  //   // Flip the image horizontally to correct the mirror effect
  //   context.translate(canvas.width, 0);
  //   context.scale(-1, 1);

  //   context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  //   const imageURL = canvas.toDataURL("image/jpeg");
  //   setCapturedImage(imageURL);

  //   canvas.toBlob(
  //     (blob) => {
  //       if (blob) {
  //         const file = new File([blob], "check-in-photo.jpg", {
  //           type: "image/jpeg",
  //         });
  //         setImageFile(file);
  //       }
  //     },
  //     "image/jpeg",
  //     0.8
  //   );

  //   stopCameraStream();
  // };

  // const resetCamera = () => {
  //   setCapturedImage(null);
  //   setImageFile(null);
  //   setShowOutsideRadiusDialog(false);
  //   if (isMounted.current) {
  //     initializeCamera();
  //   }
  // };

  const handleLeaveRequest = () => {
    // stopCameraStream();
    navigate("/leave-request-form");
  };

  const handleDialogClose = () => {
    setShowOutsideRadiusDialog(false);
  };

  const handleStayOnPage = () => {
    setShowOutsideRadiusDialog(false);
  };

  const submitAttendance = async () => {
    // Wajib lokasi untuk MASUK (sesuai requirement)
    if (!isCheckOut && isGeofenceEnabled === null) {
      showNotification("Memuat pengaturan lokasi...", "error");
      return;
    }

    if (!isCheckOut && isGeofenceEnabled === true && (!userLocation || !isWithinRadius)) {
      showNotification(
        locationError
          ? locationError
          : !userLocation
            ? "Silakan aktifkan layanan lokasi untuk presensi."
            : `Lokasi Anda di luar radius ${radius}m.`,
        "error"
      );
      return;
    }

    if (isSubmitting || actionLocked) return;
    setIsSubmitting(true);

    try {
      // allow redirect again for this submission
      redirectedRef.current = false;
      if (isCheckOut) {
        const checkOutData: CheckOutDto = {
          latitude: userLocation?.[0] ?? 0,
          longitude: userLocation?.[1] ?? 0,
          notes: "", // Empty string instead of notes
        };
        await checkOut(checkOutData);
        showNotification("Check-out successful!", "success");
      } else {
        const checkInData: CheckInDto = {
          latitude: userLocation?.[0] ?? 0,
          longitude: userLocation?.[1] ?? 0,
          notes: "", // Empty string instead of notes
        };
        await checkIn(checkInData);
        showNotification("Check-in successful!", "success");
      }

      // Stop showing loading spinner, but keep the action locked
      // until the toast is closed (auto-hide or manual close).
      setIsSubmitting(false);
      setActionLocked(true);
      setPendingRedirect(true);

      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
      redirectTimerRef.current = window.setTimeout(() => {
        redirectOnce();
      }, TOAST_DURATION_MS);
    } catch (error) {
      // Error handling
      setIsSubmitting(false);
      setActionLocked(false);
    } finally {
      // no-op: isSubmitting is managed above
    }
  };

  const canCheckIn = !todayAttendance?.checkInTime && !todayAttendance?.isForgotCheckIn;
  const canCheckOut = (todayAttendance?.checkInTime || todayAttendance?.isForgotCheckIn) && !todayAttendance?.checkOutTime;

  const lateMinutesForCheckout = React.useMemo(() => {
    if (!isCheckOut) return null;
    if (!workingDayToday?.workEnd) return null;

    const workEndParts = String(workingDayToday.workEnd).split(":");
    if (workEndParts.length < 2) return null;

    const workEndHour = Number(workEndParts[0]);
    const workEndMinute = Number(workEndParts[1]);
    if (Number.isNaN(workEndHour) || Number.isNaN(workEndMinute)) return null;

    const scheduledEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      workEndHour,
      workEndMinute,
      0,
      0
    );

    const diffMs = now.getTime() - scheduledEnd.getTime();
    const lateMinutes = Math.floor(diffMs / 60000);
    return lateMinutes > 0 ? lateMinutes : 0;
  }, [isCheckOut, workingDayToday?.workEnd, now]);

  const effectiveLateMinutesForCheckout = React.useMemo(() => {
    if (!isCheckOut) return null;

    const fromAttendance = (todayAttendance as any)?.lateMinutes;
    const parseLateMinutes = (value: unknown): number | null => {
      if (typeof value === "number" && Number.isFinite(value)) return value;
      if (typeof value === "string") {
        const parsed = Number(value.trim());
        return Number.isFinite(parsed) ? parsed : null;
      }
      if (Array.isArray(value) && value.length > 0) {
        return parseLateMinutes(value[0]);
      }
      return null;
    };

    const parsedLateMinutes = parseLateMinutes(fromAttendance);
    if (parsedLateMinutes !== null) {
      return Math.max(0, Math.floor(parsedLateMinutes));
    }

    return lateMinutesForCheckout;
  }, [isCheckOut, todayAttendance?.lateMinutes, lateMinutesForCheckout]);

  const showLateWithinToleranceInfo =
    isCheckOut &&
    lateToleranceMinutes > 0 &&
    effectiveLateMinutesForCheckout !== null &&
    effectiveLateMinutesForCheckout > 0 &&
    effectiveLateMinutesForCheckout < lateToleranceMinutes;

  const suggestedCheckoutTime = React.useMemo(() => {
    if (!showLateWithinToleranceInfo) return null;
    if (!workingDayToday?.workEnd) return null;
    if (effectiveLateMinutesForCheckout === null) return null;

    const workEndParts = String(workingDayToday.workEnd).split(":");
    if (workEndParts.length < 2) return null;

    const workEndHour = Number(workEndParts[0]);
    const workEndMinute = Number(workEndParts[1]);
    if (Number.isNaN(workEndHour) || Number.isNaN(workEndMinute)) return null;

    const scheduledEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      workEndHour,
      workEndMinute,
      0,
      0
    );

    const suggested = new Date(scheduledEnd);
    suggested.setMinutes(suggested.getMinutes() + effectiveLateMinutesForCheckout);
    return formatTime(suggested);
  }, [showLateWithinToleranceInfo, workingDayToday?.workEnd, effectiveLateMinutesForCheckout, now]);
  const actionButtonDisabled =
    attendanceLoading ||
    systemLoading ||
    // !capturedImage ||
    isSubmitting ||
    actionLocked ||
    (isCheckOut ? !canCheckOut : !canCheckIn) ||
    (!canCheckIn && !canCheckOut) ||
    (!isCheckOut && (
      isGeofenceEnabled === null ||
      (isGeofenceEnabled === true && (!userLocation || !isWithinRadius))
    ));

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        bgcolor: "#f5f5f5",
      }}
    >
      <Box
        sx={{
          bgcolor: "primary.main",
         height: "4vh",
          p: 2,
          color: "white",
          display: "flex",
          alignItems: "center",
        }}
      >
        <IconButton color="inherit" onClick={handleBackClick}>
          <ArrowBack />
        </IconButton>
        <Typography
          variant="h6"
          sx={{ flexGrow: 1, textAlign: "center", mr: 4 }}
        >
          Presensi
        </Typography>
      </Box>

      <Container
        maxWidth="sm"
        sx={{
         minHeight: "95svh", // 🔑 FIX utama
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          px: 2,
          py: 3,
        }}
      >
        <Paper
          elevation={2}
          sx={{
            width: "100%",
            borderRadius: 2,
            p: 2.5,
            display: "flex",
            flexDirection: "column",
            gap: 1, // ✅ ganti space-between
          }}
        >
          {/* STATUS */}
          <Box textAlign="center">
            <Typography variant="body1" fontWeight="bold" mb={2}>
              Presensi Hari Ini
            </Typography>

            <Divider />
            <Typography variant="body2" color="text.secondary" mt={3}>
              {formatDate(now)}
            </Typography>
            <Typography variant="h4" fontWeight={700} mt={2}>
              {formatTime(now)}{" "}
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
              >
                WIB
              </Typography>
            </Typography>

            {/* <Typography
              variant="body2"
              color="success.main"
              mt={0.5}
            >
              ● Sudah Absen
            </Typography> */}
          </Box>

          {/* JAM KERJA */}
          <Box textAlign="center" mt={1}>
            <Typography variant="body2" color="text.secondary">
              Jam Kerja Hari Ini
            </Typography>
            <Typography fontWeight={600}>{workingDayToday?.workStart} – {workingDayToday?.workEnd}</Typography>
          </Box>

          {/* VALIDATOR LOKASI (MAP + STATUS) */}
          {isGeofenceEnabled === true && (
            <Box mt={2}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Typography variant="body2" fontWeight={700}>
                  Validasi Lokasi
                </Typography>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={refreshLocation}
                  disabled={isRefreshingLocation}
                  startIcon={
                    isRefreshingLocation ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <MyLocation />
                    )
                  }
                  sx={{ textTransform: "none" }}
                >
                  Refresh Lokasi
                </Button>
              </Box>

              <Box sx={{ borderRadius: 2, overflow: "hidden" }}>
                <MapContainer
                  center={userLocation || officeLocation}
                  zoom={16}
                  scrollWheelZoom={false}
                  style={{ height: 200, width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <Circle
                    center={officeLocation}
                    radius={radius}
                    pathOptions={{
                      color: theme.palette.primary.main,
                      fillColor: theme.palette.primary.main,
                      fillOpacity: 0.15,
                    }}
                  />

                  <Marker position={officeLocation}>
                    <Tooltip direction="top" offset={[-15, 0]} opacity={0.8} permanent>
                      KPU Kota Batu
                    </Tooltip>
                    <Popup>Kantor (radius {radius} m)</Popup>
                  </Marker>

                  {userLocation && (
                    <Marker position={userLocation}>
                      <Tooltip direction="top" offset={[-15, 0]} opacity={0.8} permanent>
                        Anda
                      </Tooltip>
                      <Popup>Lokasi Anda</Popup>
                    </Marker>
                  )}
                </MapContainer>
              </Box>

              <Typography
                variant="caption"
                display="block"
                mt={1}
                color={
                  isWithinRadius ? theme.palette.success.main : theme.palette.error.main
                }
              >
                {locationError
                  ? locationError
                  : !userLocation
                    ? "Mencari lokasi... (aktifkan layanan lokasi untuk MASUK)"
                    : isWithinRadius
                      ? `Lokasi valid. Jarak ke kantor: ${distanceToOffice?.toFixed(0)} m`
                      : `Di luar radius ${radius} m. Jarak: ${distanceToOffice?.toFixed(0)} m`}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mt={0.5}
                textAlign="left"
              >
                Toleransi keterlambatan {lateToleranceMinutes} menit
              </Typography>
            </Box>
          )}

          {/* ACTION BUTTON */}
          <Box mt={2}>
            {showLateWithinToleranceInfo && (
              <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2 }}>
                Anda telat {effectiveLateMinutesForCheckout} menit (toleransi {lateToleranceMinutes} menit).{suggestedCheckoutTime ? ` Disarankan pulang pada: ${suggestedCheckoutTime} WIB untuk mengganti.` : ""}
              </Alert>
            )}
            <Button
              fullWidth
              size="large"
              variant="contained"
              startIcon={isCheckOut ? <LogoutRounded /> : <SendRounded />}
              onClick={submitAttendance}
              disabled={actionButtonDisabled}
              sx={{
                height: 56,
                borderRadius: 2,
                fontWeight: 600,
                bgcolor: isCheckOut ? "#ff9800" : theme.palette.success.main,
                py: 1.5,
                textTransform: "none",
                "&:hover": {
                  bgcolor: isCheckOut ? "#f57c00" : theme.palette.success.dark,
                },
                "&.Mui-disabled": { bgcolor: "#ccc", color: "#666" },
              }}
            >
              {attendanceLoading || isSubmitting ? (
                <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
              ) : isCheckOut ? (
                "PULANG"
              ) : (
                "MASUK"
              )}
            </Button>

            {/* kalau sudah masuk, ganti jadi PULANG */}
            {/* <Button color="error">PULANG</Button> */}
          </Box>

          {/* CATATAN */}
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
            mt={2}
          >
            Pastikan waktu sudah sesuai sebelum melakukan presensi.
          </Typography>
        </Paper>

        {/* Main action button */}
        {/* <Button
          variant="contained"
          // startIcon={
          //   capturedImage ? (
          //     isCheckOut ? (
          //       <LogoutRounded />
          //     ) : (
          //       <SendRounded />
          //     )
          //   ) : (
          //     <CameraAlt />
          //   )
          // }
          onClick={submitAttendance}
          disabled={
            (actionButtonDisabled || isWithinRadius === false)
          }
          sx={{
            bgcolor: isCheckOut ? "#ff9800" : "primary.main",
            borderRadius: 6,
            py: 1.5,
            textTransform: "none",
            "&:hover": { bgcolor: isCheckOut ? "#f57c00" : "primary.dark" },
            "&.Mui-disabled": { bgcolor: "#ccc", color: "#666" },
          }}
        >
          {attendanceLoading || isSubmitting ? (
            <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
          ) : (
            isWithinRadius === false ? (
              "Tidak Dapat Presensi"
            ) : isCheckOut ? (
              "Check Out"
            ) : (
              "Check In"
            )
          )}
        </Button> */}
      </Container>
      <BottomNav />

      {/* Outside Radius Dialog */}
      <Dialog
        open={showOutsideRadiusDialog}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            pb: 1,
            color: "#d32f2f",
          }}
        >
          <LocationOff sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant="h6" component="span" fontWeight="bold">
            Lokasi di Luar Radius
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mb: 2 }}>
            {/* <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
              Anda berada di luar radius kantor
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Jarak Anda dari kantor:{" "}
              <strong>{Math.round(distanceToOffice || 0)}m</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Presensi hanya dapat dilakukan dalam radius {maxRadius}m dari
              kantor. Jika Anda perlu bekerja dari lokasi lain, silakan ajukan
              permohonan izin.
            </Typography> */}
          </Box>
        </DialogContent>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "stretch",
            px: 3,
            pb: 3,
            gap: 1,
          }}
        >
          <Button
            onClick={handleStayOnPage}
            variant="outlined"
            fullWidth
            sx={{
              borderRadius: 2,
              textTransform: "none",
              justifyContent: "center",
            }}
          >
            Keluar
          </Button>
          <Button
            onClick={handleLeaveRequest}
            variant="contained"
            startIcon={<Assignment />}
            fullWidth
            sx={{
              borderRadius: 2,
              textTransform: "none",
              justifyContent: "center",
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "#1565c0" },
            }}
          >
            Ajukan Izin
          </Button>
        </Box>
      </Dialog>

      <Snackbar
        open={showAlert}
        autoHideDuration={TOAST_DURATION_MS}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleToastClose}
          severity={alertSeverity}
          sx={{ width: "100%" }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PresensiPage;
