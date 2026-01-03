import { useMutation } from "@tanstack/react-query";
import * as keychain from "@/utils/keychain";
import { error } from "@/features/shared";
import { formatError } from "@/api/operations";
import { makeHsCode } from "@/utils";
import { EcencyConfigManager } from "@/config";
import { AccountCreateOperation, Authority, cryptoUtils, PrivateKey } from "@hiveio/dhive";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import hs from "hivesigner";
import { client } from "@/api/hive";

function makeOperation(
  creator: string,
  fee: string,
  username: string,
  auths: { ownerAuthority: Authority; activeAuthority: Authority; postingAuthority: Authority },
  memoKey: PrivateKey
): AccountCreateOperation {
  return [
    "account_create",
    {
      fee: fee,
      creator: creator,
      new_account_name: username,
      owner: auths.ownerAuthority,
      active: auths.activeAuthority,
      posting: auths.postingAuthority,
      memo_key: memoKey.createPublic(),
      json_metadata: ""
    }
  ];
}

function makeAuthorities({
  ownerKey,
  activeKey,
  postingKey
}: {
  ownerKey: PrivateKey;
  activeKey: PrivateKey;
  postingKey: PrivateKey;
}) {
  return {
    ownerAuthority: Authority.from(ownerKey.createPublic()),
    activeAuthority: Authority.from(activeKey.createPublic()),
    postingAuthority: {
      ...Authority.from(postingKey.createPublic()),
      account_auths: [["ecency.app", 1]]
    } as Authority
  };
}

function makePrivateKeys(username: string, wif: string) {
  return {
    ownerKey: PrivateKey.fromLogin(username, wif, "owner"),
    activeKey: PrivateKey.fromLogin(username, wif, "active"),
    postingKey: PrivateKey.fromLogin(username, wif, "posting"),
    memoKey: PrivateKey.fromLogin(username, wif, "memo")
  };
}

interface Payload {
  username: string;
  wif: string;
  fee: string;
}

export function useCreateCommunityByApi() {
  const { activeUser } = useActiveAccount();

  return useMutation({
    mutationKey: ["createCommunity", "api"],
    mutationFn: async ({
      creatorKey,
      username,
      wif,
      fee
    }: Payload & { creatorKey: PrivateKey }) => {
      if (!activeUser) {
        throw new Error("[Community][Create][API] Active user isn't provided");
      }

      if (!creatorKey) {
        throw new Error("[Community][Create][API] Creator key is empty");
      }

      // create community account
      const keys = makePrivateKeys(username, wif);
      const auths = makeAuthorities(keys);
      const operation = makeOperation(activeUser.username, fee, username, auths, keys.memoKey);
      await client.broadcast.sendOperations([operation], creatorKey);

      // create hive signer code from active private key
      const signer = (message: string): Promise<string> => {
        const hash = cryptoUtils.sha256(message);
        return new Promise((resolve) => resolve(keys.activeKey.sign(hash).toString()));
      };
      return await makeHsCode(EcencyConfigManager.CONFIG.service.hsClientId, username, signer);
    },
    onError: (e) => error(...formatError(e))
  });
}

export function useCreateCommunityByHivesigner() {
  const { activeUser } = useActiveAccount();

  return useMutation({
    mutationKey: ["createCommunity", "hs"],
    mutationFn: async ({
      username,
      wif,
      fee,
      title,
      about
    }: Payload & { title: string; about: string }) => {
      if (!activeUser) {
        throw new Error("[Community][Create][HS] Active user isn't provided");
      }

      const keys = makePrivateKeys(username, wif);
      const auths = makeAuthorities(keys);
      const operation = makeOperation(activeUser.username, fee, username, auths, keys.memoKey);

      // create hive signer code from active private key to use after redirection from hivesigner
      const signer = (message: string): Promise<string> => {
        const hash = cryptoUtils.sha256(message);
        return new Promise<string>((resolve) => resolve(keys.activeKey.sign(hash).toString()));
      };
      const code = await makeHsCode(
        EcencyConfigManager.CONFIG.service.hsClientId,
        username,
        signer
      );
      if (code) {
        const callback = `${
          window.location.origin
        }/communities/create-hs?code=${code}&title=${encodeURIComponent(
          title
        )}&about=${encodeURIComponent(about)}`;
        hs.sendOperation(operation, { callback }, () => {});
      }
    }
  });
}

export function useCreateCommunityByKeychain() {
  const { activeUser } = useActiveAccount();

  return useMutation({
    mutationKey: ["createCommunity", "keychain"],
    mutationFn: async ({ username, wif, fee }: Payload) => {
      if (!activeUser) {
        throw new Error("[Community][Create][KC] Active user isn't provided");
      }

      const keys = makePrivateKeys(username, wif);
      const operation = [
        "account_create",
        {
          fee,
          creator: activeUser.username,
          new_account_name: username,
          owner: {
            weight_threshold: 1,
            account_auths: [],
            key_auths: [[keys.ownerKey.createPublic().toString(), 1]]
          },
          active: {
            weight_threshold: 1,
            account_auths: [],
            key_auths: [[keys.activeKey.createPublic().toString(), 1]]
          },
          posting: {
            weight_threshold: 1,
            account_auths: [["ecency.app", 1]],
            key_auths: [[keys.postingKey.createPublic().toString(), 1]]
          },
          memo_key: keys.memoKey.createPublic().toString(),
          json_metadata: ""
        }
      ];

      await keychain.broadcast(activeUser!.username, [operation], "Active");

      // Add account to keychain
      await keychain.addAccount(username, {
        active: keys.activeKey.toString(),
        posting: keys.postingKey.toString(),
        memo: keys.memoKey.toString()
      });

      // create hive signer code from active private key
      const signer = (message: string): Promise<string> =>
        keychain.signBuffer(username, message, "Active").then((r) => r.result);
      return await makeHsCode(EcencyConfigManager.CONFIG.service.hsClientId, username, signer);
    },
    onError: (e) => error(...formatError(e))
  });
}
