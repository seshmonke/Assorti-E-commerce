import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearCart } from '../store/cartSlice';
import {
  registerBrowserUser,
  searchCdekCities,
  fetchCdekPvz,
  calcCdekDelivery,
  createOrder,
  type CdekCity,
  type CdekPvz,
  type CdekDeliveryCalc,
} from '../services/api';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          user?: {
            id?: number;
            username?: string;
            first_name?: string;
            last_name?: string;
          };
        };
        CloudStorage?: {
          getItem: (key: string, cb: (err: unknown, val: string | null) => void) => void;
          setItem: (key: string, val: string, cb?: (err: unknown) => void) => void;
        };
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        };
        MainButton?: {
          setText: (text: string) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        showAlert: (msg: string, cb?: () => void) => void;
        expand: () => void;
      };
    };
  }
}

const tg = window.Telegram?.WebApp;

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Yup validation schema ──────────────────────────────────────────────────
const contactsSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required('Имя обязательно для заполнения')
    .min(2, 'Имя должно содержать минимум 2 символа'),
  phone: yup
    .string()
    .required('Телефон обязателен для заполнения')
    .matches(
      /^(\+7|8)\d{10}$/,
      'Введите телефон без пробелов и спец. символов в формате +71234567899 или 81234567899',
    ),
  email: yup
    .string()
    .email('Email должен быть в формате example@mail.com')
    .optional(),
  telegramHandle: yup.string().optional(),
});

type ContactsValues = yup.InferType<typeof contactsSchema>;

