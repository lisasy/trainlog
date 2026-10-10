import "leaflet/dist/leaflet.css";
import "./style.css";
import L from "leaflet";
import {
  cheapestSpot,
  fastestSpot,
  marketDriveMin,
  spots,
  toMarket,
  totalMin,
  trip,
  type Spot,
} from "./data";

type SortKey = "time" | "price";

const map = L.map("map", {
  zoomControl: false,
  attributionControl: true,
}).setView([34.07, -118.26], 13);

L.control.zoom({ position: "topright" }).addTo(map);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 19,
}).addTo(map);

const routeLayer = L.layerGroup().addTo(map);
const pinMarkers = new Map<string, L.Marker>();

let selectedId: string | null = null;
let sortKey: SortKey = "time";

const selectionEl = document.querySelector<HTMLElement>("#selection")!;
const nameEl = document.querySelector<HTMLElement>("#selection-name")!;
const typeEl = document.querySelector<HTMLElement>("#selection-type")!;
const kickerEl = document.querySelector<HTMLElement>("#selection-kicker")!;
const priceEl = document.querySelector<HTMLElement>("#selection-price")!;
const timeEl = document.querySelector<HTMLElement>("#selection-time")!;
const breakdownEl = document.querySelector<HTMLElement>("#selection-breakdown")!;
const compareEl = document.querySelector<HTMLElement>("#selection-compare")!;
const clearBtn = document.querySelector<HTMLButtonElement>("#clear")!;
const listEl = document.querySelector<HTMLElement>("#list")!;
const compareWrap = document.querySelector<HTMLElement>("#compare")!;
const sortTimeBtn = document.querySelector<HTMLButtonElement>("#sort-time")!;
const sortPriceBtn = document.querySelector<HTMLButtonElement>("#sort-price")!;

function boundsPadding(): L.FitBoundsOptions {
  const narrow = window.matchMedia("(max-width: 760px)").matches;
  if (narrow) {
    const sheet = Math.min(window.innerHeight * 0.58, 560);
    return {
      paddingTopLeft: L.point(28, 56),
      paddingBottomRight: L.point(28, sheet + 28),
    };
  }
  return {
    paddingTopLeft: L.point(440, 40),
    paddingBottomRight: L.point(40, 40),
  };
}

function walkLine(spot: Spot): L.LatLngExpression[] {
  const parked = spot.drive[spot.drive.length - 1];
  return [parked, ...spot.walk];
}

function showRoute(spot: Spot | null): void {
  routeLayer.clearLayers();
  const drive = spot ? spot.drive : toMarket;
  const casing = {
    color: "#ffffff",
    weight: 10,
    opacity: 0.95,
    lineJoin: "round" as const,
    lineCap: "round" as const,
  };
  L.polyline(drive, casing).addTo(routeLayer);
  L.polyline(drive, {
    color: "#1a73e8",
    weight: 5,
    opacity: 1,
    lineJoin: "round",
    lineCap: "round",
  }).addTo(routeLayer);

  const bounds = L.latLngBounds(drive);
  if (spot) {
    const walk = walkLine(spot);
    L.polyline(walk, {
      ...casing,
      weight: 8,
      dashArray: "0 14",
    }).addTo(routeLayer);
    L.polyline(walk, {
      color: "#188038",
      weight: 5,
      opacity: 1,
      dashArray: "0 14",
      lineCap: "round",
      lineJoin: "round",
    }).addTo(routeLayer);
    bounds.extend(L.latLngBounds(walk));
  }
  map.fitBounds(bounds, boundsPadding());
}

