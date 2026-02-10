import { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'
import styles from './Layout.module.css'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.wrapper}>
      <Header />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  )
}
