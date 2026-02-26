export interface IProduct {
    id: string;
    name: string;
    price: number;
    image: string;
    categoryId: string;
    category?: ICategory;
    description: string;
    sizes: unknown;
    composition: unknown;
    discount: number | null;
    archive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateProductDTO {
    name: string;
    price: number;
    image: string;
    categoryId: string;
    description: string;
    sizes: unknown;
    composition: unknown;
    discount?: number;
    archive?: boolean;
}

export interface UpdateProductDTO {
    name?: string;
    price?: number;
    image?: string;
    categoryId?: string;
    description?: string;
    sizes?: unknown;
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

export interface IOrder {
    id: string;
    productId: string;
    product?: IProduct;
    quantity: number;
    totalPrice: number;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paymentId: string | null;
    confirmationUrl: string | null;
    telegramUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateOrderDTO {
    productId: string;
    quantity?: number;
    totalPrice: number;
    telegramUserId?: string;
    paymentMethod?: PaymentMethod;
}

export interface UpdateOrderStatusDTO {
    status: OrderStatus;
    paymentId?: string;
    confirmationUrl?: string;
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
