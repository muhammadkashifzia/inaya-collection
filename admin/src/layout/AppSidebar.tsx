import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import type { PermissionKey } from "@/types/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";
import {
  BoxCubeIcon,
  CartIcon,
  ChevronDownIcon,
  DollarLineIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  LayoutIcon,
  ListIcon,
  LogoutIcon,
  MailIcon,
  PageIcon,
  SettingsAltIcon,
  StackIcon,
} from "../icons";
import { cn } from "../utils";

type NavItem = {
  name: string;
  key?: string;
  icon: React.ReactNode;
  path?: string;
  new?: boolean;
  target?: string;
  permission?: PermissionKey;
  subItems?: {
    name: string;
    key?: string;
    path: string;
    pro?: boolean;
    new?: boolean;
    target?: string;
    permission?: PermissionKey;
  }[];
};

const navItems: NavItem[] = [
  { icon: <GridIcon fontSize={24} />, name: "Dashboard", path: "/", permission: "view-dashboard" },
  { icon: <CartIcon fontSize={24} />, name: "Orders", path: "/orders", permission: "manage-orders" },
  {
    icon: <BoxCubeIcon fontSize={24} />,
    name: "Products",
    subItems: [
      { name: "All Products", path: "/products", permission: "manage-products" },
      { name: "Add new product", path: "/products/new", permission: "manage-products" },
      { name: "Categories", path: "/categories", permission: "manage-categories" },
      { name: "Tags", path: "/products/tags", permission: "manage-products" },
      { name: "Attributes", path: "/products/attributes", permission: "manage-products" },
      { name: "Reviews", path: "/products/reviews", permission: "manage-products" },
    ],
  },
  { icon: <StackIcon fontSize={24} />, name: "Inventory", path: "/inventory", permission: "manage-inventory" },
  { icon: <GroupIcon fontSize={24} />, name: "Users", path: "/customers", permission: "view-customers" },
  { icon: <DollarLineIcon fontSize={24} />, name: "Coupons", path: "/coupons", permission: "manage-coupons" },
  { icon: <MailIcon fontSize={24} />, name: "Messages", path: "/messages", permission: "manage-messages" },
];

const othersItems: NavItem[] = [
  {
    icon: <LayoutIcon fontSize={24} />,
    name: "Storefront",
    subItems: [
      { name: "Banners", path: "/content/banners", permission: "manage-content" },
      { name: "Homepage sections", path: "/content/sections", permission: "manage-content" },
    ],
  },
  { icon: <PageIcon fontSize={24} />, name: "Pages", path: "/content/pages", permission: "manage-content" },
  { icon: <ListIcon fontSize={24} />, name: "Stock history", path: "/inventory/movements", permission: "manage-inventory" },
  { icon: <SettingsAltIcon fontSize={24} />, name: "Settings", path: "/settings", permission: "manage-settings" },
];

