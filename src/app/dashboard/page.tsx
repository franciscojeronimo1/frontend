import { Orders } from "./components/orders";
import { SetupChecklist } from "./components/setup-checklist";
import { api } from "@/services/api";
import { getCookieServer } from '@/lib/cookieServer';
import { OrderProps } from "@/lib/order.type";
import { getSetupStatus } from "@/lib/setupStatus.server";

export const dynamic = 'force-dynamic';

async function getOrders(): Promise<OrderProps[] | []> {
    try {
        const token = await getCookieServer();
        const response = await api.get("/orders", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data ||[];
    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
}

export default async function Dashboard() {
    const [orders, setupStatus] = await Promise.all([
        getOrders(),
        getSetupStatus(),
    ]);

    return(
        <>
           <SetupChecklist status={setupStatus} />
           <Orders orders={orders}/>
        </>
    )
}