import React, { useState, useEffect, useContext } from "react";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import PostTaskPage from "./pages/PostTaskPage";
import TaskDetails from "./pages/TaskDetails";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import PaymentPage from "./pages/PaymentPage";
import "./App.css";
import { AuthContext } from "./AuthContext";
import GeneralLoader from "./GeneralLoader";

const getInitialTheme = () => {
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return "light";
};

const App = ({ setNavigateFn }) => {
  const { user, loading, logout: authLogout } = useContext(AuthContext);
  const isAuthenticated = !!user;

  const [currentPage, setCurrentPage] = useState("landing");
  const [pageParams, setPageParams] = useState({});
  const [theme, setTheme] = useState(getInitialTheme());
  const [showLoader, setShowLoader] = useState(true);

  // Persist theme to localStorage
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Loader timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Set navigation function
  useEffect(() => {
    if (setNavigateFn) {
      setNavigateFn(() => navigateTo);
    }
  }, [setNavigateFn]);

  // Apply theme to document
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Redirect to home if authenticated
  useEffect(() => {
    if (user && currentPage === "landing") {
      setCurrentPage("home");
    }
  }, [user]);

  const navigateTo = (page, params = {}) => {
    setCurrentPage(page);
    setPageParams(params);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const logout = async () => {
    try {
      await authLogout();
      navigateTo("landing");
      setPageParams({});
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case "landing":
        return (
          <LandingPage
            navigateTo={navigateTo}
            isAuthenticated={isAuthenticated}
            theme={theme}
            toggleTheme={toggleTheme}
            logout={logout}
          />
        );
      case "auth":
        return (
          <AuthPage
            navigateTo={navigateTo}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        );
      case "home":
        return (
          <HomePage
            navigateTo={navigateTo}
            isAuthenticated={isAuthenticated}
            theme={theme}
            toggleTheme={toggleTheme}
            logout={logout}
          />
        );
      case "post-task":
        return (
          <PostTaskPage
            navigateTo={navigateTo}
            theme={theme}
            toggleTheme={toggleTheme}
            logout={logout}
          />
        );
      case "task":
        return (
          <TaskDetails
            navigateTo={navigateTo}
            taskId={pageParams.taskId}
            theme={theme}
            toggleTheme={toggleTheme}
            isLoggedIn={isAuthenticated}
          />
        );
      case "chat":
        return (
          <ChatPage
            navigateTo={navigateTo}
            chatId={pageParams.chatId}
            theme={theme}
            toggleTheme={toggleTheme}
            logout={logout}
          />
        );
      case "profile":
        return (
          <ProfilePage
            navigateTo={navigateTo}
            isAuthenticated={isAuthenticated}
            theme={theme}
            toggleTheme={toggleTheme}
            logout={logout}
          />
        );
      case "payment":
        return (
          <PaymentPage
            navigateTo={navigateTo}
            taskId={pageParams.taskId}
            budget={pageParams.budget}
            theme={theme}
            toggleTheme={toggleTheme}
            isLoggedIn={isAuthenticated}
          />
        );
      default:
        return (
          <LandingPage
            navigateTo={navigateTo}
            isAuthenticated={isAuthenticated}
            theme={theme}
            toggleTheme={toggleTheme}
            logout={logout}
          />
        );
    }
  };

  if (loading || showLoader) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <GeneralLoader theme={theme} />
      </div>
    );
  }

  return <div className="app">{renderPage()}</div>;
};

export default App;