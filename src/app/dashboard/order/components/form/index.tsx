"use client";
import styles from "./styles.module.scss";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { api } from "@/services/api";
import { getCookieClient } from '@/lib/cookieClient';
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { X, Plus, Minus, Settings2 } from "lucide-react";
import { Product, Category } from "@/lib/types";
import { Select, SelectOption } from "@/app/dashboard/components/select";
import { getDefaultSizeId, sortProductPrices } from "@/lib/productSizeHelpers";
import {
    getLastCategoryId,
    setLastCategoryId,
    getLastPaymentMethod,
    setLastPaymentMethod,
} from "@/lib/orderFormStorage";

interface OrderItem {
    product_id: string;
    product: Product;
    amount: number;
    size_id: string | null;
    selectedPrice: number;
    product_id_2?: string | null;
    product_2?: Product | null;
    size_id_2?: string | null;
}

interface Client {
    name: string;
    address: string;
}

interface SplitFlavorState {
    cartIndex: number;
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
    const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
    const [halfHalfMode, setHalfHalfMode] = useState<Record<string, boolean>>({});
    const [selectedSecondFlavor, setSelectedSecondFlavor] = useState<Record<string, string>>({});
    const [expandedOptions, setExpandedOptions] = useState<Record<string, boolean>>({});
    const [clientSuggestions, setClientSuggestions] = useState<Client[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearchingClients, setIsSearchingClients] = useState(false);
    const [splitFlavor, setSplitFlavor] = useState<SplitFlavorState | null>(null);
    const [splitSecondFlavorId, setSplitSecondFlavorId] = useState("");
    const nameInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    const filteredProducts = useMemo(() => {
        if (!selectedCategoryId) return products;
        return products.filter((product) => product.category_id === selectedCategoryId);
    }, [products, selectedCategoryId]);

    const categoryOptions: SelectOption[] = useMemo(() => {
        return categories.map((category) => ({
            value: category.id,
            label: category.name,
        }));
    }, [categories]);

    const paymentMethodOptions: SelectOption[] = useMemo(
        () => [
            { value: "PIX", label: "PIX" },
            { value: "CARTAO", label: "Cartão" },
            { value: "DINHEIRO", label: "Dinheiro" },
            { value: "OUTROS", label: "Outros" },
        ],
        []
    );

    const canFinalize = name.trim().length > 0 && orderItems.length > 0 && !isCreating;

    useEffect(() => {
        nameInputRef.current?.focus();
    }, []);

    useEffect(() => {
        const savedPayment = getLastPaymentMethod();
        if (savedPayment) setPaymentMethod(savedPayment);

        if (categories.length === 1) {
            setSelectedCategoryId(categories[0].id);
            return;
        }

        const savedCategory = getLastCategoryId();
        if (savedCategory && categories.some((c) => c.id === savedCategory)) {
            setSelectedCategoryId(savedCategory);
        }
    }, [categories]);

    useEffect(() => {
        if (selectedCategoryId) setLastCategoryId(selectedCategoryId);
    }, [selectedCategoryId]);

    useEffect(() => {
        if (paymentMethod) setLastPaymentMethod(paymentMethod);
    }, [paymentMethod]);

