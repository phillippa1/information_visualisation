import React, { useEffect, useState } from "react";

const DurationFilter = ({ data, selectedDuration, setSelectedDuration }) => {
  const [open, setOpen] = useState(false);

  const [customMin, setCustomMin] = useState(selectedDuration[0]);
  const [customMax, setCustomMax] = useState(selectedDuration[1]);

  const durations = data
    .map((d) => Number(d.durationSeconds) || 0)
    .filter((n) => !isNaN(n));

  const globalMinSec = Math.min(...durations);
  const globalMaxSec = Math.max(...durations);

  const presets = [
    { label: "All Durations", range: [globalMinSec, globalMaxSec] },
    { label: "0–10 sec", range: [0, 10] },
    { label: "10–60 sec", range: [10, 60] },
    { label: "1–5 min", range: [60, 300] },
    { label: "5–30 min", range: [300, 1800] },
    { label: "30–60 min", range: [1800, 3600] },
    { label: "> 1 hr", range: [3600, globalMaxSec] },
  ];

  const applyPreset = (range) => {
    setSelectedDuration(range);
    setCustomMin(range[0]);
    setCustomMax(range[1]);
  };

  const applyCustom = () => {
    let min = Number(customMin);
    let max = Number(customMax);
    if (isNaN(min) || isNaN(max)) return;
    if (min > max) [min, max] = [max, min];
    setSelectedDuration([min, max]);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      {/* DROPDOWN BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "6px",
          background: "#d9dcff",
          border: "1px solid #a4a9e0",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Duration Filter ▾
      </button>

      {open && (
        <div
          style={{
            marginTop: 10,
            background: "white",
            padding: 12,
            borderRadius: 6,
            border: "1px solid #ccc",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {/* HEADER */}
          <h4 style={{ marginBottom: 10, fontSize: "15px" }}>Presets</h4>

          {/* PRESET BUTTONS */}
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.range)}
              style={{
                display: "block",
                width: "100%",
                padding: "8px",
                marginBottom: "8px",
                background: "#eef0ff",
                border: "1px solid #aaa",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              {p.label}
            </button>
          ))}

          <hr style={{ marginTop: 14, marginBottom: 14 }} />

          {/* CUSTOM RANGE */}
          <h4 style={{ marginBottom: 10, fontSize: "15px" }}>
            Custom Range (seconds)
          </h4>

          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="number"
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
              style={{
                width: "50%",
                padding: "8px",
                borderRadius: 6,
                border: "1px solid #bbb",
                fontSize: "14px",
              }}
              placeholder="Min sec"
            />

            <input
              type="number"
              value={customMax}
              onChange={(e) => setCustomMax(e.target.value)}
              style={{
                width: "50%",
                padding: "8px",
                borderRadius: 6,
                border: "1px solid #bbb",
                fontSize: "14px",
              }}
              placeholder="Max sec"
            />
          </div>

          <button
            onClick={applyCustom}
            style={{
              marginTop: 12,
              width: "100%",
              padding: 8,
              background: "#e8ecff",
              borderRadius: 6,
              border: "1px solid #9da7e0",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Apply Custom Range
          </button>
        </div>
      )}
    </div>
  );
};

export default DurationFilter;
