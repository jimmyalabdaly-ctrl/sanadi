"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { Star } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue with webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Teal custom marker icon
const tealIcon = new L.DivIcon({
  html: `<div style="
    width: 32px;
    height: 32px;
    background: #0D7377;
    border: 3px solid #fff;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -34],
  className: "",
});

const CITY_COORDS: Record<string, [number, number]> = {
  Amman: [31.9539, 35.9106],
  Irbid: [32.5556, 35.85],
  Zarqa: [32.0728, 36.088],
  Aqaba: [29.5267, 35.0078],
  Salt: [32.0392, 35.7272],
  Madaba: [31.7167, 35.7833],
  Jerash: [32.2747, 35.8961],
  Mafraq: [32.3422, 36.2083],
  Karak: [31.1853, 35.7047],
  Tafilah: [30.8375, 35.6044],
  "Ma'an": [30.1962, 35.7341],
  Ajloun: [32.3325, 35.7517],
  Balqa: [32.0392, 35.7272],
};

export interface MapProvider {
  id: string;
  name: string;
  slug: string;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  rating: number;
  category: string;
}

interface ProviderMapProps {
  providers: MapProvider[];
  locale?: string;
}

export default function ProviderMap({ providers, locale = "en" }: ProviderMapProps) {
  const isAr = locale === "ar";

  return (
    <MapContainer
      center={[31.9539, 35.9106]}
      zoom={8}
      style={{ height: "100%", width: "100%", borderRadius: "12px" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {providers.map((provider) => {
        let position: [number, number] | null = null;

        if (provider.lat && provider.lng) {
          position = [provider.lat, provider.lng];
        } else if (provider.city) {
          position = CITY_COORDS[provider.city] ?? CITY_COORDS["Amman"];
        } else {
          position = CITY_COORDS["Amman"];
        }

        return (
          <Marker key={provider.id} position={position} icon={tealIcon}>
            <Popup>
              <div style={{ minWidth: "160px", fontFamily: "inherit" }}>
                <p style={{ fontWeight: "700", marginBottom: "4px", color: "#1a1a1a" }}>
                  {provider.name}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill={i < Math.round(provider.rating) ? "#F59E0B" : "#e5e7eb"}
                      stroke={i < Math.round(provider.rating) ? "#F59E0B" : "#e5e7eb"}
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>
                    {provider.rating.toFixed(1)}
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>
                  {provider.category}
                </p>
                <a
                  href={`/${locale}/pro/${provider.slug}`}
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    background: "#0D7377",
                    color: "#fff",
                    borderRadius: "6px",
                    fontSize: "12px",
                    textDecoration: "none",
                    fontWeight: "600",
                  }}
                >
                  {isAr ? "عرض الملف" : "View Profile"}
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
