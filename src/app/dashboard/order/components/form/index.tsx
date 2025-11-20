"use client";
import styles from "./styles.module.scss";
import { useState } from "react";
import { Button } from "@/app/dashboard/components/button";
import { api } from "@/services/api";
import { getCookieClient } from '@/lib/cookieClient';
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { X, Plus, Minus } from "lucide-react";

interface ProductProps {
    id: string;
    name: string;
    price: string;
    description: string;
    banner: string;
    category_id: string;
}

interface OrderItem {
    product_id: string;
    product: ProductProps;
    amount: number;
}

interface Props {
    products: ProductProps[];
}

export function CreateOrderForm({ products }: Props) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    function handleAddItem(product: ProductProps) {
        const existingItem = orderItems.find(item => item.product_id === product.id);
        
        if (existingItem) {
            setOrderItems(orderItems.map(item =>
                item.product_id === product.id
                    ? { ...item, amount: item.amount + 1 }
                    : item
            ));
        } else {
            setOrderItems([...orderItems, {
                product_id: product.id,
                product,
                amount: 1
            }]);
        }
    }

    function handleRemoveItem(productId: string) {
        const existingItem = orderItems.find(item => item.product_id === productId);
        
        if (existingItem && existingItem.amount > 1) {
            setOrderItems(orderItems.map(item =>
                item.product_id === productId
                    ? { ...item, amount: item.amount - 1 }
                    : item
            ));
        } else {
            setOrderItems(orderItems.filter(item => item.product_id !== productId));
        }
    }

    function getItemAmount(productId: string): number {
        const item = orderItems.find(item => item.product_id === productId);
        return item ? item.amount : 0;
    }

    function calculateTotal(): number {
        return orderItems.reduce((total, item) => {
            return total + (parseFloat(item.product.price) * item.amount);
        }, 0);
    }

    async function handleCreateOrder() {
        if (!name || name.trim() === "") {
            toast.warning("Digite o nome do cliente!");
            return;
        }

        if (orderItems.length === 0) {
            toast.warning("Adicione pelo menos um item ao pedido!");
            return;
        }

        setIsCreating(true);
        const token = getCookieClient();

        try {
            // 1. Criar o pedido
            const orderResponse = await api.post("/order", {
                table: 0,
                name: name.trim()
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const orderId = orderResponse.data.id;

            // 2. Adicionar itens ao pedido
            for (const item of orderItems) {
                await api.post("/order/add", {
                    order_id: orderId,
                    product_id: item.product_id,
                    amount: item.amount
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }

            // 3. Enviar o pedido (muda draft para false e aparece na lista)
            await api.put("/order/send", {
                order_id: orderId
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            toast.success("Pedido criado com sucesso!");
            router.push("/dashboard");
            router.refresh();

        } catch (error) {
            console.error("Error creating order:", error);
            toast.error("Falha ao criar o pedido!");
        } finally {
            setIsCreating(false);
        }
    }

    return (
        <main className={styles.container}>
            <h1>Novo Pedido</h1>

            <div className={styles.formContainer}>
                <section className={styles.orderInfo}>
                    <input
                        type="text"
                        placeholder="Nome do cliente"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={styles.input}
                        required
                    />
                </section>

                <section className={styles.productsSection}>
                    <h2>Selecione os produtos</h2>
                    <div className={styles.productsList}>
                        {products.length === 0 ? (
                            <span className={styles.emptyMessage}>
                                Nenhum produto cadastrado. Cadastre produtos primeiro.
                            </span>
                        ) : (
                            products.map(product => (
                                <div key={product.id} className={styles.productCard}>
                                    <div className={styles.productInfo}>
                                        <h3>{product.name}</h3>
                                        <p className={styles.description}>{product.description}</p>
                                        <span className={styles.price}>R$ {parseFloat(product.price).toFixed(2)}</span>
                                    </div>
                                    <div className={styles.productActions}>
                                        {getItemAmount(product.id) > 0 ? (
                                            <div className={styles.quantityControl}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(product.id)}
                                                    className={styles.quantityButton}
                                                >
                                                    <Minus size={20} />
                                                </button>
                                                <span className={styles.quantity}>{getItemAmount(product.id)}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddItem(product)}
                                                    className={styles.quantityButton}
                                                >
                                                    <Plus size={20} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleAddItem(product)}
                                                className={styles.addButton}
                                            >
                                                <Plus size={20} />
                                                Adicionar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {orderItems.length > 0 && (
                    <section className={styles.orderSummary}>
                        <h2>Resumo do Pedido</h2>
                        <div className={styles.itemsList}>
                            {orderItems.map(item => (
                                <div key={item.product_id} className={styles.orderItem}>
                                    <div className={styles.itemInfo}>
                                        <span className={styles.itemName}>{item.product.name}</span>
                                        <span className={styles.itemPrice}>
                                            R$ {parseFloat(item.product.price).toFixed(2)} x {item.amount}
                                        </span>
                                    </div>
                                    <div className={styles.itemTotal}>
                                        R$ {(parseFloat(item.product.price) * item.amount).toFixed(2)}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(item.product_id)}
                                        className={styles.removeButton}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className={styles.total}>
                            <span>Total: R$ {calculateTotal().toFixed(2)}</span>
                        </div>
                    </section>
                )}

                <button
                    type="button"
                    onClick={handleCreateOrder}
                    disabled={isCreating || orderItems.length === 0 || !name.trim()}
                    className={styles.createButton}
                >
                    {isCreating ? "Criando pedido..." : "Criar Pedido"}
                </button>
            </div>
        </main>
    );
}

