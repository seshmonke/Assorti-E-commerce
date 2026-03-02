import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchOrderById } from '../services/api';
import type { Order } from '../services/api';

const tg = window.Telegram?.WebApp;

const STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  pending_payment: { label: 'Ожидает оплаты', color: 'warning', icon: '⏳' },
  paid: { label: 'Оплачен', color: 'success', icon: '✅' },
  delivered: { label: 'Доставлен', color: 'info', icon: '📦' },
  cancelled: { label: 'Отменён', color: 'danger', icon: '❌' },
};

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('ID заказа не указан');
      setLoading(false);
      return;
    }
    tg?.expand?.();

    fetchOrderById(id)
      .then(setOrder)
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Ошибка загрузки заказа';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ── Telegram MainButton ────────────────────────────────────────────────────
  useEffect(() => {
    const btn = tg?.MainButton;
    if (!btn || !order) return;

    if (order.status === 'pending_payment') {
      btn.setText('Оплатить заказ');
      btn.show();
      btn.enable();
      const cb = () => navigate(`/payment?orderId=${order.id}`);
      btn.onClick(cb);
      return () => btn.offClick(cb);
    } else {
      btn.hide();
    }
  }, [order, navigate]);

  // ── Share track ────────────────────────────────────────────────────────────
  function shareTrack() {
    if (!order?.trackNumber) return;
    const trackUrl = `https://track.cdek.ru/?orderId=${order.trackNumber}`;
    const text = `Отслеживай мой заказ СДЭК: ${trackUrl}`;

    if (navigator.share) {
      void navigator.share({ text, url: trackUrl });
    } else {
      // Telegram share fallback
      const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(trackUrl)}&text=${encodeURIComponent('Отслеживай мой заказ СДЭК')}`;
      window.open(tgShareUrl, '_blank');
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container py-4" style={{ maxWidth: 500 }}>
        <div className="alert alert-danger">{error || 'Заказ не найден'}</div>
        <button className="btn btn-outline-secondary" onClick={() => navigate('/')}>
          ← На главную
        </button>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[order.status] ?? {
    label: order.status,
    color: 'secondary',
    icon: '❓',
  };

  const totalWithDelivery = order.totalPrice + (order.deliveryPrice ?? 0);

  return (
    <div className="container py-3" style={{ maxWidth: 560, paddingBottom: 80 }}>
      {/* Header */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => navigate('/')}
        >
          ←
        </button>
        <h5 className="mb-0 fw-bold">Заказ #{order.id.slice(0, 8).toUpperCase()}</h5>
      </div>

      {/* Status badge */}
      <div className={`alert alert-${statusInfo.color} py-2 d-flex align-items-center gap-2 mb-3`}>
        <span style={{ fontSize: 20 }}>{statusInfo.icon}</span>
        <div>
          <div className="fw-bold">{statusInfo.label}</div>
          <div className="small text-muted">
            {new Date(order.createdAt).toLocaleString('ru-RU')}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-header bg-white fw-semibold py-2">
          🛍 Товары
        </div>
        <div className="card-body py-2">
          {order.items.map((item) => (
            <div key={item.id} className="d-flex align-items-center gap-3 py-2 border-bottom">
                          {item.product?.images?.[0] && (
                            <img
                              src={item.product.images[0]}
                              alt={item.name}
                              style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }}
                            />
                          )}
              <div className="flex-fill">
                <div className="fw-semibold small">{item.name}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  {item.quantity} × {item.price.toLocaleString('ru-RU')} ₽
                </div>
              </div>
              <div className="fw-bold small">
                {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
              </div>
            </div>
          ))}
          {order.deliveryPrice != null && order.deliveryPrice > 0 && (
            <div className="d-flex justify-content-between small text-muted pt-2">
              <span>Доставка СДЭК</span>
              <span>{order.deliveryPrice.toLocaleString('ru-RU')} ₽</span>
            </div>
          )}
          <div className="d-flex justify-content-between fw-bold pt-2">
            <span>Итого:</span>
            <span>{totalWithDelivery.toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>
      </div>

      {/* Delivery info */}
      {(order.deliveryCity || order.deliveryPvzAddress) && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-header bg-white fw-semibold py-2">
            📦 Доставка
          </div>
          <div className="card-body py-2">
            {order.deliveryCity && (
              <div className="small mb-1">
                <span className="text-muted">Город:</span>{' '}
                <span className="fw-semibold">{order.deliveryCity}</span>
              </div>
            )}
            {order.deliveryPvzAddress && (
              <div className="small mb-1">
                <span className="text-muted">ПВЗ:</span>{' '}
                <span className="fw-semibold">{order.deliveryPvzAddress}</span>
              </div>
            )}
            {order.deliveryPvzCode && (
              <div className="small text-muted">
                Код ПВЗ: {order.deliveryPvzCode}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact info */}
      {order.user && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-header bg-white fw-semibold py-2">
            👤 Получатель
          </div>
          <div className="card-body py-2">
            <div className="small mb-1">
              <span className="text-muted">Имя:</span>{' '}
              <span className="fw-semibold">{order.user.name}</span>
            </div>
            <div className="small mb-1">
              <span className="text-muted">Телефон:</span>{' '}
              <span className="fw-semibold">{order.user.phone}</span>
            </div>
            {order.user.email && (
              <div className="small mb-1">
                <span className="text-muted">Email:</span>{' '}
                <span>{order.user.email}</span>
              </div>
            )}
            {order.user.telegram && (
              <div className="small">
                <span className="text-muted">Telegram:</span>{' '}
                <span>{order.user.telegram}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Track number */}
      {order.trackNumber && (
        <div className="card border-0 shadow-sm mb-3 border-success">
          <div className="card-header bg-white fw-semibold py-2 text-success">
            🚚 Трек-номер СДЭК
          </div>
          <div className="card-body py-2">
            <div className="d-flex align-items-center gap-2 mb-2">
              <code className="fs-6 fw-bold">{order.trackNumber}</code>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  void navigator.clipboard.writeText(order.trackNumber!);
                  tg?.HapticFeedback?.impactOccurred('light');
                }}
              >
                📋
              </button>
            </div>
            <a
              href={`https://track.cdek.ru/?orderId=${order.trackNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-primary me-2"
            >
              Отследить на СДЭК
            </a>
            <button
              className="btn btn-sm btn-outline-success"
              onClick={shareTrack}
            >
              Поделиться треком
            </button>
          </div>
        </div>
      )}

      {/* Pay button (if pending) */}
      {order.status === 'pending_payment' && !tg?.MainButton && (
        <button
          className="btn btn-primary w-100 mt-2"
          onClick={() => navigate(`/payment?orderId=${order.id}`)}
        >
          Оплатить {totalWithDelivery.toLocaleString('ru-RU')} ₽
        </button>
      )}

      {/* Back to catalog */}
      {order.status === 'paid' && (
        <button
          className="btn btn-outline-primary w-100 mt-2"
          onClick={() => navigate('/')}
        >
          Вернуться в каталог
        </button>
      )}
    </div>
  );
}
