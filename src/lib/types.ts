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
 * grind_size / extraction_seconds are numeric columns — pg serialises them
 * as strings, but freshly POSTed payloads may carry numbers.
 */
export interface DialInLog {
  id: string;
  bean_id: string;
  grind_size: string | number;
  extraction_seconds: string | number;
  basket_type: string;
  notes: string | null;
  is_best: boolean;
  logged_at: string;
}
