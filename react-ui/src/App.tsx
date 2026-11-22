import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router";
import LoginPage from "./pages/login";
import AttendancePage from "./pages/attendance";
import MonitoringPage from "./pages/monitoring";
import HomePage from "./pages/home";
import { CookiesProvider, useCookies } from "react-cookie";
import Navbar from "./components/Navbar";
import { Toaster } from "sonner";
import { decodeAccessToken } from "./lib/jwt";

export default function App() {
  return (
    <CookiesProvider>
      <BrowserRouter>
        <Toaster position="top-right" className="text-left" duration={2000} />
        <Shell />
      </BrowserRouter>
    </CookiesProvider>
  );
}

function Shell() {
  const { pathname } = useLocation();
  const title = pathname.split('/')[1].charAt(0).toUpperCase() + pathname.split('/')[1].slice(1);

  return (
    <div className="flex flex-col gap-6 p-8">
      <Navbar title={title || 'Home Page'} />
      <Routes>
        <Route
          path="/"
          element={<HomePage />}
        />
        <Route element={<RequireGuest />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<RequireEmployee />}>
            <Route path="/attendance" element={<AttendancePage />} />
          </Route>
          <Route element={<RequireAdmin />}>
            <Route path="/monitoring" element={<MonitoringPage />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

function RequireAuth() {
  const [cookies] = useCookies(['token']);
  const user = decodeAccessToken(cookies.token);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function RequireGuest() {
  const [cookies] = useCookies(['token']);
  const user = decodeAccessToken(cookies.token);

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/monitoring' : '/attendance'} replace />;
  }

  return <Outlet />;
}

function RequireEmployee() {
  const [cookies] = useCookies(['token']);
  const user = decodeAccessToken(cookies.token);

  if (user?.role === 'admin') {
    return <Navigate to="/monitoring" replace />;
  }

  return <Outlet />;
}

function RequireAdmin() {
  const [cookies] = useCookies(['token']);
  const user = decodeAccessToken(cookies.token);

  if (user?.role !== 'admin') {
    return <Navigate to="/attendance" replace />;
  }

  return <Outlet />;
}
