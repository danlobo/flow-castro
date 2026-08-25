import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { ContextMenu } from "../ContextMenu.jsx";
import { ThemeProvider } from "../ThemeProvider.jsx";

/** Opens the menu with `options` and returns the labels, in rendered order. */
function openWith(options) {
  const { getByTestId, container } = render(
    <ThemeProvider>
      <ContextMenu containerRef={{ current: null }} i18n={{}}>
        {({ handleContextMenu }) => (
          <div
            data-testid="target"
            onContextMenu={(e) => handleContextMenu(e, options)}
          />
        )}
      </ContextMenu>
    </ThemeProvider>,
  );

  fireEvent.contextMenu(getByTestId("target"));

  return [
    ...(container.ownerDocument.querySelectorAll("li") ?? []),
  ]
    .map((item) => item.textContent.trim())
    .filter(Boolean);
}

describe("ContextMenu ordering", () => {
  it("sorts plain options by label", () => {
    const labels = openWith([
      { label: "Text" },
      { label: "Numeric" },
      { label: "Add comment" },
    ]);

    expect(labels).toEqual(["Add comment", "Numeric", "Text"]);
  });

  it("keeps pinned options on top, in declaration order", () => {
    const labels = openWith([
      { label: "Add comment", pinned: true },
      { label: "Organize flow", pinned: true },
      { label: "Text" },
      { label: "Numeric" },
    ]);

    expect(labels).toEqual([
      "Add comment",
      "Organize flow",
      "Numeric",
      "Text",
    ]);
  });

  it("does not reorder pinned options among themselves by label", () => {
    // "Organize flow" would come first alphabetically.
    const labels = openWith([
      { label: "Zzz first", pinned: true },
      { label: "Aaa second", pinned: true },
    ]);

    expect(labels).toEqual(["Zzz first", "Aaa second"]);
  });
});
