import O, { useRef as $, useEffect as l, useState as x, useMemo as b, useCallback as D } from "react";
import { renderPostBody as j } from "@ecency/render-helper";
import { clsx as z } from "clsx";
import I from "medium-zoom";
import { jsx as c, Fragment as w, jsxs as m } from "react/jsx-runtime";
import { createRoot as h, hydrateRoot as N } from "react-dom/client";
function F({
  containerRef: a
}) {
  const r = $(void 0);
  return l(() => {
    var n, t, o;
    return Array.from(((n = a.current) == null ? void 0 : n.querySelectorAll(".markdown-view:not(.markdown-view-pure) img")) ?? []).filter((s) => {
      try {
        if (!s.isConnected)
          return !1;
        const i = s.parentNode;
        return i ? i.nodeName !== "A" && !s.classList.contains("medium-zoom-image") && !s.closest(".markdown-image-container") : !1;
      } catch (i) {
        return console.warn("Error accessing image element properties:", i), !1;
      }
    }).forEach((s) => {
      var k, g, R, T;
      try {
        if (!s.isConnected) {
          console.warn("Image element is no longer connected to DOM, skipping");
          return;
        }
        const i = s.parentElement;
        if (!i) {
          console.warn("Image element has no parent, skipping");
          return;
        }
        const d = document.createElement("div");
        d.classList.add("markdown-image-container");
        const u = s.cloneNode(!0), p = (k = s.getAttribute("title")) == null ? void 0 : k.trim(), h = (g = s.getAttribute("data-caption")) == null ? void 0 : g.trim(), f = (R = s.getAttribute("alt")) == null ? void 0 : R.trim(), y = f ? /^[\w,\s-]+\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(f) : !1, v = p || h || (y ? "" : f);
        if (v) {
          const A = document.createElement("div");
          A.classList.add("markdown-img-caption"), A.innerText = v, d.appendChild(u), d.appendChild(A);
        } else
          d.appendChild(u);
        s.isConnected && i && i.replaceChild(d, s);
      } catch (i) {
        console.warn("Error enhancing image element:", i);
      }
    }), r.current = I(((t = a.current) == null ? void 0 : t.querySelectorAll(".markdown-view:not(.markdown-view-pure) img")) ?? []), (o = r.current) == null || o.update({
      background: "#131111"
    }), () => {
      var s;
      (s = r.current) == null || s.detach();
    };
  }, []), /* @__PURE__ */ c(w, {});
}
function L(a) {
  try {
    const r = new URL(a, "https://ecency.com").pathname.split("/").filter(Boolean).pop() ?? "";
    return r.includes("re-ecencywaves") || r.includes("re-leothreads") || r.startsWith("wave-") || r.startsWith("re-liketu-moments");
  } catch {
    return !1;
  }
}
const V = ".markdown-view:not(.markdown-view-pure) a", Y = /* @__PURE__ */ new Set([
  "ecency.com",
  "www.ecency.com",
  "peakd.com",
  "www.peakd.com",
  "hive.blog",
  "www.hive.blog"
]);
function Z(a) {
  return a.trim().replace(/^https?:\/\/(www\.)?(ecency\.com|peakd\.com|hive\.blog)/i, "").replace(/^\/+/, "").split("?")[0].replace(/#@.*$/i, "").replace(/\/+$/, "").toLowerCase();
}
function E(a) {
  return Array.from(
    a.querySelectorAll(V)
  ).filter((e) => {
    if ((e.dataset.isInline ?? "").toLowerCase() === "true")
      return !1;
    if (e.dataset.postLinkChecked === "true")
      return e.classList.contains("markdown-post-link");
    if (e.dataset.postLinkChecked = "true", (e.dataset.isInline ?? "").toLowerCase() === "true")
      return !1;
    if (e.classList.contains("markdown-post-link"))
      return !0;
    const n = e.getAttribute("href") ?? "";
    if (!n)
      return !1;
    try {
      const t = new URL(n, "https://ecency.com");
      if (t.protocol && !/^https?:$/.test(t.protocol) || t.hostname && t.hostname !== "" && !Y.has(t.hostname) || t.hash.startsWith("#@"))
        return !1;
      const o = t.pathname.split("/").filter(Boolean);
      if (o.length < 2)
        return !1;
      const s = decodeURIComponent(o.pop() ?? ""), i = decodeURIComponent(o.pop() ?? "");
      if (!i.startsWith("@") || !s || !(o.length === 0 || o.length === 1 && o[0].toLowerCase().startsWith("hive-")))
        return !1;
      const u = Z(e.innerText), p = `${i}/${s}`.toLowerCase(), f = o.length === 1 ? decodeURIComponent(o[0]).toLowerCase() : void 0, y = /* @__PURE__ */ new Set([p]);
      return f && y.add(`${f}/${p}`), e.innerText.trim() === n.trim() || y.has(u) ? (e.classList.add("markdown-post-link"), !0) : !1;
    } catch {
      return !1;
    }
  });
}
const S = /* @__PURE__ */ new Map();
function P(a) {
  try {
    const r = new URL(`https://ecency.com${a}`).pathname.split("/"), e = decodeURIComponent(r[3] || ""), n = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(e), t = /[?#]/.test(e);
    return !/^[a-z0-9-]+$/.test(e) || n || t;
  } catch {
    return !0;
  }
}
function q({
  link: a
}) {
  const [r, e] = x(), n = b(() => new URL(a, "https://ecency.com"), [a]), t = n.pathname.toLowerCase(), o = D(async () => {
    var i, d, u, p;
    if (S.has(t)) {
      e(S.get(t));
      return;
    }
    if (P(t)) {
      console.warn("[Ecency Renderer] Skipping invalid post link:", t);
      return;
    }
    try {
      const y = await (await fetch(`https://ecency.com${t}`, {
        method: "GET"
      })).text(), v = document.createElement("html");
      v.innerHTML = y;
      const k = (i = v.querySelector('meta[property="og:title"]')) == null ? void 0 : i.getAttribute("content");
      if (k) {
        const g = {
          title: k,
          description: ((u = (d = v.querySelector('meta[property="og:description"]')) == null ? void 0 : d.getAttribute("content")) == null ? void 0 : u.substring(0, 71)) ?? void 0,
          image: ((p = v.querySelector('meta[property="og:image"]')) == null ? void 0 : p.getAttribute("content")) ?? void 0
        };
        S.set(t, g), e(g);
      }
    } catch (f) {
      console.error(`[Ecency Renderer] Failed to fetch preview: ${a}`, f);
    }
  }, [t, a]);
  l(() => {
    o();
  }, [o]);
  const s = b(() => {
    const i = new URL(n.href), d = i.searchParams.get("referral");
    return `${i.pathname}${d ? `?referral=${d}` : ""}${i.hash}`;
  }, [n]);
  return /* @__PURE__ */ c("a", {
    href: s,
    className: "ecency-renderer-hive-post-extension-link",
    target: "_blank",
    rel: "noopener",
    children: r ? /* @__PURE__ */ m(w, {
      children: [/* @__PURE__ */ c("div", {
        className: "ecency-renderer-hive-post-extension-link-image",
        style: {
          backgroundImage: `url(${r.image})`
        }
      }), /* @__PURE__ */ m("div", {
        className: "ecency-renderer-hive-post-extension-link-text-content",
        children: [/* @__PURE__ */ c("div", {
          className: "ecency-renderer-hive-post-extension-link-type",
          children: "Hive post"
        }), /* @__PURE__ */ c("div", {
          className: "ecency-renderer-hive-post-extension-link-title",
          children: r.title
        }), /* @__PURE__ */ c("div", {
          className: "ecency-renderer-hive-post-extension-link-description",
          children: r.description + "..."
        })]
      })]
    }) : a
  });
}
function K({
  containerRef: a
}) {
  return l(() => {
    const r = a.current;
    r && E(r).filter((e) => !L(e.getAttribute("href") ?? "")).filter((e) => {
      try {
        const n = new URL(e.getAttribute("href") ?? "", "https://ecency.com");
        return !P(n.pathname);
      } catch {
        return !1;
      }
    }).forEach((e) => {
      var s;
      if (e.dataset.enhanced === "true") return;
      e.dataset.enhanced = "true";
      const n = document.createElement("div");
      n.classList.add("ecency-renderer-hive-post-extension");
      const t = e.getAttribute("href") ?? "";
      h(n).render(/* @__PURE__ */ c(q, {
        link: t
      })), (s = e.parentElement) == null || s.replaceChild(n, e);
    });
  }, []), null;
}
function _({
  author: a
}) {
  const r = `https://images.ecency.com/u${a.toLowerCase().replace("@", "")}/avatar/small`;
  return /* @__PURE__ */ m(w, {
    children: [/* @__PURE__ */ c("img", {
      src: r,
      className: "ecency-renderer-author-extension-link-image",
      alt: a
    }), /* @__PURE__ */ m("div", {
      className: "ecency-renderer-author-extension-link-content",
      children: [/* @__PURE__ */ c("span", {
        className: "ecency-renderer-author-extension-link-content-label",
        children: "Hive account"
      }), /* @__PURE__ */ c("span", {
        children: a.toLowerCase().replace("/", "")
      })]
    })]
  });
}
function G({
  containerRef: a
}) {
  return l(() => {
    var e;
    Array.from(((e = a.current) == null ? void 0 : e.querySelectorAll(".markdown-view:not(.markdown-view-pure) .markdown-author-link")) ?? []).forEach((n) => {
      var i;
      if (n.dataset.enhanced === "true") return;
      const t = n.getAttribute("href");
      if (!t) return;
      const o = document.createElement("a");
      o.setAttribute("href", t), o.setAttribute("target", "_blank"), o.setAttribute("rel", "noopener"), o.classList.add("ecency-renderer-author-extension"), o.classList.add("ecency-renderer-author-extension-link"), h(o).render(/* @__PURE__ */ c(_, {
        author: t
      })), (i = n.parentElement) == null || i.replaceChild(o, n), o.dataset.enhanced = "true";
    });
  }, []), null;
}
function J({
  tag: a
}) {
  return /* @__PURE__ */ c("span", {
    children: a.replace("/", "")
  });
}
function Q({
  containerRef: a
}) {
  return l(() => {
    var e;
    Array.from(((e = a.current) == null ? void 0 : e.querySelectorAll(".markdown-view:not(.markdown-view-pure) .markdown-tag-link")) ?? []).forEach((n) => {
      var s;
      const t = document.createElement("a");
      t.setAttribute("href", n.getAttribute("href") ?? ""), t.setAttribute("target", "_blank"), t.setAttribute("rel", "noopener"), t.classList.add("ecency-renderer-tag-extension"), t.classList.add("ecency-renderer-tag-extension-link"), h(t).render(/* @__PURE__ */ c(J, {
        tag: n.innerText
      })), (s = n.parentElement) == null || s.replaceChild(t, n);
    });
  }, []), null;
}
function W(a) {
  try {
    const r = new URL(a);
    let e = "";
    if (r.hostname === "youtu.be" ? e = r.pathname.slice(1) : r.pathname.startsWith("/shorts/") ? e = r.pathname.split("/shorts/")[1] : r.pathname.startsWith("/embed/") ? e = r.pathname.split("/embed/")[1] : e = r.searchParams.get("v") ?? "", !e)
      return "";
    const n = new URLSearchParams(), t = r.searchParams.get("t") || r.searchParams.get("start") || r.searchParams.get("time_continue");
    if (t) {
      const i = X(t);
      i && n.set("start", i.toString());
    }
    const o = r.searchParams.get("list");
    o && n.set("list", o), n.set("rel", "0"), n.set("modestbranding", "1");
    const s = n.toString();
    return `https://www.youtube.com/embed/${e}${s ? `?${s}` : ""}`;
  } catch {
    return "";
  }
}
function X(a) {
  const r = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/, e = a.match(r);
  if (e && (e[1] || e[2] || e[3])) {
    const t = parseInt(e[1] || "0", 10), o = parseInt(e[2] || "0", 10), s = parseInt(e[3] || "0", 10);
    return t * 3600 + o * 60 + s;
  }
  const n = parseInt(a, 10);
  return Number.isNaN(n) ? void 0 : n;
}
function H({
  embedSrc: a,
  container: r
}) {
  const [e, n] = x(!1);
  return l(() => {
    const t = () => n(!0);
    return r.addEventListener("click", t), () => r.removeEventListener("click", t);
  }, []), l(() => {
    if (e) {
      const t = r.querySelector(".video-thumbnail"), o = r.querySelector(".markdown-video-play");
      t && (t.style.display = "none"), o && (o.style.display = "none");
    }
  }, [e]), e ? /* @__PURE__ */ c("iframe", {
    className: "youtube-shorts-iframe",
    src: a,
    title: "Video player",
    frameBorder: "0",
    allow: "accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
    allowFullScreen: !0
  }) : null;
}
function ee({
  containerRef: a
}) {
  return l(() => {
    var e;
    Array.from(((e = a.current) == null ? void 0 : e.querySelectorAll(".markdown-view:not(.markdown-view-pure) .markdown-video-link-youtube:not(.ecency-renderer-youtube-extension)")) ?? []).forEach((n) => {
      const t = n.dataset.embedSrc || W(n.getAttribute("href") ?? "");
      n.dataset.embedSrc = t;
      const o = document.createElement("div");
      o.classList.add("ecency-renderer-youtube-extension-frame"), n.classList.add("ecency-renderer-youtube-extension"), N(o, /* @__PURE__ */ c(H, {
        embedSrc: t,
        container: n
      })), n.appendChild(o);
    });
  }, []), /* @__PURE__ */ c(w, {});
}
const C = /* @__PURE__ */ new Map();
async function te(a, r) {
  if (C.has(`${a}/${r}`))
    return C.get(`${a}/${r}`);
  const e = await window.dHiveClient.call(
    "condenser_api",
    "get_content",
    [a, r]
  );
  return C.set(`${a}/${r}`, e), e;
}
const re = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 148.85 148.85"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><circle class="ecency-logo-circle" cx="74.43" cy="74.43" r="74.43"/><path class="ecency-logo-sign" d="M88.27,105.71c-9,.08-30.35.27-35.13-.29-3.88-.46-11-3-11.11-12.81C42,87,41.66,64,42.46,59,44.13,48.4,47,41.77,59.05,36.33c10.26-4.44,32.17-.78,34.54,16.93.45,3.37,1.25,3.74,2.49,4,19.61,4.13,24,26.26,14.6,38.32C104.73,103.26,98.31,104.76,88.27,105.71ZM84.71,59.25c.68-11.52-11-19.82-22.82-13.66-8.42,4.39-9.15,10.76-9.68,18-.67,9.2-.25,15.91-.09,25.13.07,4.13,1.27,6.64,5.7,7,1.14.1,17,0,25.22.06,10.74.06,24.06-4.89,21.93-18a12.68,12.68,0,0,0-10.8-10.22,2.12,2.12,0,0,0-2.21,1C85,83,69.66,82.31,63.41,74.46c-5.61-7.06-2.7-18.73,4.68-21.2,2.78-.94,5.11-.11,6.25,1.86,1.84,3.18.11,6.06-2.49,7.65s-2.45,3.92-1.36,5.46c2.56,3.59,7.6,2.88,10.79-.28C83.87,65.4,84.52,62.47,84.71,59.25Z"/></g></g></svg>';
function U({
  link: a
}) {
  const [r, e] = x(), n = b(() => {
    var o, s, i, d;
    return (o = r == null ? void 0 : r.permlink) != null && o.startsWith("re-ecencywaves") || (s = r == null ? void 0 : r.permlink) != null && s.startsWith("wave-") ? "ecency.waves" : (i = r == null ? void 0 : r.permlink) != null && i.startsWith("re-leothreads") ? "threads" : (d = r == null ? void 0 : r.permlink) != null && d.startsWith("re-liketu-moments") ? "moments" : "";
  }, [r]);
  if (l(() => {
    const [o, s, i, d, u] = new URL(a, "https://ecency.com").pathname.split("/");
    te(d.replace("@", ""), u).then((p) => {
      e(p);
    }).catch((p) => console.error(p));
  }, []), !r)
    return /* @__PURE__ */ c(w, {});
  const t = `/waves/${r.author}/${r.permlink}`;
  return /* @__PURE__ */ m("article", {
    className: "ecency-renderer-wave-like-post-extension-renderer",
    children: [/* @__PURE__ */ c("a", {
      href: t,
      "aria-label": `Open wave by @${r.author}`,
      className: "ecency-renderer-wave-like-post-extension-renderer__overlay"
    }), /* @__PURE__ */ m("div", {
      className: "ecency-renderer-wave-like-post-extension-renderer--author",
      children: [/* @__PURE__ */ c("img", {
        src: `https://images.ecency.com/u/${r.author}/avatar/small`,
        alt: r.author,
        className: "ecency-renderer-wave-like-post-extension-renderer--author-avatar"
      }), /* @__PURE__ */ m("div", {
        className: "ecency-renderer-wave-like-post-extension-renderer--author-content",
        children: [/* @__PURE__ */ m("a", {
          className: "ecency-renderer-wave-like-post-extension-renderer--author-content-link",
          href: `/@${r.author}/posts`,
          children: ["@", r.author]
        }), /* @__PURE__ */ m("div", {
          className: "ecency-renderer-wave-like-post-extension-renderer--author-content-host",
          children: ["#", n]
        })]
      })]
    }), /* @__PURE__ */ c("a", {
      href: "https://ecency.com",
      className: "ecency-renderer-wave-like-post-extension-renderer--logo",
      dangerouslySetInnerHTML: {
        __html: re
      }
    }), /* @__PURE__ */ c("div", {
      className: "ecency-renderer-wave-like-post-extension-renderer--body",
      children: /* @__PURE__ */ c(ce, {
        value: r.body
      })
    })]
  });
}
function ne({
  containerRef: a
}) {
  return l(() => {
    const r = a.current;
    r && E(r).filter((e) => L(e.getAttribute("href") ?? "")).forEach((e) => {
      var t;
      const n = document.createElement("div");
      n.classList.add("ecency-renderer-wave-like-extension"), N(n, /* @__PURE__ */ c(U, {
        link: e.getAttribute("href") ?? ""
      })), (t = e.parentElement) == null || t.replaceChild(n, e);
    });
  }, []), /* @__PURE__ */ c(w, {});
}
function M({
  op: a
}) {
  const r = b(() => {
    try {
      const n = atob(a);
      return JSON.parse(n);
    } catch {
      return;
    }
  }, [a]), e = b(() => r == null ? void 0 : r[0].split("_").join(" "), [r]);
  return /* @__PURE__ */ m(w, {
    children: [/* @__PURE__ */ c("span", {
      className: "ecency-renderer-hive-operation-extension-label",
      children: "Hive operation, click to Sign"
    }), !r && a, /* @__PURE__ */ c("div", {
      className: "ecency-renderer-hive-operation-extension-content",
      children: r && /* @__PURE__ */ m(w, {
        children: [/* @__PURE__ */ c("div", {
          className: "ecency-renderer-hive-operation-extension-type",
          children: e
        }), e === "transfer" && /* @__PURE__ */ m("div", {
          className: "ecency-renderer-hive-operation-extension-transfer",
          children: [/* @__PURE__ */ c("span", {
            className: "ecency-renderer-hive-operation-extension-transfer-highlight",
            children: r[1].amount
          }), /* @__PURE__ */ c("span", {
            children: " to"
          }), /* @__PURE__ */ c("img", {
            src: `https://images.ecency.com/u/${r[1].to}/avatar/small`,
            className: "ecency-renderer-hive-operation-extension-transfer-image",
            alt: ""
          }), /* @__PURE__ */ c("span", {
            className: "ecency-renderer-hive-operation-extension-transfer-highlight",
            children: r[1].to
          })]
        })]
      })
    })]
  });
}
function ae({
  containerRef: a,
  onClick: r
}) {
  return l(() => {
    var e;
    Array.from(((e = a.current) == null ? void 0 : e.querySelectorAll(".markdown-view:not(.markdown-view-pure) .markdown-external-link")) ?? []).filter((n) => {
      var t;
      return (t = n.innerText) == null ? void 0 : t.startsWith("hive://sign/op/");
    }).forEach((n) => {
      var i;
      const t = document.createElement("div");
      t.classList.add("ecency-renderer-hive-operation-extension");
      const o = n.innerText.replace("hive://sign/op/", "");
      t.addEventListener("click", () => r == null ? void 0 : r(o)), h(t).render(/* @__PURE__ */ c(M, {
        op: o
      })), (i = n.parentElement) == null || i.replaceChild(t, n);
    });
  }, [a, r]), null;
}
function oe({
  containerRef: a,
  ComponentInstance: r
}) {
  return l(() => {
    var n;
    Array.from(((n = a.current) == null ? void 0 : n.querySelectorAll(".markdown-view:not(.markdown-view-pure) .markdown-external-link")) ?? []).filter((t) => {
      const o = t.getAttribute("href") || "";
      return o.startsWith("https://x.com") || o.startsWith("https://twitter.com");
    }).forEach((t) => {
      try {
        const o = t.getAttribute("href");
        if (!o) return;
        const i = new URL(o).pathname.split("/").pop();
        if (!i) return;
        const d = document.createElement("div");
        d.classList.add("ecency-renderer-twitter-extension-frame"), t.classList.add("ecency-renderer-twitter-extension"), t.innerHTML = "", t.appendChild(d), h(d).render(/* @__PURE__ */ c(r, {
          id: i
        }));
      } catch (o) {
        console.warn("TwitterExtension failed to render tweet:", o);
      }
    });
  }, [a]), null;
}
function B({
  embedSrc: a,
  container: r
}) {
  const [e, n] = x(!1);
  return l(() => {
    const t = () => n(!0);
    return r.addEventListener("click", t), () => r.removeEventListener("click", t);
  }, []), l(() => {
    if (e) {
      const t = r.querySelector(".video-thumbnail"), o = r.querySelector(".markdown-video-play");
      t && (t.style.display = "none"), o && (o.style.display = "none");
    }
  }, [e]), e ? /* @__PURE__ */ c("iframe", {
    className: "speak-iframe",
    src: a,
    title: "3Speak video",
    frameBorder: "0",
    allow: "accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
    allowFullScreen: !0
  }) : null;
}
function se({
  containerRef: a
}) {
  return l(() => {
    var e;
    Array.from(((e = a.current) == null ? void 0 : e.querySelectorAll(".markdown-view:not(.markdown-view-pure) .markdown-video-link-speak:not(.ecency-renderer-speak-extension)")) ?? []).forEach((n) => {
      const t = document.createElement("div");
      t.classList.add("ecency-renderer-speak-extension-frame"), n.classList.add("ecency-renderer-speak-extension"), N(t, /* @__PURE__ */ c(B, {
        embedSrc: n.dataset.embedSrc ?? "",
        container: n
      })), n.appendChild(t);
    });
  }, []), /* @__PURE__ */ c(w, {});
}
function ce({
  value: a,
  pure: r = !1,
  onHiveOperationClick: e,
  TwitterComponent: n = () => /* @__PURE__ */ c("div", {
    children: "No twitter component"
  }),
  ...t
}) {
  const o = $(null);
  return /* @__PURE__ */ m(w, {
    children: [/* @__PURE__ */ c("div", {
      ...t,
      ref: o,
      itemProp: "articleBody",
      className: z("entry-body markdown-view user-selectable", r ? "markdown-view-pure" : "", t.className),
      dangerouslySetInnerHTML: {
        __html: j(a, !1)
      }
    }), !r && /* @__PURE__ */ m(w, {
      children: [/* @__PURE__ */ c(F, {
        containerRef: o
      }), /* @__PURE__ */ c(K, {
        containerRef: o
      }), /* @__PURE__ */ c(G, {
        containerRef: o
      }), /* @__PURE__ */ c(Q, {
        containerRef: o
      }), /* @__PURE__ */ c(ee, {
        containerRef: o
      }), /* @__PURE__ */ c(se, {
        containerRef: o
      }), /* @__PURE__ */ c(ne, {
        containerRef: o
      }), /* @__PURE__ */ c(oe, {
        containerRef: o,
        ComponentInstance: n
      }), /* @__PURE__ */ c(ae, {
        containerRef: o,
        onClick: e
      })]
    })]
  });
}
function ie(a) {
  Array.from(
    a.querySelectorAll(
      ".markdown-view:not(.markdown-view-pure) img"
    )
  ).filter((n) => {
    try {
      if (!n.isConnected)
        return !1;
      const t = n.parentNode;
      return t ? t.nodeName !== "A" && !n.classList.contains("medium-zoom-image") && !n.closest(".markdown-image-container") : !1;
    } catch (t) {
      return console.warn("Error accessing image element properties:", t), !1;
    }
  }).forEach((n) => {
    var t, o, s;
    try {
      if (!n.isConnected) {
        console.warn("Image element is no longer connected to DOM, skipping");
        return;
      }
      if (!n.parentElement) {
        console.warn("Image element has no parent, skipping");
        return;
      }
      const d = document.createElement("div");
      d.classList.add("markdown-image-container");
      const u = n.cloneNode(!0), p = (t = n.getAttribute("title")) == null ? void 0 : t.trim(), f = (o = n.getAttribute("data-caption")) == null ? void 0 : o.trim(), y = (s = n.getAttribute("alt")) == null ? void 0 : s.trim(), v = y ? /^[\w,\s-]+\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(y) : !1, k = p || f || (v ? "" : y);
      if (k) {
        const g = document.createElement("div");
        g.classList.add("markdown-img-caption"), g.innerText = k, d.appendChild(u), d.appendChild(g);
      } else
        d.appendChild(u);
      n.isConnected && n.parentElement && n.parentElement.replaceChild(d, n);
    } catch (i) {
      console.warn("Error enhancing image element:", i);
    }
  }), I(
    a.querySelectorAll(
      ".markdown-view:not(.markdown-view-pure) img"
    )
  ).update({ background: "#131111" });
}
function de(a, r = E(a)) {
  r.filter((e) => e.dataset.isInline !== "true").filter((e) => !L(e.getAttribute("href") ?? "")).forEach((e) => {
    var s;
    if (e.dataset.enhanced === "true") return;
    e.dataset.enhanced = "true";
    const n = e.getAttribute("href") ?? "", t = document.createElement("div");
    t.classList.add("ecency-renderer-hive-post-extension"), h(t).render(/* @__PURE__ */ c(q, {
      link: n
    })), (s = e.parentElement) == null || s.replaceChild(t, e);
  });
}
function le(a, r) {
  Array.from(a.querySelectorAll(".markdown-view:not(.markdown-view-pure) .markdown-external-link")).filter((e) => e.innerText.startsWith("hive://sign/op/")).forEach((e) => {
    var s;
    if (e.dataset.enhanced === "true") return;
    e.dataset.enhanced = "true";
    const n = e.innerText.replace("hive://sign/op/", ""), t = document.createElement("div");
    t.classList.add("ecency-renderer-hive-operation-extension"), t.addEventListener("click", () => r == null ? void 0 : r(n)), h(t).render(/* @__PURE__ */ c(M, {
      op: n
    })), (s = e.parentElement) == null || s.replaceChild(t, e);
  });
}
function me(a) {
  Array.from(a.querySelectorAll(".markdown-view:not(.markdown-view-pure) .markdown-author-link")).forEach((e) => {
    var s;
    if (e.dataset.enhanced === "true") return;
    e.dataset.enhanced = "true";
    const n = e.getAttribute("href");
    if (!n) return;
    const t = document.createElement("a");
    t.href = n, t.target = "_blank", t.rel = "noopener", t.classList.add("ecency-renderer-author-extension", "ecency-renderer-author-extension-link"), h(t).render(/* @__PURE__ */ c(_, {
      author: n
    })), (s = e.parentElement) == null || s.replaceChild(t, e);
  });
}
function ue(a) {
  a.querySelectorAll(
    ".markdown-view:not(.markdown-view-pure) .markdown-tag-link"
  ).forEach((e) => {
    e.classList.add("ecency-renderer-tag-link-enhanced");
  });
}
function pe(a) {
  Array.from(a.querySelectorAll(".markdown-view:not(.markdown-view-pure) .markdown-video-link-youtube:not(.ecency-renderer-youtube-extension)")).forEach((e) => {
    if (e.dataset.enhanced === "true") return;
    e.dataset.enhanced = "true";
    const n = e.dataset.embedSrc || W(e.getAttribute("href") ?? "");
    e.dataset.embedSrc = n;
    const t = document.createElement("div");
    t.classList.add("ecency-renderer-youtube-extension-frame"), h(t).render(/* @__PURE__ */ c(H, {
      embedSrc: n,
      container: e
    })), e.appendChild(t);
  });
}
function he(a) {
  Array.from(a.querySelectorAll(".markdown-view:not(.markdown-view-pure) .markdown-video-link-speak:not(.ecency-renderer-speak-extension)")).forEach((e) => {
    if (e.dataset.enhanced === "true") return;
    e.dataset.enhanced = "true";
    const n = e.dataset.embedSrc ?? "", t = document.createElement("div");
    t.classList.add("ecency-renderer-speak-extension-frame"), h(t).render(/* @__PURE__ */ c(B, {
      embedSrc: n,
      container: e
    })), e.appendChild(t);
  });
}
function fe(a, r) {
  Array.from(a.querySelectorAll(".markdown-view:not(.markdown-view-pure) .markdown-external-link")).filter((n) => {
    const t = n.getAttribute("href") || "";
    if (!t.startsWith("https://x.com") && !t.startsWith("https://twitter.com"))
      return !1;
    try {
      const s = new URL(t).pathname.split("/").filter(Boolean);
      return s.length >= 3 && s[1] === "status" && /^\d+$/.test(s[2]);
    } catch {
      return !1;
    }
  }).forEach((n) => {
    try {
      if (n.dataset.enhanced === "true") return;
      n.dataset.enhanced = "true";
      const t = n.getAttribute("href");
      if (!t) return;
      const i = new URL(t).pathname.split("/").filter(Boolean)[2];
      if (!i) return;
      const d = document.createElement("div");
      d.classList.add("ecency-renderer-twitter-extension-frame"), n.innerHTML = "", n.appendChild(d), h(d).render(/* @__PURE__ */ c(r, {
        id: i
      }));
    } catch (t) {
      console.warn("applyTwitterEmbeds failed to render tweet:", t);
    }
  });
}
function we(a, r = E(a)) {
  r.filter((e) => e.dataset.isInline !== "true").filter((e) => L(e.getAttribute("href") ?? "")).forEach((e) => {
    var s;
    if (e.dataset.enhanced === "true") return;
    e.dataset.enhanced = "true";
    const n = e.getAttribute("href") ?? "", t = document.createElement("div");
    t.classList.add("ecency-renderer-wave-like-extension"), h(t).render(/* @__PURE__ */ c(U, {
      link: n
    })), (s = e.parentElement) == null || s.replaceChild(t, e);
  });
}
const ye = ({ id: a }) => O.createElement("div", {
  style: {
    padding: "16px",
    border: "1px solid #e1e8ed",
    borderRadius: "8px",
    backgroundColor: "#f7f9fa",
    color: "#657786",
    textAlign: "center"
  }
}, `Failed to load tweet. View on Twitter: https://twitter.com/i/status/${a}`);
function Le(a, r) {
  ie(a);
  const e = E(a);
  de(a, e), me(a), le(a, r == null ? void 0 : r.onHiveOperationClick), ue(a), pe(a), he(a), we(a, e), fe(a, (r == null ? void 0 : r.TwitterComponent) ?? ye);
}
export {
  ce as EcencyRenderer,
  Le as setupPostEnhancements
};
