'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Email ou senha incorretos.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p className={styles.errorMessage} role="alert">
          {error}
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
