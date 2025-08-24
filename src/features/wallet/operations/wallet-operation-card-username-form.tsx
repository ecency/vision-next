import { Button, FormControl, InputGroup } from "@/features/ui";
import { yupResolver } from "@hookform/resolvers/yup";
import { UilEnter } from "@tooni/iconscout-unicons-react";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";
import { useForm } from "react-hook-form";
import * as yup from "yup";

const form = yup.object({
  username: yup
    .string()
    .required(i18next.t("validation.required"))
    .min(2, i18next.t("sign-up.username-max-length-error"))
});

interface Props {
  onUsernameSubmit?: (name: string) => void;
}

export function WalletOperationCardUsernameForm({ onUsernameSubmit }: Props) {
  const methods = useForm({
    resolver: yupResolver(form),
    defaultValues: {
      username: ""
    }
  });

  const error = methods.formState.errors.username?.message?.toString();

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4"
      onSubmit={methods.handleSubmit(({ username }) => onUsernameSubmit?.(username))}
    >
      <InputGroup append={<Button type="submit" appearance="gray-link" icon={<UilEnter />} />}>
        <FormControl
          {...methods.register("username")}
          type="text"
          placeholder="Username"
          onBlur={methods.handleSubmit(({ username }) => onUsernameSubmit?.(username))}
          aria-invalid={!!error}
        />
      </InputGroup>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            key={error}
            className="text-red text-xs px-3 pt-0.5"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  );
}
