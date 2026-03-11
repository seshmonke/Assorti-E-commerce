import axios from 'axios';

// СДЭК API v2 — тестовые ключи (sandbox)
const CDEK_API_URL = 'https://api.edu.cdek.ru/v2';
const CDEK_CLIENT_ID = process.env.CDEK_CLIENT_ID || 'EMscd6r9JnFiQ3bLoyjJY6eM78JrJceI';
const CDEK_CLIENT_SECRET = process.env.CDEK_CLIENT_SECRET || 'PjLZkKBHEiLK3YsjtNrt3TGNG0ahs3dR';

// Москва — город отправки (код СДЭК)
const FROM_CITY_CODE = 44; // Москва

interface CdekToken {
    access_token: string;
    expires_at: number; // timestamp
}

let cachedToken: CdekToken | null = null;

/**
 * Получить OAuth2 токен СДЭК (с кешированием)
 */
async function getToken(): Promise<string> {
    const now = Date.now();

    if (cachedToken && cachedToken.expires_at > now + 60_000) {
        return cachedToken.access_token;
    }

    const response = await axios.post(
        `${CDEK_API_URL}/oauth/token`,
        new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: CDEK_CLIENT_ID,
            client_secret: CDEK_CLIENT_SECRET,
        }),
        {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
    );

    const data = response.data as { access_token: string; expires_in: number };
    cachedToken = {
        access_token: data.access_token,
        expires_at: now + data.expires_in * 1000,
    };

    return cachedToken.access_token;
}

export interface CdekCity {
    code: number;
    city: string;
    region: string;
    country_code: string;
    full_name: string;
}

export interface CdekPvz {
    code: string;
    name: string;
    location: {
        address: string;
        city: string;
        region: string;
        latitude: number;
        longitude: number;
    };
    work_time: string;
    phones: Array<{ number: string }> | undefined;
    type: string;
    is_handout: boolean;
    is_reception: boolean;
}

export interface CdekDeliveryCalc {
    tariff_code: number;
    tariff_name: string;
    delivery_sum: number;
    period_min: number;
    period_max: number;
    weight_calc: number;
}

/**
 * Поиск городов СДЭК по названию
 */
export async function searchCities(query: string): Promise<CdekCity[]> {
    const token = await getToken();

    const response = await axios.get(`${CDEK_API_URL}/location/cities`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
            city: query,
            country_codes: 'RU',
            size: 20,
        },
    });

    const cities = response.data as Array<{
        code: number;
        city: string;
        region: string;
        country_code: string;
    }>;

    return cities.map((c) => ({
        code: c.code,
        city: c.city,
        region: c.region,
        country_code: c.country_code,
        full_name: `${c.city}, ${c.region}`,
    }));
}

/**
 * Получить список ПВЗ СДЭК по коду города
 */
export async function getPvzList(cityCode: number): Promise<CdekPvz[]> {
    const token = await getToken();

    const response = await axios.get(`${CDEK_API_URL}/deliverypoints`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
            city_code: cityCode,
            type: 'PVZ',
            is_handout: true,
            size: 50,
        },
    });

    const pvzList = response.data as Array<{
        code: string;
        name: string;
        location: {
            address: string;
            city: string;
            region: string;
            latitude: number;
            longitude: number;
        };
        work_time: string;
        phones?: Array<{ number: string }>;
        type: string;
        is_handout: boolean;
        is_reception: boolean;
    }>;

    return pvzList.map((p) => ({
        code: p.code,
        name: p.name,
        location: p.location,
        work_time: p.work_time,
        phones: p.phones,
        type: p.type,
        is_handout: p.is_handout,
        is_reception: p.is_reception,
    }));
}

/**
 * Рассчитать стоимость доставки до ПВЗ
 * @param toCityCode - код города назначения
 * @param weight - вес в граммах (по умолчанию 500г)
 */
export async function calculateDelivery(
    toCityCode: number,
    weight = 500,
): Promise<CdekDeliveryCalc[]> {
    const token = await getToken();

    const payload = {
        type: 1, // интернет-магазин
        from_location: { code: FROM_CITY_CODE },
        to_location: { code: toCityCode },
        packages: [
            {
                weight,
                length: 20,
                width: 20,
                height: 10,
            },
        ],
        tariff_codes: [136, 137, 138, 139], // Посылка склад-склад, склад-дверь и т.д.
    };

    const response = await axios.post(`${CDEK_API_URL}/calculator/tarifflist`, payload, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    const data = response.data as {
        tariff_codes?: Array<{
            tariff_code: number;
            tariff_name: string;
            delivery_sum: number;
            period_min: number;
            period_max: number;
            weight_calc: number;
            errors?: Array<{ code: string; message: string }>;
        }>;
    };

    if (!data.tariff_codes) return [];

    return data.tariff_codes
        .filter((t) => !t.errors || t.errors.length === 0)
        .map((t) => ({
            tariff_code: t.tariff_code,
            tariff_name: t.tariff_name,
            delivery_sum: t.delivery_sum,
            period_min: t.period_min,
            period_max: t.period_max,
            weight_calc: t.weight_calc,
        }));
}
