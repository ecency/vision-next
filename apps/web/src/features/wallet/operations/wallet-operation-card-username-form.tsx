import { useSearchByUsernameQuery } from "@/api/queries";
import { UserAvatar } from "@/features/shared";
import { Button, FormControl, InputGroup } from "@/features/ui";
import { Spinner } from "@/features/ui/spinner";
import { yupResolver } from "@hookform/resolvers/yup";
import { UilEnter } from "@tooni/iconscout-unicons-react";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
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
  const [isFocused, setIsFocused] = useState(false);
  const usernameValue = methods.watch("username") ?? "";
  const normalizedUsername = useMemo(() => usernameValue.trim(), [usernameValue]);
  const [debouncedUsername, setDebouncedUsername] = useState(normalizedUsername);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedUsername(normalizedUsername.toLowerCase());
    }, 250);

    return () => clearTimeout(handler);
  }, [normalizedUsername]);

  const { data: suggestions = [], isFetching } = useSearchByUsernameQuery(debouncedUsername);
  const showSuggestions = isFocused && normalizedUsername.length > 0;
  const submit = methods.handleSubmit(({ username }) => onUsernameSubmit?.(username));

  const handleSuggestionSelect = (name: string) => {
    methods.setValue("username", name, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
    methods.clearErrors("username");
    onUsernameSubmit?.(name);
    setIsFocused(false);
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4"
      onSubmit={submit}
    >
      <div className="relative">
        <InputGroup append={<Button type="submit" appearance="gray-link" icon={<UilEnter />} />}>
          <Controller
            control={methods.control}
            name="username"
            render={({ field }) => (
              <FormControl
                {...field}
                value={field.value ?? ""}
                type="text"
                placeholder={i18next.t("g.username")}
                aria-invalid={!!error}
                autoComplete="off"
                onFocus={() => setIsFocused(true)}
                onChange={(event) => {
                  const sanitizedValue = event.target.value.replace(/^@/, "").toLowerCase();
                  field.onChange(sanitizedValue);
                }}
                onBlur={(event) => {
                  field.onBlur();
                  setTimeout(() => setIsFocused(false), 150);
                  submit(event);
                }}
              />
            )}
          />
        </InputGroup>

        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-md border border-[--border-color] bg-white text-sm shadow-lg dark:bg-gray-900"
            >
              {isFetching ? (
                <div className="flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-gray-300">
                  <Spinner className="h-4 w-4" />
                  {i18next.t("g.loading")}
                </div>
              ) : suggestions.length === 0 ? (
                <div className="px-3 py-2 text-gray-500 dark:text-gray-300">
                  {i18next.t("g.no-matches")}
                </div>
              ) : (
                <ul className="py-1">
                  {suggestions.map((name) => (
                    <li
                      key={name}
                      className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleSuggestionSelect(name);
                      }}
                    >
                      <UserAvatar size="small" username={name} />
                      <span>@{name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
