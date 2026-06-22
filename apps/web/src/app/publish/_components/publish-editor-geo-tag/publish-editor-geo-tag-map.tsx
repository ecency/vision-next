"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { GeoCoordinates } from "./geo-tag-types";

interface Props {
  position?: GeoCoordinates;
  /** Bumped by the dialog to request a smooth recenter (search / detect). */
  flyNonce: number;
  tileUrl: string;
  onPick: (coords: GeoCoordinates) => void;
}

const DEFAULT_CENTER: [number, number] = [25, 0];
const DEFAULT_ZOOM = 2;
const FOCUS_ZOOM = 11;

// A self-contained SVG pin avoids Leaflet's default marker image (which breaks
// under bundlers) and lets the pin match the brand accent in both themes.
const pinIcon = L.divIcon({
  className: "geo-tag-pin",
  html: `<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 13.4 25.4 14 26.1a1.4 1.4 0 0 0 2 0c.6-.7 14-15.6 14-26.1C30 6.7 23.3 0 15 0z" fill="#357ce6"/>
      <circle cx="15" cy="15" r="6" fill="#fff"/>
    </svg>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42]
});

// The dialog animates (transform/opacity) as it opens, so Leaflet measures the
// container before it has settled and paints grey/partial tiles. Re-measure
// after mount + after the open animation finishes.
function SizeFix() {
  const map = useMap();
  useEffect(() => {
    const raf = requestAnimationFrame(() => map.invalidateSize());
    const t = setTimeout(() => map.invalidateSize(), 350);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [map]);
  return null;
}

function ClickHandler({ onPick }: { onPick: (coords: GeoCoordinates) => void }) {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
  });
  return null;
}

function FlyTo({ position, flyNonce }: { position?: GeoCoordinates; flyNonce: number }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), FOCUS_ZOOM), {
        duration: 0.75
      });
    }
    // Recenter only when the dialog explicitly requests it (not on every drag).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyNonce]);
  return null;
}

export default function PublishEditorGeoTagMap({ position, flyNonce, tileUrl, onPick }: Props) {
  const center: [number, number] = position ? [position.lat, position.lng] : DEFAULT_CENTER;
  const zoom = position ? FOCUS_ZOOM : DEFAULT_ZOOM;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      worldCopyJump={true}
      className="h-[320px] w-full"
    >
      <TileLayer
        url={tileUrl}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      {position && (
        <Marker
          position={[position.lat, position.lng]}
          draggable={true}
          icon={pinIcon}
          eventHandlers={{
            dragend: (e) => {
              const ll = (e.target as L.Marker).getLatLng();
              onPick({ lat: ll.lat, lng: ll.lng });
            }
          }}
        />
      )}
      <ClickHandler onPick={onPick} />
      <FlyTo position={position} flyNonce={flyNonce} />
      <SizeFix />
    </MapContainer>
  );
}
