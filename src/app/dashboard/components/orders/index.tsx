"use client";
import styles from './styles.module.scss';
import { RefreshCw, CheckSquare, Square } from 'lucide-react';
import { OrderProps } from '@/lib/order.type';
import { Modalorder } from '../modal';
import { use, useState } from 'react';
import { OrderContext } from '@/providers/order';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
interface Props{
    orders: OrderProps[];
}


export function Orders({orders}:Props) {
    const {isOpen, onRequestOpen, finishMultipleOrders} = use( OrderContext);
    const router = useRouter()
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())

  async function handleDetailOrder(order_id: string){
     await  onRequestOpen(order_id );
    }

    function handleRefresh() {
        router.refresh()
        toast.success("Pedidos atualizados com sucesso!")
        setSelectedOrders(new Set())
    }

    function handleToggleSelect(orderId: string) {
        const newSelected = new Set(selectedOrders)
        if (newSelected.has(orderId)) {
            newSelected.delete(orderId)
        } else {
            newSelected.add(orderId)
        }
        setSelectedOrders(newSelected)
    }

    function handleSelectAll() {
        if (selectedOrders.size === orders.length) {
            setSelectedOrders(new Set())
        } else {
            setSelectedOrders(new Set(orders.map(order => order.id)))
        }
    }

    async function handleFinishSelected() {
        if (selectedOrders.size === 0) {
            toast.error("Selecione pelo menos um pedido para finalizar!")
            return
        }
        
        await finishMultipleOrders(Array.from(selectedOrders))
        setSelectedOrders(new Set())
    }

    function handleOrderItemClick(orderId: string, event: React.MouseEvent) {
        // Se clicar no checkbox ou no container do checkbox, não abre o modal
        const target = event.target as HTMLElement
        if (target.closest(`.${styles.checkboxContainer}`) || target.closest(`.${styles.checkbox}`)) {
            return
        }
        handleDetailOrder(orderId)
    }

    return(
        <>
        <main className={styles.container}>
            <section className={styles.containerHeader}>
                <h1>Últimos pedidos</h1>
                <div className={styles.headerActions}>
                    {orders.length > 0 && (
                        <>
                            <button 
                                className={styles.selectAllButton}
                                onClick={handleSelectAll}
                                title={selectedOrders.size === orders.length ? "Desselecionar todos" : "Selecionar todos"}
                            >
                                {selectedOrders.size === orders.length ? (
                                    <CheckSquare size={20} color='#3fffa3'/>
                                ) : (
                                    <Square size={20} color='#3fffa3'/>
                                )}
                            </button>
                            {selectedOrders.size > 0 && (
                                <button 
                                    className={styles.finishButton}
                                    onClick={handleFinishSelected}
                                >
                                    Finalizar {selectedOrders.size} pedido(s)
                                </button>
                            )}
                        </>
                    )}
                    <button onClick={handleRefresh}>
                        <RefreshCw size={24} color='#3fffa3'/>
                    </button>
                </div>
            </section>

            <section className={styles.listOrders}>
                {orders.length === 0 && (
                    <span className={styles.emptyItem}>Nenhum pedido aberto no momento...</span>
                )}
               {orders.map(order => (
                 <div key={order.id} className={styles.orderItemWrapper}>
                    <div 
                        className={`${styles.orderItem} ${selectedOrders.has(order.id) ? styles.selected : ''}`}
                        onClick={(e) => handleOrderItemClick(order.id, e)}
                    >
                        <div className={styles.tag}></div>
                        <div 
                            className={styles.checkboxContainer} 
                            onClick={(e) => {
                                e.stopPropagation()
                                handleToggleSelect(order.id)
                            }}
                        >
                            {selectedOrders.has(order.id) ? (
                                <CheckSquare size={20} color='#3fffa3'/>
                            ) : (
                                <Square size={20} color='#3fffa3'/>
                            )}
                        </div>
                        <span>{order.name || `Pedido ${order.table}`}</span>
                    </div>
                 </div>
               ))}
                
            </section>
        </main>

        {isOpen && <Modalorder />}

        </>
    )
}