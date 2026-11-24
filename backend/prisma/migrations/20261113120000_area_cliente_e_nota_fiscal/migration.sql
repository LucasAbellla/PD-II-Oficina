-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "documentDigits" TEXT;

-- AlterTable
ALTER TABLE "ServiceOrder" ADD COLUMN     "publicToken" TEXT,
ADD COLUMN     "publicTokenExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "StatusEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "StatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAccess" (
    "customerId" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAccess_pkey" PRIMARY KEY ("customerId")
);

-- CreateTable
CREATE TABLE "OrderInvoice" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "sizeBytes" INTEGER NOT NULL,
    "content" BYTEA NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,

    CONSTRAINT "OrderInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StatusEvent_orderId_idx" ON "StatusEvent"("orderId");

-- CreateIndex
CREATE INDEX "StatusEvent_createdAt_idx" ON "StatusEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrderInvoice_orderId_key" ON "OrderInvoice"("orderId");

-- CreateIndex
CREATE INDEX "Customer_documentDigits_idx" ON "Customer"("documentDigits");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceOrder_publicToken_key" ON "ServiceOrder"("publicToken");

-- AddForeignKey
ALTER TABLE "StatusEvent" ADD CONSTRAINT "StatusEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusEvent" ADD CONSTRAINT "StatusEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAccess" ADD CONSTRAINT "CustomerAccess_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderInvoice" ADD CONSTRAINT "OrderInvoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderInvoice" ADD CONSTRAINT "OrderInvoice_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Clientes já cadastrados: preenche os dígitos do CPF/CNPJ (11 ou 14) para que possam entrar pela área do cliente
UPDATE "Customer"
SET "documentDigits" = regexp_replace("document", '\D', '', 'g')
WHERE "document" IS NOT NULL
  AND length(regexp_replace("document", '\D', '', 'g')) IN (11, 14);
