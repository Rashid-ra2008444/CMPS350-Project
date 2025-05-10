import { NextResponse } from "next/server";
import {enrollmentRepository} from "@/app/repo/repository";


export async function GET() {
  try {
    const enrollments = await enrollmentRepository.findAll();
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
    const result = await enrollmentRepository.create(newEnrollment);
    
    return NextResponse.json({ success: true, enrollment: result });
  } catch (error) {
    console.error("Error adding enrollment:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error adding enrollment" },
      { status: 500 }
    );
  }
}