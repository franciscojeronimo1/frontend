'use server';

import { api } from '@/services/api';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAxiosError } from 'axios';

export type LoginState = {
  error?: string;
};

const LOGIN_ERROR_MESSAGE = 'Email ou senha incorretos.';

function getApiErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return LOGIN_ERROR_MESSAGE;
  }

  const data = error.response?.data as { error?: string; message?: string } | undefined;
  return data?.error || data?.message || LOGIN_ERROR_MESSAGE;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get('email');
  const password = formData.get('password');

  if (!email || !password) {
    return { error: 'Preencha o email e a senha.' };
  }

  try {
    const response = await api.post('/session', {
      email,
      password,
    });

    if (!response.data.token) {
      return { error: LOGIN_ERROR_MESSAGE };
    }

    const maxAge = 60 * 60 * 24 * 7; // 7 dias (segundos)
    const cookiesStore = await cookies();
    cookiesStore.set('session', response.data.token, {
      maxAge,
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
    });
  } catch (error) {
    return { error: getApiErrorMessage(error) };
  }

  redirect('/dashboard');
}
