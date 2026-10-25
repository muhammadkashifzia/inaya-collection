import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Pagination } from "../Pagination";

const hrefFor = (page: number) => `/products?page=${page}`;

describe("Pagination", () => {
  it("returns null when there is only one page", () => {
    const { container } = render(<Pagination meta={{ currentPage: 1, lastPage: 1, perPage: 24, total: 10 }} hrefFor={hrefFor} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders pagination nav when multiple pages exist", () => {
    render(<Pagination meta={{ currentPage: 1, lastPage: 3, perPage: 24, total: 72 }} hrefFor={hrefFor} />);
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
  });

  it("shows page numbers", () => {
    render(<Pagination meta={{ currentPage: 1, lastPage: 3, perPage: 24, total: 72 }} hrefFor={hrefFor} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("marks current page with aria-current", () => {
    render(<Pagination meta={{ currentPage: 2, lastPage: 3, perPage: 24, total: 72 }} hrefFor={hrefFor} />);
    const page2 = screen.getByText("2");
    expect(page2).toHaveAttribute("aria-current", "page");
  });

  it("does not show Previous on first page", () => {
    render(<Pagination meta={{ currentPage: 1, lastPage: 3, perPage: 24, total: 72 }} hrefFor={hrefFor} />);
    expect(screen.queryByText("Previous")).not.toBeInTheDocument();
  });

  it("shows Previous on page 2+", () => {
    render(<Pagination meta={{ currentPage: 2, lastPage: 3, perPage: 24, total: 72 }} hrefFor={hrefFor} />);
    const prev = screen.getByText("Previous");
    expect(prev).toHaveAttribute("href", "/products?page=1");
  });

  it("does not show Next on last page", () => {
    render(<Pagination meta={{ currentPage: 3, lastPage: 3, perPage: 24, total: 72 }} hrefFor={hrefFor} />);
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
  });

  it("shows Next when not on last page", () => {
    render(<Pagination meta={{ currentPage: 1, lastPage: 3, perPage: 24, total: 72 }} hrefFor={hrefFor} />);
    const next = screen.getByText("Next");
    expect(next).toHaveAttribute("href", "/products?page=2");
  });

  it("shows ellipsis for large page ranges", () => {
    render(<Pagination meta={{ currentPage: 5, lastPage: 20, perPage: 24, total: 480 }} hrefFor={hrefFor} />);
    const dots = screen.getAllByText("…");
    expect(dots.length).toBeGreaterThanOrEqual(1);
  });

  it("generates correct hrefs", () => {
    render(<Pagination meta={{ currentPage: 1, lastPage: 2, perPage: 24, total: 48 }} hrefFor={hrefFor} />);
    expect(screen.getByText("1")).toHaveAttribute("href", "/products?page=1");
    expect(screen.getByText("2")).toHaveAttribute("href", "/products?page=2");
  });
});
