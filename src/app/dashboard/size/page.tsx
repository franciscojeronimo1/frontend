import { api } from "@/services/api"
import { getCookieServer } from "@/lib/cookieServer"
import { SizeForm } from "./components/form"
import { Size } from "@/lib/types"

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

export default async function SizePage() {
    const sizes = await getSizes();

    return (
        <SizeForm sizes={sizes} />
    )
}

