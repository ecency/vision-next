'use strict';

var clsx = require('clsx');
var react = require('react');
var jsxRuntime = require('react/jsx-runtime');

// src/components/user-avatar/index.tsx
var sizeClasses = {
  xsmall: "w-4 h-4",
  small: "w-6 h-6",
  normal: "w-7 h-7",
  medium: "w-10 h-10",
  sLarge: "w-14 h-14",
  large: "w-20 h-20",
  xlarge: "w-[120px] h-[120px]",
  xLarge: "w-[120px] h-[120px]",
  "deck-item": "w-9 h-9"
};
var sizeToApiSize = {
  xsmall: "small",
  small: "small",
  normal: "small",
  medium: "medium",
  sLarge: "medium",
  large: "large",
  xlarge: "large",
  xLarge: "large",
  "deck-item": "small"
};
var DEFAULT_IMAGE_PROXY = "https://images.ecency.com";
function UserAvatar({
  username,
  size = "medium",
  src,
  imageProxyBase = DEFAULT_IMAGE_PROXY,
  onClick,
  className
}) {
  const [hasMounted, setHasMounted] = react.useState(false);
  const [canUseWebp, setCanUseWebp] = react.useState(false);
  react.useEffect(() => {
    setHasMounted(true);
    if (typeof document !== "undefined") {
      try {
        const canvas = document.createElement("canvas");
        const dataUrl = canvas.toDataURL("image/webp");
        setCanUseWebp(dataUrl?.indexOf("data:image/webp") === 0);
      } catch {
        setCanUseWebp(false);
      }
    }
  }, []);
  const apiSize = react.useMemo(() => sizeToApiSize[size] || "medium", [size]);
  const imageSrc = react.useMemo(() => {
    if (src) {
      return src;
    }
    const useWebp = hasMounted && canUseWebp;
    const webpPath = useWebp ? "/webp" : "";
    return `${imageProxyBase}${webpPath}/u/${username}/avatar/${apiSize}`;
  }, [src, imageProxyBase, username, apiSize, canUseWebp, hasMounted]);
  const handleKeyDown = react.useCallback(
    (e) => {
      if (onClick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );
  const sizeClass = sizeClasses[size] || sizeClasses.medium;
  return /* @__PURE__ */ jsxRuntime.jsx(
    "span",
    {
      onClick,
      onKeyDown: onClick ? handleKeyDown : void 0,
      className: clsx.clsx(
        "inline-block rounded-full bg-gray-300 dark:bg-gray-700 bg-cover bg-center bg-no-repeat shrink-0",
        sizeClass,
        onClick && "cursor-pointer hover:opacity-90 transition-opacity",
        className
      ),
      style: {
        backgroundImage: `url(${imageSrc})`
      },
      role: onClick ? "button" : "img",
      tabIndex: onClick ? 0 : void 0,
      "aria-label": `${username}'s avatar`
    }
  );
}
function DefaultErrorIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "currentColor",
      className,
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsxRuntime.jsx(
        "path",
        {
          fillRule: "evenodd",
          d: "M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z",
          clipRule: "evenodd"
        }
      )
    }
  );
}
function ErrorMessage({
  message = "An error occurred",
  onRetry,
  className,
  retryText = "Retry",
  icon
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className: clsx.clsx(
        "flex flex-col items-center justify-center py-12 px-4",
        className
      ),
      role: "alert",
      children: [
        icon || /* @__PURE__ */ jsxRuntime.jsx(DefaultErrorIcon, { className: "w-12 h-12 text-red-500 mb-4" }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-500 dark:text-gray-400 text-center mb-4", children: message }),
        onRetry && /* @__PURE__ */ jsxRuntime.jsx(
          "button",
          {
            type: "button",
            onClick: onRetry,
            className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm",
            children: retryText
          }
        )
      ]
    }
  );
}
var ErrorBoundary = class extends react.Component {
  constructor(props) {
    super(props);
    this.handleRetry = () => {
      this.setState({ hasError: false, error: null });
    };
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
    this.props.onError?.(error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      const errorMessage = this.props.errorMessage || this.state.error?.message || "Something went wrong";
      return /* @__PURE__ */ jsxRuntime.jsx(
        "div",
        {
          className: clsx.clsx(
            "flex items-center justify-center min-h-[200px] p-4",
            this.props.className
          ),
          children: /* @__PURE__ */ jsxRuntime.jsx(
            ErrorMessage,
            {
              message: errorMessage,
              onRetry: this.handleRetry,
              retryText: this.props.retryText
            }
          )
        }
      );
    }
    return this.props.children;
  }
};
function SkipToContent({
  targetId = "main-content",
  children = "Skip to main content",
  className
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "a",
    {
      href: `#${targetId}`,
      className: clsx.clsx(
        // Visually hidden by default
        "sr-only",
        // Visible when focused
        "focus:not-sr-only",
        "focus:absolute",
        "focus:top-4",
        "focus:left-4",
        "focus:z-[100]",
        "focus:px-4",
        "focus:py-2",
        "focus:bg-blue-600",
        "focus:text-white",
        "focus:rounded",
        "focus:outline-none",
        "focus:ring-2",
        "focus:ring-blue-400",
        "focus:ring-offset-2",
        "focus:font-medium",
        "focus:text-sm",
        className
      ),
      children
    }
  );
}
function HeartIcon({ filled, className }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: filled ? "currentColor" : "none",
      stroke: "currentColor",
      strokeWidth: filled ? 0 : 2,
      className,
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsxRuntime.jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        }
      )
    }
  );
}
function VoteButton({
  author,
  permlink,
  activeVotes,
  currentUser,
  isVotingEnabled = true,
  isAuthenticated = false,
  onVote,
  onAuthRequired,
  showCount = true,
  className,
  labels = {},
  icon
}) {
  const [isVoting, setIsVoting] = react.useState(false);
  const { likes = "likes", login = "Login to vote" } = labels;
  const userVote = react.useMemo(() => {
    if (!currentUser) return null;
    return activeVotes.find(
      (v) => v.voter.toLowerCase() === currentUser.toLowerCase()
    );
  }, [activeVotes, currentUser]);
  const hasVoted = !!userVote && (userVote.weight ?? userVote.percent ?? 0) > 0;
  const voteCount = activeVotes.length;
  const handleVote = react.useCallback(async () => {
    if (!currentUser || isVoting || !onVote) return;
    setIsVoting(true);
    try {
      const weight = hasVoted ? 0 : 1e4;
      await onVote({ author, permlink, weight });
    } catch (error) {
      console.error("Vote failed:", error);
    } finally {
      setIsVoting(false);
    }
  }, [currentUser, isVoting, hasVoted, author, permlink, onVote]);
  const handleClick = react.useCallback(() => {
    if (!isAuthenticated && onAuthRequired) {
      onAuthRequired();
      return;
    }
    handleVote();
  }, [isAuthenticated, onAuthRequired, handleVote]);
  const iconElement = icon || /* @__PURE__ */ jsxRuntime.jsx(HeartIcon, { filled: hasVoted, className: "w-4 h-4" });
  if (!isVotingEnabled) {
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        className: clsx.clsx(
          "flex items-center gap-1 text-gray-500 dark:text-gray-400",
          className
        ),
        children: [
          iconElement,
          showCount && /* @__PURE__ */ jsxRuntime.jsxs("span", { children: [
            voteCount,
            " ",
            likes
          ] })
        ]
      }
    );
  }
  if (!isAuthenticated) {
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "button",
      {
        type: "button",
        onClick: handleClick,
        className: clsx.clsx(
          "flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors",
          className
        ),
        title: login,
        children: [
          iconElement,
          showCount && /* @__PURE__ */ jsxRuntime.jsxs("span", { children: [
            voteCount,
            " ",
            likes
          ] })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "button",
    {
      type: "button",
      onClick: handleClick,
      disabled: isVoting,
      className: clsx.clsx(
        "flex items-center gap-1 transition-colors",
        hasVoted ? "text-red-500 hover:text-red-600" : "text-gray-500 dark:text-gray-400 hover:text-red-500",
        isVoting && "opacity-50 cursor-not-allowed",
        className
      ),
      children: [
        iconElement,
        showCount && /* @__PURE__ */ jsxRuntime.jsxs("span", { children: [
          voteCount,
          " ",
          likes
        ] })
      ]
    }
  );
}
function ReblogIcon({ className }) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      className,
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsxRuntime.jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
        }
      )
    }
  );
}
function ReblogButton({
  author,
  permlink,
  reblogCount = 0,
  currentUser,
  isReblogEnabled = true,
  isAuthenticated = false,
  onReblog,
  onConfirm,
  className,
  labels = {},
  icon
}) {
  const [isSubmitting, setIsSubmitting] = react.useState(false);
  const [hasReblogged, setHasReblogged] = react.useState(false);
  const [error, setError] = react.useState(null);
  const {
    reblogs = "reblogs",
    reblogging = "Reblogging...",
    confirmMessage = "Are you sure you want to reblog this post to your followers?",
    loginTitle = "Login to reblog",
    ownPostTitle = "You can't reblog your own post",
    rebloggedTitle = "Already reblogged",
    reblogTitle = "Reblog to your followers"
  } = labels;
  const isOwnPost = currentUser?.toLowerCase() === author.toLowerCase();
  const handleReblog = react.useCallback(async () => {
    if (!currentUser || isSubmitting || isOwnPost || hasReblogged || !onReblog) return;
    const defaultConfirm = () => window.confirm(confirmMessage);
    const confirmed = onConfirm ? await onConfirm() : defaultConfirm();
    if (!confirmed) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onReblog({ author, permlink });
      setHasReblogged(true);
    } catch (err) {
      console.error("Reblog failed:", err);
      setError(err instanceof Error ? err.message : "Failed to reblog");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    currentUser,
    isSubmitting,
    isOwnPost,
    hasReblogged,
    onReblog,
    author,
    permlink,
    confirmMessage,
    onConfirm
  ]);
  const buttonLabel = react.useMemo(() => {
    if (isSubmitting) return reblogging;
    return `${reblogCount + (hasReblogged ? 1 : 0)} ${reblogs}`;
  }, [reblogCount, hasReblogged, isSubmitting, reblogging, reblogs]);
  const title = react.useMemo(() => {
    if (!isAuthenticated) return loginTitle;
    if (isOwnPost) return ownPostTitle;
    if (hasReblogged) return rebloggedTitle;
    return reblogTitle;
  }, [isAuthenticated, isOwnPost, hasReblogged, loginTitle, ownPostTitle, rebloggedTitle, reblogTitle]);
  const iconElement = icon || /* @__PURE__ */ jsxRuntime.jsx(ReblogIcon, { className: "w-4 h-4" });
  if (!isReblogEnabled) {
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "div",
      {
        className: clsx.clsx(
          "flex items-center gap-1 text-gray-500 dark:text-gray-400",
          className
        ),
        children: [
          iconElement,
          /* @__PURE__ */ jsxRuntime.jsxs("span", { children: [
            reblogCount,
            " ",
            reblogs
          ] })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: clsx.clsx("flex items-center", className), children: [
    /* @__PURE__ */ jsxRuntime.jsxs(
      "button",
      {
        type: "button",
        onClick: handleReblog,
        disabled: !isAuthenticated || isSubmitting || isOwnPost || hasReblogged,
        className: clsx.clsx(
          "flex items-center gap-1 transition-colors",
          hasReblogged ? "text-green-500" : isAuthenticated && !isOwnPost ? "text-gray-500 dark:text-gray-400 hover:text-green-500 cursor-pointer" : "text-gray-500 dark:text-gray-400 cursor-not-allowed"
        ),
        title,
        children: [
          iconElement,
          /* @__PURE__ */ jsxRuntime.jsx("span", { children: buttonLabel })
        ]
      }
    ),
    error && /* @__PURE__ */ jsxRuntime.jsx("span", { className: "ml-2 text-xs text-red-500", children: error })
  ] });
}
var roundedClasses = {
  true: "rounded",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full"
};
function Skeleton({
  width = "w-full",
  height = "h-4",
  rounded = "md",
  className,
  count = 1
}) {
  const roundedClass = typeof rounded === "boolean" ? rounded ? roundedClasses.true : "" : roundedClasses[rounded];
  const skeletons = Array.from({ length: count }, (_, i) => /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className: clsx.clsx(
        "animate-pulse bg-gray-200 dark:bg-gray-700",
        width,
        height,
        roundedClass,
        count > 1 && i < count - 1 && "mb-2",
        className
      ),
      "aria-hidden": "true"
    },
    i
  ));
  return count === 1 ? skeletons[0] : /* @__PURE__ */ jsxRuntime.jsx("div", { children: skeletons });
}
var sizeClasses2 = {
  xsmall: "w-3 h-3",
  small: "w-4 h-4",
  medium: "w-6 h-6",
  large: "w-8 h-8",
  xlarge: "w-12 h-12"
};
function Spinner({
  size = "medium",
  className,
  label = "Loading..."
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      role: "status",
      "aria-label": label,
      className: clsx.clsx("inline-block", className),
      children: [
        /* @__PURE__ */ jsxRuntime.jsxs(
          "svg",
          {
            className: clsx.clsx("animate-spin", sizeClasses2[size]),
            xmlns: "http://www.w3.org/2000/svg",
            fill: "none",
            viewBox: "0 0 24 24",
            "aria-hidden": "true",
            children: [
              /* @__PURE__ */ jsxRuntime.jsx(
                "circle",
                {
                  className: "opacity-25",
                  cx: "12",
                  cy: "12",
                  r: "10",
                  stroke: "currentColor",
                  strokeWidth: "4"
                }
              ),
              /* @__PURE__ */ jsxRuntime.jsx(
                "path",
                {
                  className: "opacity-75",
                  fill: "currentColor",
                  d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx("span", { className: "sr-only", children: label })
      ]
    }
  );
}
function useMounted() {
  const [hasMounted, setHasMounted] = react.useState(false);
  react.useEffect(() => {
    setHasMounted(true);
  }, []);
  return hasMounted;
}
function useWebpSupport() {
  const [supportsWebp, setSupportsWebp] = react.useState(false);
  react.useEffect(() => {
    if (typeof document === "undefined") return;
    const canvas = document.createElement("canvas");
    const isSupported = canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
    setSupportsWebp(isSupported);
  }, []);
  return supportsWebp;
}

exports.ErrorBoundary = ErrorBoundary;
exports.ErrorMessage = ErrorMessage;
exports.ReblogButton = ReblogButton;
exports.Skeleton = Skeleton;
exports.SkipToContent = SkipToContent;
exports.Spinner = Spinner;
exports.UserAvatar = UserAvatar;
exports.VoteButton = VoteButton;
exports.useMounted = useMounted;
exports.useWebpSupport = useWebpSupport;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map