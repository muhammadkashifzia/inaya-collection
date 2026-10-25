import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { fakeCollection } from "@//__tests__/helpers";
import { CollectionTile } from "../CollectionTile";

describe("CollectionTile", () => {
  it("renders a link to the collection", () => {
    render(<CollectionTile collection={fakeCollection({ slug: "winter" })} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/collections/winter");
  });

  it("renders the collection label", () => {
    render(<CollectionTile collection={fakeCollection({ shortTitle: "Winter" })} />);
    expect(screen.getByText("Winter")).toBeInTheDocument();
  });

  it("parses piece badge from title like '3 PC Khaddar'", () => {
    render(<CollectionTile collection={fakeCollection({ shortTitle: "3 PC Khaddar", title: "3 PC Khaddar" })} />);
    expect(screen.getByText("3 Piece")).toBeInTheDocument();
    expect(screen.getByText("Khaddar")).toBeInTheDocument();
  });

  it("parses piece badge from '3 Piece Cotton'", () => {
    render(<CollectionTile collection={fakeCollection({ shortTitle: "3 Piece Cotton", title: "3 Piece Cotton" })} />);
    expect(screen.getByText("3 Piece")).toBeInTheDocument();
    expect(screen.getByText("Cotton")).toBeInTheDocument();
  });

  it("does not show piece badge when no piece pattern", () => {
    render(<CollectionTile collection={fakeCollection({ shortTitle: "Silk", title: "Silk Collection" })} />);
    expect(screen.queryByText(/Piece/)).not.toBeInTheDocument();
    expect(screen.getByText("Silk")).toBeInTheDocument();
  });

  it("renders rank number", () => {
    render(<CollectionTile collection={fakeCollection({ rank: 5 })} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("has sr-only collection text for accessibility", () => {
    render(<CollectionTile collection={fakeCollection()} />);
    expect(screen.getByText("collection")).toBeInTheDocument();
  });
});
