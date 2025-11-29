import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";

import "leaflet/dist/leaflet.css";
import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import "./App.css";
import TimeSlider from "./TimeSlider.jsx";
import ShapeFilter from "./ShapeFilter.jsx";
import DurationFilter from "./DurationFilter.jsx";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

//
// CONTINENT DATA
//
const continentCenters = {
  Africa: [1.5, 17.3],
  Asia: [34.0479, 100.6197],
  Europe: [54.526, 15.2551],
  NorthAmerica: [54.526, -105.2551],
  Oceania: [-22.7359, 140.0188],
  SouthAmerica: [-8.7832, -55.4915],
};

const countryToContinent = {
  AU: "Oceania",
  CA: "North America",
  DE: "Europe",
  GB: "Europe",
  US: "North America",
};

//
// YEAR PARSER
//
function extractYear(datetime) {
  if (!datetime) return null;
  const parts = datetime.split(" ")[0].split("/");
  if (parts.length !== 3) return null;
  const y = parseInt(parts[2]);
  if (isNaN(y) || y < 1900 || y > 2050) return null;
  return y;
}

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 4);
  }, [center]);
  return null;
}

//
// APP
//
function App() {
  const [data, setData] = useState([]);

  const [selectedShapes, setSelectedShapes] = useState([]);
  const [selectedDuration, setSelectedDuration] = useState([0, 3600]);

  const [selectedContinent, setSelectedContinent] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [selectedYear, setSelectedYear] = useState([1906, 2014]);

  //
  // LOAD CSV — TOP 2000 ROWS ONLY
  //
  useEffect(() => {
    Papa.parse("/UFO_dataset.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
      complete: (results) => {
        const valid = results.data
          .filter((item) => item.latitude && item.longitude)
          .map((item) => {
            const code = item.country?.toUpperCase() || "Unknown";
            return {
              ...item,
              country: code,
              continent: countryToContinent[code] || "Unknown",
              year: extractYear(item.datetime),
              durationSeconds: Number(item.durationseconds) || 0,
            };
          });

        setData(valid.slice(0, 2000));
      },
    });
  }, []);

  //
  // FILTERED DATA (MAP + CHARTS + COUNTRIES)
  //
  const filteredData = useMemo(() => {
    if (data.length === 0) return [];

    let base = [...data];

    // Shape filter
    if (selectedShapes.length === 0) return [];

    base = base.filter((d) =>
      selectedShapes.includes((d.shape || "unknown").toLowerCase().trim())
    );

    // Continent / Country
    if (selectedCountry) {
      base = base.filter((d) => d.country === selectedCountry);
    } else if (selectedContinent) {
      base = base.filter((d) => d.continent === selectedContinent);
    }

    // Year filter
    base = base.filter(
      (d) =>
        d.year !== null &&
        d.year >= selectedYear[0] &&
        d.year <= selectedYear[1]
    );

    // Duration filter
    base = base.filter(
      (d) =>
        d.durationSeconds >= selectedDuration[0] &&
        d.durationSeconds <= selectedDuration[1]
    );

    return base;
  }, [
    data,
    selectedShapes,
    selectedContinent,
    selectedCountry,
    selectedYear,
    selectedDuration,
  ]);

  //
  // CHART DATA (NOW USES filteredData)
  //
  const continentData = filteredData.filter(
    (d) => d.continent === selectedContinent
  );

  const countriesList = [...new Set(continentData.map((d) => d.country))];
  const countryCounts = countriesList.map(
    (country) => continentData.filter((d) => d.country === country).length
  );

  const yearCounts = {};
  continentData.forEach((d) => {
    if (d.year) yearCounts[d.year] = (yearCounts[d.year] || 0) + 1;
  });

  const years = Object.keys(yearCounts).sort((a, b) => a - b);
  const counts = years.map((year) => yearCounts[year]);

  const shapes = [...new Set(continentData.map((d) => d.shape))];
  const shapeCounts = shapes.map(
    (shape) => continentData.filter((d) => d.shape === shape).length
  );

  //
  // RENDER
  //
  return (
    <div className="app-container">
      <div className="sidebar">
        {/* SHAPE FILTER */}
        <ShapeFilter
          data={data}
          selectedShapes={selectedShapes}
          setSelectedShapes={setSelectedShapes}
        />

        {/* DURATION FILTER */}
        <DurationFilter
          data={data}
          selectedDuration={selectedDuration}
          setSelectedDuration={setSelectedDuration}
        />

        {/* CONTINENT SELECT */}
        {!selectedContinent && (
          <>
            <h3>Select a Continent</h3>
            {[...new Set(data.map((d) => d.continent))].map((continent) => (
              <button
                key={continent}
                onClick={() => {
                  setSelectedContinent(continent);
                  setSelectedCountry(null);
                  setSelectedRecord(null);
                }}
              >
                {continent}
              </button>
            ))}
          </>
        )}

        {/* COUNTRY SELECT */}
        {selectedContinent && !selectedCountry && (
          <>
            <h3>{selectedContinent} — Countries</h3>
            <button onClick={() => setSelectedContinent(null)}>← Back</button>

            {countriesList.map((country) => (
              <button
                key={country}
                onClick={() => {
                  setSelectedCountry(country);
                  setSelectedRecord(null);
                }}
              >
                {country}
              </button>
            ))}

            {/* CHARTS */}
            <div className="charts">
              <Bar
                data={{
                  labels: countriesList,
                  datasets: [
                    {
                      label: "Sightings",
                      data: countryCounts,
                      backgroundColor: "#42a5f5",
                    },
                  ],
                }}
              />

              <Line
                data={{
                  labels: years,
                  datasets: [
                    {
                      label: "Sightings per Year",
                      data: counts,
                      borderColor: "#66bb6a",
                      tension: 0.3,
                    },
                  ],
                }}
              />

              <Pie
                data={{
                  labels: shapes,
                  datasets: [
                    {
                      data: shapeCounts,
                      backgroundColor: [
                        "#ef5350",
                        "#ab47bc",
                        "#42a5f5",
                        "#26a69a",
                        "#ffca28",
                      ],
                    },
                  ],
                }}
              />
            </div>
          </>
        )}

        {/* COUNTRY RECORDS */}
        {selectedCountry && (
          <>
            <h3>{selectedCountry} — Records</h3>
            <button onClick={() => setSelectedCountry(null)}>← Back</button>

            {filteredData
              .filter((d) => d.country === selectedCountry)
              .map((item, index) => {
                const isSelected =
                  selectedRecord &&
                  selectedRecord.datetime === item.datetime;

                return (
                  <div key={index} className="record-wrapper">
                    <div
                      className="record-item"
                      onClick={() => setSelectedRecord(item)}
                    >
                      <strong>{item.datetime}</strong>
                      <br />
                      {item.city}
                    </div>

                    {isSelected && (
                      <div className="record-details-inline">
                        <p><strong>Date/Time:</strong> {item.datetime}</p>
                        <p><strong>City:</strong> {item.city}</p>
                        <p><strong>Shape:</strong> {item.shape}</p>
                        <p><strong>Duration:</strong> {item.durationSeconds} sec</p>
                        <p><strong>Comments:</strong> {item.comments}</p>
                      </div>
                    )}
              </div>
            );
          })}
        </>
      )}
    </div>

    {/* MAP */}
    <MapContainer center={[38, -97]} zoom={4} className="map-container">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <MapController
        center={
          selectedContinent && selectedContinent !== "Unknown"
            ? continentCenters[selectedContinent.replace(/\s/g, "")]
            : null
        }
      />

      {filteredData.map((item, index) => {
        const lat = parseFloat(item.latitude);
        const lng = parseFloat(item.longitude);
        if (isNaN(lat) || isNaN(lng)) return null;

        const isSelected =
          selectedRecord &&
          selectedRecord.datetime.trim() === item.datetime.trim();

        return (
          <CircleMarker
            key={index}
            center={[lat, lng]}
            radius={5}
            pathOptions={{
              color: isSelected ? "#2196f3" : "#d64541",
              fillColor: isSelected ? "#2196f3" : "#d64541",
              fillOpacity: 0.9,
              stroke: false,
            }}
            eventHandlers={{ click: () => setSelectedRecord(item) }}
          >
            <Popup>
              <strong>{item.city}</strong>
              <br />
              {item.shape}
              <br />
              {item.datetime}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>

    <TimeSlider selectedYear={selectedYear} setSelectedYear={setSelectedYear} />
  </div>
);
}

export default App;
