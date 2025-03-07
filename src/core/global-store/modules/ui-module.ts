export function createUiState() {
  return {
    login: false,
    uiNotifications: false
  };
}

type State = ReturnType<typeof createUiState>;

export function createUiActions(set: (state: Partial<State>) => void, getState: () => State) {
  return {
    toggleUiProp: (type: "login" | "notifications", value?: boolean) => {
      if (type === "login") {
        set({
          login: value ?? !getState().login
        });
      } else if (type === "notifications") {
        set({
          uiNotifications: value ?? !getState().uiNotifications
        });
      }
    }
  };
}
