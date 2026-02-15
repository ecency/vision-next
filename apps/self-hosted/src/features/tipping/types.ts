export type TippingVariant = 'post' | 'general';

export type TippingAsset = 'HIVE' | 'HBD' | 'POINTS';

export interface TippingConfig {
  enabled: boolean;
  buttonLabel: string;
  presetAmounts: number[];
}
