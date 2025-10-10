-- AlterTable
ALTER TABLE `utilisateurs` MODIFY `role` ENUM('SUPER_ADMIN', 'ADMIN', 'CAISSIER', 'VIGILE') NOT NULL;

-- CreateTable
CREATE TABLE `pointages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `datePointage` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `typePointage` ENUM('ENTREE', 'SORTIE') NOT NULL,
    `statut` ENUM('VALIDE', 'ANNULE', 'RETARD') NOT NULL DEFAULT 'VALIDE',
    `commentaire` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `creeLe` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `employeId` INTEGER NOT NULL,
    `entrepriseId` INTEGER NOT NULL,
    `pointeParId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pointages` ADD CONSTRAINT `pointages_employeId_fkey` FOREIGN KEY (`employeId`) REFERENCES `employes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pointages` ADD CONSTRAINT `pointages_entrepriseId_fkey` FOREIGN KEY (`entrepriseId`) REFERENCES `entreprises`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pointages` ADD CONSTRAINT `pointages_pointeParId_fkey` FOREIGN KEY (`pointeParId`) REFERENCES `utilisateurs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
