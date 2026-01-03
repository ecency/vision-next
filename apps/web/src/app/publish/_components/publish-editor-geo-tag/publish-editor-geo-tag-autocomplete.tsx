import { useMapsLibrary } from "@vis.gl/react-google-maps";
import i18next from "i18next";
import { useEffect, useRef } from "react";

interface Props {
  selectedAddress: string;
  setSelectedPlace: (v: google.maps.places.PlaceResult) => void;
}

export function PublishEditorGeoTagAutocomplete({
  selectedAddress,
  setSelectedPlace
}: Props) {
  const places = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (!places || placesServiceRef.current) {
      return;
    }

    const googleMaps = window.google?.maps;

    if (!googleMaps?.places?.PlacesService) {
      return;
    }

    placesServiceRef.current = new googleMaps.places.PlacesService(document.createElement("div"));
  }, [places]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = selectedAddress ?? "";
    }
  }, [selectedAddress]);

  useEffect(() => {
    const input = inputRef.current;

    if (!places || !input) return;

    const googleMaps = window.google?.maps;

    if (!googleMaps?.places?.Autocomplete) {
      return;
    }

    const autocomplete = new googleMaps.places.Autocomplete(input, {
      fields: ["name", "formatted_address", "geometry", "place_id"]
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place) {
        return;
      }

      const location = place.geometry?.location;

      if (location) {
        setSelectedPlace({
          ...place,
          geometry: { location }
        } as google.maps.places.PlaceResult);
        return;
      }

      if (!place.place_id || !placesServiceRef.current) {
        return;
      }

      placesServiceRef.current.getDetails(
        {
          placeId: place.place_id,
          fields: ["name", "formatted_address", "geometry.location"]
        },
        (result, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !result) {
            return;
          }

          if (!result.geometry?.location) {
            return;
          }

          setSelectedPlace(result);
        }
      );
    });

    return () => {
      listener.remove();
      googleMaps.event?.clearInstanceListeners(autocomplete);
    };
  }, [places, setSelectedPlace]);

  return (
    <div className="autocomplete-control mb-4">
      <input
        ref={inputRef}
        className="form-control"
        placeholder={i18next.t("publish.geo-tag.location-placeholder")}
        type="text"
        aria-label={i18next.t("publish.geo-tag.location-placeholder")}
      />
    </div>
  );
}
