export interface WorkingDayResponse {
  date: string;          // "yyyy-MM-dd"
  isHoliday: boolean;
  type: WorkingDayType;
  workStart: string | null; // "HH:mm" | null
  workEnd: string | null;   // "HH:mm" | null
  message: string;
}

export enum WorkingDayType {
  WORKING_DAY = "WORKING_DAY",
  WEEKEND = "WEEKEND",
  NATIONAL_HOLIDAY = "NATIONAL_HOLIDAY",
  CUTI_BERSAMA = "CUTI_BERSAMA"
}