export default function CartPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const cartItems = useAppSelector((s) => s.cart.items);

  // ── CDEK ───────────────────────────────────────────────────────────────────
  const [cityQuery, setCityQuery] = useState('');
  const [cities, setCities] = useState<CdekCity[]>([]);
  const [selectedCity, setSelectedCity] = useState<CdekCity | null>(null);
  const [pvzList, setPvzList] = useState<CdekPvz[]>([]);
  const [selectedPvz, setSelectedPvz] = useState<CdekPvz | null>(null);
  const [deliveryCalc, setDeliveryCalc] = useState<CdekDeliveryCalc | null>(null);
  const [cdekLoading, setCdekLoading] = useState(false);
  const [cdekError, setCdekError] = useState('');

  // ── UI state ───────────────────────────────────────────────────────────────
  const [step, setStep] = useState<'cart' | 'contacts' | 'delivery'>('cart');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const debouncedCityQuery = useDebounce(cityQuery, 400);

  // ── Formik ─────────────────────────────────────────────────────────────────
  const formik = useFormik<ContactsValues>({
    initialValues: {
      name: '',
      phone: '',
      email: '',
      telegramHandle: '',
    },
    validationSchema: contactsSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: () => {
      // handled manually in handleSubmit
    },
  });

  // ── Telegram auto-fill ────────────────────────────────────────────────────
  useEffect(() => {
    tg?.expand?.();
    const user = tg?.initDataUnsafe?.user;
    const updates: Partial<ContactsValues> = {};

    if (user) {
      if (user.first_name) {
        updates.name = [user.first_name, user.last_name].filter(Boolean).join(' ');
      }
      if (user.username) {
        updates.telegramHandle = `@${user.username}`;
      }
    }

    // Load saved contacts from CloudStorage
    tg?.CloudStorage?.getItem('contacts', (_err, val) => {
      if (val) {
        try {
          const saved = JSON.parse(val) as {
            name?: string;
            phone?: string;
            email?: string;
            telegram?: string;
          };
          const merged: Partial<ContactsValues> = { ...updates };
          if (saved.name) merged.name = saved.name;
          if (saved.phone) merged.phone = saved.phone;
          if (saved.email) merged.email = saved.email;
          if (saved.telegram) merged.telegramHandle = saved.telegram;
          void formik.setValues((prev) => ({ ...prev, ...merged }));
        } catch {
          if (Object.keys(updates).length > 0) {
            void formik.setValues((prev) => ({ ...prev, ...updates }));
          }
        }
      } else if (Object.keys(updates).length > 0) {
        void formik.setValues((prev) => ({ ...prev, ...updates }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── City search ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (debouncedCityQuery.length < 2) {
      setCities([]);
      return;
    }
    setCdekLoading(true);
    setCdekError('');
    searchCdekCities(debouncedCityQuery)
      .then(setCities)
      .catch(() => setCdekError('Ошибка поиска городов'))
      .finally(() => setCdekLoading(false));
  }, [debouncedCityQuery]);

  // ── Load PVZ when city selected ───────────────────────────────────────────
  const handleSelectCity = useCallback(async (city: CdekCity) => {
    setSelectedCity(city);
    setCities([]);
    setCityQuery(city.full_name);
    setSelectedPvz(null);
    setDeliveryCalc(null);
    setCdekLoading(true);
    setCdekError('');
    try {
      const [pvz, calc] = await Promise.all([
        fetchCdekPvz(city.code),
        calcCdekDelivery(city.code),
      ]);
      setPvzList(pvz);
      setDeliveryCalc(calc.recommended ?? null);
    } catch {
      setCdekError('Ошибка загрузки ПВЗ или расчёта доставки');
    } finally {
      setCdekLoading(false);
    }
  }, []);

  // ── Cart totals ───────────────────────────────────────────────────────────
  const itemsTotal = cartItems.reduce((sum, item) => {
    const price = item.discount
      ? Math.round(item.price * (1 - item.discount / 100))
      : item.price;
    return sum + price * item.quantity;
  }, 0);

  const deliveryPrice = deliveryCalc?.delivery_sum ?? 0;
  const grandTotal = itemsTotal + (selectedPvz ? deliveryPrice : 0);

  // ── Validate contacts via formik ──────────────────────────────────────────
  async function validateAndProceed(): Promise<boolean> {
    const errors = await formik.validateForm();
    formik.setTouched({
      name: true,
      phone: true,
      email: true,
      telegramHandle: true,
    });
    return Object.keys(errors).length === 0;
  }

  // ── Submit order ──────────────────────────────────────────────────────────
  async function handleSubmit() {
    const valid = await validateAndProceed();
    if (!valid) return;
    if (!selectedPvz) {
      setError('Выберите пункт выдачи СДЭК');
      return;
    }
    if (cartItems.length === 0) {
      setError('Корзина пуста');
      return;
    }

    setSubmitting(true);
    setError('');
    tg?.MainButton?.showProgress();

    const { name, phone, email, telegramHandle } = formik.values;

    try {
      // 1. Зарегистрировать browserUser
      const telegramId = tg?.initDataUnsafe?.user?.id?.toString();
      const browserUser = await registerBrowserUser({
        telegramId,
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || undefined,
        telegram: telegramHandle?.trim() || undefined,
      });

      // Сохранить контакты в CloudStorage
      tg?.CloudStorage?.setItem('contacts', JSON.stringify({
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim(),
        telegram: telegramHandle?.trim(),
      }));

      // 2. Создать заказ
      const order = await createOrder({
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.discount
            ? Math.round(item.price * (1 - item.discount / 100))
            : item.price,
          name: item.name,
        })),
        totalPrice: itemsTotal,
        telegramUserId: telegramId,
        userId: browserUser.id,
        deliveryCity: selectedCity?.full_name,
        deliveryPvzCode: selectedPvz.code,
        deliveryPvzAddress: selectedPvz.location.address,
        deliveryPrice: deliveryPrice || undefined,
      });

      // 3. Очистить корзину
      dispatch(clearCart());

      tg?.HapticFeedback?.notificationOccurred('success');
      tg?.MainButton?.hideProgress();

      // 4. Перейти на страницу оплаты
      navigate(`/payment?orderId=${order.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка оформления заказа';
      setError(msg);
      tg?.HapticFeedback?.notificationOccurred('error');
      tg?.MainButton?.hideProgress();
    } finally {
      setSubmitting(false);
    }
  }

  // ── Telegram MainButton ───────────────────────────────────────────────────
  useEffect(() => {
    const btn = tg?.MainButton;
    if (!btn) return;

    if (step === 'cart' && cartItems.length > 0) {
      btn.setText('Оформить заказ');
      btn.show();
      btn.enable();
      const cb = () => setStep('contacts');
      btn.onClick(cb);
      return () => btn.offClick(cb);
    } else if (step === 'contacts') {
      btn.setText('Выбрать доставку →');
      btn.show();
      btn.enable();
      const cb = () => {
        void validateAndProceed().then((valid) => {
          if (valid) setStep('delivery');
        });
      };
      btn.onClick(cb);
      return () => btn.offClick(cb);
    } else if (step === 'delivery') {
      if (selectedPvz) {
        btn.setText(`Оплатить ${grandTotal.toLocaleString('ru-RU')} ₽`);
        btn.show();
        btn.enable();
        const cb = () => void handleSubmit();
        btn.onClick(cb);
        return () => btn.offClick(cb);
      } else {
        btn.setText('Выберите ПВЗ');
        btn.show();
        btn.disable();
      }
    } else {
      btn.hide();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, cartItems.length, selectedPvz, grandTotal]);

  // ── Empty cart ────────────────────────────────────────────────────────────
  if (cartItems.length === 0 && step === 'cart') {
    return (
      <div className="container py-5 text-center">
        <div className="display-1 mb-3">🛒</div>
        <h4 className="text-muted">Корзина пуста</h4>
        <button className="btn btn-primary mt-3" onClick={() => navigate('/')}>
          Перейти в каталог
        </button>
      </div>
    );
  }

  return (
    <div className="container py-3" style={{ maxWidth: 600, paddingBottom: 80 }}>
      {/* ── Step indicator ── */}
      <div className="d-flex gap-2 mb-4">
        {(['cart', 'contacts', 'delivery'] as const).map((s, i) => (
          <div
            key={s}
            className={`flex-fill text-center py-1 rounded small fw-semibold ${
              step === s
                ? 'bg-primary text-white'
                : i < ['cart', 'contacts', 'delivery'].indexOf(step)
                  ? 'bg-success text-white'
                  : 'bg-light text-muted'
            }`}
            style={{ cursor: i < ['cart', 'contacts', 'delivery'].indexOf(step) ? 'pointer' : 'default' }}
            onClick={() => {
              const steps = ['cart', 'contacts', 'delivery'] as const;
              if (i < steps.indexOf(step)) setStep(s);
            }}
          >
            {i + 1}. {s === 'cart' ? 'Корзина' : s === 'contacts' ? 'Контакты' : 'Доставка'}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Cart ── */}
      {step === 'cart' && (
        <>
          <h5 className="fw-bold mb-3">Ваш заказ</h5>
          {cartItems.map((item) => {
            const finalPrice = item.discount
              ? Math.round(item.price * (1 - item.discount / 100))
              : item.price;
            return (
              <div key={item.id} className="card mb-2 border-0 shadow-sm">
                <div className="card-body d-flex align-items-center gap-3 py-2">
                  {item.images?.[0] && (
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }}
                    />
                  )}
                  <div className="flex-fill">
                    <div className="fw-semibold">{item.name}</div>
                    <div className="text-muted small">
                      {item.quantity} × {finalPrice.toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                  <div className="fw-bold">
                    {(finalPrice * item.quantity).toLocaleString('ru-RU')} ₽
                  </div>
                </div>
              </div>
            );
          })}
          <div className="d-flex justify-content-between fw-bold fs-5 mt-3 px-1">
            <span>Итого:</span>
            <span>{itemsTotal.toLocaleString('ru-RU')} ₽</span>
          </div>
          {!tg?.MainButton && (
            <button
              className="btn btn-primary w-100 mt-3"
              onClick={() => setStep('contacts')}
            >
              Оформить заказ →
            </button>
          )}
        </>
      )}

      {/* ── STEP 2: Contacts ── */}
      {step === 'contacts' && (
        <>
          <h5 className="fw-bold mb-3">Контактные данные</h5>

          {/* Имя */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              Имя <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className={`form-control ${formik.touched.name && formik.errors.name ? 'is-invalid' : ''}`}
              placeholder="Иван Иванов"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.name && formik.errors.name && (
              <div className="invalid-feedback">{formik.errors.name}</div>
            )}
          </div>

          {/* Телефон */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              Телефон <span className="text-danger">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className={`form-control ${formik.touched.phone && formik.errors.phone ? 'is-invalid' : ''}`}
              placeholder="+71234567899"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.phone && formik.errors.phone && (
              <div className="invalid-feedback">{formik.errors.phone}</div>
            )}
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-control ${formik.touched.email && formik.errors.email ? 'is-invalid' : ''}`}
              placeholder="ivan@example.com"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.email && formik.errors.email && (
              <div className="invalid-feedback">{formik.errors.email}</div>
            )}
          </div>

          {/* Telegram */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Telegram для связи</label>
            <input
              type="text"
              id="telegramHandle"
              name="telegramHandle"
              className="form-control"
              placeholder="@username или ID"
              value={formik.values.telegramHandle}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <div className="form-text">Для уведомлений о заказе</div>
          </div>

          {!tg?.MainButton && (
            <button
              className="btn btn-primary w-100 mt-2"
              onClick={() => {
                void validateAndProceed().then((valid) => {
                  if (valid) setStep('delivery');
                });
              }}
            >
              Выбрать доставку →
            </button>
          )}
        </>
      )}

      {/* ── STEP 3: Delivery ── */}
      {step === 'delivery' && (
        <>
          <h5 className="fw-bold mb-3">Доставка СДЭК</h5>

          {/* City search */}
          <div className="mb-3 position-relative">
            <label className="form-label fw-semibold">Город получения</label>
            <input
              type="text"
              className="form-control"
              placeholder="Начните вводить город..."
              value={cityQuery}
              onChange={(e) => {
                setCityQuery(e.target.value);
                setSelectedCity(null);
                setSelectedPvz(null);
                setPvzList([]);
                setDeliveryCalc(null);
              }}
            />
            {cdekLoading && (
              <div className="position-absolute end-0 top-50 me-3" style={{ marginTop: 12 }}>
                <div className="spinner-border spinner-border-sm text-primary" />
              </div>
            )}
            {cities.length > 0 && (
              <ul className="list-group position-absolute w-100 shadow" style={{ zIndex: 1000, top: '100%' }}>
                {cities.map((c) => (
                  <li
                    key={c.code}
                    className="list-group-item list-group-item-action"
                    style={{ cursor: 'pointer' }}
                    onClick={() => void handleSelectCity(c)}
                  >
                    {c.full_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {cdekError && (
            <div className="alert alert-warning py-2 small">{cdekError}</div>
          )}

          {/* Delivery price */}
          {deliveryCalc && selectedCity && (
            <div className="alert alert-info py-2 small mb-3">
              📦 Доставка в <strong>{selectedCity.city}</strong>:{' '}
              <strong>{deliveryCalc.delivery_sum.toLocaleString('ru-RU')} ₽</strong>{' '}
              ({deliveryCalc.period_min}–{deliveryCalc.period_max} дн.)
            </div>
          )}

          {/* PVZ list */}
          {pvzList.length > 0 && (
            <>
              <label className="form-label fw-semibold">Пункт выдачи СДЭК</label>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {pvzList.map((pvz) => (
                  <div
                    key={pvz.code}
                    className={`card mb-2 border-2 ${selectedPvz?.code === pvz.code ? 'border-primary' : 'border-light'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedPvz(pvz);
                      tg?.HapticFeedback?.impactOccurred('light');
                    }}
                  >
                    <div className="card-body py-2 px-3">
                      <div className="fw-semibold small">{pvz.location.address}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        {pvz.work_time}
                        {pvz.phones?.[0] && ` · ${pvz.phones[0].number}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Order summary */}
          {selectedPvz && (
            <div className="card border-0 bg-light mt-3">
              <div className="card-body py-2">
                <div className="d-flex justify-content-between small">
                  <span>Товары:</span>
                  <span>{itemsTotal.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="d-flex justify-content-between small">
                  <span>Доставка:</span>
                  <span>{deliveryPrice.toLocaleString('ru-RU')} ₽</span>
                </div>
                <hr className="my-1" />
                <div className="d-flex justify-content-between fw-bold">
                  <span>Итого:</span>
                  <span>{grandTotal.toLocaleString('ru-RU')} ₽</span>
                </div>
              </div>
            </div>
          )}

          {error && <div className="alert alert-danger mt-3 py-2 small">{error}</div>}

          {!tg?.MainButton && (
            <button
              className="btn btn-success w-100 mt-3"
              disabled={!selectedPvz || submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting ? (
                <span className="spinner-border spinner-border-sm me-2" />
              ) : null}
              Оплатить {grandTotal.toLocaleString('ru-RU')} ₽
            </button>
          )}
        </>
      )}
    </div>
  );
}
