import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchOrderById, createPayment, checkPaymentStatus } from '../services/api';
import type { Order } from '../services/api';

// ЮKassa виджет типы
declare global {
  interface Window {
    YooMoneyCheckoutWidget?: new (config: {
      confirmation_token: string;
      return_url: string;
      customization?: {
        colors?: {
          controlPrimary?: string;
          background?: { lightBlue?: string };
        };
      };
      error_callback?: (error: { localizedMessage: string }) => void;
    }) => {
      render: (containerId: string) => void;
      destroy: () => void;
    };
  }
}

const tg = window.Telegram?.WebApp;

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentToken, setPaymentToken] = useState('');
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [polling, setPolling] = useState(false);
  const widgetRef = useRef<{ destroy: () => void } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load order ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) {
      setError('orderId не указан');
      setLoading(false);
      return;
    }
    tg?.expand?.();

    fetchOrderById(orderId)
      .then(async (o) => {
        setOrder(o);
        if (o.status === 'paid') {
          navigate(`/order/${o.id}`, { replace: true });
          return;
        }
        // Создаём платёж и получаем confirmation_token
        const payment = await createPayment(o.id);
        setPaymentToken(payment.confirmationToken);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Ошибка загрузки заказа';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [orderId, navigate]);

  // ── Load YooKassa widget script ────────────────────────────────────────────
  useEffect(() => {
    if (!paymentToken) return;

    const scriptId = 'yookassa-widget-script';
    if (document.getElementById(scriptId)) {
      setWidgetLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://yookassa.ru/checkout-widget/v1/checkout-widget.js';
    script.async = true;
    script.onload = () => setWidgetLoaded(true);
    script.onerror = () => setError('Не удалось загрузить виджет оплаты');
    document.head.appendChild(script);
  }, [paymentToken]);

  // ── Init widget ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!widgetLoaded || !paymentToken || !window.YooMoneyCheckoutWidget) return;

    // Destroy previous instance
    widgetRef.current?.destroy();

    const returnUrl = `${window.location.origin}/order/${orderId}`;

    const widget = new window.YooMoneyCheckoutWidget({
      confirmation_token: paymentToken,
      return_url: returnUrl,
      customization: {
        colors: {
          controlPrimary: '#0d6efd',
        },
      },
      error_callback: (err) => {
        setError(`Ошибка виджета: ${err.localizedMessage}`);
      },
    });

    widget.render('yookassa-widget-container');
    widgetRef.current = widget;

    // Start polling for payment status
    setPolling(true);

    return () => {
      widget.destroy();
    };
  }, [widgetLoaded, paymentToken, orderId]);

  // ── Poll payment status ────────────────────────────────────────────────────
  useEffect(() => {
    if (!polling || !orderId) return;

    pollRef.current = setInterval(async () => {
      try {
        const result = await checkPaymentStatus(orderId);
        if (result.orderStatus === 'paid') {
          clearInterval(pollRef.current!);
          setPolling(false);
          tg?.HapticFeedback?.notificationOccurred('success');
          navigate(`/order/${orderId}`, { replace: true });
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [polling, orderId, navigate]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      widgetRef.current?.destroy();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ── Telegram MainButton ────────────────────────────────────────────────────
  useEffect(() => {
    tg?.MainButton?.hide();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" />
          <div className="text-muted">Подготовка оплаты...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4" style={{ maxWidth: 500 }}>
        <div className="alert alert-danger">
          <strong>Ошибка:</strong> {error}
        </div>
        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
          ← Назад
        </button>
      </div>
    );
  }

  const totalWithDelivery = order
    ? order.totalPrice + (order.deliveryPrice ?? 0)
    : 0;

  return (
    <div className="container py-3" style={{ maxWidth: 560, paddingBottom: 40 }}>
      {/* Header */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          ←
        </button>
        <h5 className="mb-0 fw-bold">Оплата заказа</h5>
      </div>

      {/* Order summary */}
      {order && (
        <div className="card border-0 bg-light mb-3">
          <div className="card-body py-2 px-3">
            <div className="small text-muted mb-1">
              Заказ #{order.id.slice(0, 8).toUpperCase()}
            </div>
            {order.items.map((item) => (
              <div key={item.id} className="d-flex justify-content-between small">
                <span>{item.name} × {item.quantity}</span>
                <span>{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
              </div>
            ))}
            {order.deliveryPrice != null && order.deliveryPrice > 0 && (
              <div className="d-flex justify-content-between small text-muted">
                <span>Доставка СДЭК</span>
                <span>{order.deliveryPrice.toLocaleString('ru-RU')} ₽</span>
              </div>
            )}
            <hr className="my-1" />
            <div className="d-flex justify-content-between fw-bold">
              <span>К оплате:</span>
              <span className="text-primary">{totalWithDelivery.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>
        </div>
      )}

      {/* YooKassa widget container */}
      {paymentToken && (
        <div id="yookassa-widget-container" className="mb-3" />
      )}

      {/* Loading widget */}
      {paymentToken && !widgetLoaded && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary mb-2" />
          <div className="text-muted small">Загрузка виджета оплаты...</div>
        </div>
      )}

      {/* Polling indicator */}
      {polling && (
        <div className="text-center text-muted small mt-2">
          <span className="spinner-border spinner-border-sm me-1" />
          Ожидаем подтверждение оплаты...
        </div>
      )}

      {/* Test mode notice */}
      <div className="alert alert-warning py-2 small mt-3">
        🧪 <strong>Тестовый режим.</strong> Используйте карту{' '}
        <code>5555 5555 5555 4444</code>, любой срок и CVV.
      </div>
    </div>
  );
}
