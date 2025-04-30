'use client'
import styles from "./css/Notification.module.css"

export default function Notification({ message, type }) {
    if (!message) return null
  
    return (
      <div className={`${styles.notification} ${styles[type]}`}>
        {message}
      </div>
    )
  }