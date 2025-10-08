import i18next from "i18next";
import { IntroStep } from "@ui/core";

export const SUBMIT_TOUR_ITEMS: IntroStep[] = [
  {
    title: i18next.t("submit-tour.title"),
    message: i18next.t("submit-tour.title-hint"),
    targetSelector: "#submit-title"
  },
  {
    title: i18next.t("submit-tour.title"),
    message: i18next.t("submit-tour.tags-hint"),
    targetSelector: "#submit-tags-selector"
  },
  {
    title: i18next.t("submit-tour.title"),
    message: i18next.t("submit-tour.body-hint"),
    targetSelector: "#the-editor"
  },
  {
    title: i18next.t("submit-tour.title"),
    message: i18next.t("submit-tour.community-hint"),
    targetSelector: "#community-picker"
  },
  {
    title: i18next.t("submit-tour.title"),
    message: i18next.t("submit-tour.toolbar-hint"),
    targetSelector: "#editor-toolbar"
  },
  {
    title: i18next.t("submit-tour.title"),
    message: i18next.t("submit-tour.advanced-hint"),
    targetSelector: "#editor-advanced"
  },
  {
    title: i18next.t("submit-tour.title"),
    message: i18next.t("submit-tour.help-hint"),
    targetSelector: "#editor-help"
  }
];
