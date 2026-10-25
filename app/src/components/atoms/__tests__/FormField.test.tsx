import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TextField, PasswordField, TextAreaField, SelectField, FormAlert } from "../FormField";

describe("TextField", () => {
  it("renders label and input", () => {
    render(<TextField label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Email").tagName).toBe("INPUT");
  });

  it("shows required asterisk when required", () => {
    render(<TextField label="Name" required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("shows error message and sets aria-invalid", () => {
    render(<TextField label="Email" error="Email is required" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Email is required")).toBeInTheDocument();
  });

  it("shows hint when no error", () => {
    render(<TextField label="Phone" hint="Include country code" />);
    expect(screen.getByText("Include country code")).toBeInTheDocument();
  });

  it("hides hint when error is present", () => {
    render(<TextField label="Phone" hint="Include country code" error="Required" />);
    expect(screen.queryByText("Include country code")).not.toBeInTheDocument();
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("accepts user input", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextField label="Name" onChange={onChange} />);
    await user.type(screen.getByLabelText("Name"), "Ali");
    expect(onChange).toHaveBeenCalled();
  });
});

describe("PasswordField", () => {
  it("renders as password input by default", () => {
    render(<PasswordField label="Password" />);
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  });

  it("toggles visibility with show/hide button", async () => {
    const user = userEvent.setup();
    render(<PasswordField label="Password" />);
    const input = screen.getByLabelText("Password");
    const toggleBtn = screen.getByRole("button", { name: "Show password" });

    await user.click(toggleBtn);
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("shows error message", () => {
    render(<PasswordField label="Password" error="Too short" />);
    expect(screen.getByText("Too short")).toBeInTheDocument();
  });
});

describe("TextAreaField", () => {
  it("renders a textarea with label", () => {
    render(<TextAreaField label="Message" />);
    const ta = screen.getByLabelText("Message");
    expect(ta.tagName).toBe("TEXTAREA");
  });

  it("shows error", () => {
    render(<TextAreaField label="Message" error="Required" />);
    expect(screen.getByText("Required")).toBeInTheDocument();
  });
});

describe("SelectField", () => {
  it("renders a select with options", () => {
    render(
      <SelectField label="Country">
        <option value="PK">Pakistan</option>
        <option value="IN">India</option>
      </SelectField>
    );
    expect(screen.getByLabelText("Country").tagName).toBe("SELECT");
    expect(screen.getByText("Pakistan")).toBeInTheDocument();
  });

  it("shows error", () => {
    render(
      <SelectField label="Province" error="Required">
        <option value="">Select</option>
      </SelectField>
    );
    expect(screen.getByText("Required")).toBeInTheDocument();
  });
});

describe("FormAlert", () => {
  it("renders error alert with alert role", () => {
    render(<FormAlert tone="error">Something went wrong</FormAlert>);
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });

  it("renders success alert with status role", () => {
    render(<FormAlert tone="success">Saved!</FormAlert>);
    expect(screen.getByRole("status")).toHaveTextContent("Saved!");
  });

  it("renders info alert with status role", () => {
    render(<FormAlert tone="info">Note</FormAlert>);
    expect(screen.getByRole("status")).toHaveTextContent("Note");
  });

  it("returns null when children is empty", () => {
    const { container } = render(<FormAlert tone="error">{""}</FormAlert>);
    expect(container.innerHTML).toBe("");
  });
});
