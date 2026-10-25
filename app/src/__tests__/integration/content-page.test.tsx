/**
 * Integration test: ContentPageTemplate and ContactPageTemplate
 * compose heading + CMS sections + contact details.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ContentPageTemplate } from "@/components/templates/ContentPageTemplate";
import { ContactPageTemplate } from "@/components/templates/ContactPageTemplate";
import type { ContentPage, SiteConfig } from "@/types";

const fakePage: ContentPage = {
  slug: "about",
  title: "About Us",
  sections: [
    { heading: "Our Story", body: "We started in 2020 with a vision." },
    { heading: "Our Mission", body: "To bring quality fashion to everyone." },
  ],
  metaTitle: null,
  metaDescription: null,
  updatedAt: null,
};

const fakeSite: SiteConfig = {
  name: "Inaya Collection", logoType: "text", logoUrl: null, tagline: "", about: "",
  email: "info@inaya.pk", phone: "0300-1234567", whatsapp: "03001234567",
  address: "123 Fashion Street, Lahore", hours: "Mon-Sat 10am-8pm",
  currencySymbol: "Rs.", announcements: [], freeShippingThreshold: null,
  shippingMethods: [], paymentMethods: [], allowGuestCheckout: true, maxQuantityPerItem: 10,
  navigation: [], trust: [],
  footer: { columns: [], copyright: "", logoUrl: null },
  social: [{ label: "Instagram", href: "https://instagram.com/inaya" }],
  seo: { defaultTitle: "", defaultDescription: "", ogImage: null },
};

describe("ContentPageTemplate integration", () => {
  it("renders page title as h1", () => {
    render(<ContentPageTemplate page={fakePage} />);
    expect(screen.getByRole("heading", { level: 1, name: "About Us" })).toBeInTheDocument();
  });

  it("renders all CMS sections with headings and bodies", () => {
    render(<ContentPageTemplate page={fakePage} />);
    expect(screen.getByText("Our Story")).toBeInTheDocument();
    expect(screen.getByText("We started in 2020 with a vision.")).toBeInTheDocument();
    expect(screen.getByText("Our Mission")).toBeInTheDocument();
    expect(screen.getByText("To bring quality fashion to everyone.")).toBeInTheDocument();
  });

  it("renders children when provided", () => {
    render(<ContentPageTemplate page={fakePage}><div>Extra content</div></ContentPageTemplate>);
    expect(screen.getByText("Extra content")).toBeInTheDocument();
  });

  it("handles page with no sections", () => {
    const emptyPage = { ...fakePage, sections: [] };
    render(<ContentPageTemplate page={emptyPage} />);
    expect(screen.getByRole("heading", { name: "About Us" })).toBeInTheDocument();
  });
});

describe("ContactPageTemplate integration", () => {
  it("renders page title", () => {
    render(<ContactPageTemplate page={{ ...fakePage, title: "Contact Us" }} site={fakeSite} />);
    expect(screen.getByRole("heading", { level: 1, name: "Contact Us" })).toBeInTheDocument();
  });

  it("renders contact details from site config", () => {
    render(<ContactPageTemplate page={fakePage} site={fakeSite} />);
    expect(screen.getByText("0300-1234567")).toBeInTheDocument();
    expect(screen.getByText("info@inaya.pk")).toBeInTheDocument();
    expect(screen.getByText("123 Fashion Street, Lahore")).toBeInTheDocument();
    expect(screen.getByText("Mon-Sat 10am-8pm")).toBeInTheDocument();
  });

  it("renders phone as a clickable link", () => {
    render(<ContactPageTemplate page={fakePage} site={fakeSite} />);
    const phoneLink = screen.getByRole("link", { name: "0300-1234567" });
    expect(phoneLink).toHaveAttribute("href", expect.stringContaining("tel:"));
  });

  it("renders email as a mailto link", () => {
    render(<ContactPageTemplate page={fakePage} site={fakeSite} />);
    const emailLink = screen.getByRole("link", { name: "info@inaya.pk" });
    expect(emailLink).toHaveAttribute("href", "mailto:info@inaya.pk");
  });

  it("renders WhatsApp link", () => {
    render(<ContactPageTemplate page={fakePage} site={fakeSite} />);
    const waLink = screen.getByRole("link", { name: "03001234567" });
    expect(waLink).toHaveAttribute("href", expect.stringContaining("wa.me"));
  });

  it("renders social links", () => {
    render(<ContactPageTemplate page={fakePage} site={fakeSite} />);
    expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute("href", "https://instagram.com/inaya");
  });

  it("renders CMS sections alongside contact info", () => {
    render(<ContactPageTemplate page={fakePage} site={fakeSite} />);
    expect(screen.getByText("Our Story")).toBeInTheDocument();
    expect(screen.getByText("Phone")).toBeInTheDocument();
  });

  it("renders children (contact form slot)", () => {
    render(<ContactPageTemplate page={fakePage} site={fakeSite}><form>Contact Form</form></ContactPageTemplate>);
    expect(screen.getByText("Contact Form")).toBeInTheDocument();
  });
});
