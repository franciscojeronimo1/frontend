import { api } from "@/services/api"
import { getCookieServer } from "@/lib/cookieServer"
import { CategoryForm } from "./components/form"
import { Size } from "@/lib/types"
import type { Category } from "@/lib/types"

async function getSizes(): Promise<Size[]> {
    try {
        const token = await getCookieServer();
        
        const response = await api.get("/sizes", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        return response.data || [];
    } catch (error) {
        console.error("Error fetching sizes:", error);
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

export default async function Category() {
    const [sizes, categories] = await Promise.all([
        getSizes(),
        getCategories()
    ]);

    return (
        <CategoryForm sizes={sizes} categories={categories} />
    )
}
