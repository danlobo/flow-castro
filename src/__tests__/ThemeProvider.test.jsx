import React from "react";
import { render, screen, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../ThemeProvider";

const TestComponent = () => {
  const { themeName, currentTheme, setThemeName } = useTheme();

  return (
    <div>
      <div data-testid="theme-name">{themeName}</div>
      <div data-testid="bg-color">{currentTheme.backgroundColor}</div>
      <button
        data-testid="change-theme"
        onClick={() => setThemeName(themeName === "light" ? "dark" : "light")}
      >
        Toggle Theme
      </button>
    </div>
  );
};

describe("ThemeProvider Component", () => {
  test("should provide the light theme as default", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme-name")).toHaveTextContent("light");
  });

  test("should accept an initial theme", () => {
    render(
      <ThemeProvider theme="dark">
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme-name")).toHaveTextContent("dark");
  });

  test("should allow switching between themes", () => {
    render(
      <ThemeProvider theme="light">
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme-name")).toHaveTextContent("light");

    act(() => {
      screen.getByTestId("change-theme").click();
    });

    expect(screen.getByTestId("theme-name")).toHaveTextContent("dark");
  });

  test("should accept custom themes", () => {
    const customThemes = {
      light: {
        backgroundColor: "#ffffff",
        textColor: "#000000",
      },
      dark: {
        backgroundColor: "#222222",
        textColor: "#ffffff",
      },
      common: {
        borderRadius: "8px",
      },
    };

    render(
      <ThemeProvider themes={customThemes} theme="light">
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId("bg-color")).toHaveTextContent("#ffffff");

    act(() => {
      screen.getByTestId("change-theme").click();
    });

    expect(screen.getByTestId("bg-color")).toHaveTextContent("#222222");
  });
});
