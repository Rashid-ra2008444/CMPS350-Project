'use client'
import styles from "./css/ConfirmModel.module.css"

export default function ConfirmModel({ message, onConfirm, onCancel }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.model}>
        <p>{message}</p>
        <div className={styles.buttons}>
          <button className={styles.confirm} onClick={onConfirm}>Yes</button>
          <button className={styles.cancel} onClick={onCancel}>No</button>
        </div>
      </div>
    </div>
  )
}