import { EcencyConfigManager } from "@/config";
import { Alert, Button, Modal, ModalBody, ModalFooter, ModalHeader } from "@/features/ui";
import { AdvancedMarker, APIProvider, Map, useAdvancedMarkerRef } from "@vis.gl/react-google-maps";
import i18next from "i18next";
import { useCallback, useEffect, useState } from "react";
import { PublishEditorGeoTagAutocomplete } from "./publish-editor-geo-tag-autocomplete";
import { PublishEditorGeoTagMapHandler } from "./publish-editor-geo-tag-map-handler";

interface Props {
  initialLocation?: { coordinates: { lat: number; lng: number }; address?: string };
  show: boolean;
  setShow: (v: boolean) => void;
  onPick: (data: { coordinates: { lat: number; lng: number }; address?: string }) => void;
  onClear: () => void;
}

declare global {
  interface Window {
    initAutocomplete: () => void;
  }
}

const G_MAPS_API_KEY = EcencyConfigManager.getConfigValue(
  ({ visionFeatures }) => visionFeatures.publish.geoPicker.gMapsApiKey
);
const G_MAPS_MAP_ID = EcencyConfigManager.getConfigValue(
  ({ visionFeatures }) => visionFeatures.publish.geoPicker.gMapsMapId
);
const IS_GMAPS_CONFIGURED = Boolean(G_MAPS_API_KEY);

export function PublishEditorGeoTagDialog({
  initialLocation,
  show,
  setShow,
  onPick,
  onClear
}: Props) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  const [selectedAddress, setSelectedAddress] = useState<string>(initialLocation?.address ?? "");
  const [selectedPosition, setSelectedPosition] = useState<
    { lat: number; lng: number } | undefined
  >(initialLocation?.coordinates);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);

  useEffect(() => {
    if (selectedPlace?.geometry?.location) {
      setSelectedPosition({
        lat: selectedPlace.geometry.location.lat(),
        lng: selectedPlace.geometry.location.lng()
      });
      setSelectedAddress(selectedPlace.formatted_address ?? "");
    }
  }, [selectedPlace]);

  const handleSave = useCallback(() => {
    onPick({
      coordinates: selectedPosition ?? { lat: 0, lng: 0 },
      address: selectedAddress
    });
  }, [selectedAddress, selectedPosition]);

  return (
    <Modal centered={true} show={show} onHide={() => setShow(false)}>
      <ModalHeader closeButton={true}>
        <div>
          <div>{i18next.t("publish.geo-tag.title")}</div>
          <div className="text-xs font-normal">{i18next.t("publish.geo-tag.subtitle")}</div>
        </div>
      </ModalHeader>
      <ModalBody>
        {initialLocation && (
          <div className="pb-4">
            <span className="opacity-50">{i18next.t("publish.geo-tag.selected-location")}: </span>
            <span>{initialLocation.address}</span>
          </div>
        )}
        {!IS_GMAPS_CONFIGURED && (
          <Alert appearance="warning" className="mb-4">
            {i18next.t("publish.geo-tag.missing-config", {
              defaultValue:
                "Google Maps integration is not configured. Set NEXT_PUBLIC_GMAPS_API_KEY and NEXT_PUBLIC_GMAPS_MAP_ID environment variables to enable geotagging."
            })}
          </Alert>
        )}
        {IS_GMAPS_CONFIGURED && (
          <APIProvider apiKey={G_MAPS_API_KEY ?? ""} libraries={["places", "geocoding"]}>
            <PublishEditorGeoTagAutocomplete
              selectedAddress={selectedAddress}
              selectedPlace={selectedPlace}
              setSelectedPlace={setSelectedPlace}
            />

            <div className="rounded-xl overflow-hidden">
              <Map
                mapId={G_MAPS_MAP_ID}
                defaultZoom={1}
                defaultCenter={{ lat: 0, lng: 0 }}
                gestureHandling="greedy"
                disableDefaultUI={true}
                className="h-[300px]"
                onClick={(e: any) => {
                  if (marker) {
                    setSelectedPosition({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng });
                    marker.position = { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng };
                  }
                }}
              >
                <AdvancedMarker ref={markerRef} />
              </Map>
            </div>
            <PublishEditorGeoTagMapHandler
              initialLocation={initialLocation}
              place={selectedPlace}
              marker={marker}
              selectedPosition={selectedPosition}
              setSelectedPosition={setSelectedPosition}
              setSelectedAddress={setSelectedAddress}
            />
          </APIProvider>
        )}
      </ModalBody>
      <ModalFooter className="flex justify-end gap-2">
        <Button appearance="gray" size="sm" onClick={onClear}>
          {i18next.t("g.clear")}
        </Button>
        <Button disabled={!marker} appearance="success" size="sm" onClick={handleSave}>
          {i18next.t("g.save")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
