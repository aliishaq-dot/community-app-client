import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import { AppLayout } from "./components/AppLayout";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { HomePage } from "@/features/groups/pages/HomePage";
import { JoinPage } from "@/features/groups/pages/JoinPage";
import { GroupPage } from "@/features/groups/pages/GroupPage";
import { RoomPage } from "@/features/groups/pages/RoomPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    Component: AppLayout,
    children: [
      {
        path: "/",
        Component: ProtectedRoute,
        children: [
          { index: true, Component: HomePage },
          { path: "join/:code", Component: JoinPage },
          { path: "groups/:groupId", Component: GroupPage },
          { path: "groups/:groupId/rooms/:roomId", Component: RoomPage },
        ],
      },
    ],
  },
  {
    Component: PublicRoute,
    children: [
      { path: "/login", Component: LoginPage },
      { path: "/register", Component: RegisterPage },
    ],
  },
  { path: "*", Component: NotFoundPage },
]);
