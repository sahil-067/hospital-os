/*
  Warnings:

  - The primary key for the `pharmacy_batch_inventory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `updated_at` to the `lab_orders` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `pharmacy_batch_inventory` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "lab_test_inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "test_name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "lab_staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "is_on_shift" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "lab_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action_type" TEXT NOT NULL,
    "barcode" TEXT,
    "details" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "pharmacy_medicine_master" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brand_name" TEXT NOT NULL,
    "generic_name" TEXT,
    "price_per_unit" REAL NOT NULL,
    "min_threshold" INTEGER NOT NULL DEFAULT 10
);

-- CreateTable
CREATE TABLE "pharmacy_sales_audit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action_type" TEXT NOT NULL,
    "medicine_name" TEXT NOT NULL,
    "batch_no" TEXT NOT NULL,
    "quantity_sold" INTEGER NOT NULL,
    "details" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "medical_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "admission_id" TEXT NOT NULL,
    "note_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note_type" TEXT NOT NULL,
    "details" TEXT NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_lab_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "barcode" TEXT,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT,
    "test_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "assigned_technician_id" TEXT,
    "result_value" TEXT,
    "report_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_lab_orders" ("barcode", "created_at", "doctor_id", "id", "patient_id", "result_value", "status", "test_type") SELECT "barcode", "created_at", "doctor_id", "id", "patient_id", "result_value", "status", "test_type" FROM "lab_orders";
DROP TABLE "lab_orders";
ALTER TABLE "new_lab_orders" RENAME TO "lab_orders";
CREATE UNIQUE INDEX "lab_orders_barcode_key" ON "lab_orders"("barcode");
CREATE TABLE "new_pharmacy_batch_inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "medicine_id" TEXT NOT NULL,
    "batch_no" TEXT NOT NULL,
    "current_stock" INTEGER NOT NULL,
    "expiry_date" DATETIME,
    "rack_location" TEXT,
    CONSTRAINT "pharmacy_batch_inventory_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "pharmacy_medicine_master" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_pharmacy_batch_inventory" ("batch_no", "current_stock", "expiry_date", "medicine_id") SELECT "batch_no", "current_stock", "expiry_date", "medicine_id" FROM "pharmacy_batch_inventory";
DROP TABLE "pharmacy_batch_inventory";
ALTER TABLE "new_pharmacy_batch_inventory" RENAME TO "pharmacy_batch_inventory";
CREATE UNIQUE INDEX "pharmacy_batch_inventory_batch_no_key" ON "pharmacy_batch_inventory"("batch_no");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "lab_test_inventory_test_name_key" ON "lab_test_inventory"("test_name");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacy_medicine_master_brand_name_key" ON "pharmacy_medicine_master"("brand_name");
