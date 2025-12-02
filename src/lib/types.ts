// Tipos para o sistema de tamanhos e preços

export interface Size {
    id: string;
    name: string; // "P", "M", "G", "F"
    display: string; // "Pequena", "Média", "Grande", "Família"
    order: number; // 1, 2, 3, 4
}

export interface SizePrice {
    id: string;
    size_id: string;
    price: number;
    size?: Size;
}

export interface Category {
    id: string;
    name: string;
    has_sizes: boolean;
    size_prices?: SizePrice[];
}

export interface ProductPrice {
    size: Size;
    price: number;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    banner: string;
    price: number | null; // null se tem tamanhos
    has_custom_prices: boolean;
    has_sizes: boolean; // Se categoria tem tamanhos
    category_id: string;
    category?: Category;
    prices?: ProductPrice[]; // Preços disponíveis (da categoria ou individuais)
    custom_prices?: SizePrice[]; // Preços individuais do produto
}

export interface OrderItem {
    id: string;
    amount: number;
    created_at: string;
    order_id: string;
    product_id: string;
    size_id: string | null;
    product_id_2?: string | null; // Segundo sabor (meia a meia)
    size_id_2?: string | null; // Tamanho do segundo sabor
    price: number; // Preço histórico (no momento da venda)
    product: Product;
    product_2?: Product; // Segundo produto (quando meia a meia)
    size: Size | null;
    size_2?: Size | null; // Segundo tamanho (quando meia a meia)
    order: {
        id: string;
        table: number;
        name: string | null;
        draft: boolean;
        status: boolean;
    };
}

