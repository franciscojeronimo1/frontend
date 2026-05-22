import styles from './page.module.scss';
import Link from 'next/link';
import { LoginForm } from './login-form';

export default function Page() {
  return (
    <>
      <div className={styles.containerCenter}>
        <Link href="/sobre" className={styles.aboutLink}>
          Como funciona
        </Link>
        <h1 className={styles.title}>Login</h1>

        <section className={styles.login}>
          <LoginForm />
        </section>
      </div>
    </>
  );
}
