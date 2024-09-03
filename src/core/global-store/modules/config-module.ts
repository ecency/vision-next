import config from "../../../config/config.json";

export function createConfigState() {
  if (!config.visionConfig) {
    return {
      config: {
        notifications: {
          enabled: false
        }
      }
    };
  }

  return {
    config
  };
}
