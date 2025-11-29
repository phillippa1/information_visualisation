import React, { useEffect, useState } from "react";

const ShapeFilter = ({ data, selectedShapes, setSelectedShapes }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [shapes, setShapes] = useState([]);

  // Load unique shapes from dataset
  useEffect(() => {
    const unique = Array.from(
      new Set(
        data.map((i) =>
          (i.shape ? i.shape.toLowerCase().trim() : "unknown")
        )
      )
    ).sort();

    setShapes(unique);

    // Auto-select ALL shapes initially
    if (selectedShapes.length === 0 && unique.length > 0) {
      setSelectedShapes(unique);
    }
  }, [data]);

  const toggleShape = (shape) => {
    if (selectedShapes.includes(shape)) {
      setSelectedShapes(selectedShapes.filter((s) => s !== shape));
    } else {
      setSelectedShapes([...selectedShapes, shape]);
    }
  };

  const filtered = shapes.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ marginBottom: 20 }}>
      {/* DROPDOWN BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "6px",
          background: "#d9f3f6",
          border: "1px solid #9ac7cf",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        UFO Shape Filter ▾
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
          {/* SEARCH BAR */}
          <input
            type="text"
            placeholder="Search shapes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #bbb",
              marginBottom: 12,
              fontSize: "14px",
            }}
          />

          {/* CHECKBOX LIST */}
          <div style={{ maxHeight: 200, overflowY: "auto", paddingRight: 4 }}>
            {filtered.map((shape) => (
              <label
                key={shape}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 8,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedShapes.includes(shape)}
                  onChange={() => toggleShape(shape)}
                  style={{ marginRight: 8, transform: "scale(1.1)" }}
                />
                {shape}
              </label>
            ))}
          </div>

          {/* BUTTON GROUP */}
          <div
            style={{
              marginTop: 14,
              display: "flex",
              gap: 10,
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={() => setSelectedShapes(shapes)}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: 6,
                border: "1px solid #8cbdf0",
                background: "#e5f1ff",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Select All
            </button>

            <button
              onClick={() => setSelectedShapes([])}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: 6,
                border: "1px solid #e09a9a",
                background: "#ffeaea",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShapeFilter;
