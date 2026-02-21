export type ProductCategory = 'all' | 'tshirts' | 'jeans' | 'jackets' | 'hats' | 'belts' | 'glasses' | 'shoes' | 'bags' | 'sale';

export interface IProduct {
    id: number;
    name: string;
    price: number;
    image: string;
    category: ProductCategory;
    description: string;
    sizes: unknown;
    composition: unknown;
    discount: number | null;
    originalCategory: ProductCategory | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateProductDTO {
    name: string;
    price: number;
    image: string;
    category: ProductCategory;
    description: string;
    sizes: unknown;
    composition: unknown;
    discount?: number;
    originalCategory?: ProductCategory;
}

export interface UpdateProductDTO {
    name?: string;
    price?: number;
    image?: string;
    category?: ProductCategory;
    description?: string;
    sizes?: unknown;
    composition?: unknown;
    discount?: number;
    originalCategory?: ProductCategory;
}

export interface AuthPayload {
    userId?: string;
    role?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
