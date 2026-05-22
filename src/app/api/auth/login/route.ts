import { NextResponse } from 'next/server';
import { isAxiosError } from 'axios';
import { api } from '@/services/api';
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  SESSION_MAX_AGE,
} from '@/lib/session';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Preencha o email e a senha.' },
        { status: 400 }
      );
    }

    const response = await api.post('/session', { email, password });
    const token = response.data?.token;

    if (!token) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos.' },
        { status: 400 }
      );
    }

    const res = NextResponse.json({ ok: true });
    const expires = new Date(Date.now() + SESSION_MAX_AGE * 1000);

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      ...SESSION_COOKIE_OPTIONS,
      expires,
    });

    return res;
  } catch (error) {
    if (isAxiosError(error)) {
      const data = error.response?.data as { error?: string; message?: string } | undefined;
      return NextResponse.json(
        { error: data?.error || data?.message || 'Email ou senha incorretos.' },
        { status: error.response?.status || 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao fazer login. Tente novamente.' },
      { status: 500 }
    );
  }
}
