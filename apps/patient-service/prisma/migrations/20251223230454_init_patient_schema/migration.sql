-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'UNKNOWN');

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "bloodGroup" "BloodGroup" DEFAULT 'UNKNOWN',
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "phone" TEXT,
    "address" JSONB,
    "emergencyContacts" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_insurances" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "policyNumber" TEXT,
    "providerName" TEXT,
    "policyHolder" TEXT,
    "groupNumber" TEXT,
    "expirationDate" TIMESTAMP(3),

    CONSTRAINT "patient_insurances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_userId_key" ON "patients"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "patients_email_key" ON "patients"("email");

-- CreateIndex
CREATE INDEX "patients_userId_idx" ON "patients"("userId");

-- CreateIndex
CREATE INDEX "patients_phone_email_idx" ON "patients"("phone", "email");

-- CreateIndex
CREATE INDEX "patients_firstName_lastName_idx" ON "patients"("firstName", "lastName");

-- CreateIndex
CREATE INDEX "patients_dateOfBirth_idx" ON "patients"("dateOfBirth");

-- CreateIndex
CREATE UNIQUE INDEX "patient_insurances_patientId_key" ON "patient_insurances"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "patient_insurances_policyNumber_key" ON "patient_insurances"("policyNumber");

-- CreateIndex
CREATE INDEX "patient_insurances_patientId_idx" ON "patient_insurances"("patientId");

-- CreateIndex
CREATE INDEX "patient_insurances_providerName_policyNumber_idx" ON "patient_insurances"("providerName", "policyNumber");

-- AddForeignKey
ALTER TABLE "patient_insurances" ADD CONSTRAINT "patient_insurances_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
