import { useGlobalStore } from "@/core/global-store";
import { Button } from "@/features/ui";
import i18next from "i18next";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import type { User } from "@/entities";

const LoginUsersReorderDialog = dynamic(
  () => import("./login-users-reorder-dialog").then((m) => ({ default: m.LoginUsersReorderDialog })),
  { ssr: false }
);

export function LoginUsersReorder() {
  const users = useGlobalStore((state) => state.users);
  const setUsers = useGlobalStore((state) => state.setUsers);

  const [show, setShow] = useState(false);

  const handleOpen = useCallback(() => {
    setShow(true);
  }, []);

  const handleClose = useCallback(() => {
    setShow(false);
  }, []);

  const handleReorder = useCallback(
    (nextUsers: User[]) => {
      setUsers(nextUsers);
    },
    [setUsers]
  );

  return (
    <>
      <Button noPadding={true} size="xs" appearance="link" onClick={handleOpen}>
        {i18next.t("login.reorder-list")}
      </Button>
      {show && (
        <LoginUsersReorderDialog users={users} onClose={handleClose} onReorder={handleReorder} />
      )}
    </>
  );
}
