import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { Empty, RequireAuth } from './components/common';
import { Layout } from './components/Layout';
import { Admin } from './pages/Admin';
import { Login, Register } from './pages/Auth';
import { Contribute } from './pages/Contribute';
import { Explore } from './pages/Explore';
import { Home } from './pages/Home';
import { Moderation } from './pages/Moderation';
import { MyContributions } from './pages/MyContributions';
import { News } from './pages/News';
import { PlantDetail } from './pages/PlantDetail';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="explorar" element={<Explore />} />
            <Route path="plantas/:id" element={<PlantDetail />} />
            <Route path="noticias" element={<News />} />
            <Route path="entrar" element={<Login />} />
            <Route path="cadastro" element={<Register />} />
            <Route path="contribuir" element={<RequireAuth><Contribute /></RequireAuth>} />
            <Route path="contribuir/:id" element={<RequireAuth><Contribute /></RequireAuth>} />
            <Route path="minhas-contribuicoes" element={<RequireAuth><MyContributions /></RequireAuth>} />
            <Route path="moderacao" element={<RequireAuth role="MODERATOR"><Moderation /></RequireAuth>} />
            <Route path="admin" element={<RequireAuth role="ADMIN"><Admin /></RequireAuth>} />
            <Route
              path="*"
              element={
                <div className="container section">
                  <Empty title="Página não encontrada">
                    <Link to="/">Voltar ao início</Link>
                  </Empty>
                </div>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
