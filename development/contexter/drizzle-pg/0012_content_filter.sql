-- Add metadata jsonb column to documents for content filter flags and future extensibility
ALTER TABLE "documents" ADD COLUMN "metadata" jsonb DEFAULT '{}';
