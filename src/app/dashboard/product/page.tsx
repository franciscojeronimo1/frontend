import { Form } from "./components/form"
import { api } from "@/services/api"
import { getCookieServer } from "@/lib/cookieServer"
import { Category, Size } from "@/lib/types"

async function getCategories(): Promise<Category[]> {
    try {
        const token = await getCookieServer()
        const response = await api.get("/category", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        const categories = response.data || []
        

        const categoriesWithDetails: Category[] = [];
        
        for (const cat of categories) {
            try {
                // Buscar detalhes completos da categoria
                const detailResponse = await api.get(`/category/${cat.id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                
                const categoryDetail = detailResponse.data;
                categoriesWithDetails.push({
                    ...cat,
                    has_sizes: categoryDetail.has_sizes || false,
                    size_prices: categoryDetail.size_prices || []
                });
                
                
            } catch {
                // Se não conseguir buscar detalhes, usar valores padrão
                
                categoriesWithDetails.push({
                    ...cat,
                    has_sizes: false,
                    size_prices: []
                });
            }
        }
        
        return categoriesWithDetails
    } catch (error) {
        console.error("Error fetching categories:", error)
        return []
    }
}

async function getSizes(): Promise<Size[]> {
    try {
        const token = await getCookieServer();
        const response = await api.get("/sizes", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data || [];
    } catch (error: unknown) {
        // Se o endpoint não existir ou retornar erro, retorna array vazio
        // Isso não impede a criação de produtos sem tamanhos
        console.error("Error fetching sizes (pode ser normal se não houver tamanhos cadastrados):", error);
        return [];
    }
}

export default async function Product() {
    const [categories, sizes] = await Promise.all([
        getCategories(),
        getSizes()
    ])

    return(
       <Form categories={categories} sizes={sizes} />
    )
}