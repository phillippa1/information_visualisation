import React, { useEffect, useState } from "react";

const ShapeFilter = ({ data, selectedShapes, setSelectedShapes }) => {
  const [search, setSearch] = useState("");
  const [shapes, setShapes] = useState([]);

  useEffect(() => {
    const uniqueShapes = Array.from(
      new Set(
        data.map((item) =>
          item.shape
            ? item.shape.toString().trim().toLowerCase()
            : "unknown"
        )
      )
    ).sort();

    setShapes((prev) => {
      if (JSON.stringify(prev) !== JSON.stringify(uniqueShapes)) {
        return uniqueShapes;
      }
      return prev;
    });

    if (selectedShapes.length === 0 && uniqueShapes.length > 0) {
      setSelectedShapes(uniqueShapes);
    }
  }, [data]);

  const toggleShape = (shape) => {
    if (selectedShapes.includes(shape)) {
      setSelectedShapes(selectedShapes.filter((s) => s !== shape));
    } else {
      setSelectedShapes([...selectedShapes, shape]);
    }
  };

  const filteredShapes = shapes.filter((shape) =>
    shape.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="shape-filter">
      <h3>Filter by UFO Shape</h3>

      <input
        type="text"
        placeholder="Search shapes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", marginBottom: "10px", padding: "6px" }}
      />

      <div style={{ maxHeight: "200px", overflowY: "auto", padding: "5px" }}>
        {filteredShapes.map((shape) => (
          <label
            key={shape}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "6px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={selectedShapes.includes(shape)}
              onChange={() => toggleShape(shape)}
              style={{ marginRight: "8px" }}
            />
            {shape}
          </label>
        ))}
      </div>

      {/* SELECT ALL / CLEAR ALL */}
      <div style={{ marginTop: "10px" }}>
        <button
          onClick={() => setSelectedShapes(shapes)}
          style={{ marginRight: "10px" }}
        >
          Select All
        </button>
        <button onClick={() => setSelectedShapes([])}>Clear All</button>
      </div>
    </div>
  );
};

export default ShapeFilter;
