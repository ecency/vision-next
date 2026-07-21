import {
  UilArrow,
  UilBold,
  UilCheckCircle,
  UilEllipsisV,
  UilImage,
  UilItalic,
  UilTextStrikeThrough
} from "@tooni/iconscout-unicons-react";
import clsx from "clsx";

interface Props {
  step: string;
}

const TOOLBAR_ICONS = [UilBold, UilItalic, UilTextStrikeThrough, UilArrow];

// Fake page "typing" bars: width + extra classes per bar
const CONTENT_BARS = [
  { width: "80%", className: "min-h-[24px]" },
  { width: "100%", className: "min-h-[16px]" },
  { width: "40%", className: "min-h-[16px]" },
  { width: "100%", className: "h-32 my-2" },
  { width: "100%", className: "min-h-[16px]" },
  { width: "100%", className: "min-h-[16px]" },
  { width: "20%", className: "min-h-[16px]" }
];

export function OnboardingFrame({ step }: Props) {
  const isWide = step === "toolbar" || step === "settings";
  const isPosting = step === "posting" || step === "finish";
  const isSettings = step === "settings";

  return (
    // Re-keying by step remounts the frame so each step gets a fresh, fast
    // CSS entrance instead of the old scripted animation sequence.
    <div key={step} className="relative animate-fade-in-up">
      <div
        id="onboarding-frame-action-bar"
        className="flex mx-auto justify-between items-end pb-3"
        style={{ width: isWide ? "100%" : 300, opacity: isPosting ? 0.5 : 1 }}
      >
        <div
          id="onboarding-frame-community-picker"
          className="bg-gray-200 w-[72px] h-4 dark:bg-dark-default rounded-xl"
        />
        <div className="flex gap-2">
          <div
            id="onboarding-frame-publish"
            className="bg-green w-[48px] rounded-xl text-white text-sm flex items-center justify-center"
            style={isSettings ? { width: 100, height: 32 } : { height: 16 }}
          >
            {isSettings && "Publish"}
          </div>
          <div
            id="onboarding-frame-settings"
            className="bg-gray-200 dark:bg-dark-default rounded-xl flex items-center justify-center"
            style={isSettings ? { width: 32, height: 32 } : { width: 16, height: 16 }}
          >
            {isSettings && <UilEllipsisV className="size-4" />}
          </div>
        </div>
      </div>
      <div
        id="onboarding-frame-page"
        className={clsx(
          "bg-gray-200 mx-auto dark:bg-dark-default overflow-hidden",
          isWide ? "rounded-t-xl" : "rounded-xl"
        )}
        style={{
          width: isWide ? "100%" : 300,
          height: isWide ? 100 : 300,
          opacity: isPosting ? 0.5 : 1
        }}
      >
        <div
          id="onboarding-frame-toolbar"
          className="bg-gray-300 dark:bg-gray-700 flex items-center gap-4 px-4"
          style={{ height: step === "toolbar" ? 64 : 32 }}
        >
          {step === "toolbar" &&
            TOOLBAR_ICONS.map((Icon, i) => (
              <div
                key={i}
                className="animate-pop-in"
                style={{ animationDelay: `${Math.min(i, 5) * 50}ms` }}
              >
                <Icon />
              </div>
            ))}
        </div>
        <div className="p-4 flex flex-col justify-start gap-2">
          {CONTENT_BARS.map(({ width, className }, i) => (
            <div
              key={i}
              className={clsx("bg-white rounded-lg animate-fade-in-up", className)}
              style={{ width, animationDelay: `${Math.min(i, 5) * 50}ms` }}
            />
          ))}
        </div>
      </div>

      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
        {isPosting && (
          <div
            id="onboarding-frame-posting"
            className={clsx(
              "min-w-full min-h-[200px] bg-gray-200 dark:bg-dark-default rounded-xl gap-4 p-4 animate-scale-in",
              step === "posting" && "grid grid-cols-2",
              step === "finish" && "flex flex-col items-center justify-center"
            )}
          >
            {step === "finish" && (
              <div className="animate-pop-in">
                <UilCheckCircle className="text-green size-16" />
              </div>
            )}
            {step === "posting" && (
              <div className="flex flex-col gap-2">
                <div className="bg-white w-full h-[100px] rounded-lg flex items-center justify-center animate-fade-in-up">
                  <UilImage className="text-blue-dark-sky" />
                </div>
                <div
                  className="bg-white w-full h-4 rounded-lg animate-fade-in-up"
                  style={{ animationDelay: "50ms" }}
                />
                <div
                  className="bg-white w-full h-6 rounded-lg animate-fade-in-up"
                  style={{ animationDelay: "100ms" }}
                />
              </div>
            )}
            {step === "posting" && (
              <div className="flex flex-col gap-2">
                <div
                  className="bg-white w-full min-h-[16px] rounded-lg animate-fade-in-up"
                  style={{ animationDelay: "50ms" }}
                />
                <div
                  className="bg-white w-full h-6 rounded-lg animate-fade-in-up"
                  style={{ animationDelay: "100ms" }}
                />
                <div
                  className="bg-green w-12 h-4 rounded-lg animate-fade-in-up"
                  style={{ animationDelay: "150ms" }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
