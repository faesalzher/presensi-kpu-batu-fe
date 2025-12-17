// =========================
//  DEMO MODE DATA PROVIDER
// =========================

import { Attendance, GeoLocation } from "../types/attendance";
import { User as UserAuth, LoginResponse } from "../types/auth";
import { User } from "../types/users";
import { Correction, CorrectionQueryParams } from "../types/corrections";
import { LeaveRequest, LeaveRequestStatus, LeaveRequestType } from "../types/leave-requests";
import { StatisticsSummary } from "../types/statistics";
import { Department } from "../types/departments";


// -------------------------
//  Dummy User
// -------------------------
export const dummyUserAuth: UserAuth = {
  guid: "d1e0ee83-35b9-4ba2-858a-3eb2d778a093",
  fullName: "Demo User",
  email: "demo.user@example.com",
  profileImage: "",
  role: "kasubag",
  department: "Information Technology",
};

export const dummyUser: User = {
  guid: "d1e0ee83-35b9-4ba2-858a-3eb2d778a093",
  fullName: "Demo User",
  email: "demo.user@example.com",
  nip: "199801012345",
  phoneNumber: "081234567890",
  profileImage: null,
  profileImageUrl: "https://picsum.photos/200", // contoh foto random
  role: "kasubag",
  department: "Information Technology",
  position: "System Administrator",
  isActive: true,

  additionalInfo: {
    birthDate: "1998-01-01",
    address: "Jl. Demo Raya No. 123, Kota Contoh",
    emergencyContact: "089876543210",
  },

  createdAt: new Date("2024-01-01T10:00:00Z"),
  updatedAt: new Date("2024-01-15T15:30:00Z"),
};



// -------------------------
//  Dummy Login Response
// -------------------------
export const dummyLoginResponse: LoginResponse = {
  access_token: "demo-access-token-123",
  refresh_token: "demo-refresh-token-456",
  user: {
    guid: dummyUser.guid,
    fullName: dummyUser.fullName,
    email: dummyUser.email,
    role: dummyUser.role,
    profileImage: dummyUser.profileImage || undefined,
    department: dummyUser.department,
  },
};

// -------------------------
//  Dummy Leave Requests
// -------------------------
export const dummyLeaveRequests: LeaveRequest[] = [
  {
    guid: "LEAVE-REQ-001",
    userId: "USER-001",
    departmentId: "DEPT-IT",
    type: LeaveRequestType.LEAVE,
    startDate: new Date("2025-11-10"),
    endDate: new Date("2025-11-12"),
    reason: "Liburan keluarga",
    attachmentId: "ATTACH-001",
    status: LeaveRequestStatus.APPROVED,
    reviewedById: "ADMIN-001",
    reviewedAt: new Date("2025-11-05T10:00:00Z"),
    comments: "Disetujui, selamat berlibur!",
    createdAt: new Date("2025-11-01T09:00:00Z"),
    updatedAt: new Date("2025-11-05T10:00:00Z"),

    attachment: {
      guid: "ATTACH-001",
      fileName: "cuti_maret_2024.pdf",
      originalName: "cuti_maret_2024.pdf",
      mimeType: "application/pdf",
      size: 204800,
    },

    userName: "Demo User",
    departmentName: "Information Technology",
    reviewerName: "HR Admin",
  },
];

export const dummyLeaveRequest: LeaveRequest =
  {
    guid: "LEAVE-REQ-001",
    userId: "USER-001",
    departmentId: "DEPT-IT",
    type: LeaveRequestType.LEAVE,
    startDate: new Date("2025-11-10"),
    endDate: new Date("2025-11-12"),
    reason: "Liburan keluarga",
    attachmentId: "ATTACH-001",
    status: LeaveRequestStatus.APPROVED,
    reviewedById: "ADMIN-001",
    reviewedAt: new Date("2025-11-05T10:00:00Z"),
    comments: "Disetujui, selamat berlibur!",
    createdAt: new Date("2025-11-01T09:00:00Z"),
    updatedAt: new Date("2025-11-05T10:00:00Z"),

    attachment: {
      guid: "ATTACH-001",
      fileName: "cuti_maret_2024.pdf",
      originalName: "cuti_maret_2024.pdf",
      mimeType: "application/pdf",
      size: 204800,
    },

    userName: "Demo User",
    departmentName: "Information Technology",
    reviewerName: "HR Admin",
  };
