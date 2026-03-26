import { deriveHiveMasterPasswordKeys } from "@ecency/wallets";
import { generateMasterPassword } from "./master-password";

export const getKeysFromMasterPassword = (username: string, masterPassword: string) => {
  return deriveHiveMasterPasswordKeys(username, masterPassword);
};

export { generateMasterPassword };
