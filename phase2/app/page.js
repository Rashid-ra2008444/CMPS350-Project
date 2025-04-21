"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./login.module.css"

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store user info in localStorage for persistence
        localStorage.setItem("currentUser", JSON.stringify(data.user))

        // Redirect based on user role
        if (data.user.status === "admin") {
          router.push("/admin/courses")
        } else if (data.user.status === "student") {
          router.push("/student/courses")
        } else if (data.user.status === "instructor") {
          router.push("/instructor/classes")
        }
      } else {
        setError(data.message || "Invalid username or password")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Error logging in. Please try again.")
    }
  }

  return (
    <div className={styles.loginContainer}>
      <header>
        <h1>Qatar University</h1>
      </header>
      <main>
        <div className={styles.loginForm}>
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
            <label htmlFor="username">
              <b>Username:</b>
            </label>
            <input
              type="text"
              id="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <br />
            <label htmlFor="password">
              <b>Password:</b>
            </label>
            <input
              type="password"
              id="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <br />
            <button type="submit" id="sub">
              Submit
            </button>
          </form>
          {error && <div className={styles.errorMessage}>{error}</div>}
        </div>
      </main>
    </div>
  )
}
