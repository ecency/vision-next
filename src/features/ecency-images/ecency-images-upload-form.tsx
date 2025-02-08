import { UilFileDownload, UilFileUpload } from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import { motion } from "framer-motion";
import i18next from "i18next";
import { use, useCallback, useRef, useState } from "react";

interface Props {
    onFilePick: (file: File) => void;
}

export function EcencyImagesUploadForm({ onFilePick }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.items) {
            Array.from(e.dataTransfer.items).forEach((item, i) => {
                if (item.kind === "file") {
                    const file = item.getAsFile();
                    if (file) {
                        onFilePick(file);
                    }
                }
            });
        } else {
            Array.from(e.dataTransfer.files).forEach((file, i) => {
                onFilePick(file);
            });
        }

        setIsDragging(false);
    }, [onFilePick]);

    const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFilePick(files[0]);
        }
    }, [onFilePick]);

    return <motion.div initial={{ opacity: 0, position: 'absolute' }} animate={{ opacity: 1, 'position': 'static' }} exit={{ opacity: 0, 'position': 'absolute' }}>
        <input type="file" ref={fileInputRef} className="hidden" onChange={onInputChange} />
        <div
            className={clsx(
                "flex cursor-pointer flex-col gap-4 items-center justify-center py-8 md:py-12 lg:py-16 w-full border-2 rounded-xl border-dashed hover:bg-gray-100 hover:dark:bg-dark-200-075 duration-300",
                isDragging ? 'border-blue-dark-sky' : 'border-[--border-color]'
            )}
            onClick={() => fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
        >
            {isDragging ? <UilFileDownload className="w-10 h-10 opacity-50" /> : <UilFileUpload className="w-10 h-10 opacity-50" />}
            <div className="font-semibold">{i18next.t(isDragging ? 'ecency-images.dropzone-realize' : 'ecency-images.dropzone-title')}</div>
            {!isDragging && <div className="text-sm opacity-75">{i18next.t('ecency-images.dropzone-hint')}</div>}
        </div>
    </motion.div>
}