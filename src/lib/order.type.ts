export type PaymentMethod = "PIX" | "CARTAO" | "DINHEIRO" | "OUTROS";

export interface OrderProps {
    id: string;
    table: number;
    status: boolean;
    draft: boolean;
    name: string;
    address?: string | null;
    payment_method?: PaymentMethod | null;
}