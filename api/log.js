import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  try {
    // Only allow POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    // Basic env checks
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        error: "Missing Supabase env vars",
        missing: {
          SUPABASE_URL: !SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY: !SUPABASE_SERVICE_ROLE_KEY
        }
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const {
      emotion,
      emo_key,
      intensity_start,
      intensity_end,
      wave_duration,
      wave_completed,
      presence_avg
    } = req.body || {};

    // Minimal validation
    if (!emotion || intensity_start == null) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["emotion", "intensity_start"]
      });
    }

    const payload = {
      emotion,
      emo_key: emo_key ?? emotion,
      intensity_start,
      intensity_end: intensity_end ?? null,
      wave_duration: wave_duration ?? null,
      wave_completed: wave_completed ?? null,
      presence_avg: presence_avg ?? null
    };

    const { data, error } = await supabase
      .from("tide_sessions")
      .insert([payload])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message, details: error });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", details: String(err) });
  }
}
