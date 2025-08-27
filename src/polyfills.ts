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
