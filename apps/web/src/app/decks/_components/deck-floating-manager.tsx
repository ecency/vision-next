import React, { useContext, useRef, useState } from "react";
import "./_deck-floating-manager.scss";
import { DeckGridContext } from "./deck-manager";
import { getColumnTitle, ICONS } from "./consts";
import { Button } from "@ui/button";
import { classNameObject } from "@ui/util";
import { upArrowSvg } from "@ui/svg";
import i18next from "i18next";

export const DeckFloatingManager = () => {
  const columnsRef = useRef<HTMLDivElement | null>(null);

  const { layout, add, scrollTo, getNextKey } = useContext(DeckGridContext);
  const [show, setShow] = useState(false);
  const [mobileOffset, setMobileOffset] = useState(0);

  return layout.columns.length > 0 ? (
    <div
      className={classNameObject({
        "deck-floating-manager": true,
        show,
        dragging: mobileOffset > 0
      })}
    >
      <Button
        draggable="true"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onTouchEnd={() => {
          setShow(mobileOffset <= 75);
          setMobileOffset(0);
        }}
        onTouchMove={(e: React.TouchEvent) => {
          const touchY = e.touches.item(0).clientY;
          const windowHeight = window.innerHeight;
          const resultInPercentage = (touchY / windowHeight) * 100;

          e.stopPropagation();

          setMobileOffset(resultInPercentage);
        }}
        icon={upArrowSvg}
        iconClassName="mx-3"
      />
      <div
        ref={columnsRef}
        className={classNameObject({
          columns: true,
          "columns-dragging": mobileOffset > 0
        })}
        style={{
          ...(mobileOffset > 0 && { transform: `translateY(${mobileOffset}%)` })
        }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onTouchEnd={() => setShow(false)}
      >
        <div className="columns-list">
          {layout.columns.map(({ type, key, settings }) => (
            <div
              className={"item " + type}
              onClick={() => {
                scrollTo(key);
                setShow(false);
              }}
              key={key + type}
            >
              {settings && "contentType" in settings
                ? ICONS[type][settings.contentType]
                : ICONS[type]}
              <div className="title">
                <div>{getColumnTitle(type, settings)}</div>
                <div className="primary">
                  {settings && "username" in settings && ["u", "w", "n"].includes(type) ? (
                    `@${settings.username}`
                  ) : (
                    <></>
                  )}
                  {settings && "query" in settings ? settings.query : <></>}
                  {settings && "username" in settings && ["co"].includes(type) ? (
                    settings.username
                  ) : (
                    <></>
                  )}
                  {settings && "host" in settings && ["th"].includes(type) ? (
                    <div className="text-capitalize">{settings.host}</div>
                  ) : (
                    <></>
                  )}
                  {type === "ac" ? i18next.t("decks.columns.new-column") : ""}
                  {type === "to" ? i18next.t("decks.columns.topics") : ""}
                  {type === "tr" ? i18next.t("decks.columns.trending") : ""}
                  {type === "msf" ? i18next.t("decks.columns.market-swap-form") : ""}
                  {type === "faq" ? i18next.t("decks.columns.faq") : ""}
                  {type === "wb" ? i18next.t("decks.columns.balance") : ""}
                  {type === "wn" ? i18next.t("decks.columns.whats-new") : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button
          outline={true}
          onClick={() =>
            add({
              key: getNextKey(),
              type: "ac",
              settings: {}
            })
          }
        >
          {i18next.t("decks.add-column")}
        </Button>
      </div>
    </div>
  ) : (
    <></>
  );
};
