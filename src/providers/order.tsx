"use client"
import {createContext, ReactNode , useState} from 'react';
import { api } from '@/services/api';
import { getCookieClient } from '@/lib/cookieClient';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export interface OrderItemProps {
    id: string;
    amount: number;
    created_at: string;
    order_id: string;
    product_id: string;
    size_id: string | null;
    product_id_2?: string | null; // Segundo sabor (meia a meia)
    size_id_2?: string | null; // Tamanho do segundo sabor
    price: number; // Preço histórico (no momento da venda)
    product: {
        id: string;
        name: string;
        price: string | null; // null se tem tamanhos
        description: string;
        banner: string;
        category_id: string;
        has_sizes?: boolean;
    };
    product_2?: {
        id: string;
        name: string;
        price: string | null;
        description: string;
        banner: string;
        category_id: string;
        has_sizes?: boolean;
    } | null; // Segundo produto (quando meia a meia)
    size: {
        id: string;
        name: string;
        display: string;
        order: number;
    } | null;
    size_2?: {
        id: string;
        name: string;
        display: string;
        order: number;
    } | null; // Segundo tamanho (quando meia a meia)
    order: {
        id: string;
        table: number;
        name: string | null ;
        draft: boolean;
        status: boolean;
        address?: string | null;
    }
}


type OrderContextData = {
    isOpen: boolean;
    onRequestOpen: (order_id: string) => Promise<void>;
    onRequestClose: () => void;
    order: OrderItemProps[]
    finishOrder: (prder_id : string) => Promise<void>
}

type orderProviderProps = {
    children: ReactNode;
}

export const OrderContext = createContext({} as OrderContextData);

export function OrderProvider({children}: orderProviderProps){
    const [isOpen, setIsOpen] = useState(false);
    const [order, setOrder] = useState<OrderItemProps[]>([])
    const router = useRouter()

   async function onRequestOpen(order_id: string){

    const token = getCookieClient()

    const response = await api.get("/order/detail",{
        headers: {
            Authorization: `Bearer ${token}`
        },
        params:{
            order_id: order_id
        }
    })
        setOrder(response.data)

        setIsOpen(true);
    }
    function onRequestClose(){
        setIsOpen(false);
    }

    async function finishOrder(order_id: string) {
        const token = getCookieClient()

        const data = {
            order_id: order_id
        }

        try {
            await api.put("/order/finish", data, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
        }catch(err) {
            console.log(err)
            toast.error("Falha ao finalizar este pedido!")
            return;
        }

        toast.success("Pedido finalizado com sucesso!")
        router.refresh()
        setIsOpen(false)
    }
    
    return(
        <OrderContext.Provider value={{isOpen, onRequestOpen, onRequestClose, finishOrder, order}}>
            {children}
        </OrderContext.Provider>
    )
}