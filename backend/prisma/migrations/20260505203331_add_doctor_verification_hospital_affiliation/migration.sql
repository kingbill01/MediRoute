-- CreateTable
CREATE TABLE "HospitalDoctor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "doctorId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'AFFILIATED',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HospitalDoctor_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorInfo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HospitalDoctor_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DoctorInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "hospitalAffiliation" TEXT,
    "consultationFee" REAL,
    "yearsOfExperience" INTEGER,
    "bio" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "verificationNote" TEXT,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DoctorInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DoctorInfo" ("bio", "consultationFee", "createdAt", "hospitalAffiliation", "id", "licenseNumber", "specialization", "updatedAt", "userId", "yearsOfExperience") SELECT "bio", "consultationFee", "createdAt", "hospitalAffiliation", "id", "licenseNumber", "specialization", "updatedAt", "userId", "yearsOfExperience" FROM "DoctorInfo";
DROP TABLE "DoctorInfo";
ALTER TABLE "new_DoctorInfo" RENAME TO "DoctorInfo";
CREATE UNIQUE INDEX "DoctorInfo_userId_key" ON "DoctorInfo"("userId");
CREATE UNIQUE INDEX "DoctorInfo_licenseNumber_key" ON "DoctorInfo"("licenseNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "HospitalDoctor_doctorId_idx" ON "HospitalDoctor"("doctorId");

-- CreateIndex
CREATE INDEX "HospitalDoctor_hospitalId_idx" ON "HospitalDoctor"("hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalDoctor_doctorId_hospitalId_key" ON "HospitalDoctor"("doctorId", "hospitalId");
