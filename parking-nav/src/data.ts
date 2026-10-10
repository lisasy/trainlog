import rawRoutes from "./routes.json";

/** Leaflet order: latitude, longitude. */
export type LatLng = [number, number];

export type SpotType = "garage" | "lot";

export interface Spot {
  id: string;
  name: string;
  type: SpotType;
  address: string;
  /** Sample price for a 2-hour stay, in dollars. */
  price: number;
  /** Sample Saturday-afternoon drive from Silver Lake, in minutes. */
  driveMin: number;
  /** Minutes to pull in, park, and get out of the car. */
  parkMin: number;
  /** Minutes to walk from the stall to Grand Central Market. */
  walkMin: number;
  drive: LatLng[];
  walk: LatLng[];
}

interface RouteFile {
  toMarket: LatLng[];
  spots: Record<string, { drive: LatLng[]; walk: LatLng[] }>;
}

const routes = rawRoutes as unknown as RouteFile;

/**
 * Labeled sample data for one trip. Street lines follow a real driving
 * network; prices and minutes are a Saturday-afternoon scenario, not live
 * rates or traffic.
 */
const DETAILS: Omit<Spot, "drive" | "walk">[] = [
  {
    id: "broadway",
    name: "Broadway Market Garage",
    type: "garage",
    address: "328 S Broadway",
    price: 22,
    driveMin: 17,
    parkMin: 3,
    walkMin: 3,
  },
  {
    id: "grand-central-square",
    name: "Grand Central Square Garage",
    type: "garage",
    address: "308 S Hill St",
    price: 26,
    driveMin: 18,
    parkMin: 4,
    walkMin: 4,
  },
  {
    id: "main-street-lot",
    name: "4th & Main Surface Lot",
    type: "lot",
    address: "410 S Main St",
    price: 8,
    driveMin: 19,
    parkMin: 2,
    walkMin: 7,
  },
  {
    id: "spring-street-lot",
    name: "Spring Street Auto Lot",
    type: "lot",
    address: "356 S Spring St",
    price: 11,
    driveMin: 18,
    parkMin: 2,
    walkMin: 10,
  },
  {
    id: "pershing-square",
    name: "Pershing Square Garage",
    type: "garage",
    address: "530 S Olive St",
    price: 16,
    driveMin: 20,
    parkMin: 4,
    walkMin: 8,
  },
];

export const spots: Spot[] = DETAILS.map((detail) => {
  const geometry = routes.spots[detail.id];
  if (!geometry) {
    throw new Error(`Missing route geometry for ${detail.id}`);
  }
  return { ...detail, drive: geometry.drive, walk: geometry.walk };
});

/** Drive to the market curb. Parking is not included. */
export const marketDriveMin = 18;

export const toMarket: LatLng[] = routes.toMarket;

export const trip = {
  origin: "Silver Lake",
  destination: "Grand Central Market",
};

export function totalMin(spot: Spot): number {
  return spot.driveMin + spot.parkMin + spot.walkMin;
}

export function fastestSpot(list: Spot[] = spots): Spot {
  return list.reduce((best, spot) =>
    totalMin(spot) < totalMin(best) ||
    (totalMin(spot) === totalMin(best) && spot.price < best.price)
      ? spot
      : best,
  );
}

export function cheapestSpot(list: Spot[] = spots): Spot {
  return list.reduce((best, spot) =>
    spot.price < best.price ||
    (spot.price === best.price && totalMin(spot) < totalMin(best))
      ? spot
      : best,
  );
}
