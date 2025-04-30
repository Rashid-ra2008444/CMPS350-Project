import { NextResponse } from "next/server";
import { userRepo } from "@/app/repo/repository.js";

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    // Authenticate user
    const user = await userRepo.authenticate(username, password);
    
    if (user) {
      return NextResponse.json({
        success: true,
        user: {
          username: user.username,
          status: user.status,
          password: user.password, // Needed for student ID in the app
        },
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid username or password" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}