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
    confirmationUrl: string;
    confirmationToken: string | undefined;
    status: string;
}

export class PaymentService {
    /**
     * Получить credentials ЮKassa из env.
     * Читаем в момент вызова (не в конструкторе), чтобы dotenv успел загрузиться.
     */
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
     * Создать платёж в ЮKassa
     * @param orderId - ID заказа в нашей системе
     * @param amount - сумма в копейках (целое число)
     * @param description - описание платежа
     * @param returnUrl - URL для возврата после оплаты
     */
    async createPayment(
        orderId: string,
        amount: number,
        description: string,
        returnUrl?: string,
    ): Promise<CreatePaymentResult> {
        const { shopId, secretKey } = this.getCredentials();
        const idempotenceKey = randomUUID();

        // Конвертируем копейки в рубли с двумя знаками после запятой
        const amountInRubles = (amount / 100).toFixed(2);

        const redirectUrl = returnUrl ?? process.env.YOOKASSA_RETURN_URL ?? 'https://t.me/';

        const payload = {
            amount: {
                value: amountInRubles,
                currency: 'RUB',
            },
            confirmation: {
                type: 'redirect',
                return_url: redirectUrl,
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
            confirmationToken: payment.confirmation.confirmation_token,
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

    /**
     * Подтвердить платёж (capture)
     */
    async capturePayment(paymentId: string, amount: number): Promise<YookassaPaymentResponse> {
        const { shopId, secretKey } = this.getCredentials();
        const idempotenceKey = randomUUID();
        const amountInRubles = (amount / 100).toFixed(2);

        const response = await axios.post<YookassaPaymentResponse>(
            `${YOOKASSA_API_URL}/payments/${paymentId}/capture`,
            {
                amount: {
                    value: amountInRubles,
                    currency: 'RUB',
                },
            },
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
        return response.data;
    }
}

export const paymentService = new PaymentService();
