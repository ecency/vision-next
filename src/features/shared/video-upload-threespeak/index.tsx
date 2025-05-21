import { useThreeSpeakVideoUpload, useUploadVideoInfo } from "@/api/threespeak";
import { useGlobalStore } from "@/core/global-store";
import { createFile } from "@/utils/create-file";
import { Alert } from "@ui/alert";
import { Button } from "@ui/button";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import { recordVideoSvg } from "@ui/svg";
import i18next from "i18next";
import React, { ChangeEvent, ReactNode, useEffect, useRef, useState } from "react";
import useMountedState from "react-use/lib/useMountedState";
import "./index.scss";
import { VideoUploadItem } from "./video-upload-item";
import { VideoUploadRecorder } from "./video-upload-recorder";

interface Props {
  children?: ReactNode;
  show: boolean;
  setShow: (v: boolean) => void;
  setShowGallery: (v: boolean) => void;
}

export const VideoUpload = (props: Props & React.HTMLAttributes<HTMLDivElement>) => {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const toggleUIProp = useGlobalStore((s) => s.toggleUiProp);
  const {
    mutateAsync: uploadVideo,
    completed: videoPercentage,
    setCompleted: setVideoPercentage
  } = useThreeSpeakVideoUpload("video");
  const {
    mutateAsync: uploadThumbnail,
    completed: thumbnailPercentage,
    setCompleted: setThumbnailPercentage
  } = useThreeSpeakVideoUpload("thumbnail");
  const { mutateAsync: uploadInfo } = useUploadVideoInfo();

  const videoRef = useRef<HTMLVideoElement>(null);

  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [coverImage, setCoverImage] = useState<string>();
  const [step, setStep] = useState("upload");
  const [filevName, setFilevName] = useState("");
  const [fileName, setFileName] = useState("");
  const [filevSize, setFilevSize] = useState(0);
  const [fileSize, setFileSize] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbUrl, setThumbUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [durationForApiCall, setDurationForApiCall] = useState(0);
  const [showRecorder, setShowRecorder] = useState(false);

  const canUpload = videoUrl;

  const isMounted = useMountedState();

  // Reset on dialog hide
  useEffect(() => {
    if (!props.show) {
      setSelectedFile(null);
      setCoverImage(undefined);
      setFileName("");
      setFileSize(0);
      setFilevName("");
      setFilevSize(0);
      setVideoUrl("");
      setThumbUrl("");
      setDuration("");
      setStep("upload");
      setVideoPercentage(0);
      setThumbnailPercentage(0);
      setShowRecorder(false);
      setDurationForApiCall(0);
    }
  }, [props.show, setThumbnailPercentage, setVideoPercentage]);

  const getVideoDuration = () => {
    if (videoRef.current) {
      const { duration } = videoRef.current;
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      const videoDuration = `${minutes}:${seconds}`;
      setDuration(videoDuration);
      setDurationForApiCall(duration);
    }
  };

  const onChange = async (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    let file = event.target.files?.[0];
    if (!file) return;

    if (type === "video") {
      const result = await uploadVideo({ file });
      if (result) {
        setVideoUrl(result.fileUrl);
        setFilevName(result.fileName);
        setFilevSize(result.fileSize);
      }
    } else {
      const result = await uploadThumbnail({ file });
      if (result) {
        setThumbUrl(result.fileUrl);
        setFileName(result.fileName);
        setFileSize(result.fileSize);
      }
    }
  };

  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement | any>) => {
    const file: any = e?.target?.files[0];
    onChange(e, "thumbnail");
    setCoverImage(URL?.createObjectURL(file));
  };

  const handleVideoChange = (e: ChangeEvent<HTMLInputElement | any>) => {
    const file: any = e?.target?.files[0];
    onChange(e, "video");
    setSelectedFile(URL?.createObjectURL(file));
  };

  const uploadVideoModal = (
    <div className="dialog-content ">
      <div className="three-speak-video-uploading position-relative">
        <Alert appearance="primary" className="mb-4">
          {i18next.t("video-upload.min-duration-alert")}
        </Alert>
        <p className="font-weight-bold mb-2 text-sm opacity-50">
          {i18next.t("video-upload.source")}
        </p>
        {showRecorder ? (
          <VideoUploadRecorder
            setVideoUrl={setVideoUrl}
            setFilevName={setFilevName}
            setFilevSize={setFilevSize}
            setSelectedFile={setSelectedFile}
            onReset={() => setShowRecorder(false)}
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
            />
          </div>
        )}
        <p className="font-weight-bold mt-5 mb-2 text-sm opacity-50">
          {i18next.t("video-upload.thumbnail")}
        </p>
        <VideoUploadItem
          label={i18next.t("video-upload.choose-thumbnail")}
          onFileChange={handleThumbnailChange}
          type="thumbnail"
          accept="image/jpg, image/jpeg, image/png"
          completed={thumbnailPercentage}
        />
      </div>
      <Button
        className="mt-3"
        disabled={!canUpload}
        onClick={async () => {
          if (!thumbUrl) {
            const file = await createFile("/assets/thumbnail-play.jpg");
            onChange({ target: { files: [file] } } as any, "thumbnail");
            setCoverImage(URL?.createObjectURL(file));
          }
          setStep("preview");
        }}
      >
        {i18next.t("video-upload.continue")}
      </Button>
    </div>
  );

  const previewVideo = (
    <div className="dialog-content">
      <div className="file-input">
        <video
          onLoadedMetadata={getVideoDuration}
          ref={videoRef}
          controls={true}
          poster={coverImage}
        >
          <source src={selectedFile} type="video/mp4" />
        </video>
      </div>
      <div className="flex justify-end mt-3">
        <Button
          className="bg-dark"
          onClick={() => {
            setStep("upload");
          }}
        >
          {i18next.t("g.back")}
        </Button>
        <Button
          className="ml-3"
          disabled={!canUpload}
          onClick={() => {
            uploadInfo({
              fileName: filevName,
              fileSize: filevSize,
              videoUrl,
              thumbUrl,
              activeUser: activeUser!.username,
              duration: durationForApiCall
            });
            props.setShow(false);
            setStep("upload");
            props.setShowGallery(true);
          }}
        >
          {i18next.t("video-upload.to-gallery")}
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
