"use client";
import styles from "./styles.module.scss";
import { useState } from "react";
import { api } from "@/services/api";
import { getCookieClient } from '@/lib/cookieClient';
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/types";
import { Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { ConfirmModal } from "@/app/dashboard/components/confirm-modal";

interface Props {
    products: Product[];
}

export function ProductsList({ products: initialProducts }: Props) {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; productId: string; productName: string }>({
        isOpen: false,
        productId: "",
        productName: ""
    });

    function handleOpenDeleteModal(productId: string, productName: string) {
        setDeleteModal({
            isOpen: true,
            productId,
            productName
        });
    }

    function handleCloseDeleteModal() {
        setDeleteModal({
            isOpen: false,
            productId: "",
            productName: ""
        });
    }

    async function handleConfirmDelete() {
        const { productId, productName } = deleteModal;
        const token = getCookieClient();

        try {
            await api.delete(`/product?product_id=${productId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            toast.success(`Produto "${productName}" deletado com sucesso!`);
            
            // Remover produto da lista
            setProducts(products.filter(p => p.id !== productId));
            
            router.refresh();
        } catch (error: unknown) {
            console.error("Error deleting product:", error);
            const axiosError = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
            const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Falha ao deletar produto!";
            toast.error(errorMessage);
        }
    }

    // Agrupar produtos por categoria
    const productsByCategory = products.reduce((acc, product) => {
        const categoryName = product.category?.name || "Sem categoria";
        if (!acc[categoryName]) {
            acc[categoryName] = [];
        }
        acc[categoryName].push(product);
        return acc;
    }, {} as Record<string, Product[]>);

    return (
        <main className={styles.container}>
            <div className={styles.header}>
                <h1>Produtos Cadastrados</h1>
                <Link href="/dashboard/product" className={styles.addButton}>
                    <Plus size={20} />
                    Novo Produto
                </Link>
            </div>

            {products.length === 0 ? (
                <div className={styles.emptyMessage}>
                    <p>Nenhum produto cadastrado.</p>
                    <Link href="/dashboard/product" className={styles.linkButton}>
                        Criar primeiro produto
                    </Link>
                </div>
            ) : (
                <div className={styles.categoriesContainer}>
                    {Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => (
                        <section key={categoryName} className={styles.categorySection}>
                            <h2>{categoryName}</h2>
                            <div className={styles.productsGrid}>
                                {categoryProducts.map(product => (
                                    <div key={product.id} className={styles.productCard}>
                                        <div className={styles.productCardContent}>
                                            <h3>{product.name}</h3>
                                            {product.description && (
                                                <p className={styles.description}>{product.description}</p>
                                            )}
                                            <div className={styles.productInfo}>
                                                {product.has_sizes ? (
                                                    <div className={styles.sizesInfo}>
                                                        <span className={styles.infoTag}>Com tamanhos</span>
                                                        {product.prices && product.prices.length > 0 && (
                                                            <div className={styles.pricesPreview}>
                                                                {product.prices
                                                                    .sort((a, b) => a.size.order - b.size.order)
                                                                    .slice(0, 2)
                                                                    .map(price => (
                                                                        <span key={price.size.id} className={styles.priceTag}>
                                                                            {price.size.name}: R$ {price.price.toFixed(2)}
                                                                        </span>
                                                                    ))}
                                                                {product.prices.length > 2 && (
                                                                    <span className={styles.morePrices}>+{product.prices.length - 2}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className={styles.priceInfo}>
                                                        <span className={styles.infoTag}>Preço fixo</span>
                                                        {product.price && (
                                                            <span className={styles.fixedPrice}>R$ {product.price.toFixed(2)}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenDeleteModal(product.id, product.name)}
                                            className={styles.deleteButton}
                                            title={`Deletar ${product.name}`}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                title="Deletar Produto"
                message={`Tem certeza que deseja deletar o produto "${deleteModal.productName}"?\n\nEsta ação não pode ser desfeita.`}
                confirmText="Deletar"
                cancelText="Cancelar"
                confirmButtonColor="danger"
            />
        </main>
    );
}

