import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://umabghwiudwsmbcxmdlt.supabase.co"; // ganti dengan URL projectmu
const supabaseKey = "sb_publishable_j8TreDRpFS441x6X0iYCgA_5hQFkHg6"; // jangan pakai secret key!

export const supabase = createClient(supabaseUrl, supabaseKey);
