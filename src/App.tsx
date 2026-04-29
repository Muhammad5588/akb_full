import "./i18n/config";

import { useState, useEffect, useCallback } from "react";

import NavigationBar from "./components/NavigationBar";
import RegistrationForm from "./components/RegistrationForm";
import LoginForm from "./components/LoginForm";
import AdminLoginForm from "./components/AdminLoginForm";
import AdminLayout from "./components/admin/AdminLayout";
import AdminAccountsPage from "./pages/admin/AdminAccountsPage";
import AdminRolesPage from "./pages/admin/AdminRolesPage";
import AdminProfilePage from "./pages/admin/AdminProfilePage";
import AdminAuditLogsPage from "./pages/admin/AdminAuditLogsPage";
import AdminCarouselPage from "./pages/admin/AdminCarouselPage";
import FlightScheduleAdminPage from "./pages/admin/FlightScheduleAdminPage";
import POSDashboard from "./pages/POSDashboard";
import ImportPage from "./components/ImportPage";
import ClientForm from "./components/ClientForm";
import FlightsPage from "./components/FlightsPage";
import CargoListPage from "./components/CargoListPage";
import AddCargoForm from "./components/AddCargoForm";
import StatisticsDashboard from "./components/StatisticsDashboard";
import UserPage from "./pages/UserPage";
import { UserNav } from "./components/navigation/UserNav";
import { Toaster } from "sonner";
import UserHome from "./pages/UserHome";
import UserReportsPage from "./pages/UserReportsPage";
import UserHistoryPage from "./pages/UserHistoryPage";
import { fetchAuthMe } from "./api/services/auth";
import { getAdminJwtClaims } from "./api/services/adminManagement";
import ManagerPage from "./pages/admin/ManagerPage";
import PasskeyPage from "./pages/admin/PasskeyPage";
import WarehousePage from "./pages/admin/WarehousePage";
import ExpectedCargoPage from "./pages/admin/ExpectedCargoPage";
import AdminPartnersPage from "./pages/admin/AdminPartnersPage";
import { UniqueBackground } from "./components/ui/UniqueBackground";
import TelegramWebAppGuard from "./components/TelegramWebAppGuard";

// ─── Types ────────────────────────────────────────────────────────────────────

type Page =
  | "login"
  | "admin-login"
  | "register"
  | "import"
  | "client-add"
  | "client-edit"
  | "flights"
  | "cargo-list"
  | "cargo-add"
  | "statistics"
  | "user-profile"
  | "user-home"
  | "user-reports"
  | "user-history"
  | "admin-accounts"
  | "admin-roles"
  | "admin-audit"
  | "admin-profile"
  | "admin-carousel"
  | "flight-schedule-admin"
  | "pos-dashboard"
  | "manager-page"
  | "passkey-page"
  | "warehouse-page"
  | "expected-cargo"
  | "admin-partners";

interface RouteInfo {
  page: Page;
  flightName?: string;
  clientId?: number;
  clientCode?: string;
}

