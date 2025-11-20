import { api } from "@/services/api"
import { getCookieServer } from "@/lib/cookieServer"
import { CreateOrderForm } from "./components/form"

interface ProductProps {
    id: string;
    name: string;
    price: string;
    description: string;
    banner: string;
    category_id: string;
}

interface CategoryProps {
    id: string;
    name: string;
}

async function getProducts(): Promise<ProductProps[] | []> {
    try {
        const token = await getCookieServer();
        
        // 1. Buscar todas as categorias
        const categoriesResponse = await api.get("/category", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        const categories: CategoryProps[] = categoriesResponse.data || [];
        
        if (categories.length === 0) {
            return [];
        }
        
        // 2. Buscar produtos de cada categoria
        const allProducts: ProductProps[] = [];
        
        for (const category of categories) {
            try {
                const productsResponse = await api.get("/category/product", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    params: {
                        category_id: category.id
                    }
                });
                
                const products = productsResponse.data || [];
                allProducts.push(...products);
            } catch (error) {
                console.error(`Error fetching products for category ${category.id}:`, error);
            }
        }
        
        return allProducts;
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
}

export default async function CreateOrder() {
    const products = await getProducts();

    return (
        <CreateOrderForm products={products} />
    )
}

