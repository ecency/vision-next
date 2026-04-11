import { vi } from "vitest";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FinalizeCommunityBanner } from "@/app/(dynamicPages)/profile/[username]/_components/finalize-community-banner";
import { useActiveAccount } from "@/core/hooks/use-active-account";

const mockSetRole = vi.fn();
const mockUpdateCommunity = vi.fn();

vi.mock("@ecency/sdk", async () => {
  const actual = await vi.importActual("@ecency/sdk");
  return {
    ...actual as any,
    useSetCommunityRole: () => ({
      mutateAsync: mockSetRole,
      isPending: false
    }),
    useUpdateCommunity: () => ({
      mutateAsync: mockUpdateCommunity,
      isPending: false
    }),
    getCommunityQueryOptions: (username: string) => ({
      queryKey: ["community", username],
      queryFn: () => null,
      enabled: true
    })
  };
});

vi.mock("@/providers/sdk", () => ({
  getWebBroadcastAdapter: () => ({})
}));

vi.mock("@/features/shared", () => ({
  error: vi.fn(),
  success: vi.fn()
}));

vi.mock("@/api/format-error", () => ({
  formatError: (e: any) => [e?.message ?? "Error"]
}));

vi.mock("@/utils", async () => {
  const actual = await vi.importActual("@/utils");
  return {
    ...actual as any,
    isCommunity: (username: string) => /^hive-\d+$/.test(username),
    getAccessToken: () => ""
  };
});

describe("FinalizeCommunityBanner", () => {
  let queryClient: QueryClient;

  const renderComponent = (username: string) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <FinalizeCommunityBanner username={username} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnMount: false,
          refetchOnWindowFocus: false,
          staleTime: Infinity
        },
        mutations: { retry: false }
      }
    });
  });

  test("renders nothing when username is not a community account", () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "regularuser" }
    });

    queryClient.setQueryData(["community", "regularuser"], null);
    const { container } = renderComponent("regularuser");
    expect(container.innerHTML).toBe("");
  });

  test("renders nothing when activeUser does not match the username", () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "otheruser" }
    });

    queryClient.setQueryData(["community", "hive-123456"], null);
    const { container } = renderComponent("hive-123456");
    expect(container.innerHTML).toBe("");
  });

  test("renders nothing when community already exists", () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "hive-123456" }
    });

    queryClient.setQueryData(["community", "hive-123456"], {
      name: "hive-123456",
      title: "Existing Community",
      team: [["hive-123456", "owner", ""], ["myadmin", "admin", ""]]
    });
    const { container } = renderComponent("hive-123456");
    expect(container.innerHTML).toBe("");
  });

  test("renders banner with only admin field when community exists but has no admin", () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "hive-123456" }
    });

    queryClient.setQueryData(["community", "hive-123456"], {
      name: "hive-123456",
      title: "Existing Community",
      team: [["hive-123456", "owner", ""]]
    });
    renderComponent("hive-123456");

    // Banner should show
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("communities-create.finalize-title");
    // Title/about fields should NOT show (community already has props)
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(1); // only admin username field
  });

  test("renders the banner when conditions are met", () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "hive-123456" }
    });

    queryClient.setQueryData(["community", "hive-123456"], null);
    renderComponent("hive-123456");
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("communities-create.finalize-title");
    expect(screen.getByText("communities-create.finalize-description")).toBeInTheDocument();
  });

  test("submit button is disabled when title or admin is blank", () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "hive-123456" }
    });

    queryClient.setQueryData(["community", "hive-123456"], null);
    renderComponent("hive-123456");

    // Both title and admin are empty by default — button should be disabled
    const submitButton = screen.getByRole("button");
    expect(submitButton).toBeDisabled();
  });

  test("submit button is enabled when title and admin are filled", () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "hive-123456" }
    });

    queryClient.setQueryData(["community", "hive-123456"], null);
    renderComponent("hive-123456");

    const inputs = screen.getAllByRole("textbox");
    // First input is title, third is admin username (must be filled manually)
    fireEvent.change(inputs[0], { target: { value: "My Community" } });
    fireEvent.change(inputs[2], { target: { value: "myadmin" } });

    const submitButton = screen.getByRole("button");
    expect(submitButton).toBeEnabled();
  });

  test("calls setRole and updateCommunity on successful submit", async () => {
    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "hive-123456" }
    });

    mockSetRole.mockResolvedValueOnce(undefined);
    mockUpdateCommunity.mockResolvedValueOnce(undefined);

    queryClient.setQueryData(["community", "hive-123456"], null);
    renderComponent("hive-123456");

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "My Community" } });
    fireEvent.change(inputs[2], { target: { value: "myadmin" } });

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockSetRole).toHaveBeenCalledWith({
        account: "myadmin",
        role: "admin"
      });
    });

    expect(mockUpdateCommunity).toHaveBeenCalledWith({
      title: "My Community",
      about: "",
      lang: "en",
      description: "",
      flag_text: "",
      is_nsfw: false
    });
  });

  test("shows error on submit failure", async () => {
    const { error } = await import("@/features/shared");

    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "hive-123456" }
    });

    mockSetRole.mockRejectedValueOnce(new Error("Broadcast failed"));

    queryClient.setQueryData(["community", "hive-123456"], null);
    renderComponent("hive-123456");

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "My Community" } });
    fireEvent.change(inputs[2], { target: { value: "myadmin" } });

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(error).toHaveBeenCalled();
    });
  });
});
