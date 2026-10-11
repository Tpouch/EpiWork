-- Map the old check model to questionType before isCheckpoint is dropped.
UPDATE "Step" SET "questionType" = CASE
  WHEN "isCheckpoint" = 1 THEN 'checkpoint'
  WHEN "questionPrompt" IS NOT NULL THEN 'question'
  ELSE NULL
END;
UPDATE "Step" SET "questionOptions" = NULL WHERE "questionType" = 'checkpoint';

/*
  Warnings:

  - You are about to drop the column `isCheckpoint` on the `Step` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Section" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workshopId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    CONSTRAINT "Section_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocPage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workshopId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    CONSTRAINT "DocPage_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Step" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workshopId" INTEGER NOT NULL,
    "sectionId" INTEGER,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "hint" TEXT,
    "solution" TEXT,
    "questionType" TEXT,
    "questionPrompt" TEXT,
    "questionOptions" TEXT,
    "questionAnswer" TEXT,
    "questionFeedback" TEXT,
    CONSTRAINT "Step_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Step_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Step" ("content", "id", "order", "questionOptions", "questionPrompt", "questionType", "title", "workshopId") SELECT "content", "id", "order", "questionOptions", "questionPrompt", "questionType", "title", "workshopId" FROM "Step";
DROP TABLE "Step";
ALTER TABLE "new_Step" RENAME TO "Step";
CREATE TABLE "new_StepProgress" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "stepId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'locked',
    "submittedAnswer" TEXT,
    "helpRequested" BOOLEAN NOT NULL DEFAULT false,
    "solutionUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StepProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StepProgress_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StepProgress" ("helpRequested", "id", "status", "stepId", "studentId", "submittedAnswer", "updatedAt") SELECT "helpRequested", "id", "status", "stepId", "studentId", "submittedAnswer", "updatedAt" FROM "StepProgress";
DROP TABLE "StepProgress";
ALTER TABLE "new_StepProgress" RENAME TO "StepProgress";
CREATE UNIQUE INDEX "StepProgress_studentId_stepId_key" ON "StepProgress"("studentId", "stepId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
