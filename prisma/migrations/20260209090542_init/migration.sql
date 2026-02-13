-- CreateTable
CREATE TABLE "MVP_Hospital" (
    "patient_id" TEXT NOT NULL PRIMARY KEY,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "department" TEXT,
    "email" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Clinical_EHR" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patient_id" TEXT NOT NULL,
    "diagnosis" TEXT,
    "prescription" TEXT,
    "doctor_notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "admissions" (
    "admission_id" TEXT NOT NULL PRIMARY KEY,
    "patient_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Admitted',
    "doctor_name" TEXT,
    "diagnosis" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "lab_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "barcode" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT,
    "test_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "result_value" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "pharmacy_batch_inventory" (
    "medicine_id" TEXT NOT NULL PRIMARY KEY,
    "batch_no" TEXT NOT NULL,
    "current_stock" INTEGER NOT NULL,
    "expiry_date" DATETIME
);

-- CreateTable
CREATE TABLE "discharge_summaries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "admission_id" TEXT NOT NULL,
    "patient_name" TEXT,
    "generated_summary" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "lab_orders_barcode_key" ON "lab_orders"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacy_batch_inventory_batch_no_key" ON "pharmacy_batch_inventory"("batch_no");
