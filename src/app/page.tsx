import styles from './page.module.scss';
import  Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { api } from '@/services/api';
import { cookies } from 'next/headers';

export default function Page() {

  async function handleLogin(formData: FormData){
    'use server'

    const email = formData.get('email')
    const password = formData.get('password')
     
    if(email === '' || password === ''){
      return;
    }

    try {
     const response = await api.post('/session', {
        email,
        password
      })

      if (!response.data.token) {
        return;
      }
      console.log(response.data);

      const expressTime = 60 * 60 * 24 * 30 * 1000; // 30 dias
      const cookiesStore = await cookies();
      cookiesStore.set("session", response.data.token, {
        maxAge: expressTime,
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production' ,
      })

    }
    catch (error) {
      console.log(error);
      return;
    }
    
    redirect('/dashboard');
  }


  return (
    <>
  <div className={styles.containerCenter}>
      <Image 
      src="/logo.svg" 
      alt="logo da pizzaria"
      width={190}
      height={60}
       />
  

    <section className={styles.login}>
      <form action={handleLogin}>
        <input
        type="email"
        required
        name="email"
        placeholder='Digite seu email...'
        className={styles.input}
        />

        <input
        type="password"
        required
        name="password"
        placeholder='***********'
        className={styles.input}
        />

        <button type='submit'className={styles.button} >Acessar
          </button> 
      </form>

      <Link href="/signup" className={styles.text}>
        Não possui conta? Cadastre-se
      </Link>

    </section>
  </div>
    </>
  )
}