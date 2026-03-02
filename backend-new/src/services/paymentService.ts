import axios from 'axios';
import { randomUUID } from 'crypto';

const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3';

interface YookassaPaymentResponse {
    id: string;
    status: string;
    confirmation: {
        type: string;
        confirmation_url?: string;
        confirmation_token?: string;
    };
    amount: {
        value: string;
        currency: string;
    };
    description: string;
    paid: boolean;
}

export interface CreatePaymentResult {
    paymentId: string;
    /** URL для генерации QR-кода (СБП / ЮMoney) */
    confirmationUrl: string;
    /** Токен для виджета ЮKassa (embedded) */
    confirmationToken: string;
    status: string;
}

export class PaymentService {
    private getCredentials(): { shopId: string; secretKey: string } {
        const shopId = process.env.YOOKASSA_SHOP_ID;
        const secretKey = process.env.YOOKASSA_SECRET_KEY;

        if (!shopId || !secretKey) {
            throw new Error(
                'YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY не настроены. ' +
                'Добавьте их в backend-new/.env и перезапустите сервер.',
            );
        }

        return { shopId, secretKey };
    }

    /**
     * Создать платёж в ЮKassa с виджетом (confirmation type = "embedded")
     * Возвращает confirmation_token для инициализации виджета на фронтенде.
     * @param orderId - ID заказа
     * @param amount - сумма в копейках
     * @param description - описание
     */
    async createPayment(
        orderId: string,
        amount: number,
        description: string,
    ): Promise<CreatePaymentResult> {
        const { shopId, secretKey } = this.getCredentials();
        const idempotenceKey = randomUUID();

        // Конвертируем копейки в рубли
        const amountInRubles = (amount / 100).toFixed(2);

        const payload = {
            amount: {
                value: amountInRubles,
                currency: 'RUB',
            },
            confirmation: {
                type: 'embedded',
            },
            capture: true,
            description,
            metadata: {
                orderId,
            },
        };

        const response = await axios.post<YookassaPaymentResponse>(
            `${YOOKASSA_API_URL}/payments`,
            payload,
            {
                auth: {
                    username: shopId,
                    password: secretKey,
                },
                headers: {
                    'Idempotence-Key': idempotenceKey,
                    'Content-Type': 'application/json',
                },
            },
        );

        const payment = response.data;

        return {
            paymentId: payment.id,
            confirmationUrl: payment.confirmation.confirmation_url ?? '',
            confirmationToken: payment.confirmation.confirmation_token ?? '',
            status: payment.status,
        };
    }

    /**
     * Получить информацию о платеже
     */
    async getPayment(paymentId: string): Promise<YookassaPaymentResponse> {
        const { shopId, secretKey } = this.getCredentials();
        const response = await axios.get<YookassaPaymentResponse>(
            `${YOOKASSA_API_URL}/payments/${paymentId}`,
            {
                auth: {
                    username: shopId,
                    password: secretKey,
                },
            },
        );
        return response.data;
    }
}

export const paymentService = new PaymentService();
