import "./App.css"
import { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { loadFromLocalStorage } from './store/cartSlice'
import { loadCategories } from './store/categorySlice'
import { signIn } from './store/authSlice'
import { HomePage } from './pages/HomePage'
import { CategoryPage } from './pages/CategoryPage'
import { CartPage } from './pages/CartPage'
import { ProductPage } from './pages/ProductPage'
import { CartModal } from './components/CartModal'

function App() {
  const dispatch = useAppDispatch();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartItemsCount = useAppSelector((state) => state.cart.items.length);
  const categories = useAppSelector((state) => state.categories.items);
  const isAuthorized = useAppSelector((state) => state.auth.isAuthorized);
  const authError = useAppSelector((state) => state.auth.error);

  const clothingCategories = categories
    .filter((c) => c.section === 'clothing')
    .sort((a, b) => a.order - b.order);

  const accessoriesCategories = categories
    .filter((c) => c.section === 'accessories')
    .sort((a, b) => a.order - b.order);

  useEffect(() => {
    dispatch(loadFromLocalStorage());
    dispatch(loadCategories());

    // Авторизация через Telegram Mini App
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();

      // Получаем initData из Telegram Web App
      const initData = tg.initData;

      if (initData) {
        dispatch(signIn(initData));
      } else {
        console.warn('Telegram initData not available');
      }
    } else {
      console.warn('Telegram Web App SDK not available');
    }
  }, [dispatch]);

  return (
    <div className="d-flex flex-column min-vh-100 sofia-sans-condensed-font text-left">
      <nav className="navbar navbar-expand-lg bg-danger">
        <div className="container-fluid">
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="mx-auto">
            <Link to="/" className="navbar-brand text-light">ASSORTI</Link>
          </div>

          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link className="nav-link text-light" to="/">Все товары</Link>
              </li>

              {clothingCategories.length > 0 && (
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle text-light" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Одежда
                  </a>
                  <ul className="dropdown-menu bg-danger border-0" id="dropdown1">
                    {clothingCategories.map((cat) => (
                      <li key={cat.id}>
                        <Link className="dropdown-item text-light" to={`/category/${cat.id}`}>
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              )}

              {accessoriesCategories.length > 0 && (
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle text-light" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Аксессуары
                  </a>
                  <ul className="dropdown-menu bg-danger border-0" id="dropdown2">
                    {accessoriesCategories.map((cat) => (
                      <li key={cat.id}>
                        <Link className="dropdown-item text-light" to={`/category/${cat.id}`}>
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              )}

              <li className="nav-item">
                <Link className="nav-link text-light" to="/category/sale">SALE</Link>
              </li>
            </ul>
          </div>

          <div className="d-flex gap-3 ms-auto" style={{ alignItems: 'center' }}>
            {authError && (
              <div className="alert alert-warning m-0" style={{ fontSize: '0.9rem' }}>
                ⚠️ {authError}
              </div>
            )}
            {isAuthorized && (
              <span className="text-light" style={{ fontSize: '0.9rem' }}>
                ✅ Авторизован
              </span>
            )}
            <button
              className="btn btn-light position-relative"
              onClick={() => setIsCartOpen(true)}
            >
              🛒 Корзина
              {cartItemsCount > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark"
                  style={{ transform: 'translate(-50%, -50%)' }}
                >
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:categoryId" element={<CategoryPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/checkout" element={<CartPage />} />
      </Routes>

      <footer className="bg-dark text-light py-5 mt-auto text-center fs-1">
        <div className="container-fluid">
          ТУТ БУДЕТ ФУТЕР
        </div>
      </footer>
    </div>
  )
}

export default App
