// utils/time.ts
export const getNow = () => new Date('2025-11-20T07:08:20');
  /* ================= HELPERS ================= */

export  const formatDate = (date: Date) =>
    date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

 export const formatTime = (date: Date) =>
    date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

 export const formatShortTime = (value?: Date | string) => {
    if (!value) return "--:--";
    return new Date(value).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