// ─── Role Config ──────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { default: Page; allowed: Page[] }> = {
  user: {
    default: "user-home",
    allowed: ["user-home", "user-profile", "user-history", "user-reports"],
  },
  worker: {
    default: "flights",
    allowed: ["flights", "cargo-list", "cargo-add", "passkey-page", "expected-cargo", "admin-partners"],
  },
  accountant: {
    default: "pos-dashboard",
    allowed: [
      "pos-dashboard",
      "admin-profile",
      "passkey-page",
    ],
  },
  admin: {
    default: "admin-accounts",
    allowed: [
      "import",
      "client-add",
      "client-edit",
      "flights",
      "cargo-list",
      "cargo-add",
      "statistics",
      "user-home",
      "user-profile",
      "user-history",
      "user-reports",
      "admin-accounts",
      "admin-roles",
      "admin-audit",
      "admin-profile",
      "admin-carousel",
      "flight-schedule-admin",
      "pos-dashboard",
      "warehouse-page",
      "expected-cargo",
      "passkey-page",
      "admin-partners",
    ],
  },
  "super-admin": {
    default: "admin-accounts",
    allowed: [
      "import",
      "client-add",
      "client-edit",
      "flights",
      "cargo-list",
      "cargo-add",
      "statistics",
      "user-home",
      "user-profile",
      "user-history",
      "user-reports",
      "admin-accounts",
      "admin-roles",
      "admin-audit",
      "admin-profile",
      "admin-carousel",
      "flight-schedule-admin",
      "pos-dashboard",
      "warehouse-page",
      "expected-cargo",
      "manager-page",
      "passkey-page",
      "admin-partners",
    ],
  },
  manager: {
    default: "manager-page",
    // admin-carousel is gated by JWT permission (carousel:read) checked in ManagerPage UI;
    // adding it here only unlocks the route — the backend enforces actual authorization.
    allowed: ["manager-page", "admin-carousel", "admin-profile", "passkey-page", "flight-schedule-admin"],
  },
  warehouse_worker: {
    default: "warehouse-page",
    allowed: ["warehouse-page", "expected-cargo", "admin-profile", "passkey-page", "admin-partners"],
  },
  warehouse: {
    default: "warehouse-page",
    allowed: ["warehouse-page", "expected-cargo", "admin-profile", "passkey-page", "admin-partners"],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GUEST_PAGES: Page[] = ["login", "admin-login", "register"];
const USER_PAGES: Page[] = ["user-profile", "user-home", "user-reports", "user-history"];

function isGuestPage(page: Page): boolean {
  return GUEST_PAGES.includes(page);
}

function getDefaultPageForRole(role: string): Page {
  // The backend JWT's home_page is always authoritative — it may differ from
  // the static ROLE_CONFIG default (e.g. accountant whose home_page is "/pos"
  // instead of "/verification/search").  ROLE_CONFIG is only a fallback for
  // when there is no token yet (e.g. during the login redirect itself).
  const claims = getAdminJwtClaims();
  if (claims.home_page) {
    const resolved = resolvePageFromPath(claims.home_page);
    if (!isGuestPage(resolved.page)) return resolved.page;
  }

  // No JWT or home_page missing — fall back to static config then admin-login.
  if (ROLE_CONFIG[role]) return ROLE_CONFIG[role].default;
  return "admin-login";
}

/**
 * Pure access-check function — no side effects.
 * Returns the page the user should actually land on.
 */
function checkAccess(targetPage: Page, role: string | null): Page {
  if (!role) {
    // Not logged in → only guest pages are accessible
    if (isGuestPage(targetPage)) return targetPage;
    // User pages go to regular login; all other (admin/worker) pages go to admin login
    return USER_PAGES.includes(targetPage) ? "login" : "admin-login";
  }
  if (isGuestPage(targetPage)) {
    // Already logged in → skip login/register, go to role default
    return getDefaultPageForRole(role);
  }

  // Known role: enforce whitelist from static config
  if (ROLE_CONFIG[role]) {
    const allowed = ROLE_CONFIG[role].allowed;
    return allowed.includes(targetPage) ? targetPage : getDefaultPageForRole(role);
  }

  // Custom/unknown role: the only guaranteed-allowed page is their home_page.
  // Redirect any other page back to it rather than to /auth/login (which is
  // only for unauthenticated users — a 403, not a 401, situation).
  return getDefaultPageForRole(role);
}

function getPathForPage(
  page: Page,
  flightName?: string,
  clientId?: number,
): string {
  if (page === "register") return "/auth/register";
  if (page === "admin-login") return "/admin/login";
  if (page === "import") return "/import";
  if (page === "client-add") return "/client/add";
  if (page === "client-edit" && clientId) return `/client/edit/${clientId}`;
  if (page === "flights") return "/flights";
  if (page === "statistics") return "/statistics";
  if (page === "cargo-list" && flightName)
    return `/flights/${encodeURIComponent(flightName)}/photos`;
  if (page === "cargo-add" && flightName)
    return `/flights/${encodeURIComponent(flightName)}/photos/add`;
  if (page === "user-profile") return "/user/profile";
  if (page === "user-home") return "/user/home";
  if (page === "user-reports") return "/user/reports";
  if (page === "user-history") return "/user/history";
  if (page === "admin-accounts") return "/admin/accounts";
  if (page === "admin-roles") return "/admin/roles";
  if (page === "admin-audit") return "/admin/audit";
  if (page === "admin-profile") return "/admin/profile";
  if (page === "admin-carousel") return "/admin/carousel";
  if (page === "flight-schedule-admin") return "/admin/flight-schedule";
  if (page === "manager-page") return "/admin/clients";
  if (page === "passkey-page") return "/admin/passkey";
  if (page === "warehouse-page") return "/admin/warehouse";
  if (page === "pos-dashboard") return "/pos";
  if (page === "expected-cargo") return "/admin/expected-cargo";
  if (page === "admin-partners") return "/admin/partners";
  return "/auth/login";
}

function resolvePageFromPath(rawPath: string): RouteInfo {
  const path =
    rawPath.endsWith("/") && rawPath.length > 1
      ? rawPath.slice(0, -1)
      : rawPath;

  const flightMatch = path.match(/\/flights\/([^/]+)/);
  const flightName = flightMatch
    ? decodeURIComponent(flightMatch[1])
    : undefined;

  const clientEditMatch = path.match(/\/client\/edit\/(\d+)/);
  const clientEditId = clientEditMatch
    ? parseInt(clientEditMatch[1], 10)
    : undefined;

  if (path === "/auth/register") return { page: "register" };
  if (path === "/admin/login") return { page: "admin-login" };
  if (path === "/import") return { page: "import" };
  if (path === "/client/add") return { page: "client-add" };
  if (path.startsWith("/client/edit/") && clientEditId)
    return { page: "client-edit", clientId: clientEditId };
  if (path === "/flights") return { page: "flights" };
  if (path === "/statistics") return { page: "statistics" };
  if (flightName && path.includes("/photos/add"))
    return { page: "cargo-add", flightName };
  if (flightName && path.includes("/photos"))
    return { page: "cargo-list", flightName };
  if (path === "/user/profile") return { page: "user-profile" };
  if (path === "/user/home") return { page: "user-home" };
  if (path === "/user/reports") return { page: "user-reports" };
  if (path === "/user/history") return { page: "user-history" };
  if (path === "/admin/accounts") return { page: "admin-accounts" };
  if (path === "/admin/roles") return { page: "admin-roles" };
  if (path === "/admin/audit") return { page: "admin-audit" };
  if (path === "/admin/profile") return { page: "admin-profile" };
  if (path === "/admin/carousel") return { page: "admin-carousel" };
  if (path === "/admin/flight-schedule" || path === "/admin/schedule")
    return { page: "flight-schedule-admin" };
  if (path === "/admin/clients") return { page: "manager-page" };
  if (path === "/admin/passkey") return { page: "passkey-page" };
  if (path === "/warehouse" || path === "/admin/warehouse") return { page: "warehouse-page" };
  if (path === "/admin/expected-cargo") return { page: "expected-cargo" };
  if (path === "/admin/partners") return { page: "admin-partners" };
  if (path === "/pos") return { page: "pos-dashboard" };

  return { page: "login" };
}

// ─── App ──────────────────────────────────────────────────────────────────────

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const [selectedFlightName, setSelectedFlightName] = useState("");

  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // ── Core routing ─────────────────────────────────────────────────────────

  /**
   * Single place that validates access and updates URL + React state together.
   * Always pass `role` explicitly — never rely on stale closure state.
   */
  const applyRoute = useCallback(
    (
      routeInfo: RouteInfo,
      role: string | null,
      method: "push" | "replace" = "replace",
    ) => {
      let { page, flightName, clientId, clientCode } = routeInfo;

      const finalPage = checkAccess(page, role);

      if (finalPage !== page) {
        // Access denied — strip params belonging to the blocked page
        page = finalPage;
        flightName = undefined;
        clientId = undefined;
        clientCode = undefined;
      }

      const path = getPathForPage(page, flightName, clientId);

      // Preserve existing query params (e.g. ?tab=request) from the current URL
      const currentParams = window.location.search;
      const url = currentParams ? `${path}${currentParams}` : path;

      if (method === "push") {
        window.history.pushState(
          { page, flightName, clientId, clientCode },
          "",
          url,
        );
      } else {
        window.history.replaceState(
          { page, flightName, clientId, clientCode },
          "",
          url,
        );
      }

      setCurrentPage(page);
      if (flightName !== undefined) setSelectedFlightName(flightName);
    },
    [],
  );
  const handleLogout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("admin_role");
    sessionStorage.removeItem("access_token");
    setUserRole(null);

    const currentRouteInfo = resolvePageFromPath(window.location.pathname);
    const isUserRoute =
      USER_PAGES.includes(currentRouteInfo.page) ||
      currentRouteInfo.page === "login" ||
      currentRouteInfo.page === "register";

    applyRoute(
      { page: isUserRoute ? "login" : "admin-login" },
      null,
      "replace",
    );
  }, [applyRoute]);
  // ── Initial auth check (runs once on mount) ──────────────────────────────
  useEffect(() => {
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [handleLogout]);

  useEffect(() => {
    let cancelled = false;

    const verifyAuth = async () => {
      const adminToken = localStorage.getItem("access_token");
      const adminRole = localStorage.getItem("admin_role");
      const userToken = sessionStorage.getItem("access_token");
      const currentRouteInfo = resolvePageFromPath(window.location.pathname);

      // ── 1. Admin session (localStorage) ──────────────────────────────────
      // Admin tokens are issued by a separate auth system and are NOT accepted
      // by /auth/me. Calling it would always return 401 and log the admin out.
      // Token validity is instead proven on every real API call via
      // X-Admin-Authorization; a 401 there dispatches auth:logout automatically.
      // Any admin with a stored token is considered authenticated — the token's
      // validity is proven on every API call via X-Admin-Authorization.
      // Restricting by role name here locked out custom roles (e.g. "cashier").
      if (adminToken && adminRole) {
        if (!cancelled) {
          setUserRole(adminRole);
          setIsCheckingAuth(false);
          // On a guest/login page → send to the admin default; otherwise honour URL
          if (isGuestPage(currentRouteInfo.page)) {
            applyRoute({ page: getDefaultPageForRole(adminRole) }, adminRole, "replace");
          } else {
            applyRoute(currentRouteInfo, adminRole, "replace");
          }
        }
        return;
      }

      // ── 2. No user token either → guest ──────────────────────────────────
      if (!userToken) {
        if (!cancelled) {
          setUserRole(null);
          setIsCheckingAuth(false);

          // If the bot opened a protected URL, save it to redirect after login
          if (
            !isGuestPage(currentRouteInfo.page) &&
            currentRouteInfo.page !== "login"
          ) {
            sessionStorage.setItem("intended_path", window.location.pathname);
          }

          // checkAccess will route to the correct login page based on the target
          applyRoute(currentRouteInfo, null, "replace");
        }
        return;
      }

      // ── 3. Regular user session (sessionStorage) — validate with server ──
      try {
        const userData = await fetchAuthMe();
        if (!cancelled) {
          const role = userData.role ?? "user";
          setUserRole(role);
          setIsCheckingAuth(false);
          applyRoute(currentRouteInfo, role, "replace");
        }
      } catch {
        if (!cancelled) {
          sessionStorage.removeItem("access_token");
          setUserRole(null);
          setIsCheckingAuth(false);
          applyRoute({ page: "login" }, null, "replace");
        }
      }
    };

    verifyAuth();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once

  // ── Browser back / forward ───────────────────────────────────────────────

  useEffect(() => {
    const handlePopState = () => {
      applyRoute(
        resolvePageFromPath(window.location.pathname),
        userRole,
        "replace",
      );
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [userRole, applyRoute]);

  // ── Programmatic navigation ──────────────────────────────────────────────

  const navigateToPage = useCallback(
    (
      page: Page,
      flightName?: string,
      clientId?: number,
      clientCode?: string,
    ) => {
      applyRoute({ page, flightName, clientId, clientCode }, userRole, "push");
    },
    [userRole, applyRoute],
  );

  // ── Login success ────────────────────────────────────────────────────────

  const handleLoginSuccess = useCallback(
    (role: string) => {
      setUserRole(role);
      setIsCheckingAuth(false);

      // AdminLoginForm writes access_token to localStorage *before* calling this
      // callback, so getAdminJwtClaims() can read the freshly issued token here.
      const claims = getAdminJwtClaims();
      // Prefer the home_page encoded by the backend in the JWT — it is role-specific
      // and may differ from the static ROLE_CONFIG default (e.g. a super-admin
      // whose home_page is set to "/pos" rather than "/admin/accounts").
      const jwtHomePage = claims.home_page
        ? resolvePageFromPath(claims.home_page).page
        : null;

      // Check if the bot had opened a specific URL before login was required.
      // If the role allows that page → go there. Otherwise → JWT/role default.
      const intendedPath = sessionStorage.getItem("intended_path");
      sessionStorage.removeItem("intended_path");

      const intendedRoute = intendedPath
        ? resolvePageFromPath(intendedPath)
        : null;

      const targetPage = intendedRoute
        ? checkAccess(intendedRoute.page, role)
        : (jwtHomePage ?? getDefaultPageForRole(role));

      const finalRoute: RouteInfo =
        intendedRoute && targetPage === intendedRoute.page
          ? intendedRoute // intended page is allowed → use it with its params
          : { page: targetPage }; // fallback to JWT home_page / role default

      applyRoute(finalRoute, role, "replace");
    },
    [applyRoute],
  );

  // ── Derived flags ────────────────────────────────────────────────────────

  const isVerificationPage = [
    "verification-search",
    "verification-profile",
    "verification-transactions",
    "verification-unpaid",
  ].includes(currentPage);

  const isUserPages = [
    "user-profile",
    "user-home",
    "user-reports",
    "user-history",
  ].includes(currentPage);

  const isAdminLoginPage = currentPage === "admin-login";

  const isSuperAdminPages = [
    "admin-accounts",
    "admin-roles",
    "admin-audit",
    "admin-profile",
    "admin-carousel",
    "flight-schedule-admin",
    "admin-partners",
  ].includes(currentPage);

  // Only roles with admin-accounts (admin, super-admin) get the full AdminLayout shell.
  // All other roles that happen to have admin-* pages in their allowed list (manager →
  // admin-carousel, accountant/warehouse_worker → admin-profile) receive standalone views.
  const canAccessAdminPanel =
    userRole !== null &&
    (ROLE_CONFIG[userRole]?.allowed ?? []).includes("admin-accounts");

  // Non-admin role on a page that lives inside isSuperAdminPages → standalone render.
  const isStandaloneAdminSubpage =
    isSuperAdminPages &&
    !canAccessAdminPanel &&
    userRole !== null;

  const isPOSPage = currentPage === "pos-dashboard";
  const isManagerPage = currentPage === "manager-page";
  const isPasskeyPage = currentPage === "passkey-page";
  const isWarehousePage = currentPage === "warehouse-page";
  const isExpectedCargoPage = currentPage === "expected-cargo";
  const canAccessManagerPage =
    userRole !== null &&
    (ROLE_CONFIG[userRole]?.allowed ?? []).includes("manager-page");
  const canAccessWarehouse =
    userRole !== null &&
    (ROLE_CONFIG[userRole]?.allowed ?? []).includes("warehouse-page");
  const canAccessExpectedCargo =
    userRole !== null &&
    (ROLE_CONFIG[userRole]?.allowed ?? []).includes("expected-cargo");
  const isCustomerFacingPage =
    currentPage === "login" ||
    currentPage === "register" ||
    USER_PAGES.includes(currentPage);

  const isAdminArea =
    isSuperAdminPages || isAdminLoginPage || isPOSPage ||
    isManagerPage || isStandaloneAdminSubpage || isPasskeyPage ||
    isWarehousePage || isExpectedCargoPage;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
        isCustomerFacingPage
          ? "bg-[#f4f8fc] text-[#07182f] dark:bg-[#0b1420] dark:text-[#f3f7fc]"
          : isAdminArea
          ? "bg-[#f5f5f4] dark:bg-[#09090b]"
          : "bg-[#f5f5f7] dark:bg-[#111214]"
      }`}
    >
      {!isUserPages && <UniqueBackground />}

      <div className="relative z-10">
        {!isAdminArea && (
          <>
            <NavigationBar
              currentPage={currentPage}
            />

            {isUserPages && (
              <UserNav
                currentPage={currentPage}
                onNavigate={(page) => navigateToPage(page as Page)}
              />
            )}
          </>
        )}

      {isCheckingAuth ? (
        <div className="flex h-[60vh] items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-zinc-900 border-t-transparent animate-spin dark:border-white dark:border-t-transparent" />
        </div>
      ) : isSuperAdminPages && canAccessAdminPanel ? (
        <AdminLayout
          currentPage={currentPage}
          onNavigate={(page) => navigateToPage(page as Page)}
          onLogout={handleLogout}
        >
          {currentPage === "admin-accounts" && <AdminAccountsPage />}
          {currentPage === "admin-roles" && <AdminRolesPage />}
          {currentPage === "admin-audit" && <AdminAuditLogsPage />}
          {currentPage === "admin-profile" && <AdminProfilePage />}
          {currentPage === "admin-carousel" && <AdminCarouselPage />}
          {currentPage === "flight-schedule-admin" && <FlightScheduleAdminPage />}
          {currentPage === "admin-partners" && <AdminPartnersPage />}
        </AdminLayout>
      ) : isPOSPage ? (
        <POSDashboard
          onNavigate={(page) => navigateToPage(page as Page)}
          onLogout={handleLogout}
        />
      ) : isStandaloneAdminSubpage ? (
        // Non-admin roles on admin-* pages — render standalone without AdminLayout sidebar.
        // The back destination is the role's default home page.
        <>
          {currentPage === "admin-carousel" && (
            <AdminCarouselPage
              onBack={() => navigateToPage(getDefaultPageForRole(userRole!) as Page)}
            />
          )}
          {currentPage === "admin-profile" && (
            <AdminProfilePage
              onBack={() => navigateToPage(getDefaultPageForRole(userRole!) as Page)}
            />
          )}
          {currentPage === "admin-partners" && (
            <div className="min-h-screen bg-[#f5f5f4] dark:bg-[#0a0a0a] px-3 sm:px-5 py-4 sm:py-6">
              <button
                onClick={() => navigateToPage(getDefaultPageForRole(userRole!) as Page)}
                className="mb-4 flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
              >
                ← Orqaga
              </button>
              <AdminPartnersPage />
            </div>
          )}
        </>
      ) : isManagerPage && canAccessManagerPage ? (
        <ManagerPage
          onNavigate={(page) => navigateToPage(page as Page)}
          onLogout={handleLogout}
        />
      ) : isPasskeyPage ? (
        <PasskeyPage
          onNavigate={(page) => navigateToPage(page as Page)}
          onLogout={handleLogout}
        />
      ) : isWarehousePage && canAccessWarehouse ? (
        <WarehousePage
          onNavigate={(page) => navigateToPage(page as Page)}
          onLogout={handleLogout}
        />
      ) : isExpectedCargoPage && canAccessExpectedCargo ? (
        <ExpectedCargoPage
          onNavigate={(page) => navigateToPage(page as Page)}
          onLogout={handleLogout}
        />
      ) : (
        <main
          className={`relative ${
            isUserPages
              ? "pb-0 md:pb-0 pt-0"
              : isAdminLoginPage || currentPage === "login"
                ? "p-0"
                : ["flights", "cargo-list", "cargo-add"].includes(currentPage)
                  ? "pt-20 pb-6"   // NavigationBar clearance only — inner pages control their own spacing
                  : "pb-12 pt-24"
          } transition-all duration-300 ${isVerificationPage ? "pt-24 md:pt-48" : ""}`}
        >
          {currentPage === "login" && (
            <LoginForm
              onNavigateToRegister={() => navigateToPage("register")}
              onLoginSuccess={handleLoginSuccess}
            />
          )}

          {currentPage === "admin-login" && (
            <AdminLoginForm onAdminLoginSuccess={handleLoginSuccess} />
          )}

          {currentPage === "register" && (
            <RegistrationForm
              onNavigateToLogin={() => navigateToPage("login")}
            />
          )}

          {currentPage === "import" && <ImportPage />}

          {currentPage === "client-add" && <ClientForm mode="add" />}

          {currentPage === "client-edit" && (
            <ClientForm
              mode="edit"
              clientId={resolvePageFromPath(window.location.pathname).clientId}
            />
          )}

          {currentPage === "flights" && (
            <FlightsPage
              onSelectFlight={(flightName) =>
                navigateToPage("cargo-list", flightName)
              }
              onLogout={handleLogout}
              onNavigate={(page) => navigateToPage(page as Page)}
            />
          )}

          {currentPage === "cargo-list" && selectedFlightName && (
            <CargoListPage
              flightName={selectedFlightName}
              onBack={() => navigateToPage("flights")}
              onAddCargo={() => navigateToPage("cargo-add", selectedFlightName)}
              onLogout={handleLogout}
            />
          )}

          {currentPage === "cargo-add" && selectedFlightName && (
            <AddCargoForm
              flightName={selectedFlightName}
              onBack={() => navigateToPage("cargo-list", selectedFlightName)}
              onSuccess={() => navigateToPage("cargo-list", selectedFlightName)}
            />
          )}

          {currentPage === "statistics" && (
            <StatisticsDashboard onBack={() => navigateToPage("flights")} />
          )}

          {currentPage === "user-profile" && (
            <UserPage onLogout={handleLogout} />
          )}

          {currentPage === "user-home" && (
            <UserHome
              onNavigateToReports={() => navigateToPage("user-reports")}
              onNavigateToHistory={() => navigateToPage("user-history")}
            />
          )}

          {currentPage === "user-reports" && <UserReportsPage />}

          {currentPage === "user-history" && (
            <UserHistoryPage onBack={() => navigateToPage("user-home")} />
          )}
        </main>
      )}

      <Toaster position="top-center"/>


      </div>
    </div>
  );
}

export default function App() {
  return (
    <TelegramWebAppGuard>
      <AppContent />
    </TelegramWebAppGuard>
  );
}
