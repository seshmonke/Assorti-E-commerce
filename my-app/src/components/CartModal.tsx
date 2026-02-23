import { useAppDispatch, useAppSelector } from '../store/hooks';
import { removeFromCart, updateQuantity } from '../store/cartSlice';
import { Link } from 'react-router-dom';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartModal({ isOpen, onClose }: CartModalProps) {
  const dispatch = useAppDispatch();
  const { items, totalPrice } = useAppSelector((state) => state.cart);

  const handleRemove = (id: string, size: string) => {
    dispatch(removeFromCart({ id, size }));
  };

  const handleQuantityChange = (id: string, quantity: number, size: string) => {
    dispatch(updateQuantity({ id, quantity, size }));
  };

  // price — оригинальная цена из БД, итоговая = price * (1 - discount/100)
  const calculateFinalPrice = (item: typeof items[0]): number => {
    if (!item.discount) return item.price;
    return Math.round(item.price * (1 - item.discount / 100));
  };

  const calculateItemDiscount = (item: typeof items[0]): number => {
    if (!item.discount) return 0;
    return (item.price - calculateFinalPrice(item)) * item.quantity;
  };

  const totalDiscount = items.reduce((sum, item) => sum + calculateItemDiscount(item), 0);
  const totalPriceWithoutDiscount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div
      className={`modal fade ${isOpen ? 'show' : ''}`}
      style={{ display: isOpen ? 'block' : 'none' }}
      tabIndex={-1}
      role="dialog"
      aria-labelledby="cartModalLabel"
      aria-hidden={!isOpen}
    >
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header bg-danger text-light">
            <h5 className="modal-title" id="cartModalLabel">
              Корзина
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          <div className="modal-body">
            {items.length === 0 ? (
              <p className="text-center text-muted py-4">Корзина пуста</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover table-sm">
                  <thead>
                    <tr>
                      <th>Товар</th>
                      <th>Размер</th>
                      <th>Цена</th>
                      {items.some(item => item.discount) && <th>Без скидки</th>}
                      <th>Кол-во</th>
                      <th>Сумма</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const finalPrice = calculateFinalPrice(item);
                      return (
                        <tr key={`${item.id}-${item.size}`}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <img
                                src={item.image}
                                alt={item.name}
                                style={{
                                  width: '50px',
                                  height: '50px',
                                  objectFit: 'cover',
                                  borderRadius: '4px'
                                }}
                              />
                              <span>{item.name}</span>
                            </div>
                          </td>
                          <td>{item.size}</td>
                          <td>
                            <div>
                              <span className="fw-bold text-danger">{finalPrice} ₽</span>
                              {item.discount && (
                                <div className="small text-success">-{item.discount}%</div>
                              )}
                            </div>
                          </td>
                          {items.some(i => i.discount) && (
                            <td>
                              {item.discount ? (
                                <span className="text-muted text-decoration-line-through">
                                  {item.price} ₽
                                </span>
                              ) : (
                                <span>{item.price} ₽</span>
                              )}
                            </td>
                          )}
                          <td>
                            <div className="d-flex align-items-center gap-1">
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() =>
                                  handleQuantityChange(item.id, item.quantity - 1, item.size)
                                }
                              >
                                −
                              </button>
                              <span style={{ minWidth: '25px', textAlign: 'center' }}>
                                {item.quantity}
                              </span>
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() =>
                                  handleQuantityChange(item.id, item.quantity + 1, item.size)
                                }
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="fw-bold">
                            {finalPrice * item.quantity} ₽
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleRemove(item.id, item.size)}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="modal-footer bg-light border-top">
            <div className="w-100">
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Сумма без скидки:</span>
                  <span>{totalPriceWithoutDiscount} ₽</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="d-flex justify-content-between mb-2 text-success fw-bold">
                    <span>Ваша экономия:</span>
                    <span>-{Math.round(totalDiscount)} ₽</span>
                  </div>
                )}
                <div className="d-flex justify-content-between border-top pt-2">
                  <span className="text-muted">Итого к оплате:</span>
                  <h5 className="mb-0 text-danger fw-bold">{totalPrice} ₽</h5>
                </div>
              </div>
              <div className="d-flex gap-2 justify-content-end">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Продолжить покупки
                </button>
                {items.length > 0 && (
                  <Link
                    to="/checkout"
                    className="btn btn-danger"
                    onClick={onClose}
                  >
                    Оформить заказ
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
