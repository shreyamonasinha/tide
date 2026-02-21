// TIDE — Anonymous Session Logger
// Privacy design: NO personal information collected.
// No IP address, no user ID, no device fingerprint, no cookies.
// All fields are behavioral/clinical metrics only.
// Safe for COPPA (anonymous data, no under-13 PII) and FERPA (no student identifiers).

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  let body;
  try { body = req.body ?? JSON.parse(req.body); }
  catch { return res.status(400).json({ error: "Bad JSON" }); }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(500).json({ error: "Missing Supabase env vars" });

  const payload = {
    // ── Core outcome measure ──────────────────────────────
    intensity_start:      body.intensity_start      ?? null,  // SUDS at session start (0–100)
    intensity_end:        body.intensity_end         ?? null,  // SUDS at session end (0–100, null if bailed)
    suds_delta:           (body.intensity_start != null && body.intensity_end != null)
                            ? body.intensity_end - body.intensity_start
                            : null,                           // Computed: negative = improvement

    // ── Engagement / completion ───────────────────────────
    wave_completed:       body.wave_completed        ?? false, // Did they finish the full wave?
    wave_duration_sec:    body.wave_duration_sec     ?? null,  // How long the wave was set to run
    time_in_wave_sec:     body.time_in_wave_sec      ?? null,  // Actual seconds before exit/completion

    // ── Clinical behavioral data ──────────────────────────
    emotion:              body.emotion               ?? null,  // Display label (e.g. "Anxious")
    emo_key:              body.emo_key               ?? null,  // Slug (e.g. "anxious") for grouping

    // ── Presence quality metrics ──────────────────────────
    presence_mean_abs:    body.presence_mean_abs     ?? null,  // Avg deviation from center (0–1)
    presence_pct_present: body.presence_pct_present  ?? null,  // % time in green zone (0–1)
    presence_pct_danger:  body.presence_pct_danger   ?? null,  // % time in red zone (0–1)

    // ── Return rate tracking (anonymous) ─────────────────
    session_id:           body.session_id            ?? null,  // Random UUID generated client-side per session
                                                               // NOT tied to any user identity

    // ── Time context (for usage pattern analysis) ─────────
    // Stored server-side so client clock can't be spoofed.
    // No timezone or precise location — UTC only.
    created_at:           new Date().toISOString(),
    hour_of_day:          new Date().getUTCHours(),           // 0–23 UTC — for time-of-day patterns
    day_of_week:          new Date().getUTCDay(),             // 0=Sun … 6=Sat
  };

  const r = await fetch(`${url}/rest/v1/tide_sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Prefer": "return=minimal"
    },
    body: JSON.stringify(payload),
  });

  if (!r.ok) {
    const t = await r.text();
    return res.status(500).json({ error: "Insert failed", detail: t.slice(0, 600) });
  }

  return res.status(200).json({ ok: true });
}
