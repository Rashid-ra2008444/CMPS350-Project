// import { NextResponse } from "next/server"
// import fs from "fs"
// import path from "path"

// export async function GET() {
//   try {
//     const enrollmentsPath = path.join(process.cwd(), "app/data", "enrollment.json")
//     const enrollmentsData = fs.readFileSync(enrollmentsPath, "utf8")
//     const enrollments = JSON.parse(enrollmentsData)

//     return NextResponse.json(enrollments)
//   } catch (error) {
//     console.error("Error fetching enrollments:", error)
//     return NextResponse.json({ success: false, message: "Error fetching enrollments" }, { status: 500 })
//   }
// }

// export async function POST(request) {
//   try {
//     const newEnrollment = await request.json()

//     // Read existing enrollments
//     const enrollmentsPath = path.join(process.cwd(), "data", "enrollment.json")
//     const enrollmentsData = fs.readFileSync(enrollmentsPath, "utf8")
//     const enrollments = JSON.parse(enrollmentsData)

//     // Add new enrollment
//     enrollments.push(newEnrollment)

//     // Write back to file
//     fs.writeFileSync(enrollmentsPath, JSON.stringify(enrollments, null, 2))

//     return NextResponse.json({ success: true, enrollment: newEnrollment })
//   } catch (error) {
//     console.error("Error adding enrollment:", error)
//     return NextResponse.json({ success: false, message: "Error adding enrollment" }, { status: 500 })
//   }
// }


import { NextResponse } from "next/server";
import { enrollmentRepo } from "@/repo/repository";

export async function GET() {
  try {
    const enrollments = await enrollmentRepo.findAll();
    return NextResponse.json(enrollments);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error fetching enrollments" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const newEnrollment = await request.json();
    const result = await enrollmentRepo.create(newEnrollment);
    
    return NextResponse.json({ success: true, enrollment: result });
  } catch (error) {
    console.error("Error adding enrollment:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error adding enrollment" },
      { status: 500 }
    );
  }
}