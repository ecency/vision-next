interface Options {
  fractionDigits?: number;
  prefix?: string;
  suffix?: string;
}

export function formattedNumber(
  value: number | string,
  options: Options | undefined = undefined
) {
  let opts: Options = {
    fractionDigits: 3,
    prefix: "",
    suffix: "",
  };

  if (options) {
    opts = { ...opts, ...options };
  }

  const { fractionDigits, prefix, suffix } = opts;

  let out = "";

  if (prefix) out += prefix + " ";
  // turn too small values to zero. Bug: https://github.com/adamwdraper/Numeral-js/issues/563
  const av = Math.abs(parseFloat(value.toString())) < 0.0001 ? 0 : value;
  const num = typeof av === "string" ? parseFloat(av) : av;
  out += num.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    useGrouping: true,
  });
  if (suffix) out += " " + suffix;

  return out;
}
