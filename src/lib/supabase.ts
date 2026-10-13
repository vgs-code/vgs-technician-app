import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mpjzvniouurkmcdqhprw.supabase.co";
const supabasePublishableKey = "sb_publishable_9RK1zCcRIolMTYSUMhWGSw_XxqioAur";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
