import { vi } from 'vitest';
import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BoostDialog } from "../../../features/shared/boost";
import { useActiveAccount } from "@/core/hooks/use-active-account";

// Mock EcencyConfigManager to enable feature flags
vi.mock("@/config", () => ({
  EcencyConfigManager: {
    CONFIG: {
      visionFeatures: {
        points: { enabled: true },
        promotions: { enabled: true }
      }
    }
  }
}));

const mockBoostPlus = vi.fn();

vi.mock("@/api/sdk-mutations", () => ({
  useBoostPlusMutation: () => ({
    mutateAsync: mockBoostPlus,
    isPending: false
  })
}));

vi.mock("@/features/shared", () => ({
  LinearProgress: vi.fn(() => <div />)
}));

vi.mock("@/features/shared/search-by-username", () => ({
  SearchByUsername: vi.fn(({ setUsername }) => (
    <input
      type="text"
      placeholder="Search by username"
      onChange={(e) => setUsername(e.target.value)}
    />
  ))
}));

describe("BoostDialog", () => {
  const onHideMock = vi.fn();
  let queryClient: QueryClient;

  const renderWithQueryClient = (component: React.ReactElement, options?: any) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>,
      options
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Override useActiveAccount mock from setup file
    (useActiveAccount as any).mockReturnValue({
      activeUser: { username: "testuser" },
      username: "testuser",
      account: null,
      isLoading: false,
      isPending: false,
      isError: false,
      isSuccess: true,
      error: null,
      refetch: vi.fn()
    });

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnMount: false,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          staleTime: Infinity
        },
        mutations: { retry: false }
      }
    });

    // Add modal-specific elements to the document body
    const modalDialogContainer = document.createElement("div");
    modalDialogContainer.setAttribute("id", "modal-dialog-container");
    document.body.appendChild(modalDialogContainer);

    const modalOverlayContainer = document.createElement("div");
    modalOverlayContainer.setAttribute("id", "modal-overlay-container");
    document.body.appendChild(modalOverlayContainer);

    // Seed QueryClient with mock data using simplified keys from the mocked SDK
    queryClient.setQueryData(["boost-prices"], [
      { duration: 1, price: 100 },
      { duration: 7, price: 500 }
    ]);

    queryClient.setQueryData(["points"], {
      points: "1000",
      uPoints: "0",
      transactions: []
    });

    queryClient.setQueryData(["boost-account"], null);
  });

  afterEach(() => {
    // Clean up modal-specific elements
    document.body.innerHTML = "";
  });

  test("renders and displays step 1 with correct initial data", () => {
    renderWithQueryClient(<BoostDialog onHide={onHideMock} />, {
      container: document.getElementById("modal-dialog-container")
    });

    // Check initial step and available points
    expect(screen.getByText("boost-plus.title")).toBeInTheDocument();
    expect(screen.getByText("boost-plus.sub-title")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1000 POINTS")).toBeInTheDocument();

    // Check options in the duration select
    expect(screen.getByDisplayValue("1 g.day - 100 POINTS")).toBeInTheDocument();
    expect(screen.getByText("7 g.days - 500 POINTS")).toBeInTheDocument();
  });

  test("progresses to step 2 when the next button is clicked", () => {
    renderWithQueryClient(<BoostDialog onHide={onHideMock} />, {
      container: document.getElementById("modal-dialog-container")
    });

    // Set account via SearchByUsername input
    fireEvent.change(screen.getByPlaceholderText("Search by username"), {
      target: { value: "anotheruser" }
    });

    // Click the next button
    fireEvent.click(screen.getByText("g.next"));

    // Check if it progresses to step 2 (sign-title appears in both header and button)
    const signTitles = screen.getAllByText("trx-common.sign-title");
    expect(signTitles.length).toBe(2);
    expect(screen.getByText("trx-common.sign-sub-title")).toBeInTheDocument();
  });

  test("handles signing process and transitions to step 3", async () => {
    renderWithQueryClient(<BoostDialog onHide={onHideMock} />, {
      container: document.getElementById("modal-dialog-container")
    });

    // Simulate step 2 completion
    fireEvent.change(screen.getByPlaceholderText("Search by username"), {
      target: { value: "anotheruser" }
    });
    fireEvent.click(screen.getByText("g.next"));

    // Mock the SDK mutation to resolve successfully
    mockBoostPlus.mockResolvedValueOnce(true);

    // Click the Sign button (sign-title appears in both header and button, target the button)
    fireEvent.click(screen.getByRole("button", { name: "trx-common.sign-title" }));
    await screen.findByText("trx-common.success-title");

    // Check if it transitions to step 3
    expect(screen.getByText("trx-common.success-title")).toBeInTheDocument();
    expect(screen.getByText("trx-common.success-sub-title")).toBeInTheDocument();
  });

  test("finishes and calls onHide when finish button is clicked", async () => {
    renderWithQueryClient(<BoostDialog onHide={onHideMock} />, {
      container: document.getElementById("modal-dialog-container")
    });

    // Progress to step 3
    fireEvent.change(screen.getByPlaceholderText("Search by username"), {
      target: { value: "anotheruser" }
    });

    act(() => {
      fireEvent.click(screen.getByText("g.next"));
    });

    mockBoostPlus.mockResolvedValueOnce(true);

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "trx-common.sign-title" }));
    });

    // Ensure step 3 is visible
    await waitFor(() => {
      expect(screen.getByText("trx-common.success-title")).toBeInTheDocument();
    });

    act(() => {
      // Click the finish button
      fireEvent.click(screen.getByText("g.finish"));
    });

    // Check if onHide is called
    expect(onHideMock).toHaveBeenCalled();
  });

  test("shows balance error message if funds are insufficient", () => {
    // Adjust points to simulate insufficient funds
    queryClient.setQueryData(["points"], {
      points: "50", // Less than the minimum price
      uPoints: "0",
      transactions: []
    });

    renderWithQueryClient(<BoostDialog onHide={onHideMock} />, {
      container: document.getElementById("modal-dialog-container")
    });

    // Expect error message to be displayed
    expect(screen.getByText("trx-common.insufficient-funds")).toBeInTheDocument();
  });
});
