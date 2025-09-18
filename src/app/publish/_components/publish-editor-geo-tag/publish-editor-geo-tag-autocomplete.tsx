import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useRef, useState } from "react";

interface Props {
  selectedAddress: string;
  selectedPlace: google.maps.places.PlaceResult | null;
  setSelectedPlace: (v: google.maps.places.PlaceResult) => void;
}

export function PublishEditorGeoTagAutocomplete({
  selectedPlace,
  selectedAddress,
  setSelectedPlace
}: Props) {
  const inputContainerRef = useRef<HTMLDivElement>(null);

  const places = useMapsLibrary("places");

  const [placeAutocomplete, setPlaceAutocomplete] = useState<any>(null);

  useEffect(() => {
    const container = inputContainerRef.current;

    if (!places || !container) return;

    const autocomplete = new (places as any).PlaceAutocompleteElement();
    setPlaceAutocomplete(autocomplete);

    container.appendChild(autocomplete);

    const handler = async ({ placePrediction }: any) => {
      const place = placePrediction.toPlace();
      await place.fetchFields({ fields: ["displayName", "formattedAddress", "location"] });

      // Update parent state
      setSelectedPlace({
        name: place.displayName,
        formatted_address: place.formattedAddress,
        geometry: { location: place.location }
      } as google.maps.places.PlaceResult);
    };

    autocomplete.addEventListener("gmp-select", handler);

    return () => {
      autocomplete.removeEventListener("gmp-select", handler);

      if (typeof autocomplete.remove === "function") {
        try {
          autocomplete.remove();
          return;
        } catch (e) {
          // If the element was already detached by the modal cleanup, fall back
          // to removing it from the container manually below.
          console.error("Failed to remove autocomplete element", e);
        }
      }

      const parentNode = autocomplete.parentNode as Node | null;

      if (parentNode?.contains(autocomplete)) {
        parentNode.removeChild(autocomplete);
      }
    };
  }, [places]);

  return (
    <div className="autocomplete-control mb-4">
      <div className="autocomplete-container" ref={inputContainerRef} />
    </div>
  );
}
