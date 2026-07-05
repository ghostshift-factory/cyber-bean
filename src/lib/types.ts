/** A catalogue bean as returned by /api/beans. */
export interface Bean {
  id: string;
  brand: string;
  name: string;
  roast_level: string;
  origin: string;
  created_at: string;
}

/**
 * A dial-in shot log as returned by /api/beans/[id]/logs.
 * grind_size / dose_in_g / yield_out_g / extraction_seconds are numeric
 * columns — pg serialises them as strings, but freshly POSTed payloads may
 * carry numbers. taste_rating is a smallint (★1–5), so pg returns a number.
 */
export interface DialInLog {
  id: string;
  bean_id: string;
  grind_size: string | number;
  dose_in_g: string | number;
  yield_out_g: string | number;
  extraction_seconds: string | number;
  basket_type: string;
  taste_rating: number;
  taste_balance: string | null;
  notes: string | null;
  is_best: boolean;
  logged_at: string;
}
