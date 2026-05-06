-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dateOfBirth" DATETIME,
    "gender" TEXT,
    "street" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Sénégal',
    "profileImage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DoctorInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "hospitalAffiliation" TEXT,
    "consultationFee" REAL,
    "yearsOfExperience" INTEGER,
    "bio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DoctorInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DoctorAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "doctorId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    CONSTRAINT "DoctorAvailability_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorInfo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PatientInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "allergies" TEXT,
    "chronicConditions" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelationship" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PatientInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "hospitalId" TEXT,
    "appointmentDate" DATETIME NOT NULL,
    "appointmentTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "doctorNotes" TEXT,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "confirmationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentId" TEXT NOT NULL,
    "medications" TEXT NOT NULL,
    "instructions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Prescription_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "recordDate" DATETIME NOT NULL,
    "recordType" TEXT NOT NULL,
    "diagnosis" TEXT,
    "symptoms" TEXT,
    "vitalSigns" TEXT,
    "notes" TEXT NOT NULL,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "medicalRecordId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Hospital" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "emergencyPhone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "services" TEXT NOT NULL,
    "specializations" TEXT NOT NULL,
    "facilities" TEXT NOT NULL,
    "totalBeds" INTEGER NOT NULL,
    "availableBeds" INTEGER NOT NULL,
    "emergencyAvailable" BOOLEAN NOT NULL DEFAULT true,
    "ambulanceAvailable" BOOLEAN NOT NULL DEFAULT false,
    "openingHours" TEXT NOT NULL,
    "canAcceptEmergency" BOOLEAN NOT NULL DEFAULT true,
    "waitingTime" INTEGER,
    "capacityUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "website" TEXT,
    "description" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "rating" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmergencyRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "patientName" TEXT NOT NULL,
    "patientAge" INTEGER,
    "patientGender" TEXT,
    "patientPhone" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "symptoms" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "hasInjury" BOOLEAN NOT NULL,
    "isConscious" BOOLEAN NOT NULL,
    "canMove" BOOLEAN NOT NULL,
    "needsAmbulance" BOOLEAN NOT NULL,
    "assignedHospitalId" TEXT,
    "distance" REAL,
    "estimatedArrival" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priorityScore" INTEGER NOT NULL,
    "formResponses" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmergencyRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmergencyRequest_assignedHospitalId_fkey" FOREIGN KEY ("assignedHospitalId") REFERENCES "Hospital" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_region_idx" ON "User"("region");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorInfo_userId_key" ON "DoctorInfo"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorInfo_licenseNumber_key" ON "DoctorInfo"("licenseNumber");

-- CreateIndex
CREATE INDEX "DoctorAvailability_doctorId_idx" ON "DoctorAvailability"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientInfo_userId_key" ON "PatientInfo"("userId");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_doctorId_idx" ON "Appointment"("doctorId");

-- CreateIndex
CREATE INDEX "Appointment_appointmentDate_idx" ON "Appointment"("appointmentDate");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "Prescription_appointmentId_idx" ON "Prescription"("appointmentId");

-- CreateIndex
CREATE INDEX "MedicalRecord_patientId_idx" ON "MedicalRecord"("patientId");

-- CreateIndex
CREATE INDEX "MedicalRecord_doctorId_idx" ON "MedicalRecord"("doctorId");

-- CreateIndex
CREATE INDEX "MedicalRecord_recordDate_idx" ON "MedicalRecord"("recordDate");

-- CreateIndex
CREATE INDEX "Attachment_medicalRecordId_idx" ON "Attachment"("medicalRecordId");

-- CreateIndex
CREATE INDEX "Hospital_region_idx" ON "Hospital"("region");

-- CreateIndex
CREATE INDEX "Hospital_type_idx" ON "Hospital"("type");

-- CreateIndex
CREATE INDEX "Hospital_emergencyAvailable_idx" ON "Hospital"("emergencyAvailable");

-- CreateIndex
CREATE INDEX "EmergencyRequest_patientId_idx" ON "EmergencyRequest"("patientId");

-- CreateIndex
CREATE INDEX "EmergencyRequest_status_idx" ON "EmergencyRequest"("status");

-- CreateIndex
CREATE INDEX "EmergencyRequest_level_idx" ON "EmergencyRequest"("level");

-- CreateIndex
CREATE INDEX "EmergencyRequest_region_idx" ON "EmergencyRequest"("region");

-- CreateIndex
CREATE INDEX "EmergencyRequest_createdAt_idx" ON "EmergencyRequest"("createdAt");
