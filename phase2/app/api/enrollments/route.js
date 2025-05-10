import { NextResponse } from "next/server";
import { enrollmentRepo } from "@/app/repo/repository.js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const instructor = searchParams.get('instructor');
    
    let enrollments;
    if (studentId) {
      enrollments = await enrollmentRepo.findByStudentId(studentId);
    } else if (instructor) {
      enrollments = await enrollmentRepo.findByInstructor(instructor);
    } else {
      enrollments = await enrollmentRepo.findAll();
    }
    
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