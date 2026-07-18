import React, { useState, useRef, useCallback } from "react";

export default function HeightRuler() {
  const [image, setImage] = useState(null);
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 });
  const [heightCm, setHeightCm] = useState(160);
  const [mode, setMode] = useState("height"); // "height" | "measure"
  const [heightPoints, setHeightPoints] = useState([]); // [{x,y}, {x,y}]
  const [measurePoints, setMeasurePoints] = useState([]);
  const [measurements, setMeasurements] = useState([]); // {p1,p2,cm,label}
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  const pxPerCm =
    heightPoints.length === 2
      ? dist(heightPoints[0], heightPoints[1]) / heightCm
      : null;

  function dist(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImgDims({ w: img.width, h: img.height });
        setImage(e.target.result);
        setHeightPoints([]);
        setMeasurePoints([]);
        setMeasurements([]);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, []);

  const handleClick = (e) => {
    if (!image) return;
    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = imgDims.w / rect.width;
    const scaleY = imgDims.h / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const point = { x, y };

    if (mode === "height") {
      if (heightPoints.length >= 2) {
        setHeightPoints([point]);
      } else {
        setHeightPoints([...heightPoints, point]);
      }
    } else {
      if (measurePoints.length >= 1 && measurePoints.length < 2) {
        const p1 = measurePoints[0];
        const p2 = point;
        if (pxPerCm) {
          const cm = dist(p1, p2) / pxPerCm;
          setMeasurements([
            ...measurements,
            { p1, p2, cm, id: Date.now() },
          ]);
        }
        setMeasurePoints([]);
      } else {
        setMeasurePoints([point]);
      }
    }
  };

  const displayScale =
    imgRef.current && imgDims.w
      ? imgRef.current.getBoundingClientRect().width / imgDims.w
      : 1;

  const toDisplay = (p) => ({
    x: p.x * displayScale,
    y: p.y * displayScale,
  });

  const resetHeight = () => setHeightPoints([]);
  const clearMeasurements = () => {
    setMeasurements([]);
    setMeasurePoints([]);
  };

  return (
    <div
      style={{
        fontFamily:
          "'Hiragino Sans', 'Noto Sans JP', system-ui, sans-serif",
        background: "#161821",
        minHeight: "100vh",
        color: "#EDEAE2",
        padding: "24px 16px",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 0.5,
            marginBottom: 4,
            color: "#F2A65A",
          }}
        >
          身長基準ものさし
        </h1>
        <p style={{ fontSize: 13, color: "#9A9C8F", marginBottom: 20 }}>
          立ち絵の身長を基準に、他の部位やアイテムの長さを測ります
        </p>

        {!image && (
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            style={{
              border: "2px dashed #3A3D33",
              borderRadius: 12,
              padding: "48px 16px",
              textAlign: "center",
              cursor: "pointer",
              background: "#1E2029",
            }}
            onClick={() => document.getElementById("file-input").click()}
          >
            <input
              id="file-input"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
            <p style={{ color: "#9A9C8F", fontSize: 14 }}>
              画像をドラッグ&ドロップ、またはタップして選択
            </p>
          </div>
        )}

        {image && (
          <>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <label style={{ fontSize: 13, color: "#9A9C8F" }}>
                身長(cm)
              </label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                style={{
                  width: 70,
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid #3A3D33",
                  background: "#1E2029",
                  color: "#EDEAE2",
                }}
              />
              <button
                onClick={() => {
                  setMode("height");
                  resetHeight();
                }}
                style={btnStyle(mode === "height")}
              >
                身長基準を指定
              </button>
              <button
                onClick={() => setMode("measure")}
                disabled={!pxPerCm}
                style={{
                  ...btnStyle(mode === "measure"),
                  opacity: pxPerCm ? 1 : 0.4,
                  cursor: pxPerCm ? "pointer" : "not-allowed",
                }}
              >
                計測する
              </button>
              <button onClick={clearMeasurements} style={btnStyleGhost()}>
                計測クリア
              </button>
              <button
                onClick={() => document.getElementById("file-input2").click()}
                style={btnStyleGhost()}
              >
                画像を変更
              </button>
              <input
                id="file-input2"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>

            <p style={{ fontSize: 12, color: "#7C7E71", marginBottom: 8 }}>
              {mode === "height"
                ? heightPoints.length === 0
                  ? "① 頭の頂点をクリック"
                  : heightPoints.length === 1
                  ? "② 足元(地面に接する点)をクリック"
                  : `基準設定済み: ${pxPerCm.toFixed(2)} px/cm`
                : measurePoints.length === 0
                ? "測りたい区間の始点をクリック"
                : "終点をクリック"}
            </p>

            <div
              ref={containerRef}
              style={{
                position: "relative",
                display: "inline-block",
                width: "100%",
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid #3A3D33",
              }}
            >
              <img
                ref={imgRef}
                src={image}
                onClick={handleClick}
                style={{
                  display: "block",
                  width: "100%",
                  cursor: "crosshair",
                }}
                alt="uploaded"
              />
              <svg
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                }}
              >
                {heightPoints.length === 2 && (
                  <Line
                    a={toDisplay(heightPoints[0])}
                    b={toDisplay(heightPoints[1])}
                    color="#F2A65A"
                    label={`${heightCm} cm`}
                  />
                )}
                {heightPoints.map((p, i) => (
                  <Dot key={"h" + i} p={toDisplay(p)} color="#F2A65A" />
                ))}
                {measurements.map((m) => (
                  <Line
                    key={m.id}
                    a={toDisplay(m.p1)}
                    b={toDisplay(m.p2)}
                    color="#6FA3A0"
                    label={`${m.cm.toFixed(1)} cm`}
                  />
                ))}
                {measurePoints.map((p, i) => (
                  <Dot key={"m" + i} p={toDisplay(p)} color="#6FA3A0" />
                ))}
              </svg>
            </div>

            {measurements.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h2
                  style={{
                    fontSize: 14,
                    color: "#9A9C8F",
                    marginBottom: 6,
                  }}
                >
                  計測結果
                </h2>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {measurements.map((m, i) => (
                    <li
                      key={m.id}
                      style={{
                        fontSize: 14,
                        padding: "6px 10px",
                        background: "#1E2029",
                        borderRadius: 6,
                        marginBottom: 6,
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>計測 {i + 1}</span>
                      <span style={{ color: "#6FA3A0", fontWeight: 600 }}>
                        {m.cm.toFixed(1)} cm
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function btnStyle(active) {
  return {
    fontSize: 13,
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid " + (active ? "#F2A65A" : "#3A3D33"),
    background: active ? "#F2A65A" : "#1E2029",
    color: active ? "#161821" : "#EDEAE2",
    cursor: "pointer",
    fontWeight: active ? 700 : 400,
  };
}
function btnStyleGhost() {
  return {
    fontSize: 13,
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid #3A3D33",
    background: "transparent",
    color: "#9A9C8F",
    cursor: "pointer",
  };
}

function Dot({ p, color }) {
  return <circle cx={p.x} cy={p.y} r={5} fill={color} stroke="#161821" strokeWidth={1.5} />;
}

function Line({ a, b, color, label }) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  return (
    <>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={2.5} strokeDasharray="6 4" />
      <circle cx={a.x} cy={a.y} r={4} fill={color} />
      <circle cx={b.x} cy={b.y} r={4} fill={color} />
      <rect x={mx - 28} y={my - 12} width={56} height={20} fill="#161821" opacity={0.85} rx={4} />
      <text x={mx} y={my + 3} fill={color} fontSize={12} textAnchor="middle" fontWeight="700">
        {label}
      </text>
    </>
  );
}
