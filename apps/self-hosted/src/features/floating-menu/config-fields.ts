export type ConfigFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'section';

export interface ConfigField {
  label: string;
  type: ConfigFieldType;
  description?: string;
  fields?: Record<string, ConfigField>;
}

export const configFieldsMap: Record<string, ConfigField> = {
  version: {
    label: 'Version',
    type: 'number',
    description: 'Configuration version number',
  },
  configuration: {
    label: 'Configuration',
    type: 'section',
    fields: {
      instanceType: {
        label: 'Instance Type',
        type: 'string',
        description: 'Type of instance (e.g., ecency/blog)',
      },
      general: {
        label: 'General Settings',
        type: 'section',
        fields: {
          theme: {
            label: 'Theme',
            type: 'string',
            description: 'Theme setting (system, light, dark)',
          },
          language: {
            label: 'Language',
            type: 'string',
            description: 'Default language code',
          },
          timezone: {
            label: 'Timezone',
            type: 'string',
            description: 'Default timezone',
          },
          dateFormat: {
            label: 'Date Format',
            type: 'string',
            description: 'Date format pattern',
          },
          timeFormat: {
            label: 'Time Format',
            type: 'string',
            description: 'Time format pattern',
          },
          dateTimeFormat: {
            label: 'Date Time Format',
            type: 'string',
            description: 'Date and time format pattern',
          },
          styles: {
            label: 'Styles',
            type: 'section',
            fields: {
              background: {
                label: 'Background',
                type: 'string',
                description: 'CSS classes for background styling',
              },
            },
          },
        },
      },
      instanceConfiguration: {
        label: 'Instance Configuration',
        type: 'section',
        fields: {
          username: {
            label: 'Username',
            type: 'string',
            description: 'Instance username',
          },
          meta: {
            label: 'Meta Information',
            type: 'section',
            fields: {
              title: {
                label: 'Title',
                type: 'string',
                description: 'Site title',
              },
              description: {
                label: 'Description',
                type: 'string',
                description: 'Site description',
              },
              logo: {
                label: 'Logo URL',
                type: 'string',
                description: 'Logo image URL',
              },
              favicon: {
                label: 'Favicon URL',
                type: 'string',
                description: 'Favicon image URL',
              },
              keywords: {
                label: 'Keywords',
                type: 'string',
                description: 'SEO keywords',
              },
            },
          },
          layout: {
            label: 'Layout Settings',
            type: 'section',
            fields: {
              listType: {
                label: 'List Type',
                type: 'string',
                description: 'Type of list display',
              },
              search: {
                label: 'Search',
                type: 'section',
                fields: {
                  enabled: {
                    label: 'Enabled',
                    type: 'boolean',
                    description: 'Enable search functionality',
                  },
                },
              },
              sidebar: {
                label: 'Sidebar',
                type: 'section',
                fields: {
                  placement: {
                    label: 'Placement',
                    type: 'string',
                    description: 'Sidebar placement (left, right)',
                  },
                  followers: {
                    label: 'Followers',
                    type: 'section',
                    fields: {
                      enabled: {
                        label: 'Enabled',
                        type: 'boolean',
                        description: 'Show followers section',
                      },
                    },
                  },
                  following: {
                    label: 'Following',
                    type: 'section',
                    fields: {
                      enabled: {
                        label: 'Enabled',
                        type: 'boolean',
                        description: 'Show following section',
                      },
                    },
                  },
                  hiveInformation: {
                    label: 'Hive Information',
                    type: 'section',
                    fields: {
                      enabled: {
                        label: 'Enabled',
                        type: 'boolean',
                        description: 'Show Hive information',
                      },
                    },
                  },
                },
              },
            },
          },
          features: {
            label: 'Features',
            type: 'section',
            fields: {
              postsFilters: {
                label: 'Post Filters',
                type: 'array',
                description: 'Available post filter types',
              },
              communities: {
                label: 'Communities',
                type: 'section',
                fields: {
                  enabled: {
                    label: 'Enabled',
                    type: 'boolean',
                    description: 'Enable communities feature',
                  },
                },
              },
              likes: {
                label: 'Likes',
                type: 'section',
                fields: {
                  enabled: {
                    label: 'Enabled',
                    type: 'boolean',
                    description: 'Enable likes feature',
                  },
                },
              },
              wallet: {
                label: 'Wallet',
                type: 'section',
                fields: {
                  enabled: {
                    label: 'Enabled',
                    type: 'boolean',
                    description: 'Enable wallet feature',
                  },
                },
              },
              comments: {
                label: 'Comments',
                type: 'section',
                fields: {
                  enabled: {
                    label: 'Enabled',
                    type: 'boolean',
                    description: 'Enable comments feature',
                  },
                },
              },
              post: {
                label: 'Post',
                type: 'section',
                fields: {
                  text2Speeech: {
                    label: 'Text to Speech',
                    type: 'section',
                    fields: {
                      enabled: {
                        label: 'Enabled',
                        type: 'boolean',
                        description: 'Enable text to speech',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
