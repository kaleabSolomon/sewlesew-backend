/*
  Warnings:

  - A unique constraint covering the columns `[tinNumber]` on the table `businesses` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[licenseNumber]` on the table `businesses` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[registrationNumber]` on the table `charities` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tinNumber]` on the table `charities` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `businesses_tinNumber_key` ON `businesses`(`tinNumber`);

-- CreateIndex
CREATE UNIQUE INDEX `businesses_licenseNumber_key` ON `businesses`(`licenseNumber`);

-- CreateIndex
CREATE UNIQUE INDEX `charities_registrationNumber_key` ON `charities`(`registrationNumber`);

-- CreateIndex
CREATE UNIQUE INDEX `charities_tinNumber_key` ON `charities`(`tinNumber`);