// -------------------------
//  Dummy Correction Requests
// -------------------------
export const dummyCorrections: Correction[] = [
  {
    guid: "CORR-001",
    userId: "USER-001",
    departmentId: "DEPT-IT",
    attendanceId: "ATT-001",
    type: "TIME_IN",
    requestDate: new Date("2025-11-10T08:05:00Z"),
    reason: "Fingerprint error saat masuk kerja",
    status: "PENDING",
    createdAt: new Date("2025-11-10T08:10:00Z"),
    updatedAt: new Date("2025-11-10T08:10:00Z"),
  },
];

export const dummyCorrection: Correction = 
  {
    guid: "CORR-001",
    userId: "USER-001",
    departmentId: "DEPT-IT",
    attendanceId: "ATT-001",
    type: "TIME_IN",
    requestDate: new Date("2025-11-10T08:05:00Z"),
    reason: "Fingerprint error saat masuk kerja",
    status: "PENDING",
    createdAt: new Date("2025-11-10T08:10:00Z"),
    updatedAt: new Date("2025-11-10T08:10:00Z"),
  };
// -------------------------
//  Dummy Attendance
// -------------------------
export const dummyAttendance: Attendance = {
  guid: "ATT-001",
  userId: dummyUser.guid,
  date: new Date("2025-11-15"),
  checkInTime: undefined,
  checkInLocation: undefined,
  checkInPhotoId: "PHOTO-IN-001",
  checkInNotes: "On time, fingerprint OK",

  checkOutTime: undefined,
  checkOutLocation: undefined,
  checkOutPhotoId: "PHOTO-OUT-001",
  checkOutNotes: "Pulang tepat waktu",

  workHours: 8.75,
  status: "PRESENT",
  verified: true,
  verifiedBy: "ADMIN-001",
  verifiedAt: new Date("2025-11-15T17:00:00Z"),

  departmentId: "DEPT-IT",
  createdAt: new Date("2025-11-15T08:00:00Z"),
  updatedAt: new Date("2025-11-15T17:00:00Z"),
};

