"use client";
import styles from "./styles.module.scss";
// import { UploadCloud } from "lucide-react";
// import { ChangeEvent, useState, useEffect } from "react";
import { useState, useEffect } from "react";
// import Image from "next/image";
import { Button } from "@/app/dashboard/components/button";
import { api } from "@/services/api";
import { getCookieClient } from '@/lib/cookieClient';
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Category, Size } from "@/lib/types";

interface Props {
    categories: Category[];
    sizes: Size[];
}

export function Form({ categories, sizes }: Props) {
    const router = useRouter();
    // const [image, setImage] = useState<File | null>();
    // const [previewImage, setPreviewImage] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
    const [hasCustomPrices, setHasCustomPrices] = useState(false);
    const [price, setPrice] = useState("");
    const [sizePrices, setSizePrices] = useState<Record<string, string>>({});

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const categoryHasSizes = selectedCategory?.has_sizes || false;
    
    // Debug: verificar categoria selecionada
    useEffect(() => {
        if (selectedCategory) {
           

        } else if (selectedCategoryId) {
           
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategoryId]); // Apenas selectedCategoryId como dependência para evitar mudanças de tamanho

    // Inicializar preços quando categoria muda
    useEffect(() => {
        if (categoryHasSizes && sizes.length > 0) {
            const initialPrices: Record<string, string> = {};
            sizes.forEach(size => {
                initialPrices[size.id] = "";
            });
            setSizePrices(initialPrices);
        } else {
            setSizePrices({});
        }
        setHasCustomPrices(false);
        setPrice("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategoryId, categoryHasSizes]); // Removido sizes para evitar mudança de tamanho do array

    async function handleRegisterProduct(e: React.FormEvent) {
        e.preventDefault();

        const formData = new FormData(e.target as HTMLFormElement);
        const categoryId = formData.get("category");
        const name = formData.get("name");
        const description = formData.get("description");

        if (!name || !categoryId) {
            toast.warning("Preencha o nome do produto e selecione uma categoria!");
            return;
        }

        const category = categories.find(c => c.id === categoryId);
        if (!category) {
            toast.error("Categoria não encontrada!");
            return;
        }

        // Validações
        if (category.has_sizes) {
            // Só validar preços se estiver usando preços individuais
            if (hasCustomPrices) {
                // Validar preços individuais
                const missingPrices = sizes.filter(size => !sizePrices[size.id] || sizePrices[size.id].trim() === "");
                if (missingPrices.length > 0) {
                    toast.warning(`Preencha o preço para todos os tamanhos! Faltam: ${missingPrices.map(s => s.display).join(", ")}`);
                    return;
                }

                for (const size of sizes) {
                    const priceValue = parseFloat(sizePrices[size.id]);
                    if (isNaN(priceValue) || priceValue <= 0) {
                        toast.warning(`Preço inválido para ${size.display}!`);
                        return;
                    }
                }
            }
            // Se não está usando preços individuais, usa os preços da categoria (não precisa validar)
        } else {
            // Categoria sem tamanhos - precisa de preço fixo
            if (!price || price.trim() === "") {
                toast.warning("Digite o preço do produto!");
                return;
            }
            const priceValue = parseFloat(price);
            if (isNaN(priceValue) || priceValue <= 0) {
                toast.warning("Preço inválido!");
                return;
            }
        }

        const data = new FormData();
        data.append("name", name as string);
        // Sempre enviar description, mesmo que vazio (backend exige o campo)
        data.append("description", (description as string) || "");
        data.append("category_id", category.id);
        // if (image) {
        //     data.append("file", image);
        // }

        if (category.has_sizes) {
            // Backend aceita: has_custom_prices como "true"/true e custom_prices como string JSON
            if (hasCustomPrices) {
                data.append("has_custom_prices", "true"); // Backend aceita string "true" ou boolean true
                const customPrices = sizes.map(size => ({
                    size_id: size.id,
                    price: parseFloat(sizePrices[size.id])
                }));
                data.append("custom_prices", JSON.stringify(customPrices)); // Backend faz parse da string JSON
                
               
            }
            // Quando não usa preços individuais, não enviar has_custom_prices
            // Backend assume false por padrão (ou pode enviar explicitamente "false")
          
        } else {
            // Produto sem tamanhos - precisa de preço fixo
            if (price) {
                data.append("price", price);
                
            }
        }

 
        const formDataEntries: string[] = [];
        for (const [key, value] of data.entries()) {
            if (key === "file") {
                console.log(`  ${key}: [File] ${(value as File).name}`);
                formDataEntries.push(`${key}: [File]`);
            } else {
                console.log(`  ${key}: ${value}`);
                formDataEntries.push(`${key}: ${value}`);
            }
        }
        

        const token = getCookieClient();

        try {
           
            await api.post("/product", data, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            

            toast.success("Produto cadastrado com sucesso!");
            router.push("/dashboard");
            router.refresh();
        } catch (error: unknown) {
            
            
        }
    }

    // function handleFile(e: ChangeEvent<HTMLInputElement>) {
    //     if (e.target.files && e.target.files[0]) {
    //         const image = e.target.files[0];
    //         if (image.type !== "image/png" && image.type !== "image/jpeg") {
    //             toast.warning("Apenas são aceitos arquivos PNG e JPEG.");
    //             return;
    //         }

    //         setImage(image);
    //         setPreviewImage(URL.createObjectURL(image));
    //     }
    // }

    return (
        <main className={styles.container}>
            <h1>Novo Produto</h1>
            <form className={styles.form} onSubmit={handleRegisterProduct}>
                {/* Campo de imagem temporariamente desabilitado */}
                {/* <label className={styles.labelImage}>
                    <span>
                        <UploadCloud size={30} color="#FFF" />
                    </span>
                    <input
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handleFile}
                        required={false}
                    />
                    <span style={{ marginTop: '8px', fontSize: '0.875rem', color: '#999', display: 'block' }}>
                        Imagem do produto (opcional)
                    </span>

                    {previewImage && (
                        <Image
                            src={previewImage}
                            alt="Imagem do produto"
                            className={styles.preview}
                            fill={true}
                            quality={100}
                            priority={true}
                        />
                    )}
                </label> */}

                <select
                    name="category"
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    required
                >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name} {category.has_sizes ? "(com tamanhos)" : "(sem tamanhos)"}
                        </option>
                    ))}
                </select>

                <input
                    type="text"
                    name="name"
                    placeholder="Digite o nome do produto..."
                    required
                    className={styles.input}
                />

                <textarea
                    name="description"
                    placeholder="Descrição do produto (opcional)..."
                    required={false}
                    className={styles.input}
                />

                {categoryHasSizes ? (
                    <div className={styles.sizesSection}>
                        {sizes.length === 0 ? (
                            <div className={styles.warning}>
                                <p>⚠️ Nenhum tamanho cadastrado. Cadastre os tamanhos primeiro em <strong>/dashboard/size</strong></p>
                                <p style={{ marginTop: '8px', fontSize: '0.875rem', color: '#999' }}>
                                    Ou use os preços padrão da categoria "{selectedCategory?.name}"
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className={styles.checkboxContainer}>
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={hasCustomPrices}
                                            onChange={(e) => setHasCustomPrices(e.target.checked)}
                                            className={styles.checkbox}
                                        />
                                        <span>Usar preços individuais (diferentes da categoria)</span>
                                    </label>
                                </div>

                                {hasCustomPrices ? (
                                    <div className={styles.customPricesSection}>
                                        <h3>Preços Individuais por Tamanho</h3>
                                        <p className={styles.infoText}>
                                            Defina o preço para cada tamanho. Todos os campos são obrigatórios quando usar preços individuais.
                                        </p>
                                        <div className={styles.sizePricesGrid}>
                                            {sizes
                                                .sort((a, b) => a.order - b.order)
                                                .map(size => (
                                                    <div key={size.id} className={styles.sizePriceInput}>
                                                        <label>{size.display} ({size.name}) *</label>
                                                        <div className={styles.priceInputWrapper}>
                                                            <span className={styles.currency}>R$</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0.01"
                                                                placeholder="0.00"
                                                                value={sizePrices[size.id] || ""}
                                                                onChange={(e) => setSizePrices({
                                                                    ...sizePrices,
                                                                    [size.id]: e.target.value
                                                                })}
                                                                required={true}
                                                                className={styles.priceInput}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.infoBox}>
                                        <p>✓ Este produto usará os preços definidos na categoria "{selectedCategory?.name}"</p>
                                        {selectedCategory?.size_prices && selectedCategory.size_prices.length > 0 && (
                                            <div style={{ marginTop: '12px', fontSize: '0.875rem' }}>
                                                <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>Preços da categoria:</p>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                                                    {selectedCategory.size_prices
                                                        .sort((a, b) => (a.size?.order || 0) - (b.size?.order || 0))
                                                        .map(sp => (
                                                            <div key={sp.size_id} style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                                                                <strong>{sp.size?.display || 'Tamanho'}</strong>: R$ {sp.price.toFixed(2)}
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <div className={styles.priceSection}>
                        <label>Preço do Produto</label>
                        <div className={styles.priceInputWrapper}>
                            <span className={styles.currency}>R$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required={!categoryHasSizes}
                                className={styles.priceInput}
                            />
                        </div>
                    </div>
                )}

                <Button name="Cadastrar produto" />
            </form>
        </main>
    );
}
