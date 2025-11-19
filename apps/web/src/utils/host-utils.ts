const stripProtocol = (value?: string | null): string => {
  if (!value) {
    return "";
  }

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const protocolSeparatorIndex = trimmed.indexOf("://");
    return trimmed.slice(protocolSeparatorIndex + 3);
  }

  return trimmed;
};

const extractHostname = (value?: string | null): string => {
  const withoutProtocol = stripProtocol(value);
  return withoutProtocol.split(":")[0];
};

const privateNetworkMatchers = [
  /^localhost$/i,
  /^0\.0\.0\.0$/,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
];

export const shouldUseDefaultBase = (host?: string | null): boolean => {
  const hostname = extractHostname(host);
  if (!hostname) {
    return true;
  }

  if (hostname.endsWith(".local")) {
    return true;
  }

  return privateNetworkMatchers.some((matcher) => matcher.test(hostname));
};
