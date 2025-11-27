import { api } from "@/services/api"
import { getCookieServer } from "@/lib/cookieServer"
import { ProductsList } from "./components/list"
import { Product } from "@/lib/types"

async function getAllProducts(): Promise<Product[]> {
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
                allProducts.push(...products);
            } catch (error) {
                // Ignorar erros de categorias sem produtos
                console.error(`Error fetching products for category ${category.id}:`, error);
            }
        }
        
        return allProducts;
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
}

export default async function ProductsPage() {
    const products = await getAllProducts();

    return (
        <ProductsList products={products} />
    )
}

