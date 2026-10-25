import "@testing-library/jest-dom/vitest";

// Mock react-router
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
    useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
    useLocation: vi.fn(() => ({ pathname: "/", search: "", hash: "", state: null, key: "default" })),
    Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode; [k: string]: unknown }) => {
      const { createElement } = require("react");
      return createElement("a", { href: to, ...rest }, children);
    },
  };
});

// Mock react-helmet-async
vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => null,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: "en",
      resolvedLanguage: "en",
      changeLanguage: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}));

// Mock SVG icon imports (SVGR)
vi.mock("@/icons", () => {
  const createIcon = (name: string) => {
    return function MockIcon(props: Record<string, unknown>) {
      return null;
    };
  };
  return {
    __esModule: true,
    BoxCubeIcon: createIcon("BoxCubeIcon"),
    CartIcon: createIcon("CartIcon"),
    DollarLineIcon: createIcon("DollarLineIcon"),
    GroupIcon: createIcon("GroupIcon"),
    EyeIcon: createIcon("EyeIcon"),
    EyeCloseIcon: createIcon("EyeCloseIcon"),
    CalendarIcon: createIcon("CalendarIcon"),
    ChevronDownIcon: createIcon("ChevronDownIcon"),
  };
});
