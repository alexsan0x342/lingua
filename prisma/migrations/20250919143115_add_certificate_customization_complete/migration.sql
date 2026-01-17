-- CreateEnum
CREATE TYPE "CostType" AS ENUM ('MONTHLY', 'ONE_TIME', 'ANNUAL');

-- CreateEnum
CREATE TYPE "CodeType" AS ENUM ('DISCOUNT', 'COURSE', 'SERVICE');

-- CreateTable
CREATE TABLE "redemption_code" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CodeType" NOT NULL,
    "value" INTEGER NOT NULL,
    "courseId" TEXT,
    "serviceType" TEXT,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "redemption_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "code_redemption" (
    "id" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "city" TEXT,
    "region" TEXT,
    "isp" TEXT,

    CONSTRAINT "code_redemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_analytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "totalCosts" INTEGER NOT NULL DEFAULT 0,
    "newEnrollments" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "totalCourses" INTEGER NOT NULL DEFAULT 0,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tracking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "region" TEXT,
    "isp" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_entry" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "CostType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfData" BYTEA,
    "metadata" JSONB,

    CONSTRAINT "certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_settings" (
    "id" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#1e40af',
    "secondaryColor" TEXT NOT NULL DEFAULT '#059669',
    "textColor" TEXT NOT NULL DEFAULT '#1f2937',
    "headerTextColor" TEXT NOT NULL DEFAULT '#ffffff',
    "borderColor" TEXT NOT NULL DEFAULT '#d1d5db',
    "backgroundGradient" TEXT NOT NULL DEFAULT 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
    "titleFont" TEXT NOT NULL DEFAULT 'serif',
    "bodyFont" TEXT NOT NULL DEFAULT 'sans-serif',
    "titleFontSize" TEXT NOT NULL DEFAULT '28px',
    "bodyFontSize" TEXT NOT NULL DEFAULT '14px',
    "layout" TEXT NOT NULL DEFAULT 'classic',
    "orientation" TEXT NOT NULL DEFAULT 'landscape',
    "logoPosition" TEXT NOT NULL DEFAULT 'top-center',
    "signaturePosition" TEXT NOT NULL DEFAULT 'bottom-right',
    "logoUrl" TEXT,
    "logoWidth" TEXT NOT NULL DEFAULT '120px',
    "logoHeight" TEXT NOT NULL DEFAULT 'auto',
    "institutionName" TEXT NOT NULL DEFAULT 'Learning Management System',
    "institutionTitle" TEXT NOT NULL DEFAULT 'Certificate of Completion',
    "borderStyle" TEXT NOT NULL DEFAULT 'solid',
    "borderWidth" TEXT NOT NULL DEFAULT '2px',
    "showDecorations" BOOLEAN NOT NULL DEFAULT true,
    "decorationStyle" TEXT NOT NULL DEFAULT 'classic',
    "footerText" TEXT NOT NULL DEFAULT 'This certificate validates the successful completion of the course requirements.',
    "showQRCode" BOOLEAN NOT NULL DEFAULT true,
    "showCertificateId" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "redemption_code_code_key" ON "redemption_code"("code");

-- CreateIndex
CREATE UNIQUE INDEX "code_redemption_codeId_userId_key" ON "code_redemption"("codeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "device_tracking_userId_deviceId_key" ON "device_tracking"("userId", "deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_userId_courseId_key" ON "certificate"("userId", "courseId");

-- AddForeignKey
ALTER TABLE "redemption_code" ADD CONSTRAINT "redemption_code_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_redemption" ADD CONSTRAINT "code_redemption_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "redemption_code"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_redemption" ADD CONSTRAINT "code_redemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tracking" ADD CONSTRAINT "device_tracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
