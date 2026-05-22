'use client';

import { useActionState } from 'react';
import styles from './page.module.scss';
import { loginAction, type LoginState } from './actions/login';

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction}>
      {state.error && (
        <p className={styles.errorMessage} role="alert">
          {state.error}
        </p>
      )}

      <input
        type="email"
        required
        name="email"
        placeholder="Digite seu email..."
        className={styles.input}
        disabled={isPending}
      />

      <input
        type="password"
        required
        name="password"
        placeholder="***********"
        className={styles.input}
        disabled={isPending}
      />

      <button type="submit" className={styles.button} disabled={isPending}>
        {isPending ? 'Acessando...' : 'Acessar'}
      </button>
    </form>
  );
}
