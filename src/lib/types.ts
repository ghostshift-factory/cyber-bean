/** A catalogue bean as returned by /api/beans. */
export interface Bean {
  id: string;
  brand: string;
  name: string;
  roast_level: string;
  origin: string;
  created_at: string;
}
