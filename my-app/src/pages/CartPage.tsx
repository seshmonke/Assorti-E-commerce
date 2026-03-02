import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearCart } from '../store/cartSlice';
import { createOrder } from '../services/api';

interface OrderForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export function CartPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, totalPrice } = useAppSelector((state) => state.cart);
  const { user } = useAppSelector((state) => state.auth);
  const [formData, setFormData] = useState<OrderForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Расчёт цены без скидки и общей суммы скидки
  const calculatePriceWithoutDiscount = (item: typeof items[0]): number => {
    if (!item.discount) return item.price;
    return Math.round(item.price / (1 - item.discount / 100));
  };

  const calculateItemDiscount = (item: typeof items[0]): number => {
    const priceWithoutDiscount = calculatePriceWithoutDiscount(item);
    return (priceWithoutDiscount - item.price) * item.quantity;
  };

  const totalDiscount = items.reduce((sum, item) => sum + calculateItemDiscount(item), 0);
  const totalPriceWithoutDiscount = items.reduce((sum, item) => sum + calculatePriceWithoutDiscount(item) * item.quantity, 0);

  if (items.length === 0 && !orderPlaced) {
    return (
      <main className="flex-grow-1 py-4">
        <div className="container">
          <div className="alert alert-info" role="alert">
            <h4 className="alert-heading">Корзина пуста</h4>
            <p>
              Пожалуйста, добавьте товары в корзину перед оформлением заказа.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/')}
            >
              Вернуться к товарам
            </button>
          </div>
        </div>
      </main>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const orderItems = items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
      }));

      const order = await createOrder({
        items: orderItems,
        totalPrice,
        telegramUserId: user?.telegramId,
        paymentMethod: 'card',
      });

      setOrderId(order.id);
      setOrderPlaced(true);
      dispatch(clearCart());
    } catch (error: any) {
      const message =
        error?.response?.data?.error ??
        error?.message ??
        'Ошибка при оформлении заказа. Попробуйте ещё раз.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <main className="flex-grow-1 py-4">
        <div className="container">
          <div className="alert alert-success" role="alert">
            <h4 className="alert-heading">✓ Заказ успешно оформлен!</h4>
            <p>
              Спасибо за ваш заказ. Мы свяжемся с вами для подтверждения.
            </p>
            <hr />
            <p className="mb-0">
              Номер заказа: <strong>#{orderId?.slice(0, 8).toUpperCase()}</strong>
            </p>
          </div>

          <div className="mt-4">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/')}
            >
              Продолжить покупки
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow-1 py-4">
      <div className="container">
        <h1 className="mb-4">Оформление заказа</h1>

        {submitError && (
          <div className="alert alert-danger" role="alert">
            {submitError}
          </div>
        )}

        <div className="row">
          {/* Форма */}
          <div className="col-lg-8">
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-danger text-light">
                <h5 className="mb-0">Данные доставки</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="firstName" className="form-label">
                        Имя *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="lastName" className="form-label">
                        Фамилия *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="email" className="form-label">
                        Email *
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="phone" className="form-label">
                        Телефон *
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="address" className="form-label">
                      Адрес *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="city" className="form-label">
                        Город *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="postalCode" className="form-label">
                        Почтовый индекс *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-danger"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Обработка...' : 'Оформить заказ'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => navigate('/')}
                      disabled={isSubmitting}
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Сводка заказа */}
          <div className="col-lg-4">
            <div className="card shadow-sm sticky-top" style={{ top: '20px' }}>
              <div className="card-header bg-danger text-light">
                <h5 className="mb-0">Сводка заказа</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <h6 className="mb-2">Товары:</h6>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {items.map((item) => {
                      const priceWithoutDiscount = calculatePriceWithoutDiscount(item);
                      return (
                        <div
                          key={`${item.id}-${item.size}`}
                          className="d-flex justify-content-between mb-2 pb-2 border-bottom"
                        >
                          <div>
                            <p className="mb-0 small">{item.name}</p>
                            <p className="mb-0 text-muted small">
                              Размер: {item.size}
                            </p>
                            <p className="mb-0 text-muted small">
                              {item.quantity} × {item.price} ₽
                            </p>
                            {item.discount && (
                              <p className="mb-0 text-muted small text-decoration-line-through">
                                без скидки: {priceWithoutDiscount} ₽
                              </p>
                            )}
                          </div>
                          <p className="mb-0 fw-bold">
                            {item.price * item.quantity} ₽
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-top pt-3">
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
                  <div className="d-flex justify-content-between mb-2">
                    <span>Доставка:</span>
                    <span>Бесплатно</span>
                  </div>
                  <div className="d-flex justify-content-between fw-bold fs-5 text-danger border-top pt-2">
                    <span>Итого к оплате:</span>
                    <span>{totalPrice} ₽</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
