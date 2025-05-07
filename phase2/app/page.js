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

    try {
      const result = await signIn("credentials", {
        redirect: false,
        username,
        password,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      // Fetch fresh session data
      const sessionRes = await fetch("/api/auth/session")
      const session = await sessionRes.json()
      const role = session.user.role

      // Persist user info
      const currentUser = {
        username: session.user.name,
        password: Number(session.user.password),
        status: session.user.role,
      }
      localStorage.setItem("currentUser", JSON.stringify(currentUser))

      // Redirect based on role
      if (role === "admin") {
        router.push("/admin/courses")
      } else if (role === "student") {
        router.push("/student/courses")
      } else if (role === "instructor") {
        router.push("/instructor/classes")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Error logging in. Please try again.")
    }
  }
  const handleGithubSignIn = async () => {
    setError("")
    try {
      // Initiate GitHub OAuth without automatic redirect
      const result = await signIn("github", {
        redirect:false,
        callbackUrl: "/student/courses",
      })
      console.log(result);
      if (result.error) {
        setError(result.error)
        return
      }

      // Manually navigate to callback URL to complete OAuth flow
      // router.push(result.url)

      // After redirect back to /student/courses, StudentCourses page will persist to localStorage
    } catch (err) {
      console.error("GitHub login error:", err)
      setError("Error logging in with GitHub. Please try again.")
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
      <button
        type="button"
        // className={styles.githubButton}
        id="sub"
        onClick={handleGithubSignIn}
      >
        Sign in with GitHub
      </button>
    </div>
  )
}
