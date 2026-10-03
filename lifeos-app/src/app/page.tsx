"use client";

import { useState, useEffect } from "react";
import * as ds from "@/lib/data-service";
import AuthView, { type AuthUser } from "@/components/AuthView";
import { Dashboard, DataErrorBoundary, FinanceView, HabitsView, GoalsView, SettingsView, TasksView } from "@/components/FeatureViews";
import ModuleView from "../components/ModuleView";
import { resetClientCache } from "@/lib/storage";

// ── Navigation items ──
const navigation: [string, string][] = [
  ["Overview", "O"], ["Finance", "$"], ["Health", "+"], ["Habits", "✓"],
  ["Productivity", "▤"], ["Goals", "◎"], ["Learning", "L"], ["Career", "↗"],
  ["Travel", "✈"], ["Shopping", "□"], ["Vehicle", "V"], ["Home", "⌂"],
  ["Entertainment", "▶"], ["Calendar", "▦"], ["Reports", "▥"],
];

const IMPLEMENTED_MODULES = [
  "Overview", "Finance", "Health", "Habits", "Productivity", "Goals",
  "Learning", "Career", "Travel", "Shopping", "Vehicle", "Home",
  "Entertainment", "Calendar", "Reports", "Settings",
];
const DEDICATED_MODULES = ["Overview", "Finance", "Habits", "Goals", "Productivity", "Settings"];

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [toast, setToast] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [userName, setUserName] = useState("");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  // Restore the signed-in user and their records from the local project database.
  useEffect(() => {
    async function restoreSession() {
      try {
        const response = await fetch("/api/auth", { cache: "no-store", credentials: "same-origin" });
        const result = await response.json() as { user?: AuthUser | null };
        if (response.ok && result.user) {
          await ds.loadUserData();
          setAuthUser(result.user);
          setUserName(ds.getProfile()?.name || result.user.displayName);
        }
      } catch {
        notify("Unable to connect to the local LifeOS data file.");
      } finally {
        setLoaded(true);
      }
    }
    void restoreSession();
  }, []);

  // ── Helpers ──
  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  async function handleAuthenticated(user: AuthUser) {
    try {
      await ds.loadUserData();
      setAuthUser(user);
      setUserName(ds.getProfile()?.name || user.displayName);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to load your saved records.");
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
      resetClientCache();
      setAuthUser(null);
      setUserName("");
    } catch {
      notify("Unable to sign out. Try again.");
    }
  }

  function handleNavigate(page: string) {
    setActive(page);
    setMenuOpen(false);
  }

  // Initials from name (e.g. "Shaeekh Ahmed" -> "SA")
  const initials = userName
    ? userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  if (!loaded) return <main className="auth-loading">Opening LifeOS...</main>;
  if (!authUser) return <AuthView onAuthenticated={handleAuthenticated} />;

  return (
    <main className="lifeos-shell">
      {/* ── Sidebar ── */}
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">L</span>
          <span>LIFE<span>OS</span></span>
        </div>
        <div className="workspace">
          <span className="avatar avatar-small">{initials}</span>
          <span>
            <b>{userName || "User"}&apos;s space</b>
            <small>Personal workspace</small>
          </span>
          <span className="chevron">⌄</span>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {navigation.map(([label, icon]) => (
            <button
              key={label}
              className={`nav-item ${active === label ? "active" : ""}`}
              onClick={() => handleNavigate(label)}
            >
              <span className="nav-icon">{icon}</span>
              {label}
              {IMPLEMENTED_MODULES.includes(label) ? null : <span className="nav-soon">soon</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button
            className={`nav-item ${active === "Settings" ? "active" : ""}`}
            onClick={() => handleNavigate("Settings")}
          >
            <span className="nav-icon">⚙</span>Settings
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <section className="content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">☰</button>
          <div className="breadcrumb">
            <span>Workspace</span>
            <b>/</b>
            <strong>{active}</strong>
          </div>
          <div className="top-actions">
            <button className="profile">
              <span className="avatar">{initials}</span>
              <span className="profile-name">{userName || "User"}</span>
            </button>
            <button className="secondary-button sign-out-button" onClick={handleLogout}>Sign out</button>
          </div>
        </header>

        <div className="page-body">
          <DataErrorBoundary key={active}>
          {active === "Overview" && (
            <Dashboard onNavigate={handleNavigate} onNotify={notify} />
          )}
          {active === "Finance" && (
            <FinanceView onNotify={notify} />
          )}
          {active === "Habits" && (
            <HabitsView onNotify={notify} />
          )}
          {active === "Goals" && (
            <GoalsView onNotify={notify} />
          )}
          {active === "Productivity" && (
            <TasksView onNotify={notify} />
          )}
          {active === "Settings" && (
            <SettingsView onNotify={notify} />
          )}
          {!DEDICATED_MODULES.includes(active) && (
            <ModuleView module={active} onNotify={notify} />
          )}
          </DataErrorBoundary>
        </div>
      </section>

      {/* ── Toast ── */}
      {toast && <div className="toast">✓ {toast}</div>}
    </main>
  );
}