function markerIcon(kind: "start" | "end"): L.DivIcon {
  return L.divIcon({
    className: "endpoint-wrap",
    html: `<div class="endpoint endpoint-${kind}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function parkingIcon(spot: Spot): L.DivIcon {
  const label = `${spot.name}, ${spot.type}, $${spot.price}, ${totalMin(spot)} minutes`;
  return L.divIcon({
    className: "park-pin",
    html: `<button type="button" class="pin-btn" aria-label="${escapeAttr(label)}"><span class="pin-face ${spot.type}">P</span></button>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function escapeAttr(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
}

function addEndpoints(): void {
  const start = toMarket[0];
  const end = toMarket[toMarket.length - 1];
  L.marker(start, { icon: markerIcon("start"), interactive: false, keyboard: false })
    .bindTooltip(trip.origin, {
      permanent: true,
      direction: "right",
      offset: [10, 0],
      className: "place-tip",
    })
    .addTo(map);
  L.marker(end, { icon: markerIcon("end"), interactive: false, keyboard: false })
    .bindTooltip(trip.destination, {
      permanent: true,
      direction: "top",
      offset: [0, -12],
      className: "place-tip",
    })
    .addTo(map);
}

function addParkingPins(): void {
  for (const spot of spots) {
    const at = spot.drive[spot.drive.length - 1];
    const marker = L.marker(at, {
      icon: parkingIcon(spot),
      zIndexOffset: 100,
    })
      .bindTooltip(`${spot.name} · $${spot.price} · ${totalMin(spot)} min`, {
        direction: "top",
        offset: [0, -16],
        className: "spot-tip",
        opacity: 1,
      })
      .addTo(map);
    marker.on("click", () => select(spot.id));
    pinMarkers.set(spot.id, marker);
  }
}

function syncPins(): void {
  for (const [id, marker] of pinMarkers) {
    const face = marker.getElement()?.querySelector(".pin-face");
    const on = id === selectedId;
    face?.classList.toggle("is-selected", on);
    marker.setZIndexOffset(on ? 400 : 100);
    if (on) marker.openTooltip();
    else marker.closeTooltip();
  }
}

function sortedSpots(): Spot[] {
  const list = [...spots];
  list.sort((a, b) => {
    if (sortKey === "time") {
      return totalMin(a) - totalMin(b) || a.price - b.price || a.name.localeCompare(b.name);
    }
    return a.price - b.price || totalMin(a) - totalMin(b) || a.name.localeCompare(b.name);
  });
  return list;
}

function typeLabel(spot: Spot): string {
  return spot.type === "garage" ? "Garage" : "Lot";
}

function compareSentence(spot: Spot): string {
  const fastest = fastestSpot();
  const cheapest = cheapestSpot();
  const slower = totalMin(spot) - totalMin(fastest);
  const extra = spot.price - cheapest.price;
  const timePart =
    spot.id === fastest.id ? "Fastest option" : `${slower} min slower than the fastest`;
  const pricePart =
    spot.id === cheapest.id ? "cheapest option" : `$${extra} more than the cheapest`;
  return `${timePart} · ${pricePart}`;
}

function renderSelection(): void {
  const spot = spots.find((item) => item.id === selectedId) ?? null;
  selectionEl.classList.toggle("is-set", Boolean(spot));
  clearBtn.hidden = !spot;
  if (!spot) {
    kickerEl.textContent = "Parking";
    nameEl.textContent = "No spot selected";
    typeEl.textContent = "";
    priceEl.textContent = "—";
    timeEl.textContent = "—";
    breakdownEl.textContent = `Drive to the market is about ${marketDriveMin} min. Pick a garage or lot to add parking and the walk.`;
    compareEl.textContent = "";
    return;
  }
  const total = totalMin(spot);
  kickerEl.textContent = "Selected";
  nameEl.textContent = spot.name;
  typeEl.textContent = `${typeLabel(spot)} · ${spot.address}`;
  priceEl.textContent = `$${spot.price}`;
  timeEl.textContent = `${total} min`;
  breakdownEl.textContent = `${spot.driveMin} min drive · ${spot.parkMin} min to park · ${spot.walkMin} min walk`;
  compareEl.textContent = compareSentence(spot);
}

function badgeRow(spot: Spot): HTMLElement | null {
  const fastest = fastestSpot();
  const cheapest = cheapestSpot();
  const badges: HTMLElement[] = [];
  if (spot.id === fastest.id) badges.push(el("span", "badge badge-fast", "Fastest"));
  if (spot.id === cheapest.id) badges.push(el("span", "badge badge-cheap", "Cheapest"));
  if (badges.length === 0) return null;
  const row = el("span", "card-badges");
  for (const badge of badges) row.append(badge);
  return row;
}

function renderCompare(): void {
  compareWrap.replaceChildren(
    compareButton(fastestSpot(), "Faster", "badge-fast"),
    compareButton(cheapestSpot(), "Cheaper", "badge-cheap"),
  );
}

function compareButton(spot: Spot, label: string, badgeClass: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `compare-card pressable${spot.id === selectedId ? " is-selected" : ""}`;
  button.setAttribute("aria-pressed", String(spot.id === selectedId));
  button.append(
    el("span", `badge ${badgeClass}`, label),
    el("span", "compare-name", spot.name),
    el("span", "compare-meta", `${totalMin(spot)} min · $${spot.price}`),
  );
  button.addEventListener("click", () => select(spot.id));
  return button;
}

function renderList(): void {
  const scroll = listEl.scrollTop;
  const cards = sortedSpots().map((spot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `card pressable${spot.id === selectedId ? " is-selected" : ""}`;
    button.role = "listitem";
    button.setAttribute("aria-pressed", String(spot.id === selectedId));
    button.dataset.spotId = spot.id;
    button.append(
      el("span", "card-name", spot.name),
      el("span", "card-time", `${totalMin(spot)} min`),
      el("span", "card-meta", `${typeLabel(spot)} · ${spot.address}`),
      el("span", "card-price", `$${spot.price}`),
    );
    const badges = badgeRow(spot);
    if (badges) button.append(badges);
    button.addEventListener("click", () => select(spot.id));
    return button;
  });
  listEl.replaceChildren(...cards);
  listEl.scrollTop = scroll;
}

function renderSort(): void {
  sortTimeBtn.setAttribute("aria-pressed", String(sortKey === "time"));
  sortPriceBtn.setAttribute("aria-pressed", String(sortKey === "price"));
}

function render(): void {
  renderSort();
  renderSelection();
  renderCompare();
  renderList();
  syncPins();
}

function select(id: string): void {
  selectedId = id;
  const spot = spots.find((item) => item.id === id) ?? null;
  showRoute(spot);
  render();
}

function clearSelection(): void {
  selectedId = null;
  showRoute(null);
  render();
}

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

sortTimeBtn.addEventListener("click", () => {
  sortKey = "time";
  render();
});

sortPriceBtn.addEventListener("click", () => {
  sortKey = "price";
  render();
});

clearBtn.addEventListener("click", () => {
  clearSelection();
});

addEndpoints();
addParkingPins();
showRoute(null);
render();

window.addEventListener("resize", () => {
  map.invalidateSize();
  const spot = spots.find((item) => item.id === selectedId) ?? null;
  showRoute(spot);
});
