import { OrderItemProps } from "@/providers/order";

export function calculateTotalOrder(orders: OrderItemProps[]) {
return orders.reduce((total, item) => {
    // Usa o preço histórico do item (item.price) em vez do preço do produto
    const itemTotal = item.price * item.amount
    return total + itemTotal
}, 0)
}