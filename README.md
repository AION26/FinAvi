# ✈️ FinAvi

### Real-Time Flight Tracking & Risk Assessment Dashboard

FinAvi is a web-based flight tracking and risk assessment application designed to provide a clear, real-time view of an aircraft's position, route, surrounding traffic, weather conditions, and potential conflict-zone risks.

The application combines live aircraft data with route information, weather intelligence, geographic calculations, and a map-based interface to provide a unified flight-awareness dashboard.

> **Note:** FinAvi is an informational and visualization tool. Its risk scores should not be treated as official aviation safety guidance or a substitute for information from aviation authorities, airlines, air traffic control, or professional flight operations.

---

## ✨ Features

### 🛫 Real-Time Flight Tracking

Search for a flight using its callsign and retrieve live aircraft information, including:

* Current latitude and longitude
* Altitude
* Ground speed
* Heading
* Aircraft type
* Flight status
* Airline information
* Origin and destination
* Flight path

Live aircraft information is retrieved from public ADS-B data services.

### 🗺️ Interactive Flight Map

FinAvi uses Leaflet to visualize aircraft movement geographically.

The map provides:

* Current aircraft position
* Flight path visualization
* Origin and destination information
* Nearby aircraft visualization
* Continuous position updates while tracking

Users can optionally enable **nearby traffic** to display simulated nearby aircraft.

### 🌦️ Weather Risk Assessment

Weather conditions around the aircraft's current position are retrieved and converted into a risk score.

The weather assessment considers:

* Wind speed
* Precipitation
* Cloud coverage
* Temperature
* Humidity

These factors are combined into a normalized weather-risk score from **1–10**.

### ⚠️ Conflict-Zone Risk Analysis

FinAvi includes geographic analysis of predefined conflict-zone data.

Risk is evaluated across three areas:

1. **Airport Risk** — conflict zones near the origin or destination
2. **Flight Path Risk** — conflict zones close to the projected route
3. **Current Position Risk** — conflict zones near the aircraft's current location

The application uses geographic distance and great-circle calculations to determine proximity.

### 📊 Overall Risk Score

Weather and geographic risk are combined into an overall flight-risk indicator.

The dashboard presents:

* Weather risk
* Conflict/war-zone risk
* Overall risk
* Nearest detected conflict zone

### 🔄 Automatic Updates

While tracking is enabled, FinAvi periodically refreshes flight information.

If live aircraft data becomes temporarily unavailable, the application can simulate aircraft movement using the aircraft's current speed and heading so the visualization can continue updating.

### 🕘 Recent Flights

Previously tracked flights are kept in the current session, allowing users to quickly select and revisit recently searched flights.

### 🚨 Crisis Mode

FinAvi includes a crisis-mode interface intended to emphasize risk-related information during situations where geographic or environmental threats are particularly relevant.

---

## 🏗️ Architecture

FinAvi is built as a client-side Next.js application with modular components for flight tracking, mapping, weather analysis, risk calculation, and UI presentation.

```text
┌───────────────────────────────┐
│          FinAvi UI            │
│       Next.js / React         │
└───────────────┬───────────────┘
                │
       ┌────────▼────────┐
       │ Flight Tracker  │
       │   Dashboard     │
       └────────┬────────┘
                │
     ┌──────────┼───────────┐
     │          │           │
     ▼          ▼           ▼
 Flight      Weather     Conflict
  Data        Data         Data
     │          │           │
     ▼          ▼           ▼
 ADS-B APIs  Open-Meteo  Local JSON
     │          │           │
     └──────────┼───────────┘
                ▼
       ┌────────────────┐
       │ Risk Calculation│
       └───────┬────────┘
               ▼
       ┌────────────────┐
       │ Map + Dashboard│
       └────────────────┘
```

---

## 🧰 Tech Stack

