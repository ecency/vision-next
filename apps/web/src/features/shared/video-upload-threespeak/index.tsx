import { useThreeSpeakEmbedUpload } from "@/api/threespeak-embed";
import { setVideoThumbnail } from "@/api/threespeak-embed/api";
import { useUploadImageMutation } from "@/api/sdk-mutations";
import { useGlobalStore } from "@/core/global-store";
import { error } from "@/features/shared";
import { Button } from "@ui/button";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import { recordVideoSvg } from "@ui/svg";
import i18next from "i18next";
import React, { ChangeEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import useMountedState from "react-use/lib/useMountedState";
import "./index.scss";
import { VideoUploadItem } from "./video-upload-item";
import { VideoUploadRecorder } from "./video-upload-recorder";
import { useActiveAccount } from "@/core/hooks/use-active-account";

interface Props {
  children?: ReactNode;
  show: boolean;
  setShow: (v: boolean) => void;
  onVideoUploaded: (embedUrl: string, thumbnailUrl?: string) => void;
  /** When true, passes isShort flag to the upload token request (for Shorts/Waves). */
  isShort?: boolean;
}

interface VideoData {
  embedUrl: string;
  permlink: string;
}

export const VideoUpload = (props: Props & React.HTMLAttributes<HTMLDivElement>) => {
  const { activeUser } = useActiveAccount();
  const toggleUIProp = useGlobalStore((s) => s.toggleUiProp);
  const { mutateAsync: uploadVideo, completed: videoPercentage, setCompleted: setVideoPercentage } =
    useThreeSpeakEmbedUpload();

  const { mutateAsync: uploadThumbnailImage, isPending: isThumbnailUploading } =
    useUploadImageMutation();

  const videoRef = useRef<HTMLVideoElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const selectedFileUrlRef = useRef<string>();

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<string>("video/mp4");
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isExtractingThumbnail, setIsExtractingThumbnail] = useState(false);
  const [hasManualThumbnail, setHasManualThumbnail] = useState(false);

  const canContinue = !!videoData;

  const isMounted = useMountedState();

  // Reset on dialog hide
  useEffect(() => {
    if (!props.show) {
      if (selectedFileUrlRef.current) {
        URL.revokeObjectURL(selectedFileUrlRef.current);
        selectedFileUrlRef.current = undefined;
      }
      setSelectedFile(null);
      setSelectedFileType("video/mp4");
      setVideoData(null);
      setThumbnailUrl("");
      setHasManualThumbnail(false);
      setIsExtractingThumbnail(false);
      setStep("upload");
      setVideoPercentage(0);
      setShowRecorder(false);
    }
  }, [props.show, setVideoPercentage]);

  const maxFileSizeBytes = 1 * 1024 * 1024 * 1024; // 1 GB

  const handleVideoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUser) return;

    if (file.size > maxFileSizeBytes) {
      error(i18next.t("video-upload.file-too-large"));
      e.target.value = "";
      return;
    }

    // Show local preview
    if (selectedFileUrlRef.current) {
      URL.revokeObjectURL(selectedFileUrlRef.current);
    }
    const fileUrl = URL.createObjectURL(file);
    selectedFileUrlRef.current = fileUrl;
    setSelectedFile(fileUrl);
    setSelectedFileType(file.type || "video/mp4");

    try {
      const result = await uploadVideo({
        file,
        owner: activeUser.username,
        isShort: props.isShort
      });
      if (result) {
        setVideoData({ embedUrl: result.embedUrl, permlink: result.permlink });
      }
    } catch {
      // Error already shown by the mutation's error handler.
      // Reset file state so the selector reappears and user can retry.
      setSelectedFile(null);
    }
  };

  const handleRecordedUpload = (embedUrl: string, videoPermlink: string) => {
    setVideoData({ embedUrl, permlink: videoPermlink });
  };

  const extractFrameAsBlob = useCallback(
    (video: HTMLVideoElement): Promise<Blob | null> =>
      new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          canvas.width = 0;
          canvas.height = 0;
          resolve(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            // Release canvas GPU resources
            canvas.width = 0;
            canvas.height = 0;
            resolve(blob);
          },
          "image/jpeg",
          0.85
        );
      }),
    []
  );

  // Auto-extract thumbnail from video when entering preview step
  useEffect(() => {
    if (step !== "preview" || !videoData?.permlink || !selectedFile || hasManualThumbnail || thumbnailUrl) {
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    const permlink = videoData.permlink;

    const handleSeeked = async () => {
      if (cancelled) return;
      setIsExtractingThumbnail(true);
      try {
        const blob = await extractFrameAsBlob(video);
        if (cancelled || !blob) return;

        const file = new File([blob], "auto-thumbnail.jpg", { type: "image/jpeg" });
        const response = await uploadThumbnailImage({ file });
        if (cancelled || !response?.url) return;

        setThumbnailUrl(response.url);
        try {
          await setVideoThumbnail(permlink, response.url);
        } catch {
          // Thumbnail image uploaded successfully but metadata persistence failed — non-critical
        }
      } finally {
        if (!cancelled) setIsExtractingThumbnail(false);
      }
    };

    const handleLoaded = () => {
      if (cancelled) return;
      video.currentTime = Math.max(0.1, Math.min(1, video.duration * 0.25));
    };

    video.addEventListener("seeked", handleSeeked, { once: true });

    if (video.readyState >= 2) {
      handleLoaded();
    } else {
      video.addEventListener("loadeddata", handleLoaded, { once: true });
    }

    return () => {
      cancelled = true;
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("loadeddata", handleLoaded);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- uploadThumbnailImage is a stable mutation fn
  }, [step, videoData?.permlink, selectedFile, hasManualThumbnail, thumbnailUrl, extractFrameAsBlob]);

  const handleThumbnailChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !videoData?.permlink) return;

    try {
      const response = await uploadThumbnailImage({ file });
      if (response?.url) {
        setHasManualThumbnail(true);
        setThumbnailUrl(response.url);
        try {
          await setVideoThumbnail(videoData.permlink, response.url);
        } catch {
          // Thumbnail image uploaded successfully but metadata persistence failed — non-critical
        }
      }
    } catch {
      error(i18next.t("video-upload.thumbnail-upload-failed"));
    }
  };

  const uploadVideoModal = (
    <div className="dialog-content">
      <div className="three-speak-video-uploading position-relative">
        <p className="font-weight-bold mb-2 text-sm opacity-50">
          {i18next.t("video-upload.source")}
        </p>
        {showRecorder ? (
          <VideoUploadRecorder
            onEmbedUrlReady={handleRecordedUpload}
            setSelectedFile={(url) => {
              setSelectedFile(url);
              setSelectedFileType("video/webm");
            }}
            onReset={() => {
              setShowRecorder(false);
              setSelectedFile(null);
              setVideoData(null);
            }}
          />
        ) : (
          <div className="video-source">
            {isMounted() && !selectedFile && "MediaRecorder" in window ? (
              <div
                className="flex items-center flex-col border border-[--border-color] rounded-xl p-3 hover:bg-gray-100 dark:hover:bg-dark-default cursor-pointer duration-300"
                onClick={() => setShowRecorder(true)}
              >
                {recordVideoSvg}
                {i18next.t("video-upload.record-video")}
              </div>
            ) : (
              <></>
            )}
            <VideoUploadItem
              label={i18next.t("video-upload.choose-video")}
              onFileChange={handleVideoChange}
              type="video"
              accept="video/mp4, video/webm"
              completed={videoPercentage}
              hasFile={!!selectedFile}
            />
          </div>
        )}
      </div>
      <Button className="mt-3" disabled={!canContinue} onClick={() => setStep("preview")}>
        {i18next.t("video-upload.continue")}
      </Button>
    </div>
  );

  const previewVideo = (
    <div className="dialog-content">
      <div className="file-input">
        <video ref={videoRef} controls={true}>
          <source src={selectedFile ?? undefined} type={selectedFileType} />
        </video>
      </div>
      {videoData?.permlink && (
        <div className="mt-3">
          <p className="font-weight-bold mb-2 text-sm opacity-50">
            {i18next.t("video-upload.thumbnail")}
          </p>
          <div className="flex items-center gap-3">
            {isExtractingThumbnail ? (
              <div
                className="rounded bg-gray-200 dark:bg-dark-default flex items-center justify-center text-xs text-gray-500"
                style={{ width: 160, height: 90 }}
              >
                {i18next.t("video-upload.extracting-thumbnail")}
              </div>
            ) : thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt="Thumbnail"
                className="rounded"
                style={{ maxWidth: 160, maxHeight: 90 }}
              />
            ) : null}
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleThumbnailChange}
              disabled={isThumbnailUploading || isExtractingThumbnail}
            />
            <Button
              size="sm"
              appearance="gray"
              isLoading={isThumbnailUploading}
              disabled={isThumbnailUploading || isExtractingThumbnail}
              onClick={() => thumbnailInputRef.current?.click()}
            >
              {i18next.t("video-upload.choose-thumbnail")}
            </Button>
          </div>
        </div>
      )}
      <div className="flex justify-end mt-3">
        <Button className="bg-dark" onClick={() => setStep("upload")}>
          {i18next.t("g.back")}
        </Button>
        <Button
          className="ml-3"
          disabled={!canContinue || isExtractingThumbnail || isThumbnailUploading}
          isLoading={isExtractingThumbnail || isThumbnailUploading}
          onClick={() => {
            props.onVideoUploaded(videoData!.embedUrl, thumbnailUrl || undefined);
            props.setShow(false);
          }}
        >
          {i18next.t("video-upload.insert-video")}
        </Button>
      </div>
    </div>
  );

  return (
    <div
      className={"cursor-pointer " + props.className}
      onClick={() => (activeUser ? null : toggleUIProp("login"))}
    >
      <div className="flex justify-center">{props.children}</div>
      <div>
        <Modal
          show={props.show}
          centered={true}
          onHide={() => props.setShow(false)}
          className="add-image-modal"
        >
          <ModalHeader closeButton={true}>
            <ModalTitle>
              {step === "upload" && <p>{i18next.t("video-upload.upload-video")}</p>}
              {step === "preview" && <p>{i18next.t("video-upload.preview")}</p>}
            </ModalTitle>
          </ModalHeader>
          <ModalBody>
            {step === "upload" && uploadVideoModal}
            {step === "preview" && previewVideo}
          </ModalBody>
        </Modal>
      </div>
    </div>
  );
};
