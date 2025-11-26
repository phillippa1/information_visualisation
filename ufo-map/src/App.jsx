import { countries } from "countries-list";
import "leaflet/dist/leaflet.css";
import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import TimeSlider from "./TimeSlider";

//using maptypes from lightning chart but not currently implemented
//MapType.WorldMap;
// Todo: Take the debug info out of the main prototype


// Mapping continent codes to full names- either add a continent map to countries but continents are not included in the data?
// Using https://lightningchart.com/blog/javascript-map-chart-library/#start-page for the mapping of countries
const continentMap = {
  AF: "Africa",
  AN: "Antarctica",
  AS: "Asia",
  EU: "Europe",
  NA: "North America",
  OC: "Oceania",
  SA: "South America",
};


function App() {
  const [data, setData] = useState([]);
  const [debugHeaders, setDebugHeaders] = useState([]); // For debugging: show cleaned headers
  const [selectedContinent, setSelectedContinent] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedYear, setSelectedYear] = useState([1906, 2014]); // range

  useEffect(() => {
    // Load and parse CSV file from public folder
    Papa.parse("/UFO_dataset.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Clean headers: remove spaces and special characters, lowercase
        return header.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      },
      complete: (results) => {
        if (results.data.length > 0) {
          setDebugHeaders(Object.keys(results.data[0]));
        }

        const validData = results.data
          .filter((item) => {
            const lat = item.latitude || item.lat;
            const lng = item.longitude || item.long || item.lng;
            return lat && lng;
          })
          .map((item) => {
            const code = item.country?.toUpperCase();
            const continentCode = countries[code]?.continent || "Unknown";
            return {
              ...item,
              continent: continentMap[continentCode] || "Unknown",
              year: parseInt(item.datetime?.split("/")[2]) || null
            };
          });

        console.log("First cleaned record:", validData[0]);
        setData(validData);
      },
    });
  }, []);

  // Filter data based on selection
  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (selectedCountry) {
      filtered = filtered.filter(d => d.country === selectedCountry);
    } else if (selectedContinent) {
      filtered = filtered.filter(d => d.continent === selectedContinent);
    }

    filtered = filtered.filter(
      d => d.year >= selectedYear[0] && d.year <= selectedYear[1]
    );

    return filtered.slice(0, 300);
  }, [data, selectedContinent, selectedCountry, selectedYear]);

  console.log(filteredData.length, selectedYear);


  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      {/* --- Left Panel --- */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          width: "340px",
          maxHeight: "90vh",
          backgroundColor: "white",
          zIndex: 1000,
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          padding: "15px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* Debug Info */}
        <div
          style={{
            background: "#ffebee",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "15px",
            fontSize: "12px",
          }}
        >
          <strong style={{ color: "#c62828" }}>🛠 Debug Info:</strong>
          <br />
          Loaded columns (Keys):
          <br />
          <code
            style={{
              display: "block",
              marginTop: "5px",
              wordBreak: "break-all",
            }}
          >
            {debugHeaders.join(", ")}
          </code>
          <br />
          Valid records: <strong>{data.length}</strong>
        </div>

        {/* Navigation Panel */}
        {!selectedContinent && (
          <div>
            <h3>Select a Continent</h3>
            {[...new Set(data.map((d) => d.continent))].map((continent) => (
              <button
                key={continent}
                onClick={() => {
                  setSelectedContinent(continent);
                  setSelectedCountry(null);
                  setSelectedRecord(null);
                }}
                style={{
                  display: "block",
                  margin: "5px 0",
                  padding: "8px",
                  width: "100%",
                  background: "#e3f2fd",
                  border: "1px solid #90caf9",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {continent}
              </button>
            ))}
          </div>
        )}

        {selectedContinent && !selectedCountry && (
          <div>
            <h3>{selectedContinent} - Countries</h3>
            <button
              onClick={() => setSelectedContinent(null)}
              style={{
                marginBottom: "10px",
                padding: "6px",
                background: "#f5f5f5",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              ← Back to Continents
            </button>
            {[
              ...new Set(
                data
                  .filter((d) => d.continent === selectedContinent)
                  .map((d) => d.country)
              ),
            ].map((country) => (
              <button
                key={country}
                onClick={() => {
                  setSelectedCountry(country);
                  setSelectedRecord(null);
                }}
                style={{
                  display: "block",
                  margin: "5px 0",
                  padding: "8px",
                  width: "100%",
                  background: "#e8f5e9",
                  border: "1px solid #81c784",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {country}
              </button>
            ))}
          </div>
        )}

        {selectedCountry && (
          <div>
            <h3>{selectedCountry} - Records</h3>
            <button
              onClick={() => setSelectedCountry(null)}
              style={{
                marginBottom: "10px",
                padding: "6px",
                background: "#f5f5f5",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              ← Back to Countries
            </button>
            {data
              .filter((d) => d.country === selectedCountry)
              .map((item, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedRecord(item)}
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "8px 0",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  <strong>{item.datetime}</strong>
                  <br />
                  {item.city}
                </div>
              ))}
          </div>
        )}

        {selectedRecord && (
          <div
            style={{
              marginTop: "20px",
              padding: "10px",
              background: "#f5f5f5",
              borderRadius: "5px",
            }}
          >
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

      {/* --- Map --- */}
      <MapContainer
        center={[38, -97]}
        zoom={4}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {filteredData.map((item, index) => {
          const lat = parseFloat(item.latitude || item.lat);
          const lng = parseFloat(item.longitude || item.long || item.lng);
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <CircleMarker
              key={index}
              center={[lat, lng]}
              radius={5}
              pathOptions={{
                color: "#d64541",
                fillColor: "#d64541",
                fillOpacity: 0.8,
                stroke: false,
              }}
              eventHandlers={{
                click: () => setSelectedRecord(item),
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

      <TimeSlider selectedYear={selectedYear} setSelectedYear={setSelectedYear} />


    </div>
  );
}

export default App;
