import { useActiveAccount } from "@/core/hooks/use-active-account";
import i18next from "i18next";
import { useState } from "react";
import {
  Step1Authenticate,
  Step2GenerateSeed,
  Step3ReviewKeys,
  Step4Confirm
} from "./add-keys-steps";

interface Props {
  onSuccess: () => void;
}

export function ManageKeysAddKeys({ onSuccess }: Props) {
  const { activeUser } = useActiveAccount();
  const [currentStep, setCurrentStep] = useState(1);
  const [ownerKey, setOwnerKey] = useState("");
  const [keysToRevoke, setKeysToRevoke] = useState<string[]>([]);

  const username = activeUser?.username;

  if (!username) {
    return (
      <div className="text-center py-4 text-gray-500">
        {i18next.t("g.login")} required to manage keys
      </div>
    );
  }

  const handleStep1Next = (derivedOwnerKey: string, originalCredential: string) => {
    setOwnerKey(derivedOwnerKey);
    setCurrentStep(2);
  };

  const handleStep3Next = (keys: string[]) => {
    setKeysToRevoke(keys);
    setCurrentStep(4);
  };

  const renderStepIndicator = () => {
    const steps = [
      i18next.t("permissions.add-keys.stepper.authenticate"),
      i18next.t("permissions.add-keys.stepper.generate-seed"),
      i18next.t("permissions.add-keys.stepper.review-keys"),
      i18next.t("permissions.add-keys.stepper.confirm")
    ];

    return (
      <div className="flex items-center justify-between mb-6 px-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <div key={stepNumber} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {stepNumber}
                </div>
                <div
                  className={`text-xs mt-1 text-center transition-colors ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400 font-semibold"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {step}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 transition-colors ${
                    isCompleted ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      {renderStepIndicator()}

      <div className="mt-4">
        {currentStep === 1 && <Step1Authenticate username={username} onNext={handleStep1Next} />}
        {currentStep === 2 && (
          <Step2GenerateSeed
            username={username}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}
        {currentStep === 3 && (
          <Step3ReviewKeys onNext={handleStep3Next} onBack={() => setCurrentStep(2)} />
        )}
        {currentStep === 4 && (
          <Step4Confirm
            ownerKey={ownerKey}
            keysToRevoke={keysToRevoke}
            onBack={() => setCurrentStep(3)}
            onSuccess={onSuccess}
          />
        )}
      </div>
    </div>
  );
}
