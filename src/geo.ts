// Campus geofences and coordinate validation for Explore. No React imports, so it can be tested on its own.
//
// Rule: a place gets a map pin only if (1) its coordinates are valid numbers, (2) its campus is VERIFIED, and
// (3) the point lies inside that campus's verified bounding box (and within the Explore radius of its centre).
// Anything else is kept in the list view with no pin. Coordinates are never guessed, swapped or "nudged" to fit.

export interface LatLng { lat: number; lng: number }
export interface Bounds { south: number; west: number; north: number; east: number }

export interface Campus {
  id: string;
  name: string;
  address: string;
  /** Only `true` once `center` and `bounds` were checked against a real source (survey, OSM, the school). */
  verified: boolean;
  center?: LatLng;
  /** Campus plus its immediate surroundings (the Explore area). */
  bounds?: Bounds;
  /** Extra guard: farthest a pin may be from `center`. */
  maxKm: number;
  /** Where the numbers came from, so the next person can re-check them. */
  source?: string;
}

/* How to verify TIP Quezon City (the only campus in this app today):
   1. Open openstreetmap.org, find the campus (938 Aurora Blvd. / 20th Avenue, Cubao) and right-click the main gate or
      the middle of the grounds > "Show address" / "Centre map here" to read the lat/lng.
   2. Set `center` to that point and `bounds` to a box around the campus and its immediate surroundings (Explore area).
   3. Fill in `source`, then set `verified: true`.
   Until then the map shows no pins and every place stays in the list.

   Why the old value was dropped: `CAMPUS_COORD = { lat: 14.6096, lng: 121.0536 }` was never checked. Public references put the
   20th Avenue / Aurora Blvd. area of Cubao near lat 14.618 to 14.623 and lng 121.054 to 121.057 (Socorro 14.6179, 121.0558;
   Aurora Tower 14.6230, 121.0539), so that centre sat roughly 1 km south of it, and the 1 km Explore radius was measured from there. */
export const CAMPUSES: Campus[] = [
  {
    id: 'tip-qc',
    name: 'TIP Quezon City',
    address: '938 Aurora Blvd., Cubao, Quezon City',
    verified: true,
    // Centre read from the OpenStreetMap view of the campus search result "Technological Institute of the Philippines" (938 Aurora Blvd.):
    // https://www.openstreetmap.org/search?query=Technological+Institute+of+the+Philippines+Quezon+City&zoom=18#map=18/14.625650/121.061991
    // Checked on the map: Aurora Blvd., 20th Avenue, E. Evangelista St. and the Anonas subway station are around it.
    center: { lat: 14.62565, lng: 121.061991 },
    // Not read from OSM: a box about 500 m each way around the centre (the campus is roughly 200 m across, plus its immediate surroundings).
    // Replace with the real edges if Explore should cover a different area.
    bounds: { south: 14.62115, west: 121.057491, north: 14.63015, east: 121.066491 },
    maxKm: 1,
    source: 'Centre from OpenStreetMap (search result map view, zoom 18), supplied 2026-10-29. Bounds are a +/-0.0045 deg box around it.',
  },
];

export const DEFAULT_CAMPUS_ID = 'tip-qc';

/* ---------- Validation ---------- */

export const isFiniteNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** Real WGS84 ranges, and not the (0, 0) "null island" placeholder. */
export function isValidCoord(c: unknown): c is LatLng {
  if (!c || typeof c !== 'object') return false;
  const { lat, lng } = c as Partial<LatLng>;
  if (!isFiniteNum(lat) || !isFiniteNum(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  return !(lat === 0 && lng === 0);
}

export const isValidBounds = (b: unknown): b is Bounds => {
  if (!b || typeof b !== 'object') return false;
  const { south, west, north, east } = b as Partial<Bounds>;
  return [south, west, north, east].every(isFiniteNum) && south! < north! && west! < east! && isValidCoord({ lat: south, lng: west }) && isValidCoord({ lat: north, lng: east });
};

export const inBounds = (c: LatLng, b: Bounds) => c.lat >= b.south && c.lat <= b.north && c.lng >= b.west && c.lng <= b.east;

const rad = (d: number) => (d * Math.PI) / 180;
export function distanceKm(a: LatLng, b: LatLng) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** A campus is usable for pins only when it is verified AND its centre and bounds are valid and consistent. */
export function usableCampus(c: Campus | undefined): c is Campus & { center: LatLng; bounds: Bounds } {
  return !!c && c.verified && isValidCoord(c.center) && isValidBounds(c.bounds) && inBounds(c.center, c.bounds);
}

export const campusById = (id: string | undefined, campuses: Campus[] = CAMPUSES) => campuses.find((c) => c.id === (id ?? DEFAULT_CAMPUS_ID));

/* ---------- Pin resolution ---------- */

export type PinReason = 'no-coord' | 'invalid-coord' | 'unknown-campus' | 'campus-unverified' | 'outside-geofence' | 'swapped-lat-lng';
export type PinResult = { ok: true; coord: LatLng; campus: Campus; kmFromCampus: number } | { ok: false; reason: PinReason };

interface Pinnable { coord?: unknown; campusId?: string }

export function resolvePin(p: Pinnable, campuses: Campus[] = CAMPUSES): PinResult {
  if (p.coord == null) return { ok: false, reason: 'no-coord' };
  if (!isValidCoord(p.coord)) return { ok: false, reason: 'invalid-coord' };
  const campus = campusById(p.campusId, campuses);
  if (!campus) return { ok: false, reason: 'unknown-campus' };
  if (!usableCampus(campus)) return { ok: false, reason: 'campus-unverified' };
  const km = distanceKm(campus.center, p.coord);
  if (inBounds(p.coord, campus.bounds) && km <= campus.maxKm) return { ok: true, coord: p.coord, campus, kmFromCampus: km };
  // Report the classic data bug separately so it is easy to spot in logs. The point is still NOT pinned or auto-corrected.
  if (inBounds({ lat: p.coord.lng, lng: p.coord.lat }, campus.bounds)) return { ok: false, reason: 'swapped-lat-lng' };
  return { ok: false, reason: 'outside-geofence' };
}

export interface Pin<T> { item: T; coord: LatLng; campus: Campus; kmFromCampus: number }

/** Splits items into ones that may be pinned and ones that stay list-only. */
export function partitionPins<T extends Pinnable>(items: T[], campuses: Campus[] = CAMPUSES) {
  const pins: Pin<T>[] = [];
  const unpinned: { item: T; reason: PinReason }[] = [];
  for (const item of items) {
    const r = resolvePin(item, campuses);
    if (r.ok) pins.push({ item, coord: r.coord, campus: r.campus, kmFromCampus: r.kmFromCampus });
    else unpinned.push({ item, reason: r.reason });
  }
  return { pins, unpinned };
}

/** The campuses the map can show (verified only). */
export const mapCampuses = (campuses: Campus[] = CAMPUSES) => campuses.filter(usableCampus);

/** Region to open the map on: the verified campus's own bounds. Undefined when no campus is verified (no map is drawn). */
export function startRegion(campus: Campus | undefined) {
  if (!usableCampus(campus)) return undefined;
  const b = campus.bounds;
  return {
    latitude: (b.north + b.south) / 2, longitude: (b.east + b.west) / 2,
    latitudeDelta: Math.max((b.north - b.south) * 1.2, 0.004), longitudeDelta: Math.max((b.east - b.west) * 1.2, 0.004),
  };
}

export const fmtKm = (km: number) => (km < 0.95 ? `${Math.max(50, Math.round(km * 10) * 100)} m` : `${km.toFixed(1)} km`);