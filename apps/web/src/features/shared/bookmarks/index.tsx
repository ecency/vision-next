import { BookmarksList } from "@/features/shared/bookmarks/bookmarks-list";
import { FavouritesList } from "@/features/shared/bookmarks/favourites-list";
import { TabItem } from "@/features/ui";
import { Modal, ModalBody, ModalHeader } from "@ui/modal";
import i18next from "i18next";
import { useState } from "react";
import "./_index.scss";

interface Props {
  show: boolean;
  setShow: (v: boolean) => void;
}

export function BookmarksDialog({ show, setShow }: Props) {
  const [section, setSection] = useState("bookmarks");

  return (
    <Modal show={show} centered={true} onHide={() => setShow(false)} size="lg">
      <ModalHeader closeButton={true}>
        <div className="flex text-sm">
          <TabItem
            title={i18next.t("bookmarks.title")}
            isSelected={section === "bookmarks"}
            onSelect={() => setSection("bookmarks")}
            name="bookmarks"
            i={0}
          />
          <TabItem
            title={i18next.t("favorites.title")}
            isSelected={section === "favorites"}
            onSelect={() => setSection("favorites")}
            name="favorites"
            i={1}
          />
        </div>
      </ModalHeader>
      <ModalBody className="bg-gray-100 dark:bg-gray-900 rounded-b-2xl">
        {section === "bookmarks" && <BookmarksList onHide={() => setShow(false)} />}
        {section === "favorites" && <FavouritesList onHide={() => setShow(false)} />}
      </ModalBody>
    </Modal>
  );
}
