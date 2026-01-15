import type { ConfigField } from './config-fields';

export type ConfigValue =
  | string
  | number
  | boolean
  | ConfigValue[]
  | Record<string, ConfigValue>;

export interface ConfigEditorProps {
  config: Record<string, ConfigValue>;
  fields: Record<string, ConfigField>;
  path?: string;
  onUpdate: (path: string, value: ConfigValue) => void;
}

export interface ConfigFieldEditorProps {
  field: ConfigField;
  fieldKey: string;
  value: ConfigValue;
  path?: string;
  onUpdate: (path: string, value: ConfigValue) => void;
}
