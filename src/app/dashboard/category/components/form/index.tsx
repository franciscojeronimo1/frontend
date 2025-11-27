"use client";
import styles from "../../styles.module.scss";
import { useState, useEffect } from "react";
import { Button } from "@/app/dashboard/components/button";
import { api } from "@/services/api";
import { getCookieClient } from '@/lib/cookieClient';
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Size, Category } from "@/lib/types";
import { Trash2 } from "lucide-react";
import { ConfirmModal } from "@/app/dashboard/components/confirm-modal";

interface Props {
    sizes: Size[];
    categories: Category[];
}

export function CategoryForm({ sizes, categories: initialCategories }: Props) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [hasSizes, setHasSizes] = useState(false);
    const [sizePrices, setSizePrices] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; categoryId: string; categoryName: string }>({
        isOpen: false,
        categoryId: "",
        categoryName: ""
    });

    // Inicializar preços vazios para cada tamanho
    useEffect(() => {
        if (hasSizes && sizes.length > 0) {
            const initialPrices: Record<string, string> = {};
            sizes.forEach(size => {
                initialPrices[size.id] = "";
            });
            setSizePrices(initialPrices);
        }
    }, [hasSizes, sizes]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        if (!name || name.trim() === "") {
            toast.warning("Digite o nome da categoria!");
            setIsSubmitting(false);
            return;
        }

        if (hasSizes) {
            // Validar que todos os tamanhos têm preço
            const missingPrices = sizes.filter(size => !sizePrices[size.id] || sizePrices[size.id].trim() === "");
            if (missingPrices.length > 0) {
                toast.warning(`Preencha o preço para todos os tamanhos! Faltam: ${missingPrices.map(s => s.display).join(", ")}`);
                setIsSubmitting(false);
                return;
            }

            // Validar que os preços são números válidos
            for (const size of sizes) {
                const price = parseFloat(sizePrices[size.id]);
                if (isNaN(price) || price <= 0) {
                    toast.warning(`Preço inválido para ${size.display}!`);
                    setIsSubmitting(false);
                    return;
                }
            }
        }

        const token = getCookieClient();

        try {
            interface CategoryData {
                name: string;
                has_sizes: boolean;
                size_prices?: Array<{
                    size_id: string;
                    price: number;
                }>;
            }

            const data: CategoryData = {
                name: name.trim(),
                has_sizes: hasSizes
            };

            if (hasSizes) {
                data.size_prices = sizes.map(size => ({
                    size_id: size.id,
                    price: parseFloat(sizePrices[size.id])
                }));
                
             
            }

            
            
            await api.post("/category", data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
           

            toast.success("Categoria cadastrada com sucesso!");
            
            // Atualizar lista de categorias
            const categoriesResponse = await api.get("/category", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setCategories(categoriesResponse.data || []);
            
            // Limpar formulário
            setName("");
            setHasSizes(false);
            setSizePrices({});
            
            router.refresh();
        } catch (error: unknown) {
            console.error("Error creating category:", error);
           
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleOpenDeleteModal(categoryId: string, categoryName: string) {
        setDeleteModal({
            isOpen: true,
            categoryId,
            categoryName
        });
    }

    function handleCloseDeleteModal() {
        setDeleteModal({
            isOpen: false,
            categoryId: "",
            categoryName: ""
        });
    }

    async function handleConfirmDelete() {
        const { categoryId, categoryName } = deleteModal;
        const token = getCookieClient();

        try {
            await api.delete(`/category?category_id=${categoryId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            toast.success(`Categoria "${categoryName}" deletada com sucesso!`);
            
            // Atualizar lista
            const response = await api.get("/category", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setCategories(response.data || []);
            
            router.refresh();
        } catch (error: unknown) {
            console.error("Error deleting category:", error);
            const axiosError = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
            const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Falha ao deletar categoria!";
            toast.error(errorMessage);
        }
    }

    return (
        <main className={styles.container}>
            <h1>Nova Categoria</h1>
            <form className={styles.form} onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="name"
                    placeholder="Nome da categoria, ex: Pizzas"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={styles.input}
                />

                <div className={styles.checkboxContainer}>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={hasSizes}
                            onChange={(e) => setHasSizes(e.target.checked)}
                            className={styles.checkbox}
                        />
                        <span>Esta categoria tem tamanhos (P, M, G, F)</span>
                    </label>
                </div>

                {hasSizes && sizes.length > 0 && (
                    <div className={styles.sizesSection}>
                        <h3>Preços por Tamanho</h3>
                        <p className={styles.infoText}>
                            Defina o preço para cada tamanho. Todos os produtos desta categoria usarão estes preços por padrão.
                        </p>
                        <div className={styles.sizePricesGrid}>
                            {sizes
                                .sort((a, b) => a.order - b.order)
                                .map(size => (
                                    <div key={size.id} className={styles.sizePriceInput}>
                                        <label>{size.display} ({size.name})</label>
                                        <div className={styles.priceInputWrapper}>
                                            <span className={styles.currency}>R$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                value={sizePrices[size.id] || ""}
                                                onChange={(e) => setSizePrices({
                                                    ...sizePrices,
                                                    [size.id]: e.target.value
                                                })}
                                                required={hasSizes}
                                                className={styles.priceInput}
                                            />
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {hasSizes && sizes.length === 0 && (
                    <div className={styles.warning}>
                        <p>⚠️ Nenhum tamanho cadastrado. Cadastre os tamanhos primeiro em <strong>/dashboard/size</strong></p>
                    </div>
                )}

                <Button name={isSubmitting ? "Cadastrando..." : "Cadastrar"} />
            </form>

            <section className={styles.categoriesList}>
                <h2>Categorias Cadastradas</h2>
                {categories.length === 0 ? (
                    <span className={styles.emptyMessage}>
                        Nenhuma categoria cadastrada.
                    </span>
                ) : (
                    <div className={styles.categoriesGrid}>
                        {categories.map(category => (
                            <div key={category.id} className={styles.categoryCard}>
                                <div className={styles.categoryCardContent}>
                                    <h3>{category.name}</h3>
                                    <span className={styles.categoryInfo}>
                                        {category.has_sizes ? "Com tamanhos" : "Sem tamanhos"}
                                    </span>
                                    {category.has_sizes && category.size_prices && category.size_prices.length > 0 && (
                                        <div className={styles.categoryPrices}>
                                            {category.size_prices
                                                .sort((a, b) => (a.size?.order || 0) - (b.size?.order || 0))
                                                .slice(0, 2)
                                                .map(sp => (
                                                    <span key={sp.size_id} className={styles.priceTag}>
                                                        {sp.size?.name || '?'}: R$ {sp.price.toFixed(2)}
                                                    </span>
                                                ))}
                                            {category.size_prices.length > 2 && (
                                                <span className={styles.morePrices}>+{category.size_prices.length - 2}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleOpenDeleteModal(category.id, category.name)}
                                    className={styles.deleteButton}
                                    title={`Deletar ${category.name}`}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                title="Deletar Categoria"
                message={`Tem certeza que deseja deletar a categoria "${deleteModal.categoryName}"?\n\n⚠️ ATENÇÃO: Todos os produtos desta categoria também serão deletados!\n\nEsta ação não pode ser desfeita.`}
                confirmText="Deletar"
                cancelText="Cancelar"
                confirmButtonColor="danger"
            />
        </main>
    );
}

