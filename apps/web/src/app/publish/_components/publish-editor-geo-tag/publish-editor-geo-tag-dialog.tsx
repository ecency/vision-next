"use client";

import { EcencyConfigManager } from "@/config";
import { error } from "@/features/shared/feedback";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "@/features/ui";
import i18next from "i18next";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { reverseGeocode } from "./geo-search";
import { GeoCoordinates, GeoLocation } from "./geo-tag-types";
import { PublishEditorGeoTagSearch } from "./publish-editor-geo-tag-search";

interface Props {
  initialLocation?: GeoLocation;
  show: boolean;
  setShow: (v: boolean) => void;
  onPick: (data: GeoLocation) => void;
  onClear: () => void;
}

const GEOCODER_HOST = EcencyConfigManager.getConfigValue(
  ({ visionFeatures }) => visionFeatures.publish.geoPicker.geocoderHost
);
const CITIES_URL = EcencyConfigManager.getConfigValue(
  ({ visionFeatures }) => visionFeatures.publish.geoPicker.citiesDataUrl
);
const TILE_URL = EcencyConfigManager.getConfigValue(
  ({ visionFeatures }) => visionFeatures.publish.geoPicker.tileUrl
);

// Leaflet touches `window` at import time, so the map must never be evaluated
// during SSR — load it client-side only with a skeleton fallback.
const PublishEditorGeoTagMap = dynamic(() => import("./publish-editor-geo-tag-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] w-full items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500 dark:bg-dark-200 dark:text-gray-400">
      {i18next.t("publish.geo-tag.loading-map")}
    </div>
  )
});

function toCoordinates(value?: GeoLocation): GeoCoordinates | undefined {
  if (!value?.coordinates) return undefined;
  const lat = Number(value.coordinates.lat);
  const lng = Number(value.coordinates.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined;
}

export function PublishEditorGeoTagDialog({
  initialLocation,
  show,
  setShow,
  onPick,
  onClear
}: Props) {
  const [marker, setMarker] = useState<GeoCoordinates | undefined>(() =>
    toCoordinates(initialLocation)
  );
  const [address, setAddress] = useState<string>(initialLocation?.address ?? "");
  const [flyNonce, setFlyNonce] = useState(initialLocation ? 1 : 0);
  const [detecting, setDetecting] = useState(false);

  const reverseAbortRef = useRef<AbortController | null>(null);

  useEffect(() => () => reverseAbortRef.current?.abort(), []);

  const fillAddressFor = useCallback((coords: GeoCoordinates) => {
    reverseAbortRef.current?.abort();
    const controller = new AbortController();
    reverseAbortRef.current = controller;
    reverseGeocode(GEOCODER_HOST, coords.lat, coords.lng, controller.signal)
      .then((label) => {
        if (!controller.signal.aborted) setAddress(label);
      })
      .catch(() => {
        /* aborted or offline — keep whatever address we have */
      });
  }, []);

  // Search suggestion / detected place: move the pin and recenter the map.
  const handleSelect = useCallback((location: GeoLocation) => {
    const coords = toCoordinates(location);
    if (!coords) return;
    // Cancel a reverse-geocode still in flight from a prior map pick, otherwise
    // it could resolve later and overwrite this selection's address.
    reverseAbortRef.current?.abort();
    setMarker(coords);
    setAddress(location.address ?? "");
    setFlyNonce((n) => n + 1);
  }, []);

  // Map click / pin drag: move the pin in place, then resolve the address.
  const handleMapPick = useCallback(
    (coords: GeoCoordinates) => {
      setMarker(coords);
      fillAddressFor(coords);
    },
    [fillAddressFor]
  );

  const handleDetect = useCallback(() => {
    if (!navigator?.geolocation) {
      error(i18next.t("publish.geo-tag.detect-unsupported"));
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMarker(coords);
        setFlyNonce((n) => n + 1);
        fillAddressFor(coords);
        setDetecting(false);
      },
      () => {
        setDetecting(false);
        error(i18next.t("publish.geo-tag.detect-error"));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [fillAddressFor]);

  const handleSave = useCallback(() => {
    if (!marker) return;
    onPick({
      coordinates: marker,
      address: address.trim() || `${marker.lat.toFixed(5)}, ${marker.lng.toFixed(5)}`
    });
  }, [marker, address, onPick]);

  return (
    <Modal centered={true} show={show} onHide={() => setShow(false)}>
      <ModalHeader closeButton={true}>
        <div>
          <div>{i18next.t("publish.geo-tag.title")}</div>
          <div className="text-xs font-normal opacity-75">
            {i18next.t("publish.geo-tag.subtitle")}
          </div>
        </div>
      </ModalHeader>
      <ModalBody>
        <PublishEditorGeoTagSearch
          value={address}
          geocoderHost={GEOCODER_HOST}
          citiesUrl={CITIES_URL}
          detecting={detecting}
          onSelect={handleSelect}
          onDetect={handleDetect}
        />

        <div className="relative z-0 overflow-hidden rounded-xl border border-gray-200 dark:border-dark-600">
          <PublishEditorGeoTagMap
            position={marker}
            flyNonce={flyNonce}
            tileUrl={TILE_URL}
            onPick={handleMapPick}
          />
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{i18next.t("publish.geo-tag.map-hint")}</span>
          {marker && (
            <span className="shrink-0 font-mono">
              {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
            </span>
          )}
        </div>
        <div className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
          {i18next.t("publish.geo-tag.attribution")}
        </div>
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
