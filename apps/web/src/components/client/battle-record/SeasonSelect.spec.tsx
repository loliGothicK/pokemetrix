import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SeasonSelect } from "./SeasonSelect";
import { ThemeProvider, createTheme } from "@mui/material";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import type { Season } from "@/store/battle-record/battleRecord";

const resources = {
  en: {
    translation: {
      battleRecord: {
        season: {
          none: "No Season Selected",
          new: "New Season",
        },
      },
      common: {
        edit: "Edit",
        delete: "Delete",
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

const mockSeasons: readonly Season[] = [
  {
    id: "season-1",
    name: "Season 1",
    format: "doubles",
    ruleMark: "champions",
    startedAt: "2026-01-01",
    endedAt: "2026-02-01",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "season-2",
    name: "Season 2",
    format: "doubles",
    ruleMark: "champions",
    startedAt: "2026-02-01",
    endedAt: "2026-03-01",
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: "2026-02-01T00:00:00Z",
  },
];

function renderSeasonSelect(props: Partial<React.ComponentProps<typeof SeasonSelect>> = {}) {
  const defaultProps: React.ComponentProps<typeof SeasonSelect> = {
    seasons: mockSeasons,
    value: "season-1",
    onChange: vi.fn(),
    onNew: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    ...props,
  };

  const utils = render(
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        <SeasonSelect {...defaultProps} />
      </I18nextProvider>
    </ThemeProvider>,
  );

  return { ...utils, props: defaultProps };
}

describe("SeasonSelect", () => {
  it("renders the active season name", () => {
    renderSeasonSelect({ value: "season-1" });
    expect(screen.getByText("Season 1")).toBeDefined();
  });

  it("renders placeholder when value is null or not found", () => {
    renderSeasonSelect({ value: null });
    expect(screen.getByText("No Season Selected")).toBeDefined();
  });

  it("opens dropdown and allows selecting another season", () => {
    const onChange = vi.fn();
    renderSeasonSelect({ onChange });

    const trigger = screen.getByRole("combobox");
    fireEvent.mouseDown(trigger);

    expect(screen.getByRole("listbox")).toBeDefined();
    const option = screen.getByRole("option", { name: /Season 2/i });
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith("season-2");
  });

  it("calls onNew when New Season option is clicked", () => {
    const onNew = vi.fn();
    const onChange = vi.fn();
    renderSeasonSelect({ onNew, onChange });

    const trigger = screen.getByRole("combobox");
    fireEvent.mouseDown(trigger);

    const newSeasonOption = screen.getByRole("option", { name: /New Season/i });
    fireEvent.click(newSeasonOption);

    expect(onNew).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls onEdit without calling onChange or throwing blur error when Edit button is clicked", () => {
    const onEdit = vi.fn();
    const onChange = vi.fn();
    renderSeasonSelect({ onEdit, onChange });

    const trigger = screen.getByRole("combobox");
    fireEvent.mouseDown(trigger);

    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    expect(editButtons.length).toBe(2);

    // Click edit on season-1
    fireEvent.click(editButtons[0]);

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(mockSeasons[0]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls onDelete without calling onChange or throwing blur error when Delete button is clicked", () => {
    const onDelete = vi.fn();
    const onChange = vi.fn();
    renderSeasonSelect({ onDelete, onChange });

    const trigger = screen.getByRole("combobox");
    fireEvent.mouseDown(trigger);

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    expect(deleteButtons.length).toBe(2);

    // Click delete on season-2
    fireEvent.click(deleteButtons[1]);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(mockSeasons[1]);
    expect(onChange).not.toHaveBeenCalled();
  });
});
