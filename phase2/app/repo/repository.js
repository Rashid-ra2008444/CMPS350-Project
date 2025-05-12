import { PrismaClient } from "@prisma/client";

// Initialize Prisma client
const prisma = new PrismaClient();

class UserRepository {
  // Find a user by username
  async findByUsername(username) {
    return await prisma.user.findUnique({
      where: { username },
      include: {
        student: true,
      },
    });
  }

  // Authenticate a user
  async authenticate(username, password) {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
        include: {
          student: true,
        },
      });

      if (user && user.password === Number(password)) {
        return {
          id: user.id,
          username: user.username,
          status: user.status,
          studentId: user.student?.studentId || null,
        };
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
      data: userData
    });
    if (user.status === "student") {
      const lastStudent = await prisma.student.findFirst({
        orderBy: { studentId: "desc" },
      });
      const newStudentId = lastStudent ? lastStudent.studentId + 1 : 2000001;

      await prisma.user.update({
        where: { id: user.id },
        data: { studentId: newStudentId },
      });

      await prisma.student.create({
        data: { studentId: newStudentId },
      });

      user.studentId = newStudentId;
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

class StudentRepository {
  // Find student by studentId
  async findByStudentId(studentId) {
    return await prisma.student.findUnique({
      where: { studentId: Number(studentId) },
      include: {
        user: true,
        enrollments: {
          include: {
            course: true,
          },
        },
      },
    });
  }

  // Get all students
  async findAll() {
    return await prisma.student.findMany({
      include: {
        user: true,
        enrollments: {
          include: {
            course: true,
          },
        },
      },
    });
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
        enrollments: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
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
      data: courseData
    });
  }

  // Update a course
async update(crn, courseData) {
  // Remove the `enrollments` field from the courseData object
  const { enrollments,id,isValidCourse,...courseDataWithoutEnrollments } = courseData;

  return await prisma.course.update({
    where: { crn: Number(crn) },
    data: courseDataWithoutEnrollments, // Use the filtered data object
    include: {
      enrollments: true, // Include enrollments in the response if needed
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

  // Delete a course by crn
  async delete(crn) {
    const crnNumber = Number(crn);

    const course = await prisma.course.findUnique({
      where: { crn: crnNumber },
    });

    if (!course) {
      throw new Error(`Course with CRN ${crnNumber} does not exist.`);
    }

    // Remove dependent enrollments
    await prisma.enrollment.deleteMany({
      where: { crn: crnNumber },
    });

    return prisma.course.delete({
      where: { crn: crnNumber },
    });
  }

  async findAllCategories() {
  const categories = await prisma.course.findMany({
    select: {
      category: true,
    },
    distinct: ['category'],
  });

  return categories.map(c => c.category);
}
}

class EnrollmentRepository {
  // Find all enrollments
  async findAll() {
    return await prisma.enrollment.findMany({
      include: {
        course: true,
        student: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  // Find enrollments by student ID
  async findByStudentId(studentId) {
    return await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: true,
        student: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  // Find enrollments by course CRN
  async findByCRN(crn) {
    return await prisma.enrollment.findMany({
      where: { crn: Number(crn) },
      include: {
        course: true,
        student: {
          include: {
            user: true,
          },
        },
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
      data: enrollmentData,
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
          where: {
            studentId_crn: {
              studentId: enrollment.studentId,
              crn: enrollment.crn
            }
          },
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
export const studentRepository = new StudentRepository();
