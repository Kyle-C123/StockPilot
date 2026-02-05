import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { LoginHistory } from "./components/LoginHistory";
import { Inventory } from "./components/Inventory";
import { Messages } from "./components/Messages";
import { Admin } from "./components/Admin";
import { Login } from "./components/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: (props) => (
      <ProtectedRoute>
        <Layout {...props} />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "login-history", Component: LoginHistory },
      { path: "inventory", Component: Inventory },
      { path: "messages", Component: Messages },
      { path: "admin", Component: Admin },
    ],
  },
]);
