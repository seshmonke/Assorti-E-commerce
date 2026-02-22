import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadAllProducts, loadProductsByCategoryId, loadSaleProducts } from '../store/productsSlice';

interface ProductListProps {
  categoryId?: string;
}

export function ProductList({ categoryId }: ProductListProps) {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.products);

  useEffect(() => {
    if (!categoryId || categoryId === 'all') {
      dispatch(loadAllProducts());
    } else if (categoryId === 'sale') {
      dispatch(loadSaleProducts());
    } else {
      dispatch(loadProductsByCategoryId(categoryId));
    }
  }, [categoryId, dispatch]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        Ошибка загрузки товаров: {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="alert alert-info" role="alert">
        Товары не найдены
      </div>
    );
  }

  return (
    <div className="row g-3">
      {items.map((product) => (
        <div key={product.id} className="col-6 col-lg-3">
          <div className="card h-100 position-relative">
            {product.discount != null && product.discount > 0 && (
              <div
                className="position-absolute top-0 end-0 bg-danger text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: '50px',
                  height: '50px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  zIndex: 10,
                  margin: '8px',
                }}
              >
                -{product.discount}%
              </div>
            )}
            <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <img
                src={product.image}
                className="card-img-top"
                alt={product.name}
                style={{ objectFit: 'cover', height: '250px', cursor: 'pointer' }}
              />
            </Link>
            <div className="card-body d-flex flex-column">
              <h5 className="card-title fs-6">{product.name}</h5>
              <div className="mt-auto">
                {product.discount != null && product.discount > 0 ? (
                  <div>
                    <p className="fw-bold fs-5 mb-1 text-danger">{product.price} ₽</p>
                    <p className="text-muted text-decoration-line-through small mb-0">
                      {Math.round(product.price / (1 - product.discount / 100))} ₽
                    </p>
                  </div>
                ) : (
                  <p className="fw-bold fs-5 mb-2 text-danger">{product.price} ₽</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
