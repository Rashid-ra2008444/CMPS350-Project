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
    e.preventDefault();
    setError("");

    try {
      // 1) Call your custom login API
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      // 2) Handle errors from the server
      if (!data.success) {
        setError(data.message || "Invalid username or password");
        return;
      }

      // 3) Persist user info into localStorage
      const { username: u, status, password: pwd } = data.user;
      const currentUser = {
        username: u,
        password: Number(pwd),
        status,
      };
      localStorage.setItem("currentUser", JSON.stringify(currentUser));

      // 4) Redirect based on role
      if (status === "admin") {
        router.push("/admin/courses");
      } else if (status === "student") {
        router.push("/student/courses");
      } else if (status === "instructor") {
        router.push("/instructor/classes");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Error logging in. Please try again.");
    }
  };

  const handleGithubSignIn = async () => {
    setError("");
    try {
      // 1) Kick off the OAuth flow without auto-redirect
      const result = await signIn("github", { callbackUrl: "/student/courses" });

      // 2) If GitHub errored out, show it
      if (result?.error) {
        setError(result.error);
        return;
      }

      // 3) Otherwise, fetch the new session
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      // 4) Pull out the fields you need
      const { name: username, password, role } = session.user;
      const currentUser = {
        username,
        password: Number(password),
        status: role,
      };

      // 5) Persist & redirect to the student dashboard
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      // router.push("/student/courses");
    } catch (err) {
      console.error("GitHub sign in error:", err);
      setError("Could not start GitHub sign in");
    }
  };

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
        onClick={handleGithubSignIn}
      >
        Sign in with GitHub
      </button>
    </div>
  )
}
