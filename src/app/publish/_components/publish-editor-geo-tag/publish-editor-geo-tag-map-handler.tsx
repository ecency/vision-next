import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import { useMount } from "react-use";

interface MapHandlerProps {
  initialLocation?: { coordinates: { lat: number; lng: number }; address?: string };

  place: google.maps.places.PlaceResult | null;
  marker: google.maps.marker.AdvancedMarkerElement | null;
  selectedPosition: { lat: number; lng: number } | undefined;
  setSelectedAddress: (v: string) => void;
  setSelectedPosition: (v: { lat: number; lng: number }) => void;
}

export function PublishEditorGeoTagMapHandler({
  initialLocation,
  place,
  marker,
  setSelectedPosition,
  setSelectedAddress,
  selectedPosition
}: MapHandlerProps) {
  const map = useMap();
  const geocoding = useMapsLibrary("geocoding");

  const [userLocation, setUserLocation] = useState<GeolocationCoordinates>();

  useMount(() =>
    navigator.geolocation.getCurrentPosition(
      (e) => setUserLocation(e.coords),
      (e) => console.error(e)
    )
  );

  useEffect(() => {
    if (!map || !place || !marker) return;

    if (place.geometry?.location) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(place.geometry.location);
      map.fitBounds(bounds);
    }

    marker.position = place.geometry?.location;
  }, [map, place, marker]);

  // Prefill marker by user location
  useEffect(() => {
    if (!selectedPosition && map && userLocation && marker) {
      const newPosition = { lat: userLocation.latitude, lng: userLocation.longitude };
      marker.position = newPosition;

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(newPosition);

      map.fitBounds(bounds);
      setSelectedPosition({ lat: userLocation.latitude, lng: userLocation.longitude });
    }
  }, [userLocation, marker, selectedPosition, map]);

  // Whenever marker position changes it should get address
  useEffect(() => {
    if (selectedPosition && geocoding) {
      const geocoder = new geocoding.Geocoder();
      geocoder
        .geocode({ location: selectedPosition })
        .then((response) => setSelectedAddress(response.results[0]?.formatted_address ?? ""));
    }
  }, [selectedPosition, geocoding]);

  useEffect(() => {
    if (marker && initialLocation?.coordinates && map) {
      marker.position = initialLocation.coordinates;
      const newPosition = { ...initialLocation.coordinates };
      marker.position = newPosition;

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(newPosition);

      map.fitBounds(bounds);
    }
  }, [initialLocation, marker, map]);

  return <></>;
}
