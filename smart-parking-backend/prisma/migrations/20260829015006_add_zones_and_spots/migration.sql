-- CreateEnum
CREATE TYPE "SpotStatus" AS ENUM ('free', 'occupied', 'reserved', 'disabled');

-- CreateTable
CREATE TABLE "parking_zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "polygon" geometry(Polygon, 4326) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_spots" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "location" geometry(Point, 4326) NOT NULL,
    "status" "SpotStatus" NOT NULL DEFAULT 'free',
    "zoneId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_spots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parking_spots_zoneId_idx" ON "parking_spots"("zoneId");

-- CreateIndex
CREATE UNIQUE INDEX "parking_spots_zoneId_code_key" ON "parking_spots"("zoneId", "code");

-- AddForeignKey
ALTER TABLE "parking_spots" ADD CONSTRAINT "parking_spots_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "parking_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
