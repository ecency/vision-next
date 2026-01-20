import type { ConfigField } from './config-fields';

export type ConfigPrimitive = string | number | boolean | null;
export type ConfigArray = ConfigPrimitive[] | ConfigObject[];
export interface ConfigObject {
  [key: string]: ConfigPrimitive | ConfigArray | ConfigObject;
}
export type ConfigValue = ConfigPrimitive | ConfigArray | ConfigObject;

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