/** Paths that must not also highlight their parent ("/products" vs "/products/new"). */
const EXACT_ONLY = ["/products/new", "/products/tags", "/products/attributes", "/products/reviews", "/inventory/movements", "/design-categories"];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, setIsMobileOpen } =
    useSidebar();
  // Collapsed rail (desktop only) is 50px wide: tighter padding, icon-only items.
  const isCollapsed = !isExpanded && !isHovered && !isMobileOpen;
  const { t } = useTranslation();
  const { can, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const allowed = (items: NavItem[]): NavItem[] =>
    items
      .map((item) => (item.subItems ? { ...item, subItems: item.subItems.filter((sub) => !sub.permission || can(sub.permission)) } : item))
      .filter((item) => (item.subItems ? item.subItems.length > 0 : !item.permission || can(item.permission)));
  const mainItems = allowed(navItems);
  const otherItems = allowed(othersItems);
  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {},
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-close sidebar on mobile after route change
  useEffect(() => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => {
      if (path === "/" || EXACT_ONLY.includes(path)) return location.pathname === path;
      return location.pathname === path || (location.pathname.startsWith(`${path}/`) && !EXACT_ONLY.some((p) => location.pathname.startsWith(p)));
    },
    [location.pathname],
  );

  useEffect(() => {
    let submenuMatched = false;

    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? mainItems : otherItems;

      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- template behaviour: collapse submenus on route change
      setOpenSubmenu(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- menu definitions only change with the user role
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`group menu-item ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                isCollapsed ? "xl:justify-center xl:px-0" : "xl:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>

              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">
                  {nav.key ? t(`sidebar.items.${nav.key}`) : nav.name}
                </span>
              )}
              {nav.new && (isExpanded || isHovered || isMobileOpen) && (
                <span
                  className={`absolute inset-e-10 ms-auto ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "menu-dropdown-badge-active"
                      : "menu-dropdown-badge-inactive"
                  } menu-dropdown-badge`}
                >
                  {t("sidebar.badges.new")}
                </span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ms-auto h-5 w-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-400"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                target={nav.target}
                className={`group menu-item ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                } ${isCollapsed ? "xl:justify-center xl:px-0" : ""}`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">
                    {nav.key ? t(`sidebar.items.${nav.key}`) : nav.name}
                  </span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="ms-0 mt-2 space-y-1">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      target={subItem.target}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.key
                        ? t(`sidebar.items.${subItem.key}`)
                        : subItem.name}
                      <span className="ms-auto flex items-center gap-1">
                        {subItem.new && (
                          <span
                            className={`ms-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            {t("sidebar.badges.new")}
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ms-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-pro-active"
                                : "menu-dropdown-badge-pro-inactive"
                            } menu-dropdown-badge-pro`}
                          >
                            {t("sidebar.badges.pro")}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={cn(
        "fixed inset-s-0 top-0 z-99999 flex h-screen flex-col border-e border-ink-800 bg-ink-900 text-white transition-all duration-300 ease-in-out xl:translate-x-0 xl:rtl:translate-x-0 dark:border-gray-800 dark:bg-ink-950",
        isCollapsed ? "w-12.5 px-1.5" : "w-55.5 px-5",
        isMobileOpen
          ? "translate-x-0"
          : "-translate-x-full rtl:translate-x-full",
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "flex py-8",
          !isExpanded && !isHovered ? "xl:justify-center" : "justify-start",
        )}
      >
        {/* Mobile: user info | Desktop: logo */}
        {isMobileOpen && user ? (
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
              {user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-[11px] text-ink-400 capitalize">{user.role}</p>
            </div>
          </div>
        ) : (
          <Link to="/" className="flex items-center gap-3" aria-label="Anaya Collection admin home">
            {isExpanded || isHovered ? (
              <span className="flex flex-col items-start gap-1">
                <img
                  src="/images/logo/anaya-collection-logo.png"
                  alt="Anaya Collection"
                  width={600}
                  height={258}
                  className="h-16 w-auto"
                />
                <span className="block ps-1 text-[11px] tracking-[0.3em] text-ink-300 uppercase">Admin</span>
              </span>
            ) : (
              <img
                src="/images/logo/anaya-collection-icon.png"
                alt="Anaya Collection"
                width={36}
                height={36}
                className="size-9 shrink-0 rounded-lg"
              />
            )}
          </Link>
        )}
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 flex text-xs leading-5 tracking-widest text-ink-300 uppercase ${
                  !isExpanded && !isHovered
                    ? "xl:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  t("sidebar.groups.menu")
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(mainItems, "main")}
            </div>

            <div>
              <h2
                className={`mb-4 flex text-xs leading-5 tracking-widest text-ink-300 uppercase ${
                  !isExpanded && !isHovered
                    ? "xl:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  t("sidebar.groups.others")
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(otherItems, "others")}
            </div>
          </div>
        </nav>
      </div>

      {/* ── Logout (mobile sidebar only) ── */}
      {isMobileOpen && (
        <div className="border-t border-ink-800 px-1 py-4 dark:border-gray-800">
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate("/signin", { replace: true });
            }}
            className="menu-item menu-item-inactive w-full"
          >
            <span className="menu-item-icon-size menu-item-icon-inactive">
              <LogoutIcon fontSize={24} />
            </span>
            <span className="menu-item-text">Sign out</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default AppSidebar;
