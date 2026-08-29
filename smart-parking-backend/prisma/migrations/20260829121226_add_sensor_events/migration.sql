-- CreateTable
CREATE TABLE "sensor_events" (
    "id" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "status" "SpotStatus" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sensor_events_spotId_idx" ON "sensor_events"("spotId");

-- AddForeignKey
ALTER TABLE "sensor_events" ADD CONSTRAINT "sensor_events_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "parking_spots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
