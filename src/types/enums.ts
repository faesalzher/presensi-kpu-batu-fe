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
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "late",
  PROBLEM = "PROBLEM",
  EARLY_DEPARTURE = "EARLY_DEPARTURE",
  REMOTE_WORKING = "REMOTE_WORKING",
  ON_LEAVE = "ON_LEAVE",
  OFFICIAL_TRAVEL = "OFFICIAL_TRAVEL",
}

export enum FileCategory {
  ATTENDANCE = "ATTENDANCE",
  PERMISSION = "PERMISSION",
  PROFILE = "PROFILE",
  OTHER = "OTHER",
}