"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { dismissSetupChecklist, isSetupDismissed } from "@/lib/orderFormStorage";
import styles from "./styles.module.scss";

export interface SetupStatus {
    sizesCount: number;
    categoriesCount: number;
    productsCount: number;
}

interface Props {
    status: SetupStatus;
}

type StepDef = {
    key: string;
    label: string;
    description: string;
    href: string;
    optional?: boolean;
    isDone: (s: SetupStatus) => boolean;
};

const STEPS: StepDef[] = [
    {
        key: "categories",
        label: "Categoria",
        description: 'Ex.: "Lanches", "Bebidas" ou "Pizzas"',
        href: "/dashboard/category",
        isDone: (s) => s.categoriesCount > 0,
    },
    {
        key: "products",
        label: "Produtos",
        description: "Cadastre os itens do seu cardápio",
        href: "/dashboard/product",
        isDone: (s) => s.productsCount > 0,
    },
    {
        key: "order",
        label: "Primeiro pedido",
        description: "Teste criando um pedido de delivery",
        href: "/dashboard/order",
        isDone: (s) => s.productsCount > 0,
    },
    {
        key: "sizes",
        label: "Tamanhos",
        description: "Opcional — use se vender por tamanho (P/M/G, porção, etc.)",
        href: "/dashboard/size",
        optional: true,
        isDone: (s) => s.sizesCount > 0,
    },
];

const REQUIRED_STEPS = STEPS.filter((s) => !s.optional);

function isSetupComplete(status: SetupStatus): boolean {
    return status.categoriesCount > 0 && status.productsCount > 0;
}

function isPreviousRequiredDone(stepIndex: number, status: SetupStatus): boolean {
    const previousRequired = STEPS.slice(0, stepIndex).filter((s) => !s.optional);
    if (previousRequired.length === 0) return true;
    return previousRequired.every((s) => s.isDone(status));
}

export function SetupChecklist({ status }: Props) {
    const [visible, setVisible] = useState(false);
    const complete = isSetupComplete(status);

    useEffect(() => {
        if (complete) {
            setVisible(false);
            return;
        }
        setVisible(!isSetupDismissed());
    }, [complete]);

    if (!visible || complete) {
        return null;
    }

    function handleDismiss() {
        dismissSetupChecklist();
        setVisible(false);
    }

    const requiredDoneCount = REQUIRED_STEPS.filter((s) => s.isDone(status)).length;

    return (
        <section className={styles.checklist}>
            <div className={styles.header}>
                <div>
                    <h2>Configure seu delivery</h2>
                    <p>Complete os passos para começar a receber pedidos. Tamanhos são opcionais.</p>
                </div>
                <span className={styles.progress}>
                    {requiredDoneCount}/{REQUIRED_STEPS.length}
                </span>
            </div>
            <ol className={styles.steps}>
                {STEPS.map((step, index) => {
                    const done = step.isDone(status);
                    const canAccess = step.optional || isPreviousRequiredDone(index, status);
                    const isFirstRequired =
                        !step.optional && REQUIRED_STEPS.findIndex((s) => s.key === step.key) === 0;

                    return (
                        <li
                            key={step.key}
                            className={`${done ? styles.stepDone : ""} ${step.optional ? styles.stepOptional : ""}`}
                        >
                            {done ? (
                                <CheckCircle2 size={22} className={styles.iconDone} />
                            ) : (
                                <Circle size={22} className={styles.iconPending} />
                            )}
                            <div className={styles.stepContent}>
                                <strong>
                                    {step.label}
                                    {step.optional && (
                                        <span className={styles.optionalBadge}>opcional</span>
                                    )}
                                </strong>
                                <span>{step.description}</span>
                                {!done && canAccess && (
                                    <Link href={step.href} className={styles.stepLink}>
                                        {isFirstRequired || step.optional
                                            ? `Ir para ${step.label.toLowerCase()} →`
                                            : `Continuar →`}
                                    </Link>
                                )}
                                {!done && !canAccess && !step.optional && (
                                    <span className={styles.stepLocked}>Conclua o passo anterior</span>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
            <button type="button" className={styles.dismissBtn} onClick={handleDismiss}>
                Já configurei, não mostrar de novo
            </button>
        </section>
    );
}
