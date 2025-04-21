const { PrismaClient } = require("@prisma/client")
const fs = require("fs")
const path = require("path")
const prisma = new PrismaClient()

async function main() {
  console.log("Starting database seeding...")

  try {
    // Read JSON files
    const usersData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "app/data/login.json"), "utf8"))
    const coursesData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "app/data/courses.json"), "utf8"))
    const enrollmentsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "app/data/enrollment.json"), "utf8"))

    console.log(
      `Found ${usersData.length} users, ${coursesData.length} courses, and ${enrollmentsData.length} enrollments`,
    )

    // Seed users
    console.log("Seeding users...")
    for (const user of usersData) {
      await prisma.user.upsert({
        where: { username: user.username },
        update: {},
        create: {
          username: user.username,
          password: Number.parseInt(user.password),
          status: user.status,
        },
      })
    }

    // Seed courses
    console.log("Seeding courses...")
    for (const course of coursesData) {
      await prisma.course.upsert({
        where: { crn: Number.parseInt(course.crn) },
        update: {},
        create: {
          name: course.name,
          courseNum: Number.parseInt(course.courseNum),
          instructor: course.instructor,
          prerequisite: course.prerequisite || "none",
          enrollment_maximum: Number.parseInt(course.enrollment_maximum) || 30,
          enrollment_actual: Number.parseInt(course.enrollment_actual) || 0,
          category: course.category,
          status: course.status,
          crn: Number.parseInt(course.crn),
        },
      })
    }

    // Seed enrollments
    console.log("Seeding enrollments...")
    // First, delete all existing enrollments to avoid duplicates
    // (since enrollments don't have a unique identifier in the JSON)
    await prisma.enrollment.deleteMany({})

    for (const enrollment of enrollmentsData) {
      await prisma.enrollment.create({
        data: {
          studentId: enrollment.studentId,
          studentName: enrollment.studentName,
          courseNum: Number.parseInt(enrollment.courseNum),
          crn: Number.parseInt(enrollment.crn),
          instructor: enrollment.instructor,
          enrollmentDate: enrollment.enrollmentDate,
          grade: enrollment.grade,
          courseStatus: enrollment.courseStatus,
        },
      })
    }

    console.log("Database seeding completed successfully!")
  } catch (error) {
    console.error("Error during database seeding:", error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error("Failed to seed database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
