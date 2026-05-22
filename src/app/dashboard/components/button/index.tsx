"use client"

import styles   from './styles.module.scss'
import { useFormStatus } from 'react-dom';

interface Props {
    name: string;
    disabled?: boolean;
}

export function Button({ name, disabled: disabledProp }: Props) {
    const { pending } = useFormStatus();
    const isDisabled = disabledProp ?? pending;
    const label = disabledProp ? name : pending ? "Carregando..." : name;

    return (
        <button className={styles.button} disabled={isDisabled} type="submit">
            {label}
        </button>
    );
}