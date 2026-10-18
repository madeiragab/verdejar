import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Sprout, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function Layout() {
  const { user, isModerator, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="app">
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label="Verdejar, página inicial">
            <span className="brand-mark">
              <Sprout size={20} strokeWidth={2.2} />
            </span>
            <span className="brand-name">Verdejar</span>
          </Link>

          <button className="icon-btn menu-toggle" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>

          <nav className={`nav ${open ? 'is-open' : ''}`}>
            <NavLink to="/" end>
              Perto de mim
            </NavLink>
            <NavLink to="/explorar">Explorar</NavLink>
            <NavLink to="/noticias">Notícias</NavLink>
            <NavLink to="/contribuir">Contribuir</NavLink>
            {isModerator && <NavLink to="/moderacao">Moderação</NavLink>}
            {isAdmin && <NavLink to="/admin">Usuários</NavLink>}
            <span className="nav-sep" />
            {user ? (
              <>
                <NavLink to="/minhas-contribuicoes" className="nav-user">
                  <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
                  {user.name.split(' ')[0]}
                </NavLink>
                <button
                  className="icon-btn"
                  title="Sair"
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <NavLink to="/entrar">Entrar</NavLink>
                <Link to="/cadastro" className="btn btn-sm">
                  Criar conta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <strong className="brand-name">Verdejar</strong>
            <p>Plantas do Brasil, região por região. Conteúdo enviado pela comunidade e revisado por mediadores.</p>
          </div>
          <p className="muted small">
            Informações sobre uso medicinal são de caráter informativo e não substituem orientação profissional.
            Mapas © colaboradores do OpenStreetMap · Municípios: IBGE.
          </p>
        </div>
      </footer>
    </div>
  );
}
