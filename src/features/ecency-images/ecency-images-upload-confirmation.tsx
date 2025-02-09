import { motion } from "framer-motion";
import { useMemo } from "react";
import { Button } from "../ui";
import i18next from "i18next";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";
import { useUploadPostImage } from "@/api/mutations";

interface Props {
  file: File;
  onUpload: (link: string) => void;
  onCancel: () => void;
}

export function EcencyImagesUploadConfirmation({ file, onCancel, onUpload }: Props) {
  const fileUrl = useMemo(() => URL.createObjectURL(file), [file]);

  const { mutateAsync: upload, isPending } = useUploadPostImage();

  return (
    <motion.div
      initial={{ opacity: 0, position: "absolute" }}
      animate={{ opacity: 1, position: "static" }}
      exit={{ opacity: 0, position: "absolute" }}
    >
      <img className="w-full" src={fileUrl} alt={file.name} />
      <div className="flex justify-end gap-4 mt-4">
        <Button disabled={isPending} appearance="gray" size="sm" onClick={onCancel}>
          {i18next.t("g.cancel")}
        </Button>
        <Button
          isLoading={isPending}
          icon={<UilArrowRight />}
          size="sm"
          onClick={async () => {
            const { url } = await upload({ file });
            onUpload(url);
          }}
        >
          {i18next.t(isPending ? "ecency-images.uploading" : "g.confirm")}
        </Button>
      </div>
    </motion.div>
  );
}
