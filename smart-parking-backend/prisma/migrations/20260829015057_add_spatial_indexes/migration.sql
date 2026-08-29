-- Indekse hapësinore (GiST) për kërkime gjeografike (p.sh. spote brenda një zone/rrezeje)
CREATE INDEX "parking_zones_polygon_gist_idx" ON "parking_zones" USING GIST ("polygon");
CREATE INDEX "parking_spots_location_gist_idx" ON "parking_spots" USING GIST ("location");
