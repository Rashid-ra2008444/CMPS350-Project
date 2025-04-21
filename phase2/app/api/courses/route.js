import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    // Check if data exists in localStorage on the server (not possible)
    // So we'll always read from the file
    const coursesPath = path.join(process.cwd(), "app/data", "courses.json")
    const coursesData = fs.readFileSync(coursesPath, "utf8")
    const courses = JSON.parse(coursesData)

    return NextResponse.json(courses)
  } catch (error) {
    console.error("Error fetching courses:", error)
    return NextResponse.json({ success: false, message: "Error fetching courses" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const newCourse = await request.json()

    // Read existing courses
    const coursesPath = path.join(process.cwd(), "data", "courses.json")
    const coursesData = fs.readFileSync(coursesPath, "utf8")
    const courses = JSON.parse(coursesData)

    // Add new course
    courses.push(newCourse)

    // Write back to file
    fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2))

    return NextResponse.json({ success: true, course: newCourse })
  } catch (error) {
    console.error("Error adding course:", error)
    return NextResponse.json({ success: false, message: "Error adding course" }, { status: 500 })
  }
}
