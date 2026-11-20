ALTER TABLE "services"
ADD COLUMN "advancePercent" INTEGER NOT NULL DEFAULT 100;

ALTER TABLE "appointments"
ADD COLUMN "advanceAtBooking" DECIMAL(10, 2);