    useEffect(() => {
        const searchClients = async () => {
            if (name.trim().length < 2) {
                setClientSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            setIsSearchingClients(true);
            try {
                const token = getCookieClient();
                const response = await api.get("/order/clients", {
                    params: { search: name.trim() },
                    headers: { Authorization: `Bearer ${token}` },
                });
                const clients: Client[] = response.data || [];
                setClientSuggestions(clients);
                setShowSuggestions(clients.length > 0);
            } catch (error) {
                console.error("Error searching clients:", error);
                setClientSuggestions([]);
                setShowSuggestions(false);
            } finally {
                setIsSearchingClients(false);
            }
        };

        const timeoutId = setTimeout(searchClients, 300);
        return () => clearTimeout(timeoutId);
    }, [name]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                nameInputRef.current &&
                !nameInputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCreateOrderRef = useRef<() => void>(() => {});

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "F2") {
                e.preventDefault();
                if (canFinalize) handleCreateOrderRef.current();
                return;
            }
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (canFinalize) handleCreateOrderRef.current();
            }
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [canFinalize]);

    function handleSelectClient(client: Client) {
        setName(client.name);
        setAddress(client.address || "");
        setShowSuggestions(false);
        setClientSuggestions([]);
    }

    function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value.toUpperCase();
        setName(value);
        if (value.trim() === "") setAddress("");
    }

    function getProductPrice(product: Product, sizeId?: string): number | null {
        if (!product.has_sizes) return product.price || null;
        if (!sizeId) return null;
        const priceInfo = product.prices?.find((p) => p.size.id === sizeId);
        return priceInfo?.price ?? null;
    }

    function toggleOptions(productId: string) {
        setExpandedOptions((prev) => ({
            ...prev,
            [productId]: !prev[productId],
        }));
    }

    function handleSelectSize(productId: string, sizeId: string) {
        setSelectedSizes({ ...selectedSizes, [productId]: sizeId });
        if (halfHalfMode[productId]) {
            setSelectedSecondFlavor({ ...selectedSecondFlavor, [productId]: "" });
        }
    }

    function toggleHalfHalf(productId: string) {
        const newHalfHalfMode = !halfHalfMode[productId];
        setHalfHalfMode({ ...halfHalfMode, [productId]: newHalfHalfMode });
        if (!newHalfHalfMode) {
            setSelectedSecondFlavor({ ...selectedSecondFlavor, [productId]: "" });
        }
    }

    function handleSelectSecondFlavor(productId: string, secondProductId: string) {
        setSelectedSecondFlavor({ ...selectedSecondFlavor, [productId]: secondProductId });
    }

    function addItemToCart(
        product: Product,
        sizeId: string | null,
        halfHalf: boolean,
        secondProductId: string | null
    ) {
        if (halfHalf) {
            if (!secondProductId) {
                toast.warning("Selecione o segundo sabor para pizza meia a meia!");
                return;
            }
            if (secondProductId === product.id) {
                toast.warning("O segundo sabor deve ser diferente do primeiro!");
                return;
            }
        }

        if (product.has_sizes) {
            if (!sizeId) {
                toast.warning(`Selecione um tamanho para ${product.name}!`);
                return;
            }

            const price = getProductPrice(product, sizeId);
            if (price === null) {
                toast.error("Erro ao obter preço do produto!");
                return;
            }

            let finalPrice = price;
            let secondProduct: Product | null = null;
            let secondSizeId: string | null = null;

            if (halfHalf && secondProductId) {
                secondProduct = products.find((p) => p.id === secondProductId) || null;
                if (!secondProduct) {
                    toast.error("Segundo produto não encontrado!");
                    return;
                }
                if (secondProduct.has_sizes) {
                    secondSizeId = sizeId;
                    const secondPrice = getProductPrice(secondProduct, secondSizeId);
                    if (secondPrice === null) {
                        toast.error("Erro ao obter preço do segundo produto!");
                        return;
                    }
                    finalPrice = Math.max(price, secondPrice);
                } else {
                    toast.warning("O segundo produto deve ter tamanhos para pizza meia a meia!");
                    return;
                }
            }

            const matches = (item: OrderItem) => {
                if (halfHalf && secondProductId) {
                    return (
                        item.product_id === product.id &&
                        item.size_id === sizeId &&
                        item.product_id_2 === secondProductId
                    );
                }
                return item.product_id === product.id && item.size_id === sizeId && !item.product_id_2;
            };

            const existingItem = orderItems.find(matches);
            if (existingItem) {
                setOrderItems(
                    orderItems.map((item) => (matches(item) ? { ...item, amount: item.amount + 1 } : item))
                );
            } else {
                setOrderItems([
                    ...orderItems,
                    {
                        product_id: product.id,
                        product,
                        amount: 1,
                        size_id: sizeId,
                        selectedPrice: finalPrice,
                        product_id_2: halfHalf && secondProductId ? secondProductId : null,
                        product_2: halfHalf && secondProduct ? secondProduct : null,
                        size_id_2: halfHalf && secondSizeId ? secondSizeId : null,
                    },
                ]);
            }
        } else {
            if (halfHalf) {
                toast.warning("Pizza meia a meia só está disponível para produtos com tamanhos!");
                return;
            }

            const price = product.price;
            if (!price) {
                toast.error("Produto sem preço definido!");
                return;
            }

            const existingItem = orderItems.find(
                (item) => item.product_id === product.id && item.size_id === null && !item.product_id_2
            );

            if (existingItem) {
                setOrderItems(
                    orderItems.map((item) =>
                        item.product_id === product.id && item.size_id === null && !item.product_id_2
                            ? { ...item, amount: item.amount + 1 }
                            : item
                    )
                );
            } else {
                setOrderItems([
                    ...orderItems,
                    {
                        product_id: product.id,
                        product,
                        amount: 1,
                        size_id: null,
                        selectedPrice: price,
                    },
                ]);
            }
        }
    }

    function handleAddItem(product: Product) {
        const isHalfHalf = halfHalfMode[product.id];
        const secondProductId = selectedSecondFlavor[product.id] || null;
        const sizeId = product.has_sizes
            ? selectedSizes[product.id] || getDefaultSizeId(product)
            : null;

        if (product.has_sizes && sizeId && !selectedSizes[product.id]) {
            setSelectedSizes({ ...selectedSizes, [product.id]: sizeId });
        }

        addItemToCart(product, sizeId, !!isHalfHalf, isHalfHalf ? secondProductId : null);
    }

    function handleQuickAdd(product: Product, sizeId: string) {
        setSelectedSizes({ ...selectedSizes, [product.id]: sizeId });
        addItemToCart(product, sizeId, false, null);
    }

    function handleRemoveItem(productId: string, sizeId: string | null, productId2?: string | null) {
        const existingItem = orderItems.find((item) => {
            if (productId2) {
                return item.product_id === productId && item.size_id === sizeId && item.product_id_2 === productId2;
            }
            return item.product_id === productId && item.size_id === sizeId && !item.product_id_2;
        });

        if (existingItem && existingItem.amount > 1) {
            setOrderItems(
                orderItems.map((item) => {
                    if (productId2) {
                        return item.product_id === productId &&
                            item.size_id === sizeId &&
                            item.product_id_2 === productId2
                            ? { ...item, amount: item.amount - 1 }
                            : item;
                    }
                    return item.product_id === productId && item.size_id === sizeId && !item.product_id_2
                        ? { ...item, amount: item.amount - 1 }
                        : item;
                })
            );
        } else {
            setOrderItems(
                orderItems.filter((item) => {
                    if (productId2) {
                        return !(
                            item.product_id === productId &&
                            item.size_id === sizeId &&
                            item.product_id_2 === productId2
                        );
                    }
                    return !(item.product_id === productId && item.size_id === sizeId && !item.product_id_2);
                })
            );
        }
    }

    function getItemAmount(productId: string, sizeId: string | null, productId2?: string | null): number {
        const item = orderItems.find((item) => {
            if (productId2) {
                return item.product_id === productId && item.size_id === sizeId && item.product_id_2 === productId2;
            }
            return item.product_id === productId && item.size_id === sizeId && !item.product_id_2;
        });
        return item ? item.amount : 0;
    }

    function calculateTotal(): number {
        return orderItems.reduce((total, item) => total + item.selectedPrice * item.amount, 0);
    }

    function getAvailableSecondFlavors(currentProductId: string): Product[] {
        return filteredProducts.filter((p) => p.id !== currentProductId && p.has_sizes);
    }

    function getItemDisplayName(item: OrderItem): string {
        const sizeInfo = item.size_id ? item.product.prices?.find((p) => p.size.id === item.size_id) : undefined;
        if (item.product_id_2 && item.product_2) {
            const sizeDisplay = sizeInfo ? sizeInfo.size.display : "";
            return `Meia: ${item.product.name} / ${item.product_2.name}${sizeDisplay ? ` - ${sizeDisplay}` : ""}`;
        }
        return sizeInfo ? `${item.product.name} - ${sizeInfo.size.display}` : item.product.name;
    }

    function openSplitFlavor(cartIndex: number) {
        const item = orderItems[cartIndex];
        if (!item || item.product_id_2 || !item.size_id) return;
        setSplitFlavor({ cartIndex });
        setSplitSecondFlavorId("");
    }

    function confirmSplitFlavor() {
        if (!splitFlavor) return;

        const item = orderItems[splitFlavor.cartIndex];
        if (!item.size_id) return;

        if (!splitSecondFlavorId) {
            toast.warning("Selecione o segundo sabor!");
            return;
        }

        if (splitSecondFlavorId === item.product_id) {
            toast.warning("O segundo sabor deve ser diferente!");
            return;
        }

        const secondProduct = products.find((p) => p.id === splitSecondFlavorId);
        if (!secondProduct || !secondProduct.has_sizes) {
            toast.error("Segundo produto inválido!");
            return;
        }

        const firstPrice = getProductPrice(item.product, item.size_id);
        const secondPrice = getProductPrice(secondProduct, item.size_id);
        if (firstPrice === null || secondPrice === null) {
            toast.error("Erro ao calcular preço!");
            return;
        }

        const finalPrice = Math.max(firstPrice, secondPrice);
        const amount = item.amount;

        setOrderItems((prev) => {
            const without = prev.filter((_, i) => i !== splitFlavor.cartIndex);
            const existing = without.find(
                (it) =>
                    it.product_id === item.product_id &&
                    it.size_id === item.size_id &&
                    it.product_id_2 === splitSecondFlavorId
            );

            if (existing) {
                return without.map((it) =>
                    it.product_id === item.product_id &&
                    it.size_id === item.size_id &&
                    it.product_id_2 === splitSecondFlavorId
                        ? { ...it, amount: it.amount + amount }
                        : it
                );
            }

            return [
                ...without,
                {
                    ...item,
                    selectedPrice: finalPrice,
                    product_id_2: splitSecondFlavorId,
                    product_2: secondProduct,
                    size_id_2: item.size_id,
                    amount,
                },
            ];
        });

        setSplitFlavor(null);
        setSplitSecondFlavorId("");
        toast.success("Pizza convertida para meia a meia!");
    }

    const handleCreateOrder = useCallback(async () => {
        if (!name || name.trim() === "") {
            toast.warning("Digite o nome do cliente!");
            return;
        }

        if (orderItems.length === 0) {
            toast.warning("Adicione pelo menos um item ao pedido!");
            return;
        }

        const invalidItems = orderItems.filter((item) => item.product.has_sizes && !item.size_id);
        if (invalidItems.length > 0) {
            toast.warning("Alguns produtos com tamanhos não têm tamanho selecionado!");
            return;
        }

        const invalidHalfHalf = orderItems.filter((item) => item.product_id_2 && !item.product_2);
        if (invalidHalfHalf.length > 0) {
            toast.warning("Alguns itens meia a meia não têm segundo sabor selecionado!");
            return;
        }

        setIsCreating(true);
        const token = getCookieClient();

        try {
            const orderResponse = await api.post(
                "/order",
                {
                    table: 0,
                    name: name.trim(),
                    address: address.trim() || null,
                    payment_method: paymentMethod || null,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const orderId = orderResponse.data.id;

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
                    amount: item.amount,
                };

                if (item.product.has_sizes && item.size_id) {
                    payload.size_id = item.size_id;
                }

                if (item.product_id_2) {
                    payload.product_id_2 = item.product_id_2;
                    if (item.size_id_2) payload.size_id_2 = item.size_id_2;
                }

                await api.post("/order/add", payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            await api.put(
                "/order/send",
                { order_id: orderId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Pedido criado com sucesso!");
            router.push("/dashboard");
            router.refresh();
        } catch (error: unknown) {
            console.error("Error creating order:", error);
            const axiosError = error as { response?: { data?: { error?: string } } };
            toast.error(axiosError.response?.data?.error || "Falha ao criar o pedido!");
        } finally {
            setIsCreating(false);
        }
    }, [name, address, paymentMethod, orderItems, router]);

    handleCreateOrderRef.current = () => {
        void handleCreateOrder();
    };

    const splitItem = splitFlavor !== null ? orderItems[splitFlavor.cartIndex] : null;
    const splitFlavorOptions: SelectOption[] = splitItem
        ? getAvailableSecondFlavors(splitItem.product_id).map((p) => ({
              value: p.id,
              label: p.name,
          }))
        : [];

    return (
        <main className={styles.page}>
            <header className={styles.topBar}>
                <h1>Novo Pedido</h1>
                <section className={styles.orderInfo}>
                    <div className={styles.nameInputContainer}>
                        <input
                            ref={nameInputRef}
                            type="text"
                            placeholder="Nome do cliente"
                            value={name}
                            onChange={handleNameChange}
                            onFocus={() => {
                                if (clientSuggestions.length > 0) setShowSuggestions(true);
                            }}
                            className={styles.input}
                            required
                        />
                        {showSuggestions && clientSuggestions.length > 0 && (
                            <div ref={suggestionsRef} className={styles.clientSuggestions}>
                                {isSearchingClients ? (
                                    <div className={styles.suggestionItem}>
                                        <span>Buscando...</span>
                                    </div>
                                ) : (
                                    clientSuggestions.map((client, index) => (
                                        <div
                                            key={`${client.name}-${index}`}
                                            className={styles.suggestionItem}
                                            onClick={() => handleSelectClient(client)}
                                        >
                                            <span className={styles.clientName}>{client.name}</span>
                                            {client.address && (
                                                <span className={styles.clientAddress}>{client.address}</span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                    <input
                        type="text"
                        placeholder="Endereço de entrega (opcional)"
                        value={address}
                        onChange={(e) => setAddress(e.target.value.toUpperCase())}
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
            </header>

            <section className={styles.productsSection}>
                <div className={styles.productsHeader}>
                    <h2>Produtos</h2>
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
                                ? "Nenhum produto nesta categoria."
                                : products.length === 0
                                  ? "Nenhum produto cadastrado. Configure em Produtos no menu."
                                  : "Nenhum produto encontrado."}
                        </span>
                    ) : (
                        filteredProducts.map((product) => {
                            const hasSizes = product.has_sizes;
                            const sortedPrices = hasSizes && product.prices ? sortProductPrices(product.prices) : [];
                            const selectedSizeId = selectedSizes[product.id];
                            const isHalfHalf = halfHalfMode[product.id] || false;
                            const selectedSecondProductId = selectedSecondFlavor[product.id] || "";
                            const showOptions = expandedOptions[product.id];
                            const defaultSizeId = getDefaultSizeId(product);

                            const itemAmount = hasSizes
                                ? isHalfHalf && selectedSecondProductId && selectedSizeId
                                    ? getItemAmount(product.id, selectedSizeId, selectedSecondProductId)
                                    : selectedSizeId
                                      ? getItemAmount(product.id, selectedSizeId)
                                      : 0
                                : getItemAmount(product.id, null);

                            const availableSecondFlavors = getAvailableSecondFlavors(product.id);
                            const secondFlavorOptions: SelectOption[] = availableSecondFlavors.map((p) => ({
                                value: p.id,
                                label: p.name,
                            }));

                            return (
                                <div key={product.id} className={styles.productCard}>
                                    <div className={styles.productRow}>
                                        <h3>{product.name}</h3>
                                        {!hasSizes && (
                                            <div className={styles.quickActions}>
                                                {itemAmount > 0 ? (
                                                    <div className={styles.quantityControl}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItem(product.id, null)}
                                                            className={styles.quantityButton}
                                                        >
                                                            <Minus size={18} />
                                                        </button>
                                                        <span className={styles.quantity}>{itemAmount}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddItem(product)}
                                                            className={styles.quantityButton}
                                                        >
                                                            <Plus size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddItem(product)}
                                                        className={styles.quickAddBtn}
                                                    >
                                                        <Plus size={16} />
                                                        {product.price != null
                                                            ? `R$ ${product.price.toFixed(2)}`
                                                            : "Add"}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {hasSizes && (
                                        <div className={styles.quickSizeRow}>
                                            {sortedPrices.map((priceInfo) => {
                                                const qty = getItemAmount(product.id, priceInfo.size.id);
                                                return (
                                                    <button
                                                        key={priceInfo.size.id}
                                                        type="button"
                                                        className={`${styles.quickSizeBtn} ${
                                                            selectedSizeId === priceInfo.size.id
                                                                ? styles.quickSizeBtnActive
                                                                : ""
                                                        }`}
                                                        onClick={() => handleQuickAdd(product, priceInfo.size.id)}
                                                        title={`${priceInfo.size.display} - R$ ${priceInfo.price.toFixed(2)}`}
                                                    >
                                                        <span className={styles.quickSizeLabel}>
                                                            {priceInfo.size.name}
                                                        </span>
                                                        {qty > 0 && <span className={styles.quickSizeBadge}>{qty}</span>}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                type="button"
                                                className={styles.optionsBtn}
                                                onClick={() => toggleOptions(product.id)}
                                                title="Meia a meia e opções"
                                            >
                                                <Settings2 size={16} />
                                            </button>
                                        </div>
                                    )}

                                    {hasSizes && showOptions && (
                                        <div className={styles.advancedOptions}>
                                            <p className={styles.optionsHint}>
                                                Tamanho ativo:{" "}
                                                {selectedSizeId
                                                    ? sortedPrices.find((p) => p.size.id === selectedSizeId)?.size
                                                          .display
                                                    : defaultSizeId
                                                      ? sortedPrices.find((p) => p.size.id === defaultSizeId)?.size
                                                            .display
                                                      : "clique em P/M/G acima"}
                                            </p>
                                            <div className={styles.sizesGridCompact}>
                                                {sortedPrices.map((priceInfo) => (
                                                    <button
                                                        key={priceInfo.size.id}
                                                        type="button"
                                                        onClick={() => handleSelectSize(product.id, priceInfo.size.id)}
                                                        className={`${styles.sizeButton} ${
                                                            selectedSizeId === priceInfo.size.id
                                                                ? styles.sizeButtonActive
                                                                : ""
                                                        }`}
                                                    >
                                                        {priceInfo.size.name} — R$ {priceInfo.price.toFixed(2)}
                                                    </button>
                                                ))}
                                            </div>
                                            <label className={styles.halfHalfCheckbox}>
                                                <input
                                                    type="checkbox"
                                                    checked={isHalfHalf}
                                                    onChange={() => toggleHalfHalf(product.id)}
                                                />
                                                <span>Meia a meia</span>
                                            </label>
                                            {isHalfHalf && (
                                                <Select
                                                    options={secondFlavorOptions}
                                                    value={selectedSecondProductId}
                                                    onChange={(value) =>
                                                        handleSelectSecondFlavor(product.id, value)
                                                    }
                                                    placeholder="Segundo sabor"
                                                    className={styles.secondFlavorSelect}
                                                />
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleAddItem(product)}
                                                className={styles.addWithOptionsBtn}
                                                disabled={isHalfHalf && !selectedSecondProductId}
                                            >
                                                <Plus size={18} />
                                                Adicionar
                                                {isHalfHalf ? " (meia a meia)" : ""}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            <footer className={styles.cartFooter}>
                {orderItems.length > 0 ? (
                    <div className={styles.cartItemsScroll}>
                        {orderItems.map((item, index) => (
                            <div
                                key={`${item.product_id}-${item.size_id || "no"}-${item.product_id_2 || ""}-${index}`}
                                className={styles.cartItem}
                            >
                                <div className={styles.cartItemInfo}>
                                    <span className={styles.cartItemName}>{getItemDisplayName(item)}</span>
                                    <span className={styles.cartItemMeta}>
                                        {item.amount}x R$ {item.selectedPrice.toFixed(2)}
                                    </span>
                                </div>
                                <div className={styles.cartItemActions}>
                                    {!item.product_id_2 && item.size_id && item.product.has_sizes && (
                                        <button
                                            type="button"
                                            className={styles.splitBtn}
                                            onClick={() => openSplitFlavor(index)}
                                        >
                                            Meia
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleRemoveItem(
                                                item.product_id,
                                                item.size_id,
                                                item.product_id_2 || undefined
                                            )
                                        }
                                        className={styles.cartRemoveBtn}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={styles.cartEmpty}>Adicione itens tocando nos tamanhos (P, M, G…)</p>
                )}
                <div className={styles.cartFooterRow}>
                    <div className={styles.cartTotal}>
                        <span className={styles.cartTotalLabel}>Total</span>
                        <span className={styles.cartTotalValue}>R$ {calculateTotal().toFixed(2)}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => void handleCreateOrder()}
                        disabled={!canFinalize}
                        className={styles.finalizeButton}
                    >
                        {isCreating ? "Salvando…" : "Finalizar pedido"}
                    </button>
                </div>
                <span className={styles.keyboardHint}>F2 ou Ctrl+Enter para finalizar</span>
            </footer>

            {splitFlavor !== null && splitItem && (
                <div className={styles.splitOverlay} onClick={() => setSplitFlavor(null)}>
                    <div className={styles.splitModal} onClick={(e) => e.stopPropagation()}>
                        <h3>Meia a meia</h3>
                        <p>
                            {splitItem.product.name}
                            {splitItem.size_id &&
                                ` — ${splitItem.product.prices?.find((p) => p.size.id === splitItem.size_id)?.size.display}`}
                        </p>
                        <Select
                            options={splitFlavorOptions}
                            value={splitSecondFlavorId}
                            onChange={setSplitSecondFlavorId}
                            placeholder="Segundo sabor"
                            className={styles.secondFlavorSelect}
                        />
                        <div className={styles.splitModalActions}>
                            <button type="button" className={styles.splitCancel} onClick={() => setSplitFlavor(null)}>
                                Cancelar
                            </button>
                            <button type="button" className={styles.splitConfirm} onClick={confirmSplitFlavor}>
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
