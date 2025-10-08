if (!Array.prototype.indexOf) {
  Object.defineProperty(Array.prototype, 'indexOf', {
    value: function (searchElement: any, fromIndex?: number): number {
      const length = this.length >>> 0;
      let i = fromIndex ?? 0;
      for (; i < length; i++) {
        if (this[i] === searchElement) {
          return i;
        }
      }
      return -1;
    },
    writable: true,
    configurable: true,
  });
}

// Polyfill Intl for environments that lack it (e.g., Node with minimal ICU)
if (typeof Intl === "undefined" || !(Intl as any).DateTimeFormat) {
  const IntlPolyfill = require("intl");
  (global as any).Intl = IntlPolyfill;

  // Load locale data required by the application
  require("intl/locale-data/jsonp/en.js");
  require("intl/locale-data/jsonp/bg.js");
  require("intl/locale-data/jsonp/es.js");
  require("intl/locale-data/jsonp/fi.js");
  require("intl/locale-data/jsonp/hi.js");
  require("intl/locale-data/jsonp/id.js");
  require("intl/locale-data/jsonp/it.js");
  require("intl/locale-data/jsonp/pt.js");
  require("intl/locale-data/jsonp/ru.js");
  require("intl/locale-data/jsonp/sr.js");
  require("intl/locale-data/jsonp/uk.js");
  require("intl/locale-data/jsonp/uz.js");
  require("intl/locale-data/jsonp/zh.js");
}
