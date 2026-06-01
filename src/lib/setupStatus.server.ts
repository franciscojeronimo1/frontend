import { api } from "@/services/api";
import { getCookieServer } from "@/lib/cookieServer";
import { SetupStatus } from "@/app/dashboard/components/setup-checklist";

export async function getSetupStatus(): Promise<SetupStatus> {
    const empty: SetupStatus = { sizesCount: 0, categoriesCount: 0, productsCount: 0 };

    try {
        const token = await getCookieServer();
        const headers = { Authorization: `Bearer ${token}` };

        const [sizesRes, categoriesRes] = await Promise.all([
            api.get("/sizes", { headers }),
            api.get("/category", { headers }),
        ]);

        const sizes = sizesRes.data || [];
        const categories = categoriesRes.data || [];

        if (categories.length === 0) {
            return {
                sizesCount: sizes.length,
                categoriesCount: 0,
                productsCount: 0,
            };
        }

        let productsCount = 0;
        for (const category of categories) {
            try {
                const productsRes = await api.get(`/category/product?category_id=${category.id}`, {
                    headers,
                });
                productsCount += (productsRes.data || []).length;
            } catch {
                // categoria sem produtos
            }
        }

        return {
            sizesCount: sizes.length,
            categoriesCount: categories.length,
            productsCount,
        };
    } catch (error) {
        console.error("Error fetching setup status:", error);
        return empty;
    }
}
