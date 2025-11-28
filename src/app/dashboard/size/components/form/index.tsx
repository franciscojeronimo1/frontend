"use client";
import styles from "./styles.module.scss";
import { useState} from "react";
import { api } from "@/services/api";
import { getCookieClient } from '@/lib/cookieClient';
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Size } from "@/lib/types";
import { Trash2 } from "lucide-react";
import { ConfirmModal } from "@/app/dashboard/components/confirm-modal";

interface Props {
    sizes: Size[];
}

const DEFAULT_SIZES = [
    { name: "P", display: "Pequena", order: 1 },
    { name: "M", display: "Média", order: 2 },
    { name: "G", display: "Grande", order: 3 },
    { name: "F", display: "Família", order: 4 }
];

export function SizeForm({ sizes }: Props) {
    const router = useRouter();
    const [existingSizes, setExistingSizes] = useState<Size[]>(sizes);
    const [isCreating, setIsCreating] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; sizeId: string; sizeName: string }>({
        isOpen: false,
        sizeId: "",
        sizeName: ""
    });

    async function handleCreateSize(size: { name: string; display: string; order: number }) {
        const token = getCookieClient();

        try {
            await api.post("/size", {
                name: size.name,
                display: size.display,
                order: size.order
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            toast.success(`Tamanho ${size.display} criado com sucesso!`);
            
            // Atualizar lista de tamanhos
            const response = await api.get("/sizes", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setExistingSizes(response.data || []);
        } catch (error: any) {
            console.error("Error creating size:", error);
            const errorMessage = error.response?.data?.error || "Falha ao criar tamanho!";
            toast.error(errorMessage);
        }
    }

    async function handleCreateAllSizes() {
        if (isCreating) return;

        setIsCreating(true);
        const token = getCookieClient();

        try {
            // Verificar quais tamanhos já existem
            const existingNames = existingSizes.map(s => s.name);
            const sizesToCreate = DEFAULT_SIZES.filter(s => !existingNames.includes(s.name));

            if (sizesToCreate.length === 0) {
                toast.info("Todos os tamanhos já foram criados!");
                setIsCreating(false);
                return;
            }

            // Criar todos os tamanhos que faltam
            for (const size of sizesToCreate) {
                await api.post("/size", {
                    name: size.name,
                    display: size.display,
                    order: size.order
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }

            toast.success(`${sizesToCreate.length} tamanho(s) criado(s) com sucesso!`);
            
            // Atualizar lista
            const response = await api.get("/sizes", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setExistingSizes(response.data || []);
        } catch (error: unknown) {
            console.error("Error creating sizes:", error);
            toast.error("Falha ao criar tamanhos!");
        } finally {
            setIsCreating(false);
        }
    }

   

    function handleDeleteSize(sizeId: string, sizeName: string) {
        setDeleteModal({
            isOpen: true,
            sizeId,
            sizeName
        });
    }

    function handleCloseDeleteModal() {
        setDeleteModal({
            isOpen: false,
            sizeId: "",
            sizeName: ""
        });
    }

    async function handleConfirmDelete() {
        const { sizeId, sizeName } = deleteModal;
        const token = getCookieClient();

        try {
            await api.delete(`/size?size_id=${sizeId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            toast.success(`Tamanho "${sizeName}" deletado com sucesso!`);
            
            // Atualizar lista
            const response = await api.get("/sizes", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setExistingSizes(response.data || []);
        } catch (error: unknown) {
            console.error("Error deleting size:", error);
            const axiosError = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
            const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Falha ao deletar tamanho!";
            toast.error(errorMessage);
        }
    }

    return (
        <main className={styles.container}>
            <h1>Gerenciar Tamanhos</h1>

            <div className={styles.info}>
                <p>Os tamanhos padrão são: P (Pequena), M (Média), G (Grande) e F (Família)</p>
            </div>

            {existingSizes.length < 4 && (
                <div className={styles.createAllContainer}>
                    <button
                        type="button"
                        onClick={handleCreateAllSizes}
                        disabled={isCreating}
                        className={styles.createAllButton}
                    >
                        {isCreating ? "Criando..." : "Criar Todos os Tamanhos Padrão"}
                    </button>
                </div>
            )}

            <section className={styles.sizesList}>
                <h2>Tamanhos Cadastrados</h2>
                {existingSizes.length === 0 ? (
                    <span className={styles.emptyMessage}>
                        Nenhum tamanho cadastrado. Clique no botão acima para criar os tamanhos padrão.
                    </span>
                ) : (
                    <div className={styles.sizesGrid}>
                        {existingSizes
                            .sort((a, b) => a.order - b.order)
                            .map(size => (
                                <div key={size.id} className={styles.sizeCard}>
                                    <div className={styles.sizeCardContent}>
                                        <span className={styles.sizeName}>{size.name}</span>
                                        <span className={styles.sizeDisplay}>{size.display}</span>
                                        <span className={styles.sizeOrder}>Ordem: {size.order}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteSize(size.id, size.display)}
                                        className={styles.deleteButton}
                                        title={`Deletar ${size.display}`}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                    </div>
                )}
            </section>

            <div className={styles.actions}>
                <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className={styles.backButton}
                >
                    Voltar ao Dashboard
                </button>
            </div>

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                title="Deletar Tamanho"
                message={`Tem certeza que deseja deletar o tamanho "${deleteModal.sizeName}"?\n\nEsta ação não pode ser desfeita.`}
                confirmText="Deletar"
                cancelText="Cancelar"
                confirmButtonColor="danger"
            />
        </main>
    );
}

