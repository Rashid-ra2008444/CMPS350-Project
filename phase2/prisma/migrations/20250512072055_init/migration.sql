-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "studentId" INTEGER
);

-- CreateTable
CREATE TABLE "Student" (
    "studentId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    CONSTRAINT "Student_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Course" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "courseNum" INTEGER NOT NULL,
    "instructor" TEXT NOT NULL,
    "prerequisite" TEXT NOT NULL DEFAULT 'none',
    "enrollment_maximum" INTEGER NOT NULL DEFAULT 30,
    "enrollment_actual" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "crn" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "studentId" INTEGER NOT NULL,
    "studentName" TEXT NOT NULL,
    "courseNum" INTEGER NOT NULL,
    "crn" INTEGER NOT NULL,
    "instructor" TEXT NOT NULL,
    "enrollmentDate" TEXT NOT NULL,
    "grade" TEXT,
    "courseStatus" TEXT,

    PRIMARY KEY ("studentId", "crn"),
    CONSTRAINT "Enrollment_crn_fkey" FOREIGN KEY ("crn") REFERENCES "Course" ("crn") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_studentId_key" ON "User"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_crn_key" ON "Course"("crn");
