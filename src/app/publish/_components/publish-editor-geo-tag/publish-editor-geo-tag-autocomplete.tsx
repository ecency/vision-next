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
    if (!places || !inputContainerRef.current) return;

    const autocomplete = new (places as any).PlaceAutocompleteElement();
    setPlaceAutocomplete(autocomplete);

    inputContainerRef.current.appendChild(autocomplete);

    autocomplete.addEventListener("gmp-select", async ({ placePrediction }: any) => {
      const place = placePrediction.toPlace();
      await place.fetchFields({ fields: ["displayName", "formattedAddress", "location"] });

      // Update parent state
      setSelectedPlace({
        name: place.displayName,
        formatted_address: place.formattedAddress,
        geometry: { location: place.location }
      } as google.maps.places.PlaceResult);
    });
  }, [places]);

  return (
    <div className="autocomplete-control mb-4">
      <div className="autocomplete-container" ref={inputContainerRef} />
    </div>
  );
}
