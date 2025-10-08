import React from "react";
import xss from "xss";
import i18next from "i18next";

export const HTML_WHITELIST = {
  a: ["class", "href", "target", "rel"],
  span: ["class"],
  h3: [],
  p: [],
  strong: [],
  b: [],
  img: ["src", "alt"],
  ul: [],
  li: [],
  br: []
};

export const safeHtml = (html: string): string => {
  return xss(html, {
    whiteList: HTML_WHITELIST,
    stripIgnoreTagBody: true,
    stripIgnoreTag: true,
    css: false
  });
};

interface Props {
  k: string;
  args?: {};
  children: JSX.Element;
}

export function Tsx({ children, k, args }: Props) {
  return React.cloneElement(children, {
    dangerouslySetInnerHTML: { __html: safeHtml(i18next.t(k, args)) }
  });
}
