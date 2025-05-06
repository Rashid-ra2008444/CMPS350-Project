"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./login.module.css"
import {signIn} from "next-auth/react"

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    const result = await signIn("credentials", {
      redirect: false, // handle redirection manually
      username,
      password,
      status,
    });

    try {
      // const response = await fetch("/api/auth/login", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ username, password }),
      // })

      // const data = await response.json()

      if (result.ok) {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();

        const role = session.user.role;
        // Store user info in localStorage for persistence
        const currentUser = {
          username: session.user.name,
          password: Number(session.user.password), // cast to number if needed
          status: session.user.role,
        };

        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        // Redirect based on user role
        if (role === "admin") {
          router.push("/admin/courses")
        } else if (role === "student") {
          router.push("/student/courses")
        } else if (role === "instructor") {
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
