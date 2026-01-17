import { prisma } from "./db";

export async function runResourceMigration() {
  try {
    console.log("🔄 Checking if Resource table migration is needed...");
    
    // First check if the Resource table exists
    const tableExists = await prisma.$queryRaw`
      SELECT to_regclass('public."Resource"')::text as table_exists
    `;
    
    if (!Array.isArray(tableExists) || tableExists[0]?.table_exists === null) {
      console.log("⏭️ Resource table doesn't exist yet, skipping migration");
      return;
    }
    
    // Check if the new columns exist
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Resource' 
      AND column_name IN ('url', 'type', 'isRequired')
    `;
    
    const existingColumns = Array.isArray(result) ? result.map((row: any) => row.column_name) : [];
    
    if (existingColumns.length === 3) {
      console.log("✅ Resource table already has new columns, skipping migration");
      return;
    }
    
    console.log("🔄 Running Resource table migration...");
    
    // Add new columns
    if (!existingColumns.includes('url')) {
      await prisma.$executeRaw`ALTER TABLE "Resource" ADD COLUMN "url" TEXT`;
      console.log("✅ Added 'url' column");
    }
    
    if (!existingColumns.includes('type')) {
      await prisma.$executeRaw`ALTER TABLE "Resource" ADD COLUMN "type" TEXT DEFAULT 'file'`;
      console.log("✅ Added 'type' column");
    }
    
    if (!existingColumns.includes('isRequired')) {
      await prisma.$executeRaw`ALTER TABLE "Resource" ADD COLUMN "isRequired" BOOLEAN DEFAULT false`;
      console.log("✅ Added 'isRequired' column");
    }
    
    // Update existing resources
    await prisma.$executeRaw`
      UPDATE "Resource" 
      SET 
        "url" = CASE 
          WHEN "fileKey" LIKE 'http%' THEN "fileKey"
          ELSE NULL
        END,
        "type" = CASE 
          WHEN "fileKey" LIKE 'http%' THEN 'link'
          WHEN "fileType" = 'application/pdf' THEN 'document'
          WHEN "fileType" LIKE 'video/%' THEN 'video'
          WHEN "fileType" LIKE 'image/%' THEN 'file'
          ELSE 'file'
        END
      WHERE "type" IS NULL OR "type" = 'file'
    `;
    
    // Clear fileKey for URL resources
    await prisma.$executeRaw`
      UPDATE "Resource" 
      SET "fileKey" = NULL 
      WHERE "url" IS NOT NULL AND "fileKey" = "url"
    `;
    
    console.log("✅ Resource table migration completed successfully");
    
  } catch (error) {
    console.error("❌ Resource migration failed:", error);
    // Don't throw error to prevent app from crashing
  }
}
