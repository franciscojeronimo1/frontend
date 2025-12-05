'use client'
import { X, Printer } from 'lucide-react';
import styles from './styles.module.scss';
import {use} from 'react'
import { OrderContext } from '@/providers/order';
import { calculateTotalOrder } from '@/lib/helper';


export function Modalorder() {
    const { onRequestClose, order, finishOrder} = use(OrderContext)
    
    function getPaymentMethodLabel(method: string): string {
        const labels: Record<string, string> = {
            "PIX": "PIX",
            "CARTAO": "Cartão",
            "DINHEIRO": "Dinheiro",
            "OUTROS": "Outros"
        };
        return labels[method] || method;
    }
    
    async function handleFinishOrder() {
        await finishOrder(order[0].order.id)
    }

    function handlePrint() {
        const printContent = generatePrintContent();
        const printWindow = window.open('', '_blank');
        
        if (!printWindow) {
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Pedido - ${order[0].order?.name || 'Pedido'}</title>
                <style>
                    @media print {
                        @page {
                            size: 80mm auto;
                            margin: 0;
                        }
                        body {
                            margin: 0;
                            padding: 10px;
                            font-family: 'Courier New', monospace;
                            font-size: 12px;
                            width: 80mm;
                        }
                    }
                    body {
                        margin: 0;
                        padding: 10px;
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        width: 80mm;
                        background: white;
                        color: black;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 1px dashed #000;
                        padding-bottom: 10px;
                        margin-bottom: 10px;
                    }
                    .client {
                        font-weight: bold;
                        margin-bottom: 10px;
                        font-size: 14px;
                    }
                    .items {
                        margin: 10px 0;
                    }
                    .item {
                        margin: 8px 0;
                        padding-bottom: 5px;
                        border-bottom: 1px dotted #ccc;
                    }
                    .item-line {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 3px;
                    }
                    .item-name {
                        font-weight: bold;
                    }
                    .item-details {
                        font-size: 11px;
                        color: #666;
                        margin-top: 2px;
                    }
                    .total {
                        margin-top: 15px;
                        padding-top: 10px;
                        border-top: 2px solid #000;
                        text-align: center;
                        font-weight: bold;
                        font-size: 16px;
                    }
                    .footer {
                        margin-top: 15px;
                        text-align: center;
                        font-size: 10px;
                        color: #666;
                        border-top: 1px dashed #000;
                        padding-top: 10px;
                    }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        // Aguarda o conteúdo carregar antes de imprimir
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }

    function generatePrintContent() {
        const clientName = order[0].order?.name || `Mesa ${order[0].order.table}`;
        const total = calculateTotalOrder(order).toFixed(2);
        
        const itemsHtml = order.map(item => {
            const itemTotal = (item.price * item.amount).toFixed(2);
            let productName = "";
            
            if (item.product_id_2 && item.product_2) {
                // Pizza meia a meia
                const sizeDisplay = item.size?.display || "";
                productName = `Pizza Meia: ${item.product.name} / ${item.product_2.name}${sizeDisplay ? ` - ${sizeDisplay}` : ""}`;
            } else {
                // Pizza normal
                productName = item.size 
                    ? `${item.product.name} - ${item.size.display}`
                    : item.product.name;
            }
            
            return `
                <div class="item">
                    <div class="item-line">
                        <span class="item-name">${item.amount}x ${productName}</span>
                        <span>R$ ${itemTotal}</span>
                    </div>
                    ${item.product.description ? `<div class="item-details">${item.product.description}</div>` : ''}
                </div>
            `;
        }).join('');

        const address = order[0].order?.address;
        const paymentMethod = order[0].order?.payment_method;
        
        function getPaymentMethodLabel(method: string): string {
            const labels: Record<string, string> = {
                "PIX": "PIX",
                "CARTAO": "Cartão",
                "DINHEIRO": "Dinheiro",
                "OUTROS": "Outros"
            };
            return labels[method] || method;
        }
        
        return `
            <div class="header">
                <h2>PEDIDO</h2>
            </div>
            <div class="client">
                Cliente: ${clientName}
            </div>
            ${address ? `<div class="client" style="margin-top: 5px; font-size: 12px;">Endereço: ${address}</div>` : ''}
            ${paymentMethod ? `<div class="client" style="margin-top: 5px; font-size: 12px;">Forma de pagamento: ${getPaymentMethodLabel(paymentMethod)}</div>` : ''}
            <div class="items">
                ${itemsHtml}
            </div>
            <div class="total">
                TOTAL: R$ ${total}
            </div>
            <div class="footer">
                Obrigado pela preferência!
            </div>
        `;
    }

    return(
        <dialog className={styles.dialogContainer}> 
        <section className={styles.dialogContent}>
            <button className={styles.dialogBack} onClick={onRequestClose}>
                <X size={40} color='#ff3f4b' />
            </button>

            <article className={styles.container}>
                <h2>Detalhes do pedido</h2>

                {order[0].order?.name ? (
                    <span className={styles.table}>Cliente: <b>{order[0].order.name}</b></span>
                ) : (
                    <span className={styles.table}>Mesa <b>{order[0].order.table}</b></span>
                )}
                {order[0].order?.address && (
                    <span className={styles.table} style={{ display: 'block', marginTop: '8px' }}>
                        Endereço: <b>{order[0].order.address}</b>
                    </span>
                )}
                {order[0].order?.payment_method && (
                    <span className={styles.table} style={{ display: 'block', marginTop: '8px' }}>
                        Forma de pagamento: <b>{getPaymentMethodLabel(order[0].order.payment_method)}</b>
                    </span>
                )}
             {order.map(item => {
                let productName = "";
                
                if (item.product_id_2 && item.product_2) {
                    // Pizza meia a meia
                    const sizeDisplay = item.size?.display || "";
                    productName = `Pizza Meia: ${item.product.name} / ${item.product_2.name}${sizeDisplay ? ` - ${sizeDisplay}` : ""}`;
                } else {
                    // Pizza normal
                    productName = item.size 
                        ? `${item.product.name} - ${item.size.display}`
                        : item.product.name;
                }
                
                const itemTotal = item.price * item.amount;
                
                return (
                    <section key={item.id} className={styles.item}>
                        <span>Qtd: {item.amount} - <b>{productName}</b> - R$ {itemTotal.toFixed(2)}</span>
                        <span className={styles.description}> 
                            {item.product.description}
                            {item.product_id_2 && item.product_2 && ` / ${item.product_2.description}`}
                        </span>
                    </section>
                );
             })}

             <h3 className={styles.total}>Valor total: R$ {calculateTotalOrder(order)}</h3>
                <div className={styles.buttonsContainer}>
                    <button className={styles.printButton} onClick={handlePrint}>
                        <Printer size={20} />
                        Imprimir
                    </button>
                    <button className={styles.buttonOrder} onClick={handleFinishOrder}>
                        Concluir pedido
                    </button>
                </div>
            </article>
        </section>
        </dialog>
    )
}