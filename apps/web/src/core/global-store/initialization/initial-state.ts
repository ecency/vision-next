import { createGlobalState } from "@/core/global-store/modules/global-module";
import { createAuthenticationState } from "@/core/global-store/modules/authentication-module";
import { createUiState } from "@/core/global-store/modules/ui-module";
import { createUsersState } from "@/core/global-store/modules/users-module";
import { createSigningKeyState } from "@/core/global-store/modules/signing-key-module";
import { createNotificationsState } from "@/core/global-store/modules/notifications-module";
import { createConfigState } from "@/core/global-store/modules/config-module";

export const INITIAL_STATE = {
  ...createGlobalState(),
  ...createAuthenticationState(),
  ...createUiState(),
  ...createUsersState(),
  ...createSigningKeyState(),
  ...createNotificationsState(),
  ...createConfigState()
};

export type GlobalStore = typeof INITIAL_STATE;
