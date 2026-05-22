import { OrderItemProps } from '@/providers/order';
import { calculateTotalOrder } from './helper';

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'PIX',
  CARTAO: 'Cartão',
  DINHEIRO: 'Dinheiro',
  OUTROS: 'Outros',
};

export function getPaymentMethodLabel(method: string): string {
  return PAYMENT_LABELS[method] || method;
}

export function formatOrderItemName(item: OrderItemProps): string {
  if (item.product_id_2 && item.product_2) {
    const sizeDisplay = item.size?.display || '';
    return `Pizza Meia: ${item.product.name} / ${item.product_2.name}${sizeDisplay ? ` - ${sizeDisplay}` : ''}`;
  }
  return item.size
    ? `${item.product.name} - ${item.size.display}`
    : item.product.name;
}

/** Texto do pedido formatado para WhatsApp (negrito com *). */
export function formatOrderShareText(order: OrderItemProps[]): string {
  const clientName = order[0].order?.name || `Mesa ${order[0].order.table}`;
  const total = calculateTotalOrder(order).toFixed(2);
  const lines: string[] = ['📋 *PEDIDO*', '', `*Cliente:* ${clientName}`];

  if (order[0].order?.address) {
    lines.push(`*Endereço:* ${order[0].order.address}`);
  }
  if (order[0].order?.payment_method) {
    lines.push(`*Pagamento:* ${getPaymentMethodLabel(order[0].order.payment_method)}`);
  }

  lines.push('', '*Itens:*');

  for (const item of order) {
    const name = formatOrderItemName(item);
    const itemTotal = (item.price * item.amount).toFixed(2);
    lines.push(`• ${item.amount}x ${name} — R$ ${itemTotal}`);

    const description = [
      item.product.description,
      item.product_id_2 && item.product_2 ? item.product_2.description : null,
    ]
      .filter(Boolean)
      .join(' / ');

    if (description) {
      lines.push(`  _${description}_`);
    }
  }

  lines.push('', `*TOTAL: R$ ${total}*`);
  return lines.join('\n');
}

/** Abre o WhatsApp em nova aba/janela sem sair da página atual. */
export function shareOrderViaWhatsApp(order: OrderItemProps[]): boolean {
  const text = encodeURIComponent(formatOrderShareText(order));
  const url = `https://api.whatsapp.com/send?text=${text}`;

  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return true;
}
