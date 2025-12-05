"use client";
import styles from "./styles.module.scss";
import { useState, useMemo } from "react";
import { api } from "@/services/api";
import { getCookieClient } from '@/lib/cookieClient';
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { X, Plus, Minus } from "lucide-react";
import { Product, Category } from "@/lib/types";
import { Select, SelectOption } from "@/app/dashboard/components/select";

interface OrderItem {
    product_id: string;
    product: Product;
    amount: number;
    size_id: string | null; // Obrigatório se produto tem tamanhos
    selectedPrice: number; // Preço selecionado (maior entre os dois se meia a meia)
    product_id_2?: string | null; // Segundo sabor (meia a meia)
    product_2?: Product | null; // Segundo produto
    size_id_2?: string | null; // Tamanho do segundo sabor (deve ser igual ao primeiro)
}

interface Props {
    products: Product[];
    categories: Category[];
}

export function CreateOrderForm({ products, categories }: Props) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<string>("");
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({}); // product_id -> size_id
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
    const [halfHalfMode, setHalfHalfMode] = useState<Record<string, boolean>>({}); // product_id -> isHalfHalf
    const [selectedSecondFlavor, setSelectedSecondFlavor] = useState<Record<string, string>>({}); // product_id -> second_product_id

    const filteredProducts = useMemo(() => {
        if (!selectedCategoryId) {
            return products;
        }
        return products.filter(product => product.category_id === selectedCategoryId);
    }, [products, selectedCategoryId]);

    const categoryOptions: SelectOption[] = useMemo(() => {
        return categories.map(category => ({
            value: category.id,
            label: category.name
        }));
    }, [categories]);

    const paymentMethodOptions: SelectOption[] = useMemo(() => [
        { value: "PIX", label: "PIX" },
        { value: "CARTAO", label: "Cartão" },
        { value: "DINHEIRO", label: "Dinheiro" },
        { value: "OUTROS", label: "Outros" }
    ], []);

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
        // Se estiver em modo meia a meia, limpar seleção do segundo sabor quando mudar tamanho
        if (halfHalfMode[productId]) {
            setSelectedSecondFlavor({
                ...selectedSecondFlavor,
                [productId]: ""
            });
        }
    }

    function toggleHalfHalf(productId: string) {
        const newHalfHalfMode = !halfHalfMode[productId];
        setHalfHalfMode({
            ...halfHalfMode,
            [productId]: newHalfHalfMode
        });
        
        // Se desativar meia a meia, limpar seleção do segundo sabor
        if (!newHalfHalfMode) {
            setSelectedSecondFlavor({
                ...selectedSecondFlavor,
                [productId]: ""
            });
        }
    }

    function handleSelectSecondFlavor(productId: string, secondProductId: string) {
        setSelectedSecondFlavor({
            ...selectedSecondFlavor,
            [productId]: secondProductId
        });
    }

    function handleAddItem(product: Product) {
        const isHalfHalf = halfHalfMode[product.id];
        const secondProductId = selectedSecondFlavor[product.id];

        // Se está em modo meia a meia, validar segundo sabor
        if (isHalfHalf) {
            if (!secondProductId || secondProductId === "") {
                toast.warning("Selecione o segundo sabor para pizza meia a meia!");
                return;
            }

            if (secondProductId === product.id) {
                toast.warning("O segundo sabor deve ser diferente do primeiro!");
                return;
            }
        }

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

            let finalPrice = price;
            let secondProduct: Product | null = null;
            let secondSizeId: string | null = null;

            // Se é meia a meia, buscar segundo produto e calcular preço
            if (isHalfHalf && secondProductId) {
                secondProduct = products.find(p => p.id === secondProductId) || null;
                if (!secondProduct) {
                    toast.error("Segundo produto não encontrado!");
                    return;
                }

                // Validar que o segundo produto também tem tamanhos (se o primeiro tem)
                if (secondProduct.has_sizes) {
                    secondSizeId = selectedSizeId; // Mesmo tamanho do primeiro
                    const secondPrice = getProductPrice(secondProduct, secondSizeId);
                    if (secondPrice === null) {
                        toast.error("Erro ao obter preço do segundo produto!");
                        return;
                    }
                    // Usar o maior preço entre os dois (Opção B)
                    finalPrice = Math.max(price, secondPrice);
                } else {
                    toast.warning("O segundo produto deve ter tamanhos para pizza meia a meia!");
                    return;
                }
            }

            const existingItem = orderItems.find(item => {
                if (isHalfHalf && secondProductId) {
                    return item.product_id === product.id && 
                           item.size_id === selectedSizeId &&
                           item.product_id_2 === secondProductId;
                } else {
                    return item.product_id === product.id && 
                           item.size_id === selectedSizeId &&
                           !item.product_id_2;
                }
            });

            if (existingItem) {
                setOrderItems(orderItems.map(item =>
                    (isHalfHalf && secondProductId
                        ? item.product_id === product.id && 
                          item.size_id === selectedSizeId &&
                          item.product_id_2 === secondProductId
                        : item.product_id === product.id && 
                          item.size_id === selectedSizeId &&
                          !item.product_id_2)
                        ? { ...item, amount: item.amount + 1 }
                        : item
                ));
            } else {
                setOrderItems([...orderItems, {
                    product_id: product.id,
                    product,
                    amount: 1,
                    size_id: selectedSizeId,
                    selectedPrice: finalPrice,
                    product_id_2: isHalfHalf && secondProductId ? secondProductId : null,
                    product_2: isHalfHalf && secondProduct ? secondProduct : null,
                    size_id_2: isHalfHalf && secondSizeId ? secondSizeId : null
                }]);
            }
        } else {
            // Produto sem tamanhos - não suporta meia a meia
            if (isHalfHalf) {
                toast.warning("Pizza meia a meia só está disponível para produtos com tamanhos!");
                return;
            }

            const price = product.price;
            if (!price) {
                toast.error("Produto sem preço definido!");
                return;
            }

            const existingItem = orderItems.find(
                item => item.product_id === product.id && item.size_id === null && !item.product_id_2
            );

            if (existingItem) {
                setOrderItems(orderItems.map(item =>
                    item.product_id === product.id && item.size_id === null && !item.product_id_2
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

    function handleRemoveItem(productId: string, sizeId: string | null, productId2?: string | null) {
        const existingItem = orderItems.find(item => {
            if (productId2) {
                return item.product_id === productId && 
                       item.size_id === sizeId &&
                       item.product_id_2 === productId2;
            } else {
                return item.product_id === productId && 
                       item.size_id === sizeId &&
                       !item.product_id_2;
            }
        });

        if (existingItem && existingItem.amount > 1) {
            setOrderItems(orderItems.map(item => {
                if (productId2) {
                    return item.product_id === productId && 
                           item.size_id === sizeId &&
                           item.product_id_2 === productId2
                        ? { ...item, amount: item.amount - 1 }
                        : item;
                } else {
                    return item.product_id === productId && 
                           item.size_id === sizeId &&
                           !item.product_id_2
                        ? { ...item, amount: item.amount - 1 }
                        : item;
                }
            }));
        } else {
            setOrderItems(orderItems.filter(item => {
                if (productId2) {
                    return !(item.product_id === productId && 
                            item.size_id === sizeId &&
                            item.product_id_2 === productId2);
                } else {
                    return !(item.product_id === productId && 
                            item.size_id === sizeId &&
                            !item.product_id_2);
                }
            }));
        }
    }

    function getItemAmount(productId: string, sizeId: string | null, productId2?: string | null): number {
        const item = orderItems.find(item => {
            if (productId2) {
                return item.product_id === productId && 
                       item.size_id === sizeId &&
                       item.product_id_2 === productId2;
            } else {
                return item.product_id === productId && 
                       item.size_id === sizeId &&
                       !item.product_id_2;
            }
        });
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

        // Validar que itens meia a meia têm segundo sabor selecionado
        const invalidHalfHalf = orderItems.filter(
            item => item.product_id_2 && !item.product_2
        );
        if (invalidHalfHalf.length > 0) {
            toast.warning("Alguns itens meia a meia não têm segundo sabor selecionado!");
            return;
        }

        setIsCreating(true);
        const token = getCookieClient();

        try {
            // 1. Criar o pedido
            const orderResponse = await api.post("/order", {
                table: 0,
                name: name.trim(),
                address: address.trim() || null,
                payment_method: paymentMethod || null
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
                    product_id_2?: string | null;
                    size_id_2?: string | null;
                } = {
                    order_id: orderId,
                    product_id: item.product_id,
                    amount: item.amount
                };

                // Adicionar size_id apenas se produto tem tamanhos
                if (item.product.has_sizes && item.size_id) {
                    payload.size_id = item.size_id;
                }

                // Adicionar segundo sabor se for meia a meia
                if (item.product_id_2) {
                    payload.product_id_2 = item.product_id_2;
                    if (item.size_id_2) {
                        payload.size_id_2 = item.size_id_2;
                    }
                }

                await api.post("/order/add", payload, {
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

        } catch (error: unknown) {
            console.error("Error creating order:", error);
            const axiosError = error as { response?: { data?: { error?: string } } };
            const errorMessage = axiosError.response?.data?.error || "Falha ao criar o pedido!";
            toast.error(errorMessage);
        } finally {
            setIsCreating(false);
        }
    }

    function renderProductPrice(product: Product, isHalfHalf: boolean = false, secondProduct?: Product): string {
        if (!product.has_sizes) {
            return product.price ? `R$ ${product.price.toFixed(2)}` : "Preço não definido";
        }

        const selectedSizeId = selectedSizes[product.id];
        if (selectedSizeId) {
            const price = getProductPrice(product, selectedSizeId);
            if (price !== null) {
                if (isHalfHalf && secondProduct) {
                    const secondPrice = getProductPrice(secondProduct, selectedSizeId);
                    if (secondPrice !== null) {
                        const finalPrice = Math.max(price, secondPrice);
                        return `R$ ${finalPrice.toFixed(2)} (meia a meia)`;
                    }
                }
                return `R$ ${price.toFixed(2)}`;
            }
        }

        return "Selecione um tamanho";
    }

    // Obter produtos disponíveis para segundo sabor (excluindo o produto atual)
    function getAvailableSecondFlavors(currentProductId: string): Product[] {
        return filteredProducts.filter(p => 
            p.id !== currentProductId && 
            p.has_sizes // Apenas produtos com tamanhos podem ser segundo sabor
        );
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
                    <input
                        type="text"
                        placeholder="Endereço de entrega (opcional)"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className={styles.input}
                    />
                    <Select
                        options={paymentMethodOptions}
                        value={paymentMethod}
                        onChange={setPaymentMethod}
                        placeholder="Forma de pagamento"
                        className={styles.paymentSelect}
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

                {orderItems.length > 0 && (
                    <section className={styles.orderSummary}>
                        <h2>Resumo do Pedido</h2>
                        <div className={styles.itemsList}>
                            {orderItems.map((item, index) => {
                                const sizeInfo = item.size_id ? item.product.prices?.find(p => p.size.id === item.size_id) : undefined;
                                let displayName = "";
                                
                                if (item.product_id_2 && item.product_2) {
                                    // Pizza meia a meia
                                    const sizeDisplay = sizeInfo ? sizeInfo.size.display : "";
                                    displayName = `Pizza Meia: ${item.product.name} / ${item.product_2.name}${sizeDisplay ? ` - ${sizeDisplay}` : ""}`;
                                } else {
                                    // Pizza normal
                                    displayName = sizeInfo
                                        ? `${item.product.name} - ${sizeInfo.size.display}`
                                        : item.product.name;
                                }

                                return (
                                    <div key={`${item.product_id}-${item.size_id || 'no-size'}-${item.product_id_2 || ''}-${index}`} className={styles.orderItem}>
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
                                            onClick={() => handleRemoveItem(item.product_id, item.size_id, item.product_id_2 || undefined)}
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

                <section className={styles.productsSection}>
                    <div className={styles.productsHeader}>
                        <h2>Selecione os produtos</h2>
                        <Select
                            options={categoryOptions}
                            value={selectedCategoryId}
                            onChange={setSelectedCategoryId}
                            placeholder="Todas as categorias"
                            className={styles.categorySelect}
                        />
                    </div>
                    <div className={styles.productsList}>
                        {filteredProducts.length === 0 ? (
                            <span className={styles.emptyMessage}>
                                {selectedCategoryId 
                                    ? "Nenhum produto encontrado nesta categoria." 
                                    : products.length === 0 
                                        ? "Nenhum produto cadastrado. Cadastre produtos primeiro."
                                        : "Nenhum produto encontrado."}
                            </span>
                        ) : (
                            filteredProducts.map(product => {
                                const hasSizes = product.has_sizes;
                                const selectedSizeId = selectedSizes[product.id];
                                const isHalfHalf = halfHalfMode[product.id] || false;
                                const selectedSecondProductId = selectedSecondFlavor[product.id] || "";
                                const selectedSecondProduct = selectedSecondProductId 
                                    ? products.find(p => p.id === selectedSecondProductId)
                                    : null;
                                
                                // Calcular quantidade considerando meia a meia
                                let itemAmount = 0;
                                if (hasSizes && selectedSizeId) {
                                    if (isHalfHalf && selectedSecondProductId) {
                                        itemAmount = getItemAmount(product.id, selectedSizeId, selectedSecondProductId);
                                    } else {
                                        itemAmount = getItemAmount(product.id, selectedSizeId);
                                    }
                                } else {
                                    itemAmount = getItemAmount(product.id, null);
                                }

                                const availableSecondFlavors = getAvailableSecondFlavors(product.id);
                                const secondFlavorOptions: SelectOption[] = availableSecondFlavors.map(p => ({
                                    value: p.id,
                                    label: p.name
                                }));

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
                                                        {selectedSizeId 
                                                            ? renderProductPrice(product, isHalfHalf, selectedSecondProduct || undefined)
                                                            : "Selecione um tamanho"}
                                                    </div>
                                                    
                                                    {selectedSizeId && (
                                                        <div className={styles.halfHalfContainer}>
                                                            <label className={styles.halfHalfCheckbox}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isHalfHalf}
                                                                    onChange={() => toggleHalfHalf(product.id)}
                                                                />
                                                                <span>Pizza Meia a Meia</span>
                                                            </label>
                                                            
                                                            {isHalfHalf && (
                                                                <div className={styles.secondFlavorContainer}>
                                                                    <label className={styles.secondFlavorLabel}>
                                                                        Selecione o segundo sabor:
                                                                    </label>
                                                                    <Select
                                                                        options={secondFlavorOptions}
                                                                        value={selectedSecondProductId}
                                                                        onChange={(value) => handleSelectSecondFlavor(product.id, value)}
                                                                        placeholder="Escolha o segundo sabor"
                                                                        className={styles.secondFlavorSelect}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
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
                                                        onClick={() => {
                                                            if (isHalfHalf && selectedSecondProductId) {
                                                                handleRemoveItem(product.id, hasSizes ? selectedSizeId : null, selectedSecondProductId);
                                                            } else {
                                                                handleRemoveItem(product.id, hasSizes ? selectedSizeId : null);
                                                            }
                                                        }}
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
                                                    disabled={
                                                        (hasSizes && !selectedSizeId) || 
                                                        (isHalfHalf && !selectedSecondProductId)
                                                    }
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
            </div>
        </main>
    );
}
