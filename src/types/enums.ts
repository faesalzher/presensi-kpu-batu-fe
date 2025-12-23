// src/types/enums.ts
export enum UserRole {
  ADMIN = "admin",
  STAF = "staf",
  KASUBAG = "kasubag",
  KASUBAG_SDM = "kasubag sdm",
  STAF_SPIP = "staf spip",
  STAF_KUL = "staf kul",
  SEKRETARIS = "sekretaris",
}

export enum WorkingStatus {
  PRESENT = "present",
  ABSENT = "absent",
  LATE = "late",
  EARLY_DEPARTURE = "early_departure",
  REMOTE_WORKING = "remote_working",
  ON_LEAVE = "on_leave",
  OFFICIAL_TRAVEL = "official_travel",
}

export enum FileCategory {
  ATTENDANCE = "ATTENDANCE",
  PERMISSION = "PERMISSION",
  PROFILE = "PROFILE",
  OTHER = "OTHER",
}