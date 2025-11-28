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

function MapController({ center }) {
  const map = useMap();
  if (center) {
    map.setView(center, 4);
  }
  return null;
}

function App() {
  const [data, setData] = useState([]);
  const [selectedContinent, setSelectedContinent] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const [selectedYear, setSelectedYear] = useState([1906, 2014]);

  // Load CSV
  useEffect(() => {
    Papa.parse("/UFO_dataset.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) =>
        header.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
      complete: (results) => {
        const validData = results.data
          .filter((item) => item.latitude && item.longitude)
          .slice(0, 2000) //only read the first 2000 lines
          .map((item) => {
            const code = item.country?.toUpperCase();
            const continent = countryToContinent[code] || "Unknown";
            const year = parseInt(item.datetime?.split("/")[2]) || null;
            return {
              ...item,
              country: code || "Unknown",
              continent: continent,
              year: year,
            };
          });
        setData(validData);
      },
    });
  }, []);

  // Blink effect for selected record
  useEffect(() => {
    if (!highlightedId) return;
    let count = 0;
    const interval = setInterval(() => {
      count++;
      if (count >= 6) {
        clearInterval(interval);
        setHighlightedId(null);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [highlightedId]);

  // Correct filtering logic
  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (selectedCountry) {
      filtered = filtered.filter((d) => d.country === selectedCountry);
    } else if (selectedContinent) {
      filtered = filtered.filter((d) => d.continent === selectedContinent);
    }

    filtered = filtered.filter(
      (d) => d.year >= selectedYear[0] && d.year <= selectedYear[1]
    );

    return filtered.slice(0, 300);
  }, [data, selectedContinent, selectedCountry, selectedYear]);

  // Data for charts
  const continentData = data.filter((d) => d.continent === selectedContinent);
  const countriesList = [...new Set(continentData.map((d) => d.country))];
  const countryCounts = countriesList.map(
    (country) => continentData.filter((d) => d.country === country).length
  );
  const yearCounts = {};
  continentData.forEach((d) => {
    const year = d.datetime?.split(" ")[0].split("/")[2];
    if (year) yearCounts[year] = (yearCounts[year] || 0) + 1;
  });
  const years = Object.keys(yearCounts).sort((a, b) => a - b);
  const counts = years.map((year) => yearCounts[year]);
  const shapes = [...new Set(continentData.map((d) => d.shape))];
  const shapeCounts = shapes.map(
    (shape) => continentData.filter((d) => d.shape === shape).length
  );

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
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

        {selectedContinent && !selectedCountry && (
          <>
            <h3>{selectedContinent} - Countries</h3>
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

            {/* Charts */}
            <div className="charts">
              <h4>Charts for {selectedContinent}</h4>
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
                options={{ responsive: true }}
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
                options={{
                  responsive: true,
                  scales: {
                    x: { title: { display: true, text: "Year" } },
                    y: {
                      title: { display: true, text: "Number of Sightings" },
                    },
                  },
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
                options={{ responsive: true }}
              />
            </div>
          </>
        )}

        {selectedCountry && (
          <>
            <h3>{selectedCountry} - Records</h3>
            <button onClick={() => setSelectedCountry(null)}>← Back</button>
            {data
              .filter((d) => d.country === selectedCountry)
              .map((item, index) => {
                const isFlashing = highlightedId === item.datetime;
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedRecord(item)}
                    className={`record-item ${isFlashing ? "flash" : ""}`}
                  >
                    <strong>{item.datetime}</strong>
                    <br />
                    {item.city}
                  </div>
                );
              })}
          </>
        )}

        {selectedRecord && (
          <div className="record-details">
            <h4>Record Details</h4>
            <p>
              <strong>Date/Time:</strong> {selectedRecord.datetime}
            </p>
            <p>
              <strong>City:</strong> {selectedRecord.city}
            </p>
            <p>
              <strong>Shape:</strong> {selectedRecord.shape}
            </p>
            <p>
              <strong>Duration:</strong> {selectedRecord.durationseconds}{" "}
              seconds
            </p>
            <p>
              <strong>Comments:</strong> {selectedRecord.comments}
            </p>
          </div>
        )}
      </div>

      {/* Map */}
      <MapContainer center={[38, -97]} zoom={4} className="map-container">
        <TileLayer
          attribution="© OpenStreetMap"
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
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
            selectedRecord && selectedRecord.datetime === item.datetime;
          return (
            <CircleMarker
              key={index}
              center={[lat, lng]}
              radius={5}
              pathOptions={{
                color: isSelected ? "#2196f3" : "#d64541", // blue if selected
                fillColor: isSelected ? "#2196f3" : "#d64541",
                fillOpacity: 0.9,
                stroke: false,
              }}
              eventHandlers={{
                click: () => {
                  setSelectedRecord(item);
                  setHighlightedId(item.datetime);
                },
              }}
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

      {/* TimeSlider */}
      <TimeSlider
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
      />
    </div>
  );
}

export default App;
