import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BugReportDialog } from "./BugReportDialog";
import { BugReportProvider, useBugReport } from "./BugReportContext";
import { ThemeProvider, createTheme } from "@mui/material";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import * as Sentry from "@sentry/nextjs";

vi.mock("@sentry/nextjs", () => ({
  captureFeedback: vi.fn(() => "event-id-456"),
  captureException: vi.fn(),
}));

vi.mock("@/lib/otel", () => ({
  withSpan: vi.fn(async (_name, fn) => {
    return await fn({ setAttribute: vi.fn() });
  }),
}));

const resources = {
  en: {
    translation: {
      feedback: {
        reportBug: "Report a Bug",
        title: "Report an Issue / Feedback",
        description: "Please let us know about any bugs.",
        category: {
          label: "Category",
          ui: "UI / Layout Glitch",
          calculation: "Damage Calc / Data Issue",
          error: "Error / Crash",
          feature: "Feature Request / Suggestion",
          other: "Other",
        },
        messageLabel: "Issue Description / Steps to Reproduce",
        messagePlaceholder: "Please describe what happened",
        emailLabel: "Email (Optional)",
        emailPlaceholder: "Enter your email",
        urlLabel: "Page URL",
        send: "Send Report",
        sending: "Sending...",
        cancel: "Cancel",
        successTitle: "Report Sent",
        successMessage: "Thank you for your feedback!",
        errorTitle: "Submission Failed",
        errorMessage: "An error occurred while sending your report.",
        close: "Close",
      },
    },
  },
};

await i18n.init({
  lng: "en",
  fallbackLng: "en",
  resources,
});

const theme = createTheme();

function TestWrapper({ children }: { readonly children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        <BugReportProvider>{children}</BugReportProvider>
      </I18nextProvider>
    </ThemeProvider>
  );
}

function ConsumerComponent() {
  const { isBugReportOpen, openBugReport, closeBugReport } = useBugReport();
  return (
    <div>
      <span data-testid="status">{isBugReportOpen ? "open" : "closed"}</span>
      <button onClick={openBugReport}>Open</button>
      <button onClick={closeBugReport}>Close</button>
      <BugReportDialog />
    </div>
  );
}

describe("BugReportContext & useBugReport", () => {
  it("toggles isBugReportOpen state correctly", () => {
    render(
      <TestWrapper>
        <ConsumerComponent />
      </TestWrapper>,
    );

    expect(screen.getByTestId("status").textContent).toBe("closed");
    fireEvent.click(screen.getByText("Open"));
    expect(screen.getByTestId("status").textContent).toBe("open");
    fireEvent.click(screen.getByText("Close"));
    expect(screen.getByTestId("status").textContent).toBe("closed");
  });
});

describe("BugReportDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form elements when open", () => {
    render(
      <TestWrapper>
        <BugReportDialog open={true} onClose={vi.fn()} />
      </TestWrapper>,
    );

    expect(screen.getByText("Report an Issue / Feedback")).toBeDefined();
    expect(screen.getByLabelText(/Issue Description/i)).toBeDefined();
    expect(screen.getByLabelText(/Email/i)).toBeDefined();
    const sendButton = screen.getByRole("button", { name: "Send Report" }) as HTMLButtonElement;
    expect(sendButton.disabled).toBe(true);
  });

  it("enables send button when message is typed and submits feedback to Sentry", async () => {
    const handleClose = vi.fn();
    render(
      <TestWrapper>
        <BugReportDialog open={true} onClose={handleClose} />
      </TestWrapper>,
    );

    const messageInput = screen.getByLabelText(/Issue Description/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const sendButton = screen.getByRole("button", { name: "Send Report" }) as HTMLButtonElement;

    fireEvent.change(messageInput, { target: { value: "Something is broken" } });
    fireEvent.change(emailInput, { target: { value: "user@example.com" } });

    expect(sendButton.disabled).toBe(false);

    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(Sentry.captureFeedback).toHaveBeenCalledTimes(1);
    });

    expect(Sentry.captureFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Something is broken"),
        email: "user@example.com",
        source: "layout-dialog",
      }),
      expect.objectContaining({
        includeReplay: true,
      }),
    );

    expect(await screen.findByText("Report Sent")).toBeDefined();
  });

  it("handles Sentry capture failure gracefully", async () => {
    vi.mocked(Sentry.captureFeedback).mockImplementationOnce(() => {
      throw new Error("Network error");
    });

    render(
      <TestWrapper>
        <BugReportDialog open={true} onClose={vi.fn()} />
      </TestWrapper>,
    );

    const messageInput = screen.getByLabelText(/Issue Description/i);
    fireEvent.change(messageInput, { target: { value: "Failing bug report" } });

    const sendButton = screen.getByRole("button", { name: "Send Report" });
    fireEvent.click(sendButton);

    expect(await screen.findByText("An error occurred while sending your report.")).toBeDefined();
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });
});
