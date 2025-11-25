import { countries } from "countries-list";
import "leaflet/dist/leaflet.css";
import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import TimeSlider from "./TimeSlider";

function humanDuration(sec) {
  if (!sec && sec !== 0) return "";
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)} min`;
  if (sec < 86400) return `${(sec / 3600).toFixed(1)} hr`;
  if (sec < 604800) return `${(sec / 86400).toFixed(1)} days`;
  return `${(sec / 2592000).toFixed(1)} months`;
}

function unitToSeconds(value, unit) {
  if (unit === "sec") return value;
  if (unit === "min") return value * 60;
  if (unit === "hr") return value * 3600;
  if (unit === "day") return value * 86400;
  return value;
}

/* ------------------------------- */
const continentMap = {
  AF: "Africa",
  AN: "Antarctica",
  AS: "Asia",
  EU: "Europe",
  NA: "North America",
  OC: "Oceania",
  SA: "South America",
};
/* ------------------------------- */

function App() {
  /* RAW DATA */
  const [data, setData] = useState([]);
  const [debugHeaders, setDebugHeaders] = useState([]);

  /* CONTINENT / COUNTRY */
  const [selectedContinent, setSelectedContinent] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);

  /* RECORD POPUP */
  const [selectedRecord, setSelectedRecord] = useState(null);

  /* YEAR SLIDER */
  const [selectedYear, setSelectedYear] = useState([1906, 2014]);

  /* SHAPES */
  const [shapeOpen, setShapeOpen] = useState(false);
  const [allShapes, setAllShapes] = useState([]);
  const [selectedShapes, setSelectedShapes] = useState([]);
  const [shapeSearch, setShapeSearch] = useState("");

  /* DURATION */
  const [durationOpen, setDurationOpen] = useState(false);
  const [durationEnabled, setDurationEnabled] = useState(false);

  const [minDuration, setMinDuration] = useState(0);
  const [maxDuration, setMaxDuration] = useState(3600);
  const [minUnit, setMinUnit] = useState("sec");
  const [maxUnit, setMaxUnit] = useState("sec");

  const selectedDuration = [
    unitToSeconds(minDuration, minUnit),
    unitToSeconds(maxDuration, maxUnit),
  ];

  /* PRESETS */
  const durationPresets = [
    { label: "0–10 sec", min: 0, max: 10 },
    { label: "10–60 sec", min: 10, max: 60 },
    { label: "1–10 min", min: 60, max: 600 },
    { label: "10–60 min", min: 600, max: 3600 },
    { label: "1–6 hours", min: 3600, max: 21600 },
    { label: "6–24 hours", min: 21600, max: 86400 },
    { label: "1–7 days", min: 86400, max: 604800 },
    { label: "1 week – 1 month", min: 604800, max: 2592000 },
    { label: "Over 1 month", min: 2592000, max: 999999999 },
  ];

  /* Duration summary for collapsed button */
  const durationSummary = durationEnabled
    ? `${humanDuration(selectedDuration[0])} – ${humanDuration(
        selectedDuration[1]
      )}`
    : "OFF";

  /* -------------------- LOAD CSV -------------------- */
  useEffect(() => {
    Papa.parse("/UFO_dataset.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
      complete: (results) => {
        if (results.data.length > 0)
          setDebugHeaders(Object.keys(results.data[0]));

        const cleaned = results.data
          .map((item, index) => {
            /* YEAR FIX */
            let year = null;
            if (item.datetime) {
              const p = item.datetime.split(" ")[0].split("/");
              if (p.length === 3) {
                const y = parseInt(p[2]);
                if (!isNaN(y)) year = y;
              }
            }

            const code = item.country?.toUpperCase();
            const cont = countries[code]?.continent || "Unknown";

            return {
              ...item,
              id: index,
              year,
              durationSeconds: Number(item.durationseconds) || 0,
              shape: item.shape?.toLowerCase().trim() || "unknown",
              continent: continentMap[cont] || "Unknown",
              lat: parseFloat(item.latitude),
              lng: parseFloat(item.longitude),
            };
          })
          .filter((d) => !isNaN(d.lat) && !isNaN(d.lng));

        const shapes = [...new Set(cleaned.map((d) => d.shape))].sort();
        setAllShapes(shapes);
        setSelectedShapes(shapes);

        setData(cleaned);
      },
    });
  }, []);

  /* -------------------- FILTERING -------------------- */
  const filteredData = useMemo(() => {
    if (data.length === 0) return [];

    let base = data.slice(0, 2000);
    base.sort((a, b) => a.id - b.id);

    /* SHAPE */
    base = base.filter((d) => selectedShapes.includes(d.shape));

    /* CONTINENT & COUNTRY */
    if (selectedCountry)
      base = base.filter((d) => d.country === selectedCountry);
    else if (selectedContinent)
      base = base.filter((d) => d.continent === selectedContinent);

    /* YEAR */
    base = base.filter(
      (d) => d.year >= selectedYear[0] && d.year <= selectedYear[1]
    );

    /* DURATION (optional ON/OFF) */
    if (durationEnabled) {
      base = base.filter(
        (d) =>
          d.durationSeconds >= selectedDuration[0] &&
          d.durationSeconds <= selectedDuration[1]
      );
    }

    return base.slice(0, 500);
  }, [
    data,
    selectedShapes,
    selectedContinent,
    selectedCountry,
    selectedYear,
    durationEnabled,
    selectedDuration,
  ]);

  /* -------------------- RENDER -------------------- */

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      {/* SIDEBAR */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          width: 340,
          padding: 15,
          borderRadius: 8,
          background: "white",
          boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
          overflowY: "auto",
          maxHeight: "90vh",
          zIndex: 1000,
          fontFamily: "Arial",
        }}
      >
        {/* DEBUG INFO */}
        <div
          style={{
            background: "#ffebee",
            padding: 10,
            borderRadius: 5,
            marginBottom: 15,
            fontSize: 12,
          }}
        >
          <b>🛠 Debug Info</b>
          <br />
          Columns: {debugHeaders.join(", ")}
          <br /> Valid rows: {data.length}
        </div>

        {/* -------------------- SHAPE DROPDOWN -------------------- */}
        <button
          onClick={() => setShapeOpen(!shapeOpen)}
          style={{
            width: "100%",
            padding: 8,
            textAlign: "left",
            background: "#e8eaf6",
            border: "1px solid #90caf9",
            borderRadius: 4,
            marginBottom: 8,
            cursor: "pointer",
          }}
        >
          Filter Shapes ▾
        </button>

        {shapeOpen && (
          <div
            style={{
              background: "#e8eaf6",
              padding: 10,
              borderRadius: 5,
              marginBottom: 15,
            }}
          >
            <input
              type="text"
              placeholder="Search shapes..."
              value={shapeSearch}
              onChange={(e) => setShapeSearch(e.target.value)}
              style={{
                width: "100%",
                padding: 5,
                marginBottom: 10,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />

            <div style={{ maxHeight: 150, overflowY: "auto" }}>
              {allShapes
                .filter((s) =>
                  s.toLowerCase().includes(shapeSearch.toLowerCase())
                )
                .map((shape) => (
                  <label
                    key={shape}
                    style={{ display: "block", marginBottom: 6 }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedShapes.includes(shape)}
                      onChange={() =>
                        setSelectedShapes((prev) =>
                          prev.includes(shape)
                            ? prev.filter((x) => x !== shape)
                            : [...prev, shape]
                        )
                      }
                    />
                    {" " + shape}
                  </label>
                ))}
            </div>

            <button
              onClick={() => setSelectedShapes(allShapes)}
              style={{ marginTop: 10, marginRight: 10 }}
            >
              Select All
            </button>
            <button onClick={() => setSelectedShapes([])}>Clear</button>
          </div>
        )}

        {/* -------------------- DURATION DROPDOWN -------------------- */}

        <button
          onClick={() => setDurationOpen(!durationOpen)}
          style={{
            width: "100%",
            padding: 8,
            textAlign: "left",
            background: "#e8eaf6",
            border: "1px solid #90caf9",
            borderRadius: 4,
            marginBottom: 8,
            cursor: "pointer",
          }}
        >
          Filter Duration ({durationSummary}) ▾
        </button>

        {durationOpen && (
          <div
            style={{
              background: "#e8eaf6",
              padding: 10,
              borderRadius: 5,
              marginBottom: 15,
            }}
          >
            {/* Enable / Disable */}
            <label style={{ display: "block", marginBottom: 10 }}>
              <input
                type="checkbox"
                checked={durationEnabled}
                onChange={() => setDurationEnabled(!durationEnabled)}
              />{" "}
              Enable Duration Filter
            </label>

            {/* WHEN ENABLED, SHOW CONTROLS */}
            {durationEnabled && (
              <>
                {/* MIN */}
                <div style={{ marginBottom: 10 }}>
                  Min:{" "}
                  <input
                    type="number"
                    value={minDuration}
                    onChange={(e) =>
                      setMinDuration(Number(e.target.value))
                    }
                    style={{ width: 60 }}
                  />
                  <select
                    value={minUnit}
                    onChange={(e) => setMinUnit(e.target.value)}
                    style={{ marginLeft: 5 }}
                  >
                    <option value="sec">sec</option>
                    <option value="min">min</option>
                    <option value="hr">hr</option>
                    <option value="day">day</option>
                  </select>
                </div>

                {/* MAX */}
                <div style={{ marginBottom: 20 }}>
                  Max:{" "}
                  <input
                    type="number"
                    value={maxDuration}
                    onChange={(e) =>
                      setMaxDuration(Number(e.target.value))
                    }
                    style={{ width: 60 }}
                  />
                  <select
                    value={maxUnit}
                    onChange={(e) => setMaxUnit(e.target.value)}
                    style={{ marginLeft: 5 }}
                  >
                    <option value="sec">sec</option>
                    <option value="min">min</option>
                    <option value="hr">hr</option>
                    <option value="day">day</option>
                  </select>
                </div>

                {/* PRESETS */}
                <h4>Presets</h4>
                {durationPresets.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setMinUnit("sec");
                      setMaxUnit("sec");
                      setMinDuration(p.min);
                      setMaxDuration(p.max);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      marginBottom: 6,
                      padding: 6,
                      borderRadius: 4,
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </>
            )}
          </div>
        )}

        {/* -------------------- CONTINENT / COUNTRY NAV -------------------- */}

        {!selectedContinent && (
          <div>
            <h3>Select a Continent</h3>
            {[...new Set(data.map((d) => d.continent))].map((c) => (
              <button
                key={c}
                onClick={() => {
                  setSelectedContinent(c);
                  setSelectedCountry(null);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: 8,
                  margin: "5px 0",
                  background: "#e3f2fd",
                  borderRadius: 4,
                  border: "1px solid #90caf9",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {selectedContinent && !selectedCountry && (
          <div>
            <button
              onClick={() => setSelectedContinent(null)}
              style={{
                padding: 6,
                marginBottom: 10,
                borderRadius: 4,
                background: "#f5f5f5",
              }}
            >
              ← Back
            </button>

            {[...new Set(
              data
                .filter((d) => d.continent === selectedContinent)
                .map((d) => d.country)
            )].map((country) => (
              <button
                key={country}
                onClick={() => setSelectedCountry(country)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: 8,
                  margin: "5px 0",
                  background: "#e8f5e9",
                  borderRadius: 4,
                  border: "1px solid #81c784",
                }}
              >
                {country}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* -------------------- MAP -------------------- */}
      <MapContainer
        center={[38, -97]}
        zoom={4}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="© OpenStreetMap"
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {filteredData.map((item) => (
          <CircleMarker
            key={item.id}
            center={[item.lat, item.lng]}
            radius={5}
            pathOptions={{
              color: "#d64541",
              fillColor: "#d64541",
              fillOpacity: 0.8,
            }}
          >
            <Popup>
              <strong>{item.city}</strong>
              <br />
              {item.shape}
              <br />
              {item.datetime}
              <br />
              Duration: {humanDuration(item.durationSeconds)}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <TimeSlider selectedYear={selectedYear} setSelectedYear={setSelectedYear} />
    </div>
  );
}


export default App;d
