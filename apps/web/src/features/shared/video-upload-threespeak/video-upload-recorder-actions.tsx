import { circleSvg, rectSvg, switchCameraSvg } from "@/assets/img/svg";
import React, { useEffect, useState } from "react";
import { useGetCameraList } from "./utils";
import { useStopwatch } from "@/utils";
import i18next from "i18next";

interface Props {
  noPermission: boolean;
  mediaRecorder?: MediaRecorder;
  recordButtonShow?: boolean;
  onCameraSelect: (camera: MediaDeviceInfo) => void;
}

export function VideoUploadRecorderActions({
  noPermission,
  mediaRecorder,
  onCameraSelect,
  recordButtonShow
}: Props) {
  const cameraList = useGetCameraList();

  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [recordStarted, setRecordStarted] = useState(false);
  const stopwatch = useStopwatch();

  useEffect(() => {
    recordStarted ? stopwatch.start() : stopwatch.clear();
  }, [recordStarted]); // eslint-disable-line react-hooks/exhaustive-deps

  const getNextCameraIndex = (index: number) => (index + 1) % cameraList.length;

  return (
    <>
      {recordStarted && (
        <div className="absolute top-4 right-4 text-white">
          {`${stopwatch.hours}`.padStart(2, "0")}:{`${stopwatch.minutes}`.padStart(2, "0")}:
          {`${stopwatch.seconds}`.padStart(2, "0")}
        </div>
      )}

      <div className="actions">
        <div>
          {!recordStarted && cameraList.length > 1 ? (
            <div
              className="switch-camera"
              role="button"
              tabIndex={0}
              aria-label={i18next.t("video-upload.switch-camera", { defaultValue: "Switch camera" })}
              onClick={() => {
                const nextCameraIndex = getNextCameraIndex(currentCameraIndex);
                onCameraSelect(cameraList[nextCameraIndex]);
                setCurrentCameraIndex(nextCameraIndex);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  const nextCameraIndex = getNextCameraIndex(currentCameraIndex);
                  onCameraSelect(cameraList[nextCameraIndex]);
                  setCurrentCameraIndex(nextCameraIndex);
                }
              }}
            >
              {switchCameraSvg}
            </div>
          ) : (
            <></>
          )}
        </div>

        <div>
          {recordStarted ? (
            <div
              aria-disabled={noPermission}
              className="record-btn"
              role="button"
              tabIndex={0}
              aria-label={i18next.t("video-upload.stop-recording", { defaultValue: "Stop recording" })}
              onClick={() => {
                mediaRecorder?.stop();
                setRecordStarted(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  mediaRecorder?.stop();
                  setRecordStarted(false);
                }
              }}
            >
              {rectSvg}
            </div>
          ) : (
            <></>
          )}
          {!recordStarted && recordButtonShow ? (
            <div
              aria-disabled={noPermission}
              className="record-btn"
              role="button"
              tabIndex={0}
              aria-label={i18next.t("video-upload.start-recording", { defaultValue: "Start recording" })}
              onClick={() => {
                mediaRecorder?.start();
                setRecordStarted(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  mediaRecorder?.start();
                  setRecordStarted(true);
                }
              }}
            >
              {circleSvg}
            </div>
          ) : (
            <></>
          )}
        </div>
        <div />
      </div>
    </>
  );
}
