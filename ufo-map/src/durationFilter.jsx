import React, { useEffect, useState } from "react";

const DurationFilter = ({ selectedDuration, setSelectedDuration, data }) => {
  const [minVal, setMinVal] = useState(0);
  const [maxVal, setMaxVal] = useState(3600); // default 1 hour
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Extract durations (cleaned)
  const durations = data
    .map((d) => Number(d["duration (seconds)"]) || 0)
    .filter((n) => !isNaN(n));

  const globalMin = Math.min(...durations);
  const globalMax = Math.max(...durations);

  useEffect(() => {
    setMinVal(selectedDuration[0]);
    setMaxVal(selectedDuration[1]);
  }, [selectedDuration]);

  const presets = [
    { label: "Very Short (0–10 sec)", range: [0, 10] },
    { label: "Short (10–60 sec)", range: [10, 60] },
    { label: "Medium (1–5 min)", range: [60, 300] },
    { label: "Long (5–30 min)", range: [300, 1800] },
    { label: "Very Long (30–60 min)", range: [1800, 3600] },
    { label: "Extremely Long (> 1 hr)", range: [3600, globalMax] }
  ];

  const applyPreset = (range) => {
    setSelectedDuration(range);
    setMinVal(range[0]);
    setMaxVal(range[1]);
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "5px",
          background: "#e0e0ff",
          border: "1px solid #888",
          cursor: "pointer",
          marginBottom: "10px",
        }}
      >
        Duration Filter ▾
      </button>

      {dropdownOpen && (
        <div
          style={{
            background: "white",
            padding: "15px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          <h4>Custom Duration (seconds)</h4>

          {/* RANGE SLIDER */}
          <input
            type="range"
            min={globalMin}
            max={globalMax}
            value={minVal}
            onChange={(e) => setSelectedDuration([Number(e.target.value), maxVal])}
            style={{ width: "100%" }}
          />
          <input
            type="range"
            min={globalMin}
            max={globalMax}
            value={maxVal}
            onChange={(e) => setSelectedDuration([minVal, Number(e.target.value)])}
            style={{ width: "100%" }}
          />

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <input
              type="number"
              value={minVal}
              onChange={(e) => setSelectedDuration([Number(e.target.value), maxVal])}
              style={{ width: "50%", padding: "5px" }}
            />
            <input
              type="number"
              value={maxVal}
              onChange={(e) => setSelectedDuration([minVal, Number(e.target.value)])}
              style={{ width: "50%", padding: "5px" }}
            />
          </div>

          <hr style={{ margin: "15px 0" }} />

          <h4>Presets</h4>
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.range)}
              style={{
                display: "block",
                width: "100%",
                marginBottom: "8px",
