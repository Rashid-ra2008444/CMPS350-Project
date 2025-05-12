/*
  Warnings:

  - The primary key for the `Enrollment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Enrollment` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Enrollment" (
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
INSERT INTO "new_Enrollment" ("courseNum", "courseStatus", "crn", "enrollmentDate", "grade", "instructor", "studentId", "studentName") SELECT "courseNum", "courseStatus", "crn", "enrollmentDate", "grade", "instructor", "studentId", "studentName" FROM "Enrollment";
DROP TABLE "Enrollment";
ALTER TABLE "new_Enrollment" RENAME TO "Enrollment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
