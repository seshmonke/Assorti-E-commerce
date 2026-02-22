export type ProductCategory = 'all' | 'tshirts' | 'jeans' | 'jackets' | 'hats' | 'belts' | 'glasses' | 'shoes' | 'bags';

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
}

export interface ICategory {
    id: number;
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
