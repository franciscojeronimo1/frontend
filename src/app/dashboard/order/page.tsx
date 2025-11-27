import { api } from "@/services/api"
import { getCookieServer } from "@/lib/cookieServer"
import { CreateOrderForm } from "./components/form"
import { Product } from "@/lib/types"

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
        
        console.log("📥 [GET PRODUCTS] Categorias encontradas:", categories.length);
        
        if (categories.length === 0) {
            return [];
        }
        
        // 2. Buscar produtos de cada categoria
        const allProducts: Product[] = [];
        
        for (const category of categories) {
            try {
                
                // Tentar enviar category_id como query string na URL
                const productsResponse = await api.get(`/category/product?category_id=${category.id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                
                const products = productsResponse.data || [];
                
               
                products.forEach((prod: Product) => {
                    console.log(`  - ${prod.name}: has_sizes=${prod.has_sizes}, prices=${prod.prices?.length || 0} preços, price=${prod.price || 'null'}`);
                    if (prod.has_sizes && prod.prices) {
                        console.log(`    Preços disponíveis:`, prod.prices.map(p => `${p.size.display} (${p.size.name}): R$ ${p.price}`));
                    }
                });
                
                allProducts.push(...products);
            } catch (error: unknown) {
               
                
            
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

