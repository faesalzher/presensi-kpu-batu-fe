import { createClient } from "@supabase/supabase-js";

export const supabaseUrl =
	import.meta.env.VITE_SUPABASE_URL ??
	"https://umabghwiudwsmbcxmdlt.supabase.co"; // ganti dengan URL projectmu
export const supabaseKey =
	import.meta.env.VITE_SUPABASE_ANON_KEY ??
	"sb_publishable_j8TreDRpFS441x6X0iYCgA_5hQFkHg6"; // jangan pakai secret key!

export const supabase = createClient(supabaseUrl, supabaseKey);