| Technology        | Purpose                       |
| ----------------- | ----------------------------- |
| **Next.js 15**    | Application framework         |
| **React 19**      | UI framework                  |
| **TypeScript**    | Type-safe development         |
| **Tailwind CSS**  | Styling                       |
| **Leaflet**       | Interactive maps              |
| **React Leaflet** | React integration for Leaflet |
| **Recharts**      | Data visualization            |
| **Lucide React**  | Icons                         |
| **Radix UI**      | Accessible UI primitives      |
| **Axios / Fetch** | HTTP requests                 |
| **Open-Meteo**    | Weather data                  |
| **ADS-B.lol**     | Live aircraft data            |
| **ADSBDB**        | Flight route information      |

---

## 📁 Project Structure

```text
FinAvi/
├── app/
│   ├── FlightTracker.tsx       # Main flight tracking application
│   ├── layout.tsx              # Root application layout
│   ├── page.tsx                # Application entry point
│   └── globals.css             # Global styles
│
├── components/
│   ├── flight/                 # Flight dashboard components
│   │   ├── EmptyState.tsx
│   │   ├── FlightSummary.tsx
│   │   ├── PerformanceMetrics.tsx
│   │   ├── RecentFlights.tsx
│   │   ├── RiskAssessment.tsx
│   │   └── WeatherCard.tsx
│   │
│   ├── layout/                 # Application layout
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   │
│   ├── flight-map.tsx          # Interactive Leaflet map
│   └── ui/                     # Reusable UI components
│
├── hooks/                      # React hooks
│
├── lib/
│   ├── fetchFlightData.ts      # Aircraft and route data
│   ├── getWeatherRisk.ts       # Weather retrieval + scoring
│   ├── flightutils.ts          # Geographic/risk calculations
│   └── mock-data.ts            # Mock nearby aircraft
│
├── public/
│   └── newdata25.json          # Conflict-zone dataset
│
├── styles/                     # Additional styles
├── types/                      # TypeScript types
│
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── package-lock.json
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js 18+
* npm, pnpm, or another compatible Node package manager
* Git

### 1. Clone the repository

```bash
git clone https://github.com/AION26/FinAvi.git
cd FinAvi
```

### 2. Install dependencies

Using npm:

```bash
npm install
```

Or using pnpm:

```bash
pnpm install
```

### 3. Start the development server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

### 4. Build for production

```bash
npm run build
```

### 5. Start the production server

```bash
npm start
```

---

## 🛩️ How It Works

### 1. Enter a Flight Callsign

Enter a flight callsign into the search interface.

For example:

```text
UAL123
```

FinAvi normalizes the callsign and attempts to retrieve live aircraft information.

### 2. Retrieve Live Aircraft Data

The application queries an ADS-B data service for the aircraft's current position and telemetry.

The retrieved information can include:

* Latitude
* Longitude
* Altitude
* Ground speed
* Heading
* Aircraft identifier

Route information is retrieved separately when available.

### 3. Calculate Weather Risk

Once the aircraft position is known, FinAvi retrieves weather information for that location.

The weather-risk calculation considers five factors:

```text
Wind       → 30%
Rain       → 25%
Cloud      → 15%
Temperature→ 20%
Humidity   → 10%
```

The resulting score is capped at 10.

### 4. Calculate Geographic Risk

The application loads its conflict-zone dataset and checks the relationship between the flight and known conflict locations.

It evaluates:

```text
Origin / Destination
        │
        ▼
   Airport Risk

Origin ─────────────── Destination
        │
        ▼
    Path Risk

Current Aircraft Position
        │
        ▼
   Current Risk
```

### 5. Combine the Results

The geographic risk calculation uses weighted components:

```text
Airport Risk   → 40%
Flight Path    → 40%
Current Risk   → 20%
```

The resulting risk information is combined with weather risk to produce the dashboard's overall risk indicator.

---

## 🔄 Live Tracking

When tracking is active, FinAvi periodically requests updated aircraft data.

The current implementation refreshes the tracked flight approximately every **6 seconds**.

If live data cannot be retrieved, FinAvi can fall back to calculating a new aircraft position from:

* Current position
* Aircraft speed
* Aircraft heading
* Earth radius

This keeps the visualization moving even when a live update is temporarily unavailable.

---

## 🌍 Data Sources

FinAvi currently relies on external and local data sources.

### Aircraft Data

Live aircraft information is retrieved through:

* ADS-B.lol
* ADSBDB

### Weather Data

Weather information is retrieved from:

* Open-Meteo

### Conflict-Zone Data

Conflict-zone information is loaded from the application's local:

```text
public/newdata25.json
```

Because these are external or manually maintained data sources, availability, accuracy, coverage, and freshness may vary.

---

## 📐 Risk Model

FinAvi's risk model is intended primarily for visualization and experimentation.

### Weather Risk

Weather factors are scored individually and combined using weighted averages.

Example:

```text
Weather Risk =
    Wind Risk        × 0.30
  + Rain Risk        × 0.25
  + Cloud Risk       × 0.15
  + Temperature Risk × 0.20
  + Humidity Risk    × 0.10
