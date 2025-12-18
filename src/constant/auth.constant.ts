// auth.constants.ts
export const SESSION_DURATION_KEEP = 7 * 24 * 60 * 60 * 1000; // 7 hari
const ONE_MINUTE = 60 * 1000;
export const SESSION_DURATION_NORMAL = 24 * 60 * ONE_MINUTE; // 1 hari


export const STORAGE_KEYS = {
  KEEP_LOGGED_IN: "keep_logged_in",
  USER: "user",
};
