import React, { useCallback, useEffect, useRef, useState } from "react";
import useMount from "react-use/lib/useMount";
import { VideoUploadRecorderActions } from "./video-upload-recorder-actions";
import { VideoUploadRecorderNoPermission } from "./video-upload-recorder-no-permission";
import { error } from "../feedback";
import { v4 } from "uuid";
import { useUnmount } from "react-use";
import { Button } from "@ui/button";
import { useThreeSpeakVideoUpload } from "@/api/threespeak";
import i18next from "i18next";
import { formatError } from "@/api/format-error";

interface Props {
  setVideoUrl: (v: string) => void;
  setFilevName: (v: string) => void;
  setFilevSize: (v: number) => void;
  setSelectedFile: (v: string) => void;
  onReset: () => void;
}

export function VideoUploadRecorder({
  setVideoUrl,
  setFilevName,
  setFilevSize,
  onReset,
  setSelectedFile
}: Props) {
  const [stream, setStream] = useState<MediaStream>();
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder>();
  const [recordedVideoSrc, setRecordedVideoSrc] = useState<string>();
  const [recordedBlob, setRecordedBlob] = useState<Blob>();
  const [noPermission, setNoPermission] = useState(false);
  const [currentCamera, setCurrentCamera] = useState<MediaDeviceInfo>();

  const ref = useRef<HTMLVideoElement | null>(null);
  const recordedVideoUrlRef = useRef<string>();
  const selectedFileUrlRef = useRef<string>();
  const dataAvailableHandlerRef = useRef<((event: BlobEvent) => void) | null>(null);
  const previousMediaRecorderRef = useRef<MediaRecorder | null>(null);

  const {
    mutateAsync: uploadVideo,
    completed,
    isPending: isLoading,
    isSuccess
  } = useThreeSpeakVideoUpload("video");

  useMount(() => initStreamSafe());

  useUnmount(() => {
    stream?.getTracks().forEach((track) => track.stop());
    // Clean up blob URLs
    if (recordedVideoUrlRef.current) {
      URL.revokeObjectURL(recordedVideoUrlRef.current);
    }
    if (selectedFileUrlRef.current) {
      URL.revokeObjectURL(selectedFileUrlRef.current);
    }
    // Remove event listener
    if (mediaRecorder && dataAvailableHandlerRef.current) {
      mediaRecorder.removeEventListener("dataavailable", dataAvailableHandlerRef.current);
    }
  });

  useEffect(() => {
    if (stream && ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream, ref]);

  const initStream = useCallback(
    async (mimeType: string) => {
      setNoPermission(false);

      try {
        // Clean up old blob URL before creating new one
        if (recordedVideoUrlRef.current) {
          URL.revokeObjectURL(recordedVideoUrlRef.current);
          recordedVideoUrlRef.current = undefined;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: currentCamera ? { deviceId: currentCamera.deviceId } : true,
          audio: true
        });
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType
        });

        // Remove old event listener from previous MediaRecorder if it exists
        if (previousMediaRecorderRef.current && dataAvailableHandlerRef.current) {
          previousMediaRecorderRef.current.removeEventListener("dataavailable", dataAvailableHandlerRef.current);
        }

        // Create new event handler
        const dataAvailableHandler = (event: BlobEvent) => {
          if (event.data.size > 0) {
            const blobUrl = URL.createObjectURL(event.data);
            recordedVideoUrlRef.current = blobUrl;
            setRecordedVideoSrc(blobUrl);
            setRecordedBlob(event.data);
            stream.getTracks().forEach((track) => track.stop());
          }
        };

        dataAvailableHandlerRef.current = dataAvailableHandler;
        mediaRecorder.addEventListener("dataavailable", dataAvailableHandler);

        previousMediaRecorderRef.current = mediaRecorder;
        setMediaRecorder(mediaRecorder);
        setStream(stream);
      } catch (e) {
        setNoPermission(true);
        throw e;
      }
    },
    [currentCamera]
  );

  const initStreamSafe = useCallback(async () => {
    try {
      await initStream("video/webm");
    } catch (e) {
      await initStream("video/mp4");
    }
  }, [initStream]);

  useEffect(() => {
    initStreamSafe();
  }, [currentCamera, initStreamSafe]);

  return (
    <div className="video-upload-recorder">
      {recordedBlob ? (
        <Button className="reset-btn" appearance="link" size="sm" onClick={() => onReset()}>
          {i18next.t("video-upload.reset")}
        </Button>
      ) : (
        <></>
      )}

      <VideoUploadRecorderActions
        noPermission={noPermission}
        mediaRecorder={mediaRecorder}
        recordButtonShow={!noPermission && !recordedVideoSrc}
        onCameraSelect={(camera) => {
          stream
            ?.getTracks()
            .filter(({ kind }) => kind === "video")
            .forEach((track) => track.stop());

          setCurrentCamera(camera);
        }}
      />

      {noPermission ? (
        <VideoUploadRecorderNoPermission />
      ) : (
        <>
          <video
            hidden={!recordedVideoSrc}
            controls={true}
            src={recordedVideoSrc}
            autoPlay={false}
            playsInline={true}
            id="videoRecorded"
          />
          <video
            hidden={!!recordedVideoSrc}
            ref={ref}
            muted={true}
            autoPlay={true}
            playsInline={true}
            id="videoLive"
          />
          {recordedVideoSrc ? (
            <div className="flex items-center justify-center mt-3">
              {recordedBlob && isSuccess ? (
                <div className="bg-success text-white p-3 text-sm rounded-pill w-100">
                  {i18next.t("video-upload.uploaded")}
                </div>
              ) : (
                <Button
                  disabled={isLoading}
                  onClick={async () => {
                    if (!recordedBlob) {
                      return;
                    }

                    try {
                      const file = new File([recordedBlob], `ecency-recorder-${v4()}.webm`, {
                        type: "video/webm"
                      });
                      const result = await uploadVideo({
                        file
                      });
                      if (result) {
                        setVideoUrl(result.fileUrl);
                        setFilevName(result.fileName);
                        setFilevSize(result.fileSize);
                        // Clean up old selected file URL before creating new one
                        if (selectedFileUrlRef.current) {
                          URL.revokeObjectURL(selectedFileUrlRef.current);
                        }
                        const fileUrl = URL.createObjectURL(file);
                        selectedFileUrlRef.current = fileUrl;
                        setSelectedFile(fileUrl);
                      }
                    } catch (e) {
                      error(...formatError(e));
                    }
                  }}
                >
                  {isLoading
                    ? i18next.t("video-upload.uploading", { n: completed, total: 100 })
                    : i18next.t("video-upload.confirm-and-upload")}
                </Button>
              )}
            </div>
          ) : (
            <></>
          )}
        </>
      )}
    </div>
  );
}