```

### Geographic Risk

Geographic risk uses distance calculations based on the Haversine formula and cross-track distance from a great-circle flight path.

This allows FinAvi to identify conflict zones:

* Near airports
* Near the projected route
* Near the aircraft's current location

---

## ⚙️ Configuration

FinAvi currently does not require API keys for its core external data sources.

The application directly consumes publicly accessible endpoints for aircraft and weather information.

If you fork or deploy the project, keep in mind that external APIs may impose:

* Rate limits
* Availability restrictions
* Usage policies
* Data-quality limitations

The application includes retry handling for rate-limited aircraft requests and a short-lived in-memory cache to reduce repeated requests.

---

## 🧪 Development

Useful npm scripts:

```bash
# Start development server
npm run dev

# Build production application
npm run build

# Start production application
npm start

# Run linting
npm run lint
```

The project is written in TypeScript and uses the Next.js App Router.

---

## 🔒 Important Limitations

FinAvi should be considered an **experimental flight-awareness application**, not an operational aviation system.

Risk scores are generated using simplified algorithms and publicly available data. They do not account for every factor involved in real-world aviation safety.

In particular:

* Conflict-zone data may not represent current events.
* Weather data may differ from official aviation weather products.
* ADS-B coverage varies by geographic region.
* Flight route information may be incomplete.
* Risk thresholds are application-defined rather than aviation-industry standards.
* Simulated aircraft movement is only an approximation.
* External APIs may experience outages or rate limits.

**Do not use FinAvi for navigation, dispatch, flight planning, emergency decisions, or other safety-critical aviation operations.**

---

## 🛣️ Future Improvements

Potential areas for future development include:

* [ ] Add authentication and user accounts
* [ ] Add persistent flight history
* [ ] Add selectable historical flight playback
* [ ] Improve aircraft route reconstruction
* [ ] Add more detailed weather layers
* [ ] Add NOTAM integration
* [ ] Add aviation weather products such as METAR/TAF
* [ ] Add configurable risk thresholds
* [ ] Improve conflict-zone data freshness
* [ ] Add airport information and airport-status data
* [ ] Add flight alerts and notifications
* [ ] Add mobile-responsive map controls
* [ ] Add automated tests for risk calculations
* [ ] Add API abstraction/configuration for production deployments
* [ ] Add monitoring and error reporting

---

## 🤝 Contributing

Contributions are welcome.

### Development workflow

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/my-feature
```

3. Make your changes
4. Test the application locally
5. Commit your changes

```bash
git commit -m "Add my feature"
```

6. Push your branch

```bash
git push origin feature/my-feature
```

7. Open a Pull Request

When contributing, please keep changes focused and document any changes to the risk model or external data sources.

---

## 📄 License

No license file is currently included in the repository.

If you intend to distribute or accept contributions to FinAvi, consider adding an explicit open-source license such as MIT, Apache-2.0, or GPL-3.0.

---

## 👨‍💻 Project

**FinAvi**
Real-time flight tracking and risk visualization.

Repository: `AION26/FinAvi`

Built with ❤️ using Next.js, React, TypeScript, Leaflet, and public aviation/weather data.

---

### ⚠️ Disclaimer

FinAvi is provided for educational, research, and visualization purposes only.

The information displayed by this application may be delayed, incomplete, inaccurate, or unavailable. Risk scores are experimental calculations and are **not official aviation safety assessments**.

Always rely on official aviation authorities, air traffic control, airline operations teams, and certified aviation information sources for safety-critical decisions.
