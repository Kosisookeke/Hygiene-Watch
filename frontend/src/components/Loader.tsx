import styles from './Loader.module.css'

interface LoaderProps {
  /** Optional message below the loader. Default: "Loading..." */
  message?: string
}

export default function Loader({ message = 'Loading…' }: LoaderProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.dots} aria-hidden>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
      <p className={styles.message}>{message}</p>
    </div>
  )
}
