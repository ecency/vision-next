import { memo, useMemo } from "react";
import { configFieldsMap, ConfigField } from "../config-fields";
import { FLOATING_MENU_THEME } from "../constants";
import type {
  ConfigEditorProps,
  ConfigFieldEditorProps,
  ConfigValue,
} from "../types";

const sectionIcons: Record<string, string> = {
  configuration: "⚙️",
  general: "🌐",
  styles: "🎨",
  instanceConfiguration: "🔧",
  meta: "📝",
  layout: "📐",
  search: "🔍",
  sidebar: "📋",
  followers: "👥",
  following: "👤",
  hiveInformation: "🐝",
  features: "✨",
  communities: "🏘️",
  likes: "❤️",
  wallet: "💳",
  comments: "💬",
  post: "📄",
  text2Speeech: "🔊",
} as const;

function getSectionIcon(label: string): string {
  const key = Object.keys(sectionIcons).find(
    (k) => k.toLowerCase() === label.toLowerCase().replace(/\s+/g, "")
  );
  return key ? sectionIcons[key]! : "📦";
}

const ConfigFieldEditor = memo<ConfigFieldEditorProps>(
  ({ field, fieldKey, value, path, onUpdate }) => {
    const fullPath = path ? `${path}.${fieldKey}` : fieldKey;

    if (field.type === "section" && field.fields) {
      return (
        <section
          className="mb-6 border rounded-lg p-4"
          style={{ borderColor: FLOATING_MENU_THEME.borderColor }}
        >
          <h3 className="text-sm font-semibold mb-3 text-white font-sans flex items-center gap-2">
            <span aria-hidden="true">{getSectionIcon(field.label)}</span>
            {field.label}
          </h3>
          {field.description && (
            <p className="text-sm text-gray-400 mb-4 font-sans">
              {field.description}
            </p>
          )}
          <div className="mt-4">
            <ConfigEditor
              config={(value as Record<string, ConfigValue>) || {}}
              fields={field.fields}
              path={fullPath}
              onUpdate={onUpdate}
            />
          </div>
        </section>
      );
    }

    const handleChange = (newValue: ConfigValue) => {
      onUpdate(fullPath, newValue);
    };

    const inputClassName =
      "w-full px-3 py-2 rounded text-sm text-gray-100 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";
    const inputStyle = {
      backgroundColor: FLOATING_MENU_THEME.inputBackground,
      border: `1px solid ${FLOATING_MENU_THEME.borderColorStrong}`,
    };

    switch (field.type) {
      case "boolean": {
        const isChecked = value === true;
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-200 mb-2 font-sans">
              {field.label}
            </label>
            {field.description && (
              <p className="text-xs text-gray-400 mb-2 font-sans">
                {field.description}
              </p>
            )}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => handleChange(e.target.checked)}
                className="sr-only peer"
                aria-label={`${field.label}: ${
                  isChecked ? "Enabled" : "Disabled"
                }`}
              />
              <div
                className="w-11 h-6 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                style={{
                  backgroundColor: isChecked
                    ? FLOATING_MENU_THEME.toggleActive
                    : FLOATING_MENU_THEME.toggleInactive,
                  borderColor: FLOATING_MENU_THEME.borderColorStrong,
                }}
                aria-hidden="true"
              />
              <span className="ml-3 text-sm text-gray-300 font-sans">
                {isChecked ? "Enabled" : "Disabled"}
              </span>
            </label>
          </div>
        );
      }

      case "number": {
        const numValue = typeof value === "number" ? value : undefined;
        return (
          <div className="mb-4">
            <label
              htmlFor={fullPath}
              className="block text-sm font-medium text-gray-200 mb-2 font-sans"
            >
              {field.label}
            </label>
            {field.description && (
              <p className="text-xs text-gray-400 mb-2 font-sans">
                {field.description}
              </p>
            )}
            <input
              id={fullPath}
              type="number"
              value={numValue ?? ""}
              onChange={(e) =>
                handleChange(
                  e.target.value === "" ? undefined : Number(e.target.value)
                )
              }
              className={inputClassName}
              style={inputStyle}
            />
          </div>
        );
      }

      case "array": {
        const arrayValue = Array.isArray(value) ? value : [];
        return (
          <div className="mb-4">
            <label
              htmlFor={fullPath}
              className="block text-sm font-medium text-gray-200 mb-2 font-sans"
            >
              {field.label}
            </label>
            {field.description && (
              <p className="text-xs text-gray-400 mb-2 font-sans">
                {field.description}
              </p>
            )}
            <textarea
              id={fullPath}
              value={JSON.stringify(arrayValue, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  if (Array.isArray(parsed)) {
                    handleChange(parsed);
                  }
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              className={`${inputClassName} font-mono`}
              style={inputStyle}
              rows={4}
              aria-label={field.label}
            />
            <p className="text-xs text-gray-400 mt-1 font-sans">
              Enter a valid JSON array
            </p>
          </div>
        );
      }

      case "string":
      default: {
        const stringValue = typeof value === "string" ? value : "";
        return (
          <div className="mb-4">
            <label
              htmlFor={fullPath}
              className="block text-sm font-medium text-gray-200 mb-2 font-sans"
            >
              {field.label}
            </label>
            {field.description && (
              <p className="text-xs text-gray-400 mb-2 font-sans">
                {field.description}
              </p>
            )}
            <input
              id={fullPath}
              type="text"
              value={stringValue}
              onChange={(e) => handleChange(e.target.value)}
              className={inputClassName}
              style={inputStyle}
            />
          </div>
        );
      }
    }
  }
);

ConfigFieldEditor.displayName = "ConfigFieldEditor";

export const ConfigEditor = memo<ConfigEditorProps>(
  ({ config, fields, path, onUpdate }) => {
    const { sections, regularFields } = useMemo(() => {
      const sectionsList: Array<[string, ConfigField]> = [];
      const regularList: Array<[string, ConfigField]> = [];

      Object.entries(fields).forEach(([key, field]) => {
        if (field.type === "section") {
          sectionsList.push([key, field]);
        } else {
          regularList.push([key, field]);
        }
      });

      return {
        sections: sectionsList,
        regularFields: regularList,
      };
    }, [fields]);

    return (
      <div className="space-y-4">
        {/* Regular fields in grid */}
        {regularFields.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {regularFields.map(([key, field]) => {
              const value = config?.[key];
              return (
                <ConfigFieldEditor
                  key={key}
                  field={field}
                  fieldKey={key}
                  value={value}
                  path={path}
                  onUpdate={onUpdate}
                />
              );
            })}
          </div>
        )}

        {/* Sections */}
        {sections.map(([key, field]) => {
          const value = config?.[key];
          return (
            <ConfigFieldEditor
              key={key}
              field={field}
              fieldKey={key}
              value={value}
              path={path}
              onUpdate={onUpdate}
            />
          );
        })}
      </div>
    );
  }
);

ConfigEditor.displayName = "ConfigEditor";
