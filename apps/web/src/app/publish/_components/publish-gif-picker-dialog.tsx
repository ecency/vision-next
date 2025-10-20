import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import i18next from "i18next";
import React, { useCallback, useState } from "react";
import { getGifsQuery } from "@/api/queries";
import { useInfiniteDataFlow } from "@/utils";
import useMount from "react-use/lib/useMount";
import { SearchBox } from "@/features/shared";
import Image from "next/image";
import { GifPickerBottom } from "@ui/gif-picker/gif-picker-bottom";
import { GiphyResponse } from "@/entities";

interface Props {
  show: boolean;
  setShow: (show: boolean) => void;
  onPick: (url: string, alt: string) => void;
}

export function PublishGifPickerDialog({ show, setShow, onPick }: Props) {
  const [filter, setFilter] = useState("");

  const { data, refetch, fetchNextPage, hasNextPage } = getGifsQuery(filter).useClientQuery();
  const dataFlow = useInfiniteDataFlow(data);

  useMount(() => {
    if (dataFlow.length === 0) {
      refetch();
    }
  });

  const itemClicked = useCallback(
    async (gif: GiphyResponse["data"][0]) => {
      onPick(gif.images?.fixed_height?.url, gif.title);
    },
    [onPick]
  );

  return (
    <Modal show={show} centered={true} onHide={() => setShow(false)} size="lg">
      <ModalHeader closeButton={true}>
        <ModalTitle>{i18next.t("publish.gif-picker")}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <SearchBox
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          placeholder={i18next.t("gif-picker.filter-placeholder")}
          value={filter}
          onChange={(e: { target: { value: React.SetStateAction<string> } }) =>
            setFilter(e.target.value)
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-4">
          {dataFlow.map((gif, i) => (
            <div
              className="p-4 border border-[--border-color] rounded-xl cursor-pointer hover:scale-95 duration-300 hover:bg-gray-100 hover:dark:bg-dark-default"
              key={gif?.id || i}
            >
              <Image
                className="w-full"
                width={200}
                height={200}
                src={gif?.images?.fixed_height?.url}
                alt={gif?.title || i18next.t("gif-picker.alt-text")}
                onClick={() => itemClicked(gif)}
              />
            </div>
          ))}
          <GifPickerBottom onVisible={() => hasNextPage && fetchNextPage()} />
        </div>
        <span className="flex justify-end">{i18next.t("gif-picker.credits")}</span>
      </ModalBody>
    </Modal>
  );
}
