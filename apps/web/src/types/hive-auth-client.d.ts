declare module "hive-auth-client" {
  type HiveAuthEventHandler = (event: any) => void;

  export class HasClient {
    constructor(host: string, authKeySecret?: string, debug?: boolean);
    connect(): Promise<boolean>;
    addEventHandler(eventName: string | string[], handlerFunction: HiveAuthEventHandler): void;
    removeEventHandler(eventName: string, handlerFunction: HiveAuthEventHandler): void;
    authenticate(
      authData: { username: string; token?: string; expire?: number; key?: string },
      appData: { name: string; description?: string; icon?: string },
      challengeData: { key_type: string; challenge: string }
    ): void;
    broadcast(
      authData: { username: string; token: string; expire: number; key: string },
      keyType: string,
      ops: any[]
    ): void;
    challenge(
      authData: { username: string; token: string; expire: number; key: string },
      challengeData: { key_type: string; challenge: string }
    ): void;
  }
}
