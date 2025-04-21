"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function InstructorLayout({ children }) {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in and is an instructor
    const storedUser = localStorage.getItem("currentUser")
    if (!storedUser) {
      router.push("/")
      return
    }

    const userData = JSON.parse(storedUser)
    if (userData.status !== "instructor") {
      router.push("/")
      return
    }

    setUser(userData)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/")
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ display: "flex" }}>
      <div className="sidebar">
        <h2 className="title">CMPS 350</h2>
        <nav>
          <input type="text" id="searchInput" placeholder="Search Classes" />
          <button id="logout" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </div>
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.8rem",
          width: "100%",
          padding: "1rem",
        }}
      >
        {children}
      </main>
    </div>
  )
}
