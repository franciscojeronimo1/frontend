import { api } from "@/services/api"
import { getCookieServer } from "@/lib/cookieServer"
import { CreateOrderForm } from "./components/form"
import { Product, Category } from "@/lib/types"

export const dynamic = 'force-dynamic';

async function getProducts(): Promise<Product[]> {
    try {
        const token = await getCookieServer();
        
        // 1. Buscar todas as categorias
        const categoriesResponse = await api.get("/category", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        const categories = categoriesResponse.data || [];
        
        if (categories.length === 0) {
            return [];
        }
        
        // 2. Buscar produtos de cada categoria
        const allProducts: Product[] = [];
        
        for (const category of categories) {
            try {
                const productsResponse = await api.get(`/category/product?category_id=${category.id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                
                const products = productsResponse.data || [];
                
                // Garantir que todos os produtos tenham category_id
                const productsWithCategory = products.map((prod: Product) => ({
                    ...prod,
                    category_id: prod.category_id || category.id
                }));
                
                allProducts.push(...productsWithCategory);
            } catch {
                // Ignorar erros de categorias sem produtos
            }
        }
        
        return allProducts;
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
}

async function getCategories(): Promise<Category[]> {
    try {
        const token = await getCookieServer();
        const response = await api.get("/category", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data || [];
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
}

export default async function CreateOrder() {
    const [products, categories] = await Promise.all([
        getProducts(),
        getCategories()
    ]);

    return (
        <CreateOrderForm products={products} categories={categories} />
    )
}

