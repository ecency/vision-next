import { useContext, useEffect, useRef, useState } from "react";
import "./_decks-settings.scss";
import { DeckGrid } from "../types";
import * as uuid from "uuid";
import { DeckGridContext } from "../deck-manager";
import { DEFAULT_COLUMNS } from "../consts";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import { FormControl, InputGroup } from "@ui/input";
import { Button } from "@ui/button";
import { Form } from "@ui/form";
import { Alert } from "@ui/alert";
import { deleteForeverSvg } from "@ui/svg";
import { EmojiPicker } from "@ui/emoji-picker/lazy-emoji-picker";
import i18next from "i18next";
import { ClickAwayListener } from "@/features/shared";
import { emoticonHappyOutlineSvg } from "@/assets/img/svg";

interface Props {
  deck?: DeckGrid;
  show: boolean;
  setShow: (val: boolean) => void;
}

export const DecksSettings = ({ show, setShow, deck }: Props) => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const { pushOrUpdateDeck, removeDeck, decks } = useContext(DeckGridContext);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [isLocalStorage, setIsLocalStorage] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRemovingDeck, setIsRemovingDeck] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setName(deck?.title ?? name);
    setIcon(deck?.icon ?? icon);
    setIsLocalStorage(deck?.storageType === "local");
  }, [deck, icon, name]);

  const submit = () => {
    if (!name) {
      return;
    }

    if (deck) {
      const value: DeckGrid = {
        key: deck.key,
        icon,
        title: name,
        storageType: isLocalStorage ? "local" : "account",
        columns: deck.columns
      };
      pushOrUpdateDeck(value);
    } else {
      const newDeck: DeckGrid = {
        key: uuid.v4(),
        icon,
        title: name,
        storageType: isLocalStorage ? "local" : "account",
        columns: DEFAULT_COLUMNS
      };
      pushOrUpdateDeck(newDeck);
    }
    setShow(false);
  };

  return (
    <Modal
      animation={true}
      show={show}
      centered={true}
      onHide={() => setShow(false)}
      className="decks-settings"
    >
      <ModalHeader closeButton={true}>
        <ModalTitle>
          {deck ? i18next.t("decks.settings") : i18next.t("decks.create-deck")}
        </ModalTitle>
      </ModalHeader>
      <ModalBody>
        {isRemovingDeck && deck && (
          <div>
            <div className="text-center mb-4">{i18next.t("decks.delete-prompt")}</div>
            <div className="flex items-center justify-center">
              <Button
                disabled={isLoading}
                className="mr-2"
                onClick={() => setIsRemovingDeck(false)}
              >
                {i18next.t("g.cancel")}
              </Button>
              <Button
                disabled={isLoading}
                outline={true}
                appearance="danger"
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    await removeDeck(deck);
                    setShow(false);
                    setIsRemovingDeck(false);
                  } catch (e) {
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                {i18next.t("g.confirm")}
              </Button>
            </div>
          </div>
        )}
        {!isRemovingDeck && (
          <Form>
            <div className="mb-4">
              <InputGroup
                prepend={
                  <>
                    <Button
                      ref={anchorRef}
                      appearance="link"
                      className="[&_svg]:size-4"
                      onClick={() => {
                        setShowEmoji(!showEmoji);
                      }}
                    >
                      {icon ? icon : emoticonHappyOutlineSvg}
                    </Button>
                    {showEmoji && (
                      <EmojiPicker
                        show={showEmoji}
                        changeState={(state) => setShowEmoji(state)}
                        onSelect={(value) => {
                          setIcon(value);
                        }}
                        buttonRef={anchorRef}
                      />
                    )}
                  </>
                }
              >
                <FormControl
                  className="input-control"
                  type="text"
                  placeholder={i18next.t("decks.deck-name-placeholder")}
                  value={name}
                  onChange={({ target }) => setName(target.value)}
                />
              </InputGroup>
            </div>
            <label className="font-bold">{i18next.t("g.settings")}</label>
            {isLocalStorage && <Alert className="my-3">{i18next.t("decks.use-local-text")}</Alert>}
            <div className="form-section flex">
              <div className="mb-4">
                <FormControl
                  checked={isLocalStorage}
                  type="checkbox"
                  label={i18next.t("decks.save-locally")}
                  onChange={(value) => setIsLocalStorage(value)}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <div>
                {deck && decks.decks.length > 1 ? (
                  <Button
                    appearance="danger"
                    outline={true}
                    onClick={() => setIsRemovingDeck(true)}
                    icon={deleteForeverSvg}
                    aria-label={i18next.t("g.delete", { defaultValue: "Delete" })}
                  />
                ) : (
                  <></>
                )}
              </div>
              <div>
                <Button appearance="link" onClick={() => setShow(false)}>
                  {i18next.t("g.cancel")}
                </Button>
                <Button disabled={!name} onClick={() => submit()}>
                  {deck ? i18next.t("g.save") : i18next.t("decks.create")}
                </Button>
              </div>
            </div>
          </Form>
        )}
      </ModalBody>
    </Modal>
  );
};
