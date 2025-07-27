import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "../Button";
import { ThemeProvider } from "../ThemeProvider";

jest.mock("../ThemeProvider", () => ({
  useTheme: () => ({
    currentTheme: {
      buttons: {
        default: {
          backgroundColor: "#333",
          border: "1px solid #555",
          color: "#fff",
        },
      },
      roundness: "4px",
    },
  }),
  ThemeProvider: ({ children }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

describe("Button Component", () => {
  test("renders the button correctly", () => {
    render(<Button>Test</Button>);

    const button = screen.getByRole("button", { name: /test/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Test");

    expect(button).toHaveStyle({
      backgroundColor: "#333",
      border: "1px solid #555",
      color: "#fff",
      borderRadius: "4px",
    });
  });

  test("calls onClick function when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    const button = screen.getByRole("button", { name: /click/i });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
