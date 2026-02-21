import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      emotion,
      emo_key,
      intensity_start,
      intensity_end,
      wave_duration,
      wave_completed,
      presence_avg
    } = req.body;

    // basic validation (keeps junk out of your data)
    if (
      !emotion ||
      intensity_start == null ||
      intensity_end == null
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { error } = await supabase
      .from('tide_sessions')
      .insert([
        {
          emotion,
          emo_key,
          intensity_start,
          intensity_end,
          wave_duration,
          wave_completed,
          presence_avg
        }
      ]);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Database insert failed' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
