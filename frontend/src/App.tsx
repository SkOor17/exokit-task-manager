import { useAuthContext } from "./providers/authProvider";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";

// Guard de route : redirige vers /login si non authentifié
function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuthContext();
  if (isLoading) return <div>Chargement…</div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<div>Connexion</div>} />
        <Route path="/" element={<PrivateRoute />}>
          <Route index element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
