import { FormControl, StyledTooltip } from "@/features/ui";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";
import { useFormContext } from "react-hook-form";

interface Props {
  username: string;
  asset: string;
}

export function WalletOperationAmountForm({ username, asset }: Props) {
  const methods = useFormContext();

  const amountError = methods.formState.errors.amount?.message?.toString();
  const memoError = methods.formState.errors.memo?.message?.toString();

  return (
    <AnimatePresence>
      <div className="grid lg:grid-cols-2 px-4 gap-4 items-start">
        <div>
          <div className="uppercase text-xs pb-2 font-semibold text-gray-600 dark:text-gray-400">
            amount
          </div>

          <FormControl
            {...methods.register("amount")}
            type="number"
            placeholder="Username"
            aria-invalid={!!amountError}
          />
          {amountError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              key={amountError}
              className="text-red text-xs px-3 pt-0.5"
            >
              {amountError}
            </motion.div>
          )}
        </div>

        <div>
          <div className="uppercase text-xs pb-2 font-semibold text-gray-600 dark:text-gray-400">
            memo
          </div>
          <StyledTooltip content={i18next.t("transfer.memo-help")}>
            <FormControl
              {...methods.register("memo")}
              type="text"
              placeholder="Memo"
              aria-invalid={!!memoError}
            />
          </StyledTooltip>
          {memoError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              key={memoError}
              className="text-red text-xs px-3 pt-0.5"
            >
              {memoError}
            </motion.div>
          )}
        </div>
      </div>
    </AnimatePresence>
  );
}
