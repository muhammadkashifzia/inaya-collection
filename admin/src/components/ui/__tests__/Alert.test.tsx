import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Alert from "@/components/ui/alert/Alert";

describe("Alert", () => {
  it("renders title and message", () => {
    render(<Alert variant="success" title="Success!" message="Operation completed." />);
    expect(screen.getByText("Success!")).toBeInTheDocument();
    expect(screen.getByText("Operation completed.")).toBeInTheDocument();
  });

  it("applies success styling", () => {
    const { container } = render(<Alert variant="success" title="T" message="M" />);
    expect(container.firstChild).toHaveClass("border-success-500");
  });

  it("applies error styling", () => {
    const { container } = render(<Alert variant="error" title="T" message="M" />);
    expect(container.firstChild).toHaveClass("border-error-500");
  });

  it("applies warning styling", () => {
    const { container } = render(<Alert variant="warning" title="T" message="M" />);
    expect(container.firstChild).toHaveClass("border-warning-500");
  });

  it("applies info styling", () => {
    const { container } = render(<Alert variant="info" title="T" message="M" />);
    expect(container.firstChild).toHaveClass("border-blue-light-500");
  });

  it("does not show link by default", () => {
    render(<Alert variant="info" title="T" message="M" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows link when showLink is true", () => {
    render(<Alert variant="info" title="T" message="M" showLink linkHref="/docs" linkText="Read docs" />);
    const link = screen.getByRole("link", { name: "Read docs" });
    expect(link).toHaveAttribute("href", "/docs");
  });

  it("renders SVG icon for each variant", () => {
    const { container } = render(<Alert variant="success" title="T" message="M" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
