import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import { Issue } from "../types/index";

// Define custom styling for Leaflet controls to fit the dark theme
const customLeafletStyles = `
  .leaflet-container {
    background: #020617 !important;
    font-family: inherit;
  }
  .leaflet-popup-content-wrapper {
    background: #0b1329 !important;
    color: #f8fafc !important;
    border: 1px solid #1e293b !important;
    border-radius: 12px !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important;
  }
  .leaflet-popup-tip {
    background: #0b1329 !important;
    border: 1px solid #1e293b !important;
  }
  .leaflet-bar {
    border: 1px solid #1e293b !important;
    box-shadow: none !important;
  }
  .leaflet-bar a {
    background-color: #0b1329 !important;
    color: #94a3b8 !important;
    border-bottom: 1px solid #1e293b !important;
  }
  .leaflet-bar a:hover {
    background-color: #1e293b !important;
    color: #f8fafc !important;
  }
`;

interface CivicMapProps {
  issues: Issue[];
  center?: [number, number];
  zoom?: number;
}

export const CivicMap: React.FC<CivicMapProps> = ({
  issues,
  center = [37.7749, -122.4194], // Default San Francisco
  zoom = 13,
}) => {
  // Try to find a dynamic center based on provided issues if any has valid coordinates
  const validCoords = issues.filter(
    (i) => i.coordinates && typeof i.coordinates.latitude === "number" && typeof i.coordinates.longitude === "number"
  );

  const mapCenter: [number, number] = validCoords.length > 0
    ? [validCoords[0].coordinates.latitude, validCoords[0].coordinates.longitude]
    : center;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "#f43f5e"; // rose
      case "HIGH":
        return "#f97316"; // orange
      case "MEDIUM":
        return "#eab308"; // yellow
      default:
        return "#14b8a6"; // teal
    }
  };

  const createCustomIcon = (severity: string) => {
    const color = getSeverityColor(severity);
    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center w-6 h-6">
          <span class="absolute inline-flex h-full w-full rounded-full animate-ping opacity-60" style="background-color: ${color}"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 border-2 border-slate-950" style="background-color: ${color}"></span>
        </div>
      `,
      className: "custom-leaflet-marker",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-850/80 shadow-lg">
      <style>{customLeafletStyles}</style>
      
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {validCoords.map((issue) => {
          const lat = issue.coordinates.latitude;
          const lng = issue.coordinates.longitude;
          const markerColor = getSeverityColor(issue.severity);

          return (
            <Marker
              key={issue.id}
              position={[lat, lng]}
              icon={createCustomIcon(issue.severity)}
            >
              <Popup>
                <div className="p-1 space-y-2 min-w-[200px] text-slate-200">
                  <div className="flex justify-between items-center gap-2">
                    <span
                      className="text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase border"
                      style={{
                        borderColor: `${markerColor}30`,
                        backgroundColor: `${markerColor}10`,
                        color: markerColor,
                      }}
                    >
                      {issue.category.replace("_", " ")}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono font-bold uppercase">
                      {issue.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-white line-clamp-1">
                    {issue.title}
                  </h4>
                  
                  <p className="text-[10px] text-slate-300 leading-relaxed line-clamp-2">
                    {issue.description}
                  </p>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-[9px] font-mono">
                    <span className="text-slate-400 truncate max-w-[120px]">
                      📍 {issue.locationName}
                    </span>
                    <Link
                      to={`/report/${issue.id}`}
                      className="text-teal-400 hover:text-teal-300 font-bold transition flex items-center gap-0.5"
                    >
                      View Details &rarr;
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
