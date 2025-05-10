import { NextResponse } from "next/server";
import { courseRepository } from "@/app/repo/repository";

export async function GET() {
  try {
    const courses = await courseRepository.findAll();
    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching courses: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const newCourse = await request.json();
    const result = await courseRepository.create(newCourse);
    
    return NextResponse.json({ success: true, course: result });
  } catch (error) {
    console.error("Error adding course:", error);
    return NextResponse.json(
      { success: false, message: "Error adding course: " + error.message },
      { status: 500 }
    );
  }
}