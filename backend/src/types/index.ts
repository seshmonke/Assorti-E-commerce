export interface IProduct {
    id: string;
    name: string;
    price: number;
    images: string[];
    categoryId: string;
    category?: ICategory;
    description: string;
    sizes: string;
    composition: unknown;
    discount: number | null;
    archive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateProductDTO {
    name: string;
    price: number;
    images: string[];
    categoryId: string;
    description: string;
    sizes: string;
    composition: unknown;
    discount?: number;
    archive?: boolean;
}

export interface UpdateProductDTO {
    name?: string;
    price?: number;
    images?: string[];
    categoryId?: string;
    description?: string;
    sizes?: string;
    composition?: unknown;
    discount?: number;
    archive?: boolean;
}

export interface ICategory {
    id: string;
    name: string;
    section: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateCategoryDTO {
    name: string;
    section: string;
    order: number;
}

export interface UpdateCategoryDTO {
    name?: string;
    section?: string;
    order?: number;
}

export type OrderStatus = 'pending_payment' | 'paid' | 'delivered' | 'cancelled';
export type PaymentMethod = 'card' | 'cash';
export type DeliveryType = 'delivery' | 'pickup';

export interface IOrderItem {
    id: string;
    orderId: string;
    productId: string;
    product?: IProduct;
    quantity: number;
    price: number;
    name: string;
}

export interface CreateOrderItemDTO {
    productId: string;
    quantity?: number;
    price: number;
    name: string;
}

export interface IBrowserUser {
    id: string;
    telegramId: string | null;
    name: string;
    phone: string;
    email: string | null;
    telegram: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateBrowserUserDTO {
    telegramId?: string;
    name: string;
    phone: string;
    email?: string;
    telegram?: string;
}

export interface IOrder {
    id: string;
    items: IOrderItem[];
    totalPrice: number;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paymentId: string | null;
    confirmationUrl: string | null;
    telegramUserId: string | null;
    userId: string | null;
    user?: IBrowserUser | null;
    deliveryType: DeliveryType;
    deliveryCity: string | null;
    deliveryPvzCode: string | null;
    deliveryPvzAddress: string | null;
    deliveryPrice: number | null;
    trackNumber: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateOrderDTO {
    items: CreateOrderItemDTO[];
    totalPrice: number;
    telegramUserId?: string;
    paymentMethod?: PaymentMethod;
    // browserUser данные
    userId?: string;
    // тип получения
    deliveryType?: DeliveryType;
    // delivery данные
    deliveryCity?: string;
    deliveryPvzCode?: string;
    deliveryPvzAddress?: string;
    deliveryPrice?: number;
}

export interface UpdateOrderStatusDTO {
    status: OrderStatus;
    paymentId?: string;
    confirmationUrl?: string;
    trackNumber?: string;
}

export interface IUser {
    id: string;
    telegramId: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateUserDTO {
    telegramId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
}

export interface AuthPayload {
    userId: string;
    telegramId: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
