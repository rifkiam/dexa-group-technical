import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router";
import LoginPage from "./pages/login";
import AttendancePage from "./pages/attendance";
import MonitoringPage from "./pages/monitoring";


export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}

function Shell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="flex flex-col gap-6 p-8">
      <Routes>
        <Route
          path="/"
          element={<LoginPage />}
        />
        <Route
          path="/attendance"
          element={<AttendancePage />}
        />
        <Route
          path="/monitoring"
          element={<MonitoringPage />}
        />
      </Routes>
    </div>
  );
}
