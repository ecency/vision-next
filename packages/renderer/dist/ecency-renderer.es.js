import O, { useRef as T, useEffect as m, useState as L, useMemo as b, useCallback as B } from "react";
import { renderPostBody as D } from "@ecency/render-helper";
import { clsx as F } from "clsx";
import $ from "medium-zoom";
import { jsx as i, Fragment as w, jsxs as p } from "react/jsx-runtime";
import { createRoot as f, hydrateRoot as N } from "react-dom/client";
function j({
  containerRef: a
}) {
  const t = T(void 0);
  return m(() => {
    var n, r, o;
    Array.from(((n = a.current) == null ? void 0 : n.querySelectorAll(".markdown-view:not(.markdown-view-pure) img")) ?? []).filter((s) => {
      try {
        if (!s.isConnected)
          return !1;
        const c = s.parentNode;
        return c ? c.nodeName !== "A" && !s.classList.contains("medium-zoom-image") && !s.closest(".markdown-image-container") : !1;
      } catch (c) {
        return console.warn("Error accessing image element properties:", c), !1;
      }
    }).forEach((s) => {
      var c, l, h;
      try {
        if (!s.isConnected) {
          console.warn("Image element is no longer connected to DOM, skipping");
          return;
        }
        if (!s.parentElement) {
          console.warn("Image element has no parent, skipping");
          return;
        }
        const d = document.createElement("div");
        d.classList.add("markdown-image-container");
        const g = s.cloneNode(!0), y = (c = s.getAttribute("title")) == null ? void 0 : c.trim(), v = (l = s.getAttribute("data-caption")) == null ? void 0 : l.trim(), k = (h = s.getAttribute("alt")) == null ? void 0 : h.trim(), M = k ? /^[\w,\s-]+\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(k) : !1, R = y || v || (M ? "" : k);
        if (R) {
          const A = document.createElement("div");
          A.classList.add("markdown-img-caption"), A.innerText = R, d.appendChild(g), d.appendChild(A);
        } else
          d.appendChild(g);
        s.isConnected && s.parentElement && s.parentElement.replaceChild(d, s);
      } catch (u) {
        console.warn("Error enhancing image element:", u);
      }
    });
    try {
      const s = Array.from(((r = a.current) == null ? void 0 : r.querySelectorAll(".markdown-view:not(.markdown-view-pure) img")) ?? []).filter((c) => {
        try {
          return c.isConnected && c.parentNode !== null;
        } catch {
          return !1;
        }
      });
      s.length > 0 && (t.current = $(s), (o = t.current) == null || o.update({
        background: "#131111"
      }));
    } catch (s) {
      console.warn("Failed to initialize medium-zoom:", s);
    }
    return () => {
      var s;
      (s = t.current) == null || s.detach();
    };
  }, []), /* @__PURE__ */ i(w, {});
}
function x(a) {
  try {
    const t = new URL(a, "https://ecency.com").pathname.split("/").filter(Boolean).pop() ?? "";
    return t.includes("re-ecencywaves") || t.includes("re-leothreads") || t.startsWith("wave-") || t.startsWith("re-liketu-moments");
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
      const r = new URL(n, "https://ecency.com");
      if (r.protocol && !/^https?:$/.test(r.protocol) || r.hostname && r.hostname !== "" && !Y.has(r.hostname) || r.hash.startsWith("#@"))
        return !1;
      const o = r.pathname.split("/").filter(Boolean);
      if (o.length < 2)
        return !1;
      const s = decodeURIComponent(o.pop() ?? ""), c = decodeURIComponent(o.pop() ?? "");
      if (!c.startsWith("@") || !s || !(o.length === 0 || o.length === 1 && o[0].toLowerCase().startsWith("hive-")))
        return !1;
      const h = Z(e.innerText), u = `${c}/${s}`.toLowerCase(), d = o.length === 1 ? decodeURIComponent(o[0]).toLowerCase() : void 0, g = /* @__PURE__ */ new Set([u]);
      return d && g.add(`${d}/${u}`), e.innerText.trim() === n.trim() || g.has(h) ? (e.classList.add("markdown-post-link"), !0) : !1;
    } catch {
      return !1;
    }
  });
}
const C = /* @__PURE__ */ new Map();
function I(a) {
  try {
    const t = new URL(`https://ecency.com${a}`).pathname.split("/"), e = decodeURIComponent(t[3] || ""), n = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(e), r = /[?#]/.test(e);
    return !/^[a-z0-9-]+$/.test(e) || n || r;
  } catch {
    return !0;
  }
}
function P({
  link: a
}) {
  const [t, e] = L(), n = b(() => new URL(a, "https://ecency.com"), [a]), r = n.pathname.toLowerCase(), o = B(async () => {
    var c, l, h, u;
    if (C.has(r)) {
      e(C.get(r));
      return;
    }
    if (I(r)) {
      console.warn("[Ecency Renderer] Skipping invalid post link:", r);
      return;
    }
    try {
      const g = await (await fetch(`https://ecency.com${r}`, {
        method: "GET"
      })).text(), y = document.createElement("html");
      y.innerHTML = g;
      const v = (c = y.querySelector('meta[property="og:title"]')) == null ? void 0 : c.getAttribute("content");
      if (v) {
        const k = {
          title: v,
          description: ((h = (l = y.querySelector('meta[property="og:description"]')) == null ? void 0 : l.getAttribute("content")) == null ? void 0 : h.substring(0, 71)) ?? void 0,
          image: ((u = y.querySelector('meta[property="og:image"]')) == null ? void 0 : u.getAttribute("content")) ?? void 0
        };
        C.set(r, k), e(k);
      }
    } catch (d) {
      console.error(`[Ecency Renderer] Failed to fetch preview: ${a}`, d);
    }
  }, [r, a]);
  m(() => {
    o();
  }, [o]);
  const s = b(() => {
    const c = new URL(n.href), l = c.searchParams.get("referral");
    return `${c.pathname}${l ? `?referral=${l}` : ""}${c.hash}`;
  }, [n]);
  return /* @__PURE__ */ i("a", {
    href: s,
    className: "ecency-renderer-hive-post-extension-link",
    target: "_blank",
    rel: "noopener",
    children: t ? /* @__PURE__ */ p(w, {
      children: [/* @__PURE__ */ i("div", {
        className: "ecency-renderer-hive-post-extension-link-image",
        style: {
          backgroundImage: `url(${t.image})`
        }
      }), /* @__PURE__ */ p("div", {
        className: "ecency-renderer-hive-post-extension-link-text-content",
        children: [/* @__PURE__ */ i("div", {
          className: "ecency-renderer-hive-post-extension-link-type",
          children: "Hive post"
        }), /* @__PURE__ */ i("div", {
          className: "ecency-renderer-hive-post-extension-link-title",
          children: t.title
        }), /* @__PURE__ */ i("div", {
          className: "ecency-renderer-hive-post-extension-link-description",
          children: t.description + "..."
        })]
      })]
    }) : a
  });
}
function K({
  containerRef: a
}) {
  return m(() => {
    const t = a.current;
    t && E(t).filter((e) => !x(e.getAttribute("href") ?? "")).filter((e) => {
      try {
        const n = new URL(e.getAttribute("href") ?? "", "https://ecency.com");
        return !I(n.pathname);
      } catch {
        return !1;
      }
    }).forEach((e) => {
      var s;
      if (e.dataset.enhanced === "true") return;
      e.dataset.enhanced = "true";
      const n = document.createElement("div");
      n.classList.add("ecency-renderer-hive-post-extension");
      const r = e.getAttribute("href") ?? "";
      f(n).render(/* @__PURE__ */ i(P, {
        link: r
      })), (s = e.parentElement) == null || s.replaceChild(n, e);
    });
  }, []), null;
}
function q({
  author: a
}) {
  const t = `https://images.ecency.com/u${a.toLowerCase().replace("@", "")}/avatar/small`;
  return /* @__PURE__ */ p(w, {
    children: [/* @__PURE__ */ i("img", {
      src: t,
      className: "ecency-renderer-author-extension-link-image",
      alt: a
    }), /* @__PURE__ */ p("div", {
      className: "ecency-renderer-author-extension-link-content",
      children: [/* @__PURE__ */ i("span", {
        className: "ecency-renderer-author-extension-link-content-label",
        children: "Hive account"
      }), /* @__PURE__ */ i("span", {
        children: a.toLowerCase().replace("/", "")
      })]
    })]
  });
}
function G({
  containerRef: a
}) {
  return m(() => {
    var e;
    Array.from(((e = a.current) == null ? void 0 : e.querySelectorAll(".markdown-view:not(.markdown-view-pure) .markdown-author-link")) ?? []).forEach((n) => {
      var c;
      if (n.dataset.enhanced === "true") return;
      const r = n.getAttribute("href");
      if (!r) return;
      const o = document.createElement("a");
      o.setAttribute("href", r), o.setAttribute("target", "_blank"), o.setAttribute("rel", "noopener"), o.classList.add("ecency-renderer-author-extension"), o.classList.add("ecency-renderer-author-extension-link"), f(o).render(/* @__PURE__ */ i(q, {
        author: r
      })), (c = n.parentElement) == null || c.replaceChild(o, n), o.dataset.enhanced = "true";
    });
  }, []), null;
}
function J({
  tag: a
}) {
  return /* @__PURE__ */ i("span", {
    children: a.replace("/", "")
  });
}
function Q({
  containerRef: a
}) {
  return m(() => {
    var e;
    Array.from(((e = a.current) == null ? void 0 : e.querySelectorAll(".markdown-view:not(.markdown-view-pure) .markdown-tag-link")) ?? []).forEach((n) => {
      var s;
      const r = document.createElement("a");
      r.setAttribute("href", n.getAttribute("href") ?? ""), r.setAttribute("target", "_blank"), r.setAttribute("rel", "noopener"), r.classList.add("ecency-renderer-tag-extension"), r.classList.add("ecency-renderer-tag-extension-link"), f(r).render(/* @__PURE__ */ i(J, {
        tag: n.innerText
      })), (s = n.parentElement) == null || s.replaceChild(r, n);
    });
  }, []), null;
}
function _(a) {
  try {
    const t = new URL(a);
    let e = "";
    if (t.hostname === "youtu.be" ? e = t.pathname.slice(1) : t.pathname.startsWith("/shorts/") ? e = t.pathname.split("/shorts/")[1] : t.pathname.startsWith("/embed/") ? e = t.pathname.split("/embed/")[1] : e = t.searchParams.get("v") ?? "", !e)
      return "";
    const n = new URLSearchParams(), r = t.searchParams.get("t") || t.searchParams.get("start") || t.searchParams.get("time_continue");
    if (r) {
      const c = X(r);
      c && n.set("start", c.toString());
    }
    const o = t.searchParams.get("list");
    o && n.set("list", o), n.set("rel", "0"), n.set("modestbranding", "1");
    const s = n.toString();
    return `https://www.youtube.com/embed/${e}${s ? `?${s}` : ""}`;
  } catch {
    return "";
  }
}
function X(a) {
  const t = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/, e = a.match(t);
  if (e && (e[1] || e[2] || e[3])) {
    const r = parseInt(e[1] || "0", 10), o = parseInt(e[2] || "0", 10), s = parseInt(e[3] || "0", 10);
    return r * 3600 + o * 60 + s;
  }
  const n = parseInt(a, 10);
  return Number.isNaN(n) ? void 0 : n;
}
function W({
  embedSrc: a,
  container: t
}) {
  const [e, n] = L(!1);
  return m(() => {
    const r = () => n(!0);
    return t.addEventListener("click", r), () => t.removeEventListener("click", r);
  }, []), m(() => {
    if (e) {
      const r = t.querySelector(".video-thumbnail"), o = t.querySelector(".markdown-video-play");
      r && (r.style.display = "none"), o && (o.style.display = "none");
    }
  }, [e]), e ? /* @__PURE__ */ i("iframe", {
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
  return m(() => {
    var e;
    Array.from(((e = a.current) == null ? void 0 : e.querySelectorAll(".markdown-view:not(.markdown-view-pure) .markdown-video-link-youtube:not(.ecency-renderer-youtube-extension)")) ?? []).forEach((n) => {
      const r = n.dataset.embedSrc || _(n.getAttribute("href") ?? "");
      n.dataset.embedSrc = r;
      const o = document.createElement("div");
      o.classList.add("ecency-renderer-youtube-extension-frame"), n.classList.add("ecency-renderer-youtube-extension"), N(o, /* @__PURE__ */ i(W, {
        embedSrc: r,
        container: n
      })), n.appendChild(o);
    });
  }, []), /* @__PURE__ */ i(w, {});
}
const S = /* @__PURE__ */ new Map();
async function te(a, t) {
  if (S.has(`${a}/${t}`))
    return S.get(`${a}/${t}`);
  const e = await window.dHiveClient.call(
    "condenser_api",
    "get_content",
    [a, t]
  );
  return S.set(`${a}/${t}`, e), e;
}
const re = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 148.85 148.85"><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><circle class="ecency-logo-circle" cx="74.43" cy="74.43" r="74.43"/><path class="ecency-logo-sign" d="M88.27,105.71c-9,.08-30.35.27-35.13-.29-3.88-.46-11-3-11.11-12.81C42,87,41.66,64,42.46,59,44.13,48.4,47,41.77,59.05,36.33c10.26-4.44,32.17-.78,34.54,16.93.45,3.37,1.25,3.74,2.49,4,19.61,4.13,24,26.26,14.6,38.32C104.73,103.26,98.31,104.76,88.27,105.71ZM84.71,59.25c.68-11.52-11-19.82-22.82-13.66-8.42,4.39-9.15,10.76-9.68,18-.67,9.2-.25,15.91-.09,25.13.07,4.13,1.27,6.64,5.7,7,1.14.1,17,0,25.22.06,10.74.06,24.06-4.89,21.93-18a12.68,12.68,0,0,0-10.8-10.22,2.12,2.12,0,0,0-2.21,1C85,83,69.66,82.31,63.41,74.46c-5.61-7.06-2.7-18.73,4.68-21.2,2.78-.94,5.11-.11,6.25,1.86,1.84,3.18.11,6.06-2.49,7.65s-2.45,3.92-1.36,5.46c2.56,3.59,7.6,2.88,10.79-.28C83.87,65.4,84.52,62.47,84.71,59.25Z"/></g></g></svg>';
function H({
  link: a
}) {
  const [t, e] = L(), n = b(() => {
    var o, s, c, l;
    return (o = t == null ? void 0 : t.permlink) != null && o.startsWith("re-ecencywaves") || (s = t == null ? void 0 : t.permlink) != null && s.startsWith("wave-") ? "ecency.waves" : (c = t == null ? void 0 : t.permlink) != null && c.startsWith("re-leothreads") ? "threads" : (l = t == null ? void 0 : t.permlink) != null && l.startsWith("re-liketu-moments") ? "moments" : "";
  }, [t]);
  if (m(() => {
    const [o, s, c, l, h] = new URL(a, "https://ecency.com").pathname.split("/");
    te(l.replace("@", ""), h).then((u) => {
      e(u);
    }).catch((u) => console.error(u));
  }, []), !t)
    return /* @__PURE__ */ i(w, {});
  const r = `/waves/${t.author}/${t.permlink}`;
  return /* @__PURE__ */ p("article", {
    className: "ecency-renderer-wave-like-post-extension-renderer",
    children: [/* @__PURE__ */ i("a", {
      href: r,
      "aria-label": `Open wave by @${t.author}`,
      className: "ecency-renderer-wave-like-post-extension-renderer__overlay"
    }), /* @__PURE__ */ p("div", {
      className: "ecency-renderer-wave-like-post-extension-renderer--author",
      children: [/* @__PURE__ */ i("img", {
        src: `https://images.ecency.com/u/${t.author}/avatar/small`,
        alt: t.author,
        className: "ecency-renderer-wave-like-post-extension-renderer--author-avatar"
      }), /* @__PURE__ */ p("div", {
        className: "ecency-renderer-wave-like-post-extension-renderer--author-content",
        children: [/* @__PURE__ */ p("a", {
          className: "ecency-renderer-wave-like-post-extension-renderer--author-content-link",
          href: `/@${t.author}/posts`,
          children: ["@", t.author]
        }), /* @__PURE__ */ p("div", {
          className: "ecency-renderer-wave-like-post-extension-renderer--author-content-host",
          children: ["#", n]
        })]
      })]
    }), /* @__PURE__ */ i("a", {
      href: "https://ecency.com",
      className: "ecency-renderer-wave-like-post-extension-renderer--logo",
      dangerouslySetInnerHTML: {
        __html: re
      }
    }), /* @__PURE__ */ i("div", {
      className: "ecency-renderer-wave-like-post-extension-renderer--body",
      children: /* @__PURE__ */ i(ie, {
        value: t.body
      })
    })]
  });
}
function ne({
  containerRef: a
}) {
  return m(() => {
    const t = a.current;
    t && E(t).filter((e) => x(e.getAttribute("href") ?? "")).forEach((e) => {
      var r;
      const n = document.createElement("div");
      n.classList.add("ecency-renderer-wave-like-extension"), N(n, /* @__PURE__ */ i(H, {
        link: e.getAttribute("href") ?? ""
      })), (r = e.parentElement) == null || r.replaceChild(n, e);
    });
  }, []), /* @__PURE__ */ i(w, {});
}
function U({
  op: a
}) {
  const t = b(() => {
    try {
      const n = atob(a);
      return JSON.parse(n);
    } catch {
      return;
    }
  }, [a]), e = b(() => t == null ? void 0 : t[0].split("_").join(" "), [t]);
  return /* @__PURE__ */ p(w, {
    children: [/* @__PURE__ */ i("span", {
      className: "ecency-renderer-hive-operation-extension-label",
      children: "Hive operation, click to Sign"
    }), !t && a, /* @__PURE__ */ i("div", {
      className: "ecency-renderer-hive-operation-extension-content",
      children: t && /* @__PURE__ */ p(w, {
        children: [/* @__PURE__ */ i("div", {
          className: "ecency-renderer-hive-operation-extension-type",
          children: e
        }), e === "transfer" && /* @__PURE__ */ p("div", {
          className: "ecency-renderer-hive-operation-extension-transfer",
          children: [/* @__PURE__ */ i("span", {
            className: "ecency-renderer-hive-operation-extension-transfer-highlight",
            children: t[1].amount
          }), /* @__PURE__ */ i("span", {
            children: " to"
          }), /* @__PURE__ */ i("img", {
            src: `https://images.ecency.com/u/${t[1].to}/avatar/small`,
            className: "ecency-renderer-hive-operation-extension-transfer-image",
            alt: ""
          }), /* @__PURE__ */ i("span", {
            className: "ecency-renderer-hive-operation-extension-transfer-highlight",
            children: t[1].to
          })]
        })]
      })
    })]
  });
}
function ae({
  containerRef: a,
  onClick: t
}) {
  return m(() => {
    var e;
    Array.from(((e = a.current) == null ? void 0 : e.querySelectorAll(".markdown-view:not(.markdown-view-pure) .markdown-external-link")) ?? []).filter((n) => {
      var r;
      return (r = n.innerText) == null ? void 0 : r.startsWith("hive://sign/op/");
    }).forEach((n) => {
      var c;
      const r = document.createElement("div");
      r.classList.add("ecency-renderer-hive-operation-extension");
      const o = n.innerText.replace("hive://sign/op/", "");
      r.addEventListener("click", () => t == null ? void 0 : t(o)), f(r).render(/* @__PURE__ */ i(U, {
        op: o
      })), (c = n.parentElement) == null || c.replaceChild(r, n);
    });
  }, [a, t]), null;
}
function oe({
  containerRef: a,
  ComponentInstance: t
}) {
  return m(() => {
    var n;
    Array.from(((n = a.current) == null ? void 0 : n.querySelectorAll(".markdown-view:not(.markdown-view-pure) .markdown-external-link")) ?? []).filter((r) => {
      const o = r.getAttribute("href") || "";
      return o.startsWith("https://x.com") || o.startsWith("https://twitter.com");
    }).forEach((r) => {
      try {
        const o = r.getAttribute("href");
        if (!o) return;
        const c = new URL(o).pathname.split("/").pop();
        if (!c) return;
        const l = document.createElement("div");
        l.classList.add("ecency-renderer-twitter-extension-frame"), r.classList.add("ecency-renderer-twitter-extension"), r.innerHTML = "", r.appendChild(l), f(l).render(/* @__PURE__ */ i(t, {
          id: c
        }));
      } catch (o) {
        console.warn("TwitterExtension failed to render tweet:", o);
      }
    });
  }, [a]), null;
}
function z({
  embedSrc: a,
  container: t
}) {
  const [e, n] = L(!1);
  return m(() => {
    const r = () => n(!0);
    return t.addEventListener("click", r), () => t.removeEventListener("click", r);
  }, []), m(() => {
    if (e) {
      const r = t.querySelector(".video-thumbnail"), o = t.querySelector(".markdown-video-play");
      r && (r.style.display = "none"), o && (o.style.display = "none");
    }
  }, [e]), e ? /* @__PURE__ */ i("iframe", {
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
  return m(() => {
    var e;
    Array.from(((e = a.current) == null ? void 0 : e.querySelectorAll(".markdown-view:not(.markdown-view-pure) .markdown-video-link-speak:not(.ecency-renderer-speak-extension)")) ?? []).forEach((n) => {
      const r = document.createElement("div");
      r.classList.add("ecency-renderer-speak-extension-frame"), n.classList.add("ecency-renderer-speak-extension"), N(r, /* @__PURE__ */ i(z, {
        embedSrc: n.dataset.embedSrc ?? "",
        container: n
      })), n.appendChild(r);
    });
  }, []), /* @__PURE__ */ i(w, {});
}
function ie({
  value: a,
  pure: t = !1,
  onHiveOperationClick: e,
  TwitterComponent: n = () => /* @__PURE__ */ i("div", {
    children: "No twitter component"
  }),
  ...r
}) {
  const o = T(null);
  return /* @__PURE__ */ p(w, {
    children: [/* @__PURE__ */ i("div", {
      ...r,
      ref: o,
      itemProp: "articleBody",
      className: F("entry-body markdown-view user-selectable", t ? "markdown-view-pure" : "", r.className),
      dangerouslySetInnerHTML: {
        __html: D(a, !1)
      }
    }), !t && /* @__PURE__ */ p(w, {
      children: [/* @__PURE__ */ i(j, {
        containerRef: o
      }), /* @__PURE__ */ i(K, {
        containerRef: o
      }), /* @__PURE__ */ i(G, {
        containerRef: o
      }), /* @__PURE__ */ i(Q, {
        containerRef: o
      }), /* @__PURE__ */ i(ee, {
        containerRef: o
      }), /* @__PURE__ */ i(se, {
        containerRef: o
      }), /* @__PURE__ */ i(ne, {
        containerRef: o
      }), /* @__PURE__ */ i(oe, {
        containerRef: o,
        ComponentInstance: n
      }), /* @__PURE__ */ i(ae, {
        containerRef: o,
        onClick: e
      })]
    })]
  });
}
function ce(a) {
  Array.from(
    a.querySelectorAll(
      ".markdown-view:not(.markdown-view-pure) img"
    )
  ).filter((e) => {
    try {
      if (!e.isConnected)
        return !1;
      const n = e.parentNode;
      return n ? n.nodeName !== "A" && !e.classList.contains("medium-zoom-image") && !e.closest(".markdown-image-container") : !1;
    } catch (n) {
      return console.warn("Error accessing image element properties:", n), !1;
    }
  }).forEach((e) => {
    var n, r, o;
    try {
      if (!e.isConnected) {
        console.warn("Image element is no longer connected to DOM, skipping");
        return;
      }
      if (!e.parentElement) {
        console.warn("Image element has no parent, skipping");
        return;
      }
      const c = document.createElement("div");
      c.classList.add("markdown-image-container");
      const l = e.cloneNode(!0), h = (n = e.getAttribute("title")) == null ? void 0 : n.trim(), u = (r = e.getAttribute("data-caption")) == null ? void 0 : r.trim(), d = (o = e.getAttribute("alt")) == null ? void 0 : o.trim(), g = d ? /^[\w,\s-]+\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(d) : !1, y = h || u || (g ? "" : d);
      if (y) {
        const v = document.createElement("div");
        v.classList.add("markdown-img-caption"), v.innerText = y, c.appendChild(l), c.appendChild(v);
      } else
        c.appendChild(l);
      e.isConnected && e.parentElement && e.parentElement.replaceChild(c, e);
    } catch (s) {
      console.warn("Error enhancing image element:", s);
    }
  });
  try {
    const e = Array.from(
      a.querySelectorAll(
        ".markdown-view:not(.markdown-view-pure) img"
      )
    ).filter((n) => {
      try {
        return n.isConnected && n.parentNode !== null;
      } catch {
        return !1;
      }
    });
    e.length > 0 && $(e).update({ background: "#131111" });
  } catch (e) {
    console.warn("Failed to initialize medium-zoom:", e);
  }
}
function le(a, t = E(a)) {
  t.filter((e) => e.dataset.isInline !== "true").filter((e) => !x(e.getAttribute("href") ?? "")).forEach((e) => {
    var s;
    if (e.dataset.enhanced === "true") return;
    e.dataset.enhanced = "true";
    const n = e.getAttribute("href") ?? "", r = document.createElement("div");
    r.classList.add("ecency-renderer-hive-post-extension"), f(r).render(/* @__PURE__ */ i(P, {
      link: n
    })), (s = e.parentElement) == null || s.replaceChild(r, e);
  });
}
function de(a, t) {
  Array.from(a.querySelectorAll(".markdown-view:not(.markdown-view-pure) .markdown-external-link")).filter((e) => e.innerText.startsWith("hive://sign/op/")).forEach((e) => {
    var s;
    if (e.dataset.enhanced === "true") return;
    e.dataset.enhanced = "true";
    const n = e.innerText.replace("hive://sign/op/", ""), r = document.createElement("div");
    r.classList.add("ecency-renderer-hive-operation-extension"), r.addEventListener("click", () => t == null ? void 0 : t(n)), f(r).render(/* @__PURE__ */ i(U, {
      op: n
    })), (s = e.parentElement) == null || s.replaceChild(r, e);
  });
}
function me(a) {
  Array.from(a.querySelectorAll(".markdown-view:not(.markdown-view-pure) .markdown-author-link")).forEach((e) => {
    var s;
    if (e.dataset.enhanced === "true") return;
    e.dataset.enhanced = "true";
    const n = e.getAttribute("href");
    if (!n) return;
    const r = document.createElement("a");
    r.href = n, r.target = "_blank", r.rel = "noopener", r.classList.add("ecency-renderer-author-extension", "ecency-renderer-author-extension-link"), f(r).render(/* @__PURE__ */ i(q, {
      author: n
    })), (s = e.parentElement) == null || s.replaceChild(r, e);
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
    const n = e.dataset.embedSrc || _(e.getAttribute("href") ?? "");
    e.dataset.embedSrc = n;
    const r = document.createElement("div");
    r.classList.add("ecency-renderer-youtube-extension-frame"), f(r).render(/* @__PURE__ */ i(W, {
      embedSrc: n,
      container: e
    })), e.appendChild(r);
  });
}
function he(a) {
  Array.from(a.querySelectorAll(".markdown-view:not(.markdown-view-pure) .markdown-video-link-speak:not(.ecency-renderer-speak-extension)")).forEach((e) => {
    if (e.dataset.enhanced === "true") return;
    e.dataset.enhanced = "true";
    const n = e.dataset.embedSrc ?? "", r = document.createElement("div");
    r.classList.add("ecency-renderer-speak-extension-frame"), f(r).render(/* @__PURE__ */ i(z, {
      embedSrc: n,
      container: e
    })), e.appendChild(r);
  });
}
function fe(a, t) {
  Array.from(a.querySelectorAll(".markdown-view:not(.markdown-view-pure) .markdown-external-link")).filter((n) => {
    const r = n.getAttribute("href") || "";
    if (!r.startsWith("https://x.com") && !r.startsWith("https://twitter.com"))
      return !1;
    try {
      const s = new URL(r).pathname.split("/").filter(Boolean);
      return s.length >= 3 && s[1] === "status" && /^\d+$/.test(s[2]);
    } catch {
      return !1;
    }
  }).forEach((n) => {
    try {
      if (n.dataset.enhanced === "true") return;
      n.dataset.enhanced = "true";
      const r = n.getAttribute("href");
      if (!r) return;
      const c = new URL(r).pathname.split("/").filter(Boolean)[2];
      if (!c) return;
      const l = document.createElement("div");
      l.classList.add("ecency-renderer-twitter-extension-frame"), n.innerHTML = "", n.appendChild(l), f(l).render(/* @__PURE__ */ i(t, {
        id: c
      }));
    } catch (r) {
      console.warn("applyTwitterEmbeds failed to render tweet:", r);
    }
  });
}
function we(a, t = E(a)) {
  t.filter((e) => e.dataset.isInline !== "true").filter((e) => x(e.getAttribute("href") ?? "")).forEach((e) => {
    var s;
    if (e.dataset.enhanced === "true") return;
    e.dataset.enhanced = "true";
    const n = e.getAttribute("href") ?? "", r = document.createElement("div");
    r.classList.add("ecency-renderer-wave-like-extension"), f(r).render(/* @__PURE__ */ i(H, {
      link: n
    })), (s = e.parentElement) == null || s.replaceChild(r, e);
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
function xe(a, t) {
  ce(a);
  const e = E(a);
  le(a, e), me(a), de(a, t == null ? void 0 : t.onHiveOperationClick), ue(a), pe(a), he(a), we(a, e), fe(a, (t == null ? void 0 : t.TwitterComponent) ?? ye);
}
export {
  G as AuthorLinkExtension,
  q as AuthorLinkRenderer,
  ie as EcencyRenderer,
  ae as HiveOperationExtension,
  U as HiveOperationRenderer,
  K as HivePostLinkExtension,
  P as HivePostLinkRenderer,
  j as ImageZoomExtension,
  Q as TagLinkExtension,
  J as TagLinkRenderer,
  se as ThreeSpeakVideoExtension,
  z as ThreeSpeakVideoRenderer,
  oe as TwitterExtension,
  ne as WaveLikePostExtension,
  H as WaveLikePostRenderer,
  ee as YoutubeVideoExtension,
  W as YoutubeVideoRenderer,
  E as findPostLinkElements,
  x as isWaveLikePost,
  xe as setupPostEnhancements
};
