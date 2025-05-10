import { PrismaClient } from "@prisma/client";

// Initialize Prisma client
const prisma = new PrismaClient();

class UserRepository {
  // Find a user by username
  async findByUsername(username) {
    return await prisma.user.findUnique({
      where: { username },
    });
  }

  // Authenticate a user
  async authenticate(username, password) {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (user && user.password === Number(password)) {
        return user;
      }
      return null;
    } catch (error) {
      console.error("Error authenticating user:", error);
      throw new Error("Authentication failed");
    }
  }

  // Create a new user
  async create(userData) {
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        password: Number(userData.password),
        status: userData.status,
      },
    });
    if(user.status === "student") {
      await prisma.student.create({
        data: {
          studentId: user.studentId,
        }
      })
    }
    return user;
  }

  async assignStudentIdIfMissing(username) {
    try {
      const user = await this.findByUsername(username);

      if (user && user.status === "student" && !user.studentId) {
        // Generate a new student ID (e.g., starting from 2000001)
        const lastStudent = await prisma.student.findFirst({
          orderBy: { studentId: "desc" },
        });
        const newStudentId = lastStudent ? lastStudent.studentId + 1 : 2000001;

        // Update the user with the new student ID
        const updatedUser = await prisma.user.update({
          where: { username },
          data: { studentId: newStudentId },
        });

        // Create a corresponding student record
        await prisma.student.create({
          data: { studentId: newStudentId },
        });

        return updatedUser;
      }

      return user;
    } catch (error) {
      console.error("Error assigning student ID:", error);
      throw new Error("Failed to assign student ID");
    }
  }
  
}

class CourseRepository {
  // Find all courses
  async findAll() {
    return await prisma.course.findMany({
      include: {
        enrollments: true,
      },
    });
  }

  // Find course by CRN
  async findByCRN(crn) {
    return await prisma.course.findUnique({
      where: { crn: Number(crn) },
      include: {
        enrollments: true,
      },
    });
  }

  // Find courses by category
  async findByCategory(category) {
    return await prisma.course.findMany({
      where: { category },
      include: {
        enrollments: true,
      },
    });
  }

  // Find courses by status
  async findByStatus(status) {
    return await prisma.course.findMany({
      where: { status },
      include: {
        enrollments: true,
      },
    });
  }

  // Create a new course
  async create(courseData) {
    console.log("Creating course with data:", courseData);
    return await prisma.course.create({
      data: {
        name: courseData.name,
        courseNum: Number(courseData.courseNum),
        instructor: courseData.instructor,
        prerequisite: courseData.prerequisite || "none",
        enrollment_maximum: Number(courseData.enrollment_maximum) || 30,
        enrollment_actual: Number(courseData.enrollment_actual) || 0,
        category: courseData.category,
        status: courseData.status || "pending",
        crn: Number(courseData.crn),
      },
    });
  }

  // Update a course
  async update(field, value, courseData) {
    const whereClause = {};
    whereClause[field] = field === "crn" ? Number(value) : value;

    return await prisma.course.update({
      where: whereClause,
      data: {
        name: courseData.name,
        courseNum: Number(courseData.courseNum),
        instructor: courseData.instructor,
        prerequisite: courseData.prerequisite || "none",
        enrollment_maximum: Number(courseData.enrollment_maximum) || 30,
        enrollment_actual: Number(courseData.enrollment_actual) || 0,
        category: courseData.category,
        status: courseData.status || "pending",
      },
    });
  }

  // Update course status
  async updateStatus(crn, status) {
    return await prisma.course.update({
      where: { crn: Number(crn) },
      data: { status },
    });
  }

  // Delete a course
  async delete(field, value) {
    const whereClause = {};
    whereClause[field] = field === "crn" ? Number(value) : value;

    if (field === "crn") {
      await prisma.enrollment.deleteMany({
        where: { crn: Number(value) },
      });
    }

    return await prisma.course.delete({
      where: whereClause,
    });
  }
}

class EnrollmentRepository {
  // Find all enrollments
  async findAll() {
    return await prisma.enrollment.findMany({
      include: {
        course: true,
      },
    });
  }

  // Find enrollments by student ID
  async findByStudentId(studentId) {
    return await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: true,
      },
    });
  }

  // Find enrollments by course CRN
  async findByCRN(crn) {
    return await prisma.enrollment.findMany({
      where: { crn: Number(crn) },
      include: {
        course: true,
      },
    });
  }

  // Create a new enrollment
  async create(enrollmentData) {
    await prisma.course.update({
      where: { crn: Number(enrollmentData.crn) },
      data: { enrollment_actual: { increment: 1 } },
    });

    return await prisma.enrollment.create({
      data: {
        studentId: enrollmentData.studentId,
        studentName: enrollmentData.studentName,
        courseNum: Number(enrollmentData.courseNum),
        crn: Number(enrollmentData.crn),
        instructor: enrollmentData.instructor,
        enrollmentDate: enrollmentData.enrollmentDate,
        grade: enrollmentData.grade || null,
        courseStatus: enrollmentData.courseStatus || null,
      },
    });
  }

  // Update grade for a student in a course
  async updateGrade(studentId, crn, grade) {
    return await prisma.enrollment.updateMany({
      where: {
        studentId,
        crn: Number(crn),
      },
      data: { grade },
    });
  }

  // Update course status for enrollments
  async updateCourseStatus(crn, status) {
    return await prisma.enrollment.updateMany({
      where: { crn: Number(crn) },
      data: { courseStatus: status },
    });
  }

  // Save all enrollments
  async saveAll(enrollments) {
    return await prisma.$transaction(
      enrollments.map((enrollment) =>
        prisma.enrollment.update({
          where: { id: enrollment.id },
          data: {
            grade: enrollment.grade,
            courseStatus: enrollment.courseStatus,
          },
        })
      )
    );
  }

  // Delete an enrollment
  async delete(id) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: Number(id) },
    });

    if (enrollment) {
      await prisma.course.update({
        where: { crn: enrollment.crn },
        data: { enrollment_actual: { decrement: 1 } },
      });

      return await prisma.enrollment.delete({
        where: { id: Number(id) },
      });
    }
  }
}

export const userRepository = new UserRepository();
export const courseRepository = new CourseRepository();
export const enrollmentRepository = new EnrollmentRepository();