import { Button } from "./components/ui/button";
import { useAuthContext } from "./providers/authProvider";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

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
          <Route
            index
            element={
              <div className="flex flex-col h-screen w-screen items-center justify-center">
                <div className="text-3xl font-bold">Exokit</div>
                <Button className="ml-4">Get Started</Button>
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
