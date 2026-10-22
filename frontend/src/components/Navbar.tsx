import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
  BookOpen,
  Briefcase,
  Code2,
  Compass,
  LogOut,
  Map,
  Menu,
  Palette,
  User as UserIcon,
  X,
} from "lucide-react";
import "./Navbar.css";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    localStorage.getItem("jobway-theme") === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("jobway-theme", theme);
  }, [theme]);

  const handleLogout = async () => {
    const apiBase =
      import.meta.env.VITE_API_BASE ||
      (import.meta.env.DEV ? "http://127.0.0.1:3000" : "");
    try {
      await fetch(`${apiBase}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* Local state must still be cleared if the API is unavailable. */
    }
    logout();
    navigate("/");
  };

  const navItems = [
    { to: "/prepare", label: "Discover", icon: Compass },
    { to: "/workflow", label: "My plan", icon: Map },
    { to: "/dashboard", label: "Learn", icon: BookOpen },
    { to: "/practice", label: "Practice", icon: Code2 },
    {
      to: "/companies/chances",
      label: "Readiness",
      icon: Briefcase,
    },
  ];

  return (
    <nav className="navbar glass-header">
      <div className="container flex-between">
        <Link to="/" className="nav-brand flex-center">
          <Code2 size={28} className="brand-icon text-gradient" />
          <span className="brand-text">
            Job Way <small>CAREER LAUNCHPAD</small>
          </span>
        </Link>

        <button
          type="button"
          className="nav-menu-button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <div
          id="primary-navigation"
          className={menuOpen ? "nav-links open" : "nav-links"}
        >
          <div className="nav-route-links">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
          <label className="theme-picker">
            <Palette size={16} />
            <span className="sr-only">Choose color theme</span>
            <select
              value={theme}
              onChange={(event) =>
                setTheme(event.target.value as "light" | "dark")
              }
              aria-label="Color theme"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>

          <div className="nav-account">
            {isAuthenticated ? (
              <div className="auth-group flex-center">
              <Link to="/profile" className="nav-user flex-center">
                <UserIcon size={18} />
                <span>{user?.username}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="btn-icon"
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
              </div>
            ) : (
              <div className="auth-group flex-center">
                <Link to="/login" className="nav-login">
                  Log in
                </Link>
                <Link to="/signup" className="btn-primary">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
