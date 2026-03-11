import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { fetchMyOrders, type Order } from '../services/api';

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthorized = useAppSelector((state) => state.auth.isAuthorized);
  const isInitialized = useAppSelector((state) => state.auth.isInitialized);
  const authError = useAppSelector((state) => state.auth.error);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toastRef = useRef<HTMLDivElement>(null);

  // Логируем изменения состояния авторизации
  console.log('[ProfilePage] render — состояние авторизации:', {
    isInitialized,
    isAuthorized,
    user,
    authError,
  });

  useEffect(() => {
    console.log('[ProfilePage] useEffect сработал:', { isInitialized, isAuthorized });

    // Если авторизация ещё в процессе, ничего не делаем
    if (!isInitialized) {
      console.log('[ProfilePage] isInitialized=false — ждём завершения авторизации...');
      return;
    }

    // Если авторизация завершена и пользователь авторизован, загружаем заказы
    if (isAuthorized) {
      console.log('[ProfilePage] ✅ Пользователь авторизован, загружаем заказы...', { user });
      const loadOrders = async () => {
        try {
          setIsLoading(true);
          setError(null);
          console.log('[ProfilePage] Запрос заказов GET /api/orders/my...');
          const data = await fetchMyOrders();
          console.log('[ProfilePage] Заказы получены:', data);
          setOrders(data);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to load orders';
          console.error('[ProfilePage] Ошибка загрузки заказов:', err);
          setError(message);
        } finally {
          setIsLoading(false);
        }
      };

      loadOrders();
    } else {
      // Авторизация не удалась, показываем тост
      console.warn('[ProfilePage] ❌ Пользователь не авторизован. authError:', authError);
      setIsLoading(false);
      if (toastRef.current) {
        console.log('[ProfilePage] Показываем тост об ошибке авторизации');
        const toastElement = new (window as any).bootstrap.Toast(toastRef.current);
        toastElement.show();
      } else {
        console.warn('[ProfilePage] toastRef.current не найден, тост не показан');
      }
    }
  }, [isAuthorized, isInitialized]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return { emoji: '🟡', text: 'Ожидает оплаты', color: 'warning' };
      case 'paid':
        return { emoji: '🔵', text: 'Оплачен', color: 'info' };
      case 'delivered':
        return { emoji: '🟢', text: 'Доставлен', color: 'success' };
      case 'cancelled':
        return { emoji: '🔴', text: 'Отменён', color: 'danger' };
      default:
        return { emoji: '⚪', text: status, color: 'secondary' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Показываем спиннер пока авторизация в процессе
  if (!isInitialized) {
    return (
      <main className="flex-grow-1 py-4">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-danger" role="status">
              <span className="visually-hidden">Загрузка...</span>
            </div>
            <p className="mt-3 text-muted">Проверка авторизации...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow-1 py-4">
      {/* Toast для ошибки авторизации */}
      {!isAuthorized && (
        <div className="toast-container position-fixed top-0 end-0 p-3">
          <div
            ref={toastRef}
            className="toast"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div className="toast-header bg-danger text-white">
              <strong className="me-auto">⚠️ Ошибка авторизации</strong>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="toast"
                aria-label="Close"
              ></button>
            </div>
            <div className="toast-body">
              Не удалось авторизоваться через Telegram. Откройте приложение через Telegram Mini App.
              {authError && <p className="mt-2 mb-0 small text-muted">{authError}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="container">
        <div className="row mb-4">
          <div className="col-lg-8">
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-danger text-light">
                <h5 className="mb-0">👤 Профиль пользователя</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted">Имя</label>
                    <p className="fs-5 fw-bold">
                      {user?.firstName || 'Не указано'}
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted">Фамилия</label>
                    <p className="fs-5 fw-bold">
                      {user?.lastName || 'Не указано'}
                    </p>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label text-muted">Username</label>
                  <p className="fs-5 fw-bold">
                    {user?.username ? `@${user.username}` : 'Не указано'}
                  </p>
                </div>
                <div className="mb-3">
                  <label className="form-label text-muted">Telegram ID</label>
                  <p className="fs-5 fw-bold font-monospace">
                    {user?.telegramId || 'Не указано'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header bg-danger text-light">
                <h5 className="mb-0">📦 Мои заказы</h5>
              </div>
              <div className="card-body">
                {isLoading && (
                  <div className="text-center py-5">
                    <div className="spinner-border text-danger" role="status">
                      <span className="visually-hidden">Загрузка...</span>
                    </div>
                    <p className="mt-3 text-muted">Загрузка заказов...</p>
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">Ошибка</h4>
                    <p>{error}</p>
                  </div>
                )}

                {!isLoading && !error && orders.length === 0 && (
                  <div className="alert alert-info" role="alert">
                    <h4 className="alert-heading">Нет заказов</h4>
                    <p>У вас пока нет заказов. Начните покупки!</p>
                    <button
                      className="btn btn-primary mt-2"
                      onClick={() => navigate('/')}
                    >
                      Перейти к товарам
                    </button>
                  </div>
                )}

                {!isLoading && !error && orders.length > 0 && (
                  <div>
                    {orders.map((order) => {
                      const statusBadge = getStatusBadge(order.status);
                      return (
                        <div key={order.id} className="card mb-3 shadow-sm">
                          <div className="card-header d-flex justify-content-between align-items-center">
                            <span className="text-muted small">
                              Заказ #{order.id.slice(0, 8)}… · {formatDate(order.createdAt)}
                            </span>
                            <span
                              className={`badge bg-${statusBadge.color}`}
                              style={{ fontSize: '0.85rem' }}
                            >
                              {statusBadge.emoji} {statusBadge.text}
                            </span>
                          </div>
                          <div className="card-body p-0">
                            <div className="table-responsive">
                              <table className="table table-hover mb-0">
                                <thead className="table-light">
                                  <tr>
                                    <th>Фото</th>
                                    <th>Товар</th>
                                    <th>Кол-во</th>
                                    <th>Цена</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.items.map((item) => (
                                    <tr key={item.id}>
                                      <td>
                                        {item.product?.images?.[0] && (
                                          <img
                                            src={item.product.images[0]}
                                            alt={item.product.name}
                                            style={{
                                              width: '50px',
                                              height: '50px',
                                              objectFit: 'cover',
                                              borderRadius: '4px',
                                            }}
                                          />
                                        )}
                                      </td>
                                      <td>
                                        <strong>{item.name || item.product?.name || 'Товар'}</strong>
                                      </td>
                                      <td>{item.quantity}</td>
                                      <td className="fw-bold text-danger">
                                        {item.price} ₽
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          <div className="card-footer text-end fw-bold text-danger">
                            Итого: {order.totalPrice} ₽
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/')}
          >
            ← Вернуться к товарам
          </button>
        </div>
      </div>
    </main>
  );
}