function randomTime(baseHour: number, varianceMinutes: number) {
  const minutes = baseHour * 60 + Math.floor(Math.random() * varianceMinutes);
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

// function randomLocation(): GeoLocation {
//   return {
//     latitude: -7.9797 + Math.random() * 0.001,
//     longitude: 112.6304 + Math.random() * 0.001,
//   };
// }

export const dummyAttendances: Attendance[] = Array.from({ length: 30 }).map(
  (_, i) => {
    const day = i + 1;
    const date = new Date(`2025-11-${String(day).padStart(2, "0")}`);

    // Random status
    const statusPool = ["present", "late", "absent", "remote_working", "official_travel", "on_leave"];
    
    const status = statusPool[Math.floor(Math.random() * statusPool.length)];

    // Default values
    let checkInTime: Date | undefined = undefined;
    let checkOutTime: Date | undefined = undefined;
    let workHours: number | undefined = undefined;
    let checkInLocation: GeoLocation | undefined = undefined;
    let checkOutLocation: GeoLocation | undefined = undefined;
    let checkInPhotoId: string | undefined = undefined;
    let checkOutPhotoId: string | undefined = undefined;
    let checkInNotes: string | undefined = undefined;
    let checkOutNotes: string | undefined = undefined;

    const ci = randomTime(status === "present" ? 7.5 : 8.3, 30); // earlier if present
    const co = randomTime(16.3, 40);

    const dateString = `2024-03-${String(day).padStart(2, "0")}`;

    if (status === "present" || status === "late") {
      const [hIn, mIn] = ci.split(":").map(Number);
      const [hOut, mOut] = co.split(":").map(Number);

      checkInTime = new Date(dateString);
      checkInTime.setHours(hIn, mIn, 0);

      checkOutTime = new Date(dateString);
      checkOutTime.setHours(hOut, mOut, 0);

      const diffMs = checkOutTime.getTime() - checkInTime.getTime();
      workHours = Math.round((diffMs / 1000 / 3600) * 100) / 100;
    }

    if (status === "remote") {
      workHours = 7.5;
      checkInNotes = "WFH";
    }

    if (status === "official_travel") {
      workHours = 8;
      checkInNotes = "Dinas luar";
    }

    // ABSENT → no workHours

    return {
      guid: `ATT-${String(day).padStart(3, "0")}`,
      userId: "USER-001",
      date,

      checkInTime,
      checkInLocation,
      checkInPhotoId,
      checkInNotes,

      checkOutTime,
      checkOutLocation,
      checkOutPhotoId,
      checkOutNotes,

      workHours,
      status,

      verified: Math.random() > 0.3, // some verified, some not
      verifiedBy: "ADMIN-001",
      verifiedAt:
        Math.random() > 0.3
          ? new Date(`2025-11-${String(day).padStart(2, "0")}T18:00:00Z`)
          : undefined,

      departmentId: "DEPT-IT",
      createdAt: new Date(`2025-11-${String(day).padStart(2, "0")}T08:00:00Z`),
      updatedAt: new Date(`2025-11-${String(day).padStart(2, "0")}T18:00:00Z`),
    };
  }
);

// -------------------------
//  Dummy Correction Query Params
// -------------------------
export const dummyCorrectionQueryParams: CorrectionQueryParams = {
  userId: dummyUser.guid,
  departmentId: "DEPT-IT",
  status: "PENDING",
  startDate: new Date("2025-11-01"),
  endDate: new Date("2025-11-31"),
  page: 1,
  limit: 10,
};

export const dummyStatisticsSummary: StatisticsSummary = {
  totalDays: 30,
  present: 22,
  absent: 2,
  late: 3,
  earlyDeparture: 1,
  remoteWorking: 2,
  onLeave: 1,
  officialTravel: 1,

  totalWorkHours: 180,
  averageWorkHours: 7.5,
  totalAttendances: 22,

  records: [
    {
      date: "2025-11-01",
      checkInTime: "07:55",
      checkOutTime: "16:30",
      workHours: 8.5,
      status: "PRESENT",
      checkInLocation: "Politeknik Negeri IT",
      checkInNotes: "On time",
      verified: true,
    },
    {
      date: "2025-11-02",
      checkInTime: "08:20",
      checkOutTime: "16:40",
      workHours: 8,
      status: "LATE",
      checkInLocation: "Main Gate",
      checkInNotes: "Telat karena macet",
      verified: true,
    },
    {
      date: "2025-11-03",
      checkInTime: "08:05",
      checkOutTime: "16:00",
      workHours: 7.8,
      status: "PRESENT",
      checkInLocation: "Campus Lobby",
      checkInNotes: "",
      verified: true,
    },
    {
      date: "2025-11-04",
      status: "REMOTE_WORKING",
      workHours: 7.5,
      verified: false,
      checkInLocation: "Home",
      checkInNotes: "WFH",
    },
    {
      date: "2025-11-05",
      status: "ON_LEAVE",
      workHours: 0,
      verified: true,
    },
  ],
};

export const dummyDepartment: Department[] = [{
  guid: "DEPT-IT",
  name: "Information Technology",
  code: "IT",
  headId: "USER-ADMIN-001",
  memberIds: ["USER-001", "USER-002", "USER-003"],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}];




// =========================
//  DEMO MODE FLAG
// =========================
export const isDemoMode =
  import.meta.env.VITE_DEMO_MODE === "true";

