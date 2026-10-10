# Parking nav

A small wireframe for one drive plus a place to park. No maps API key.

**Trip:** Silver Lake, Los Angeles → Grand Central Market, downtown LA.

The map draws that drive, then garages and lots the driver could use. Each option has a name, a type (garage or lot), a sample price, and a combined time: drive from Silver Lake, plus time to park, plus the walk to the market. Sort the list by faster or cheaper, or jump to those two with the tiles under the sort control.

Prices and minutes are labeled sample data for a Saturday afternoon, not live rates. The lines follow downtown streets. Tiles are OpenStreetMap, so the map needs a network connection and does not need a key.

## Run

From this folder:

```bash
npm install
npm start
```

Open the URL Vite prints, usually http://127.0.0.1:5173.

## Sample options

| Option | Type | Price | Drive + park + walk |
| --- | --- | --- | --- |
| Broadway Market Garage | Garage | $22 | 23 min (fastest) |
| Grand Central Square Garage | Garage | $26 | 26 min |
| 4th & Main Surface Lot | Lot | $8 | 28 min (cheapest) |
| Spring Street Auto Lot | Lot | $11 | 30 min |
| Pershing Square Garage | Garage | $16 | 32 min |

Selecting an option redraws the drive so it ends at that spot, adds a dotted walk to the market, and updates the price and total time in the panel.
