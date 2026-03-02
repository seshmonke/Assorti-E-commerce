import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/image-gallery.css';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadProductById, clearCurrentProduct } from '../store/productsSlice';
import { addToCart } from '../store/cartSlice';

const DELIVERY_INFO = 'Доставка по России: 2-7 дней. Бесплатная доставка при заказе от 3000 ₽. Возврат в течение 14 дней.';

const tg = window.Telegram?.WebApp;

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentProduct: product, loading, error } = useAppSelector((state) => state.products);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isAdded, setIsAdded] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      dispatch(loadProductById(id));
    }
    return () => {
      dispatch(clearCurrentProduct());
    };
  }, [id, dispatch]);

  // Автоматически выбираем размер, если он один
  useEffect(() => {
    if (product && product.sizes.length === 1) {
      setSelectedSize(product.sizes[0]);
    } else {
      setSelectedSize('');
    }
  }, [product]);

  if (loading) {
    return (
      <main className="flex-grow-1 py-4">
        <div className="container d-flex justify-content-center py-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="flex-grow-1 py-4">
        <div className="container">
          <div className="alert alert-danger" role="alert">
            {error ?? 'Товар не найден'}
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Вернуться на главную
          </button>
        </div>
      </main>
    );
  }

  const handleAddToCart = () => {
    dispatch(addToCart({ product, size: selectedSize }));
    setIsAdded(true);
    tg?.HapticFeedback?.impactOccurred('light');

    setTimeout(() => {
      setIsAdded(false);
    }, 600);
  };

  // Формируем items для ImageGallery
  const galleryImages = (product.images?.length ?? 0) > 0
    ? (product.images ?? []).map((img) => ({
        original: img,
        thumbnail: img,
        originalAlt: product.name,
        thumbnailAlt: product.name,
      }))
    : [{
        original: 'https://placehold.co/600x600?text=Нет+фото',
        thumbnail: 'https://placehold.co/200x200?text=Нет+фото',
        originalAlt: product.name,
        thumbnailAlt: product.name,
      }];

  return (
    <main className="flex-grow-1 py-4">
      <div className="container">
        <button
          className="btn btn-outline-secondary mb-4"
          onClick={() => navigate(-1)}
        >
          ← Назад
        </button>

        <div className="row g-4">
          {/* Галерея товара */}
          <div className="col-lg-6">
            <div className="product-gallery-wrapper">
              <ImageGallery
                items={galleryImages}
                showThumbnails={(product.images?.length ?? 0) > 1}
                showFullscreenButton={true}
                showPlayButton={false}
                slideDuration={300}
                thumbnailPosition="bottom"
                lazyLoad={true}
                onClick={() => tg?.HapticFeedback?.impactOccurred('light')}
              />
            </div>
          </div>

          {/* Информация о товаре */}
          <div className="col-lg-6">
            <h1 className="mb-3">{product.name}</h1>

            {/* Цена */}
            <div className="mb-4">
              {product.discount != null && product.discount > 0 ? (
                <div className="d-flex align-items-center gap-3">
                  <p className="fs-3 fw-bold text-danger mb-0">
                    {Math.round(product.price * (1 - product.discount / 100))} ₽
                  </p>
                  <p className="fs-5 text-muted text-decoration-line-through mb-0">
                    {product.price} ₽
                  </p>
                  <span className="badge bg-danger fs-6">-{product.discount}%</span>
                </div>
              ) : (
                <p className="fs-3 fw-bold text-danger mb-0">{product.price} ₽</p>
              )}
            </div>

            {/* Описание */}
            <div className="mb-4">
              <h5>Описание</h5>
              <p className="text-muted">{product.description}</p>
            </div>

            {/* Размеры */}
            <div className="mb-4">
              <h5>Размер</h5>
              <div className="d-flex gap-2 flex-wrap">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    className={`btn ${
                      selectedSize === size ? 'btn-danger' : 'btn-outline-danger'
                    }`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Состав */}
            <div className="mb-4">
              <h5>Состав</h5>
              <div className="card bg-light border-0">
                <div className="card-body">
                  {Object.entries(product.composition).map(([material, percentage]) => (
                    <div key={material} className="d-flex justify-content-between mb-2">
                      <span>{material}</span>
                      <strong>{percentage}%</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Доставка */}
            <div className="mb-4">
              <h5>Доставка и возврат</h5>
              <div className="alert alert-info mb-0">
                {DELIVERY_INFO}
              </div>
            </div>

            {/* Кнопка добавления в корзину */}
            <button
              className={`btn btn-lg w-100 add-to-cart-btn ${isAdded ? 'btn-added' : 'btn-danger'}`}
              onClick={handleAddToCart}
              disabled={!selectedSize || isAdded}
              style={{ transition: 'all 0.3s ease' }}
            >
              {isAdded ? 'Добавлено' : 'Добавить в корзину'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
