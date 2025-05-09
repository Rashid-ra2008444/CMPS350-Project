"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {signOut} from "next-auth/react"

export default function StudentLayout({ children }) {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in and is a student
    const storedUser = localStorage.getItem("currentUser")
    console.log(storedUser);
    if (!storedUser) {
      console.log("pushing back");
      router.push("/")
      return
    }

    const userData = JSON.parse(storedUser)
    if (userData.status !== "student") {
      router.push("/")
      return
    }

    setUser(userData)
  }, [router])

  const handleLogout = async () => {
    // await signOut({ redirect: false });
    localStorage.removeItem("currentUser")
    router.push("/")
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ display: "flex" }}>
      <div className="sidebar">
        <h2 className="title">Qatar University</h2>
        <nav className="nav">
          <Link href="/student/courses">
            <button>Courses</button>
          </Link>
          <Link href="/student/learning-path">
            <button>Study Plan</button>
          </Link>
          <Link href="/student/registration">
            <button>Register Courses</button>
          </Link>
          <button onClick={handleLogout}>Logout</button>
        </nav>
        <div className="sidebar-footer">
          <Image className="stev" src="/img/stevq.png" alt="stev" width={250} height={250} />
        </div>
      </div>
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.4rem",
          width: "100%",
          padding: "0.5rem",
        }}
      >
        {children}
      </main>
    </div>
  )
}
