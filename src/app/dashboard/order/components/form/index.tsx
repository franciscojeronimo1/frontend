"use client";
import styles from "./styles.module.scss";
import { useState, useEffect } from "react";
import { Button } from "@/app/dashboard/components/button";
import { api } from "@/services/api";
import { getCookieClient } from '@/lib/cookieClient';
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { X, Plus, Minus } from "lucide-react";
import { Product, ProductPrice } from "@/lib/types";

interface OrderItem {
    product_id: string;
    product: Product;
    amount: number;
    size_id: string | null; // Obrigatório se produto tem tamanhos
    selectedPrice: number; // Preço selecionado
}

interface Props {
    products: Product[];
}

export function CreateOrderForm({ products }: Props) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({}); // product_id -> size_id

    function getProductPrice(product: Product, sizeId?: string): number | null {
        if (!product.has_sizes) {
            return product.price || null;
        }

        if (!sizeId) return null;

        // Buscar preço na lista de prices do produto
        const priceInfo = product.prices?.find(p => p.size.id === sizeId);
        return priceInfo?.price || null;
    }

    function handleSelectSize(productId: string, sizeId: string) {
        setSelectedSizes({
            ...selectedSizes,
            [productId]: sizeId
        });
    }

    function handleAddItem(product: Product) {
        // Se produto tem tamanhos, validar que tamanho foi selecionado
        if (product.has_sizes) {
            const selectedSizeId = selectedSizes[product.id];
            if (!selectedSizeId) {
                toast.warning(`Selecione um tamanho para ${product.name}!`);
                return;
            }

            const price = getProductPrice(product, selectedSizeId);
            if (price === null) {
                toast.error("Erro ao obter preço do produto!");
                return;
            }

            const existingItem = orderItems.find(
                item => item.product_id === product.id && item.size_id === selectedSizeId
            );

            if (existingItem) {
                setOrderItems(orderItems.map(item =>
                    item.product_id === product.id && item.size_id === selectedSizeId
                        ? { ...item, amount: item.amount + 1 }
                        : item
                ));
            } else {
                setOrderItems([...orderItems, {
                    product_id: product.id,
                    product,
                    amount: 1,
                    size_id: selectedSizeId,
                    selectedPrice: price
                }]);
            }
        } else {
            // Produto sem tamanhos
            const price = product.price;
            if (!price) {
                toast.error("Produto sem preço definido!");
                return;
            }

            const existingItem = orderItems.find(
                item => item.product_id === product.id && item.size_id === null
            );

            if (existingItem) {
                setOrderItems(orderItems.map(item =>
                    item.product_id === product.id && item.size_id === null
                        ? { ...item, amount: item.amount + 1 }
                        : item
                ));
            } else {
                setOrderItems([...orderItems, {
                    product_id: product.id,
                    product,
                    amount: 1,
                    size_id: null,
                    selectedPrice: price
                }]);
            }
        }
    }

    function handleRemoveItem(productId: string, sizeId: string | null) {
        const existingItem = orderItems.find(
            item => item.product_id === productId && item.size_id === sizeId
        );

        if (existingItem && existingItem.amount > 1) {
            setOrderItems(orderItems.map(item =>
                item.product_id === productId && item.size_id === sizeId
                    ? { ...item, amount: item.amount - 1 }
                    : item
            ));
        } else {
            setOrderItems(orderItems.filter(
                item => !(item.product_id === productId && item.size_id === sizeId)
            ));
        }
    }

    function getItemAmount(productId: string, sizeId: string | null): number {
        const item = orderItems.find(
            item => item.product_id === productId && item.size_id === sizeId
        );
        return item ? item.amount : 0;
    }

    function calculateTotal(): number {
        return orderItems.reduce((total, item) => {
            return total + (item.selectedPrice * item.amount);
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

        // Validar que produtos com tamanhos têm size_id
        const invalidItems = orderItems.filter(
            item => item.product.has_sizes && !item.size_id
        );
        if (invalidItems.length > 0) {
            toast.warning("Alguns produtos com tamanhos não têm tamanho selecionado!");
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
                const payload: {
                    order_id: string;
                    product_id: string;
                    amount: number;
                    size_id?: string;
                } = {
                    order_id: orderId,
                    product_id: item.product_id,
                    amount: item.amount
                };

                // Adicionar size_id apenas se produto tem tamanhos
                if (item.product.has_sizes && item.size_id) {
                    payload.size_id = item.size_id;
                }

                // LOG: Verificar payload antes de enviar
                console.log("🟡 [PEDIDO] Adicionando item ao pedido:");
                console.log("  - Produto:", item.product.name);
                console.log("  - Produto tem tamanhos:", item.product.has_sizes);
                console.log("  - Size ID:", item.size_id || "null/undefined");
                console.log("  - Payload completo:", JSON.stringify(payload, null, 2));

                await api.post("/order/add", payload, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                
                console.log("✅ [PEDIDO] Item adicionado com sucesso!");
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

        } catch (error: any) {
            console.error("Error creating order:", error);
            const errorMessage = error.response?.data?.error || "Falha ao criar o pedido!";
            toast.error(errorMessage);
        } finally {
            setIsCreating(false);
        }
    }

    function renderProductPrice(product: Product): string {
        if (!product.has_sizes) {
            return product.price ? `R$ ${product.price.toFixed(2)}` : "Preço não definido";
        }

        const selectedSizeId = selectedSizes[product.id];
        if (selectedSizeId) {
            const price = getProductPrice(product, selectedSizeId);
            if (price !== null) {
                return `R$ ${price.toFixed(2)}`;
            }
        }

        return "Selecione um tamanho";
    }

    // LOG: Verificar produtos quando são renderizados
    useEffect(() => {
        if (products.length > 0) {
            console.log("📥 [PEDIDO] Produtos carregados:", products.length);
            products.forEach(prod => {
                console.log(`  - ${prod.name}: has_sizes=${prod.has_sizes}, prices=${prod.prices?.length || 0}, price=${prod.price}`);
                if (prod.has_sizes && prod.prices) {
                    console.log(`    Preços disponíveis:`, prod.prices.map(p => `${p.size.display} (${p.size.name}): R$ ${p.price}`));
                }
            });
        }
    }, [products]);

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

                <button
                    type="button"
                    onClick={handleCreateOrder}
                    disabled={isCreating || orderItems.length === 0 || !name.trim()}
                    className={styles.createButton}
                >
                    {isCreating ? "Criando pedido..." : "Criar Pedido"}
                </button>

                <section className={styles.productsSection}>
                    <h2>Selecione os produtos</h2>
                    <div className={styles.productsList}>
                        {products.length === 0 ? (
                            <span className={styles.emptyMessage}>
                                Nenhum produto cadastrado. Cadastre produtos primeiro.
                            </span>
                        ) : (
                            products.map(product => {
                                const hasSizes = product.has_sizes;
                                const selectedSizeId = selectedSizes[product.id];
                                const itemAmount = hasSizes && selectedSizeId
                                    ? getItemAmount(product.id, selectedSizeId)
                                    : getItemAmount(product.id, null);

                                return (
                                    <div key={product.id} className={styles.productCard}>
                                        <div className={styles.productInfo}>
                                            <h3>{product.name}</h3>
                                            <p className={styles.description}>{product.description}</p>
                                            
                                            {hasSizes ? (
                                                <div className={styles.sizesContainer}>
                                                    <label className={styles.sizeLabel}>Selecione o tamanho:</label>
                                                    <div className={styles.sizesGrid}>
                                                        {product.prices?.map(priceInfo => (
                                                            <button
                                                                key={priceInfo.size.id}
                                                                type="button"
                                                                onClick={() => handleSelectSize(product.id, priceInfo.size.id)}
                                                                className={`${styles.sizeButton} ${
                                                                    selectedSizeId === priceInfo.size.id ? styles.sizeButtonActive : ''
                                                                }`}
                                                            >
                                                                <span className={styles.sizeName}>{priceInfo.size.name}</span>
                                                                <span className={styles.sizeDisplay}>{priceInfo.size.display}</span>
                                                                <span className={styles.sizePrice}>R$ {priceInfo.price.toFixed(2)}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className={styles.selectedPrice}>
                                                        {selectedSizeId ? renderProductPrice(product) : "Selecione um tamanho"}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className={styles.price}>{renderProductPrice(product)}</span>
                                            )}
                                        </div>
                                        <div className={styles.productActions}>
                                            {itemAmount > 0 ? (
                                                <div className={styles.quantityControl}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(product.id, hasSizes ? selectedSizeId : null)}
                                                        className={styles.quantityButton}
                                                    >
                                                        <Minus size={20} />
                                                    </button>
                                                    <span className={styles.quantity}>{itemAmount}</span>
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
                                                    disabled={hasSizes && !selectedSizeId}
                                                >
                                                    <Plus size={20} />
                                                    Adicionar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>

                {orderItems.length > 0 && (
                    <section className={styles.orderSummary}>
                        <h2>Resumo do Pedido</h2>
                        <div className={styles.itemsList}>
                            {orderItems.map((item, index) => {
                                const sizeInfo = item.size_id && item.product.prices?.find(p => p.size.id === item.size_id);
                                const displayName = sizeInfo
                                    ? `${item.product.name} - ${sizeInfo.size.display}`
                                    : item.product.name;

                                return (
                                    <div key={`${item.product_id}-${item.size_id || 'no-size'}-${index}`} className={styles.orderItem}>
                                        <div className={styles.itemInfo}>
                                            <span className={styles.itemName}>{displayName}</span>
                                            <span className={styles.itemPrice}>
                                                R$ {item.selectedPrice.toFixed(2)} x {item.amount}
                                            </span>
                                        </div>
                                        <div className={styles.itemTotal}>
                                            R$ {(item.selectedPrice * item.amount).toFixed(2)}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(item.product_id, item.size_id)}
                                            className={styles.removeButton}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <div className={styles.total}>
                            <span>Total: R$ {calculateTotal().toFixed(2)}</span>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
