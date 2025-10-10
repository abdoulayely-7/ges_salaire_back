-- CreateTable
CREATE TABLE `entreprises` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `logo` VARCHAR(191) NULL,
    `adresse` VARCHAR(191) NULL,
    `telephone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `devise` VARCHAR(191) NOT NULL DEFAULT 'XOF',
    `periodePaie` ENUM('JOURNALIERE', 'HEBDOMADAIRE', 'MENSUELLE') NOT NULL DEFAULT 'MENSUELLE',
    `creeLe` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `misAJourLe` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `utilisateurs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `motDePasse` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'CAISSIER') NOT NULL,
    `estActif` BOOLEAN NOT NULL DEFAULT true,
    `derniereConnexion` DATETIME(3) NULL,
    `creeLe` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `misAJourLe` DATETIME(3) NOT NULL,
    `entrepriseId` INTEGER NULL,

    UNIQUE INDEX `utilisateurs_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codeEmploye` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `telephone` VARCHAR(191) NULL,
    `poste` VARCHAR(191) NOT NULL,
    `typeContrat` ENUM('JOURNALIER', 'FIXE', 'HONORAIRE') NOT NULL,
    `salaireBase` DOUBLE NULL,
    `tauxJournalier` DOUBLE NULL,
    `compteBancaire` VARCHAR(191) NULL,
    `estActif` BOOLEAN NOT NULL DEFAULT true,
    `dateEmbauche` DATETIME(3) NOT NULL,
    `creeLe` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `misAJourLe` DATETIME(3) NOT NULL,
    `entrepriseId` INTEGER NOT NULL,

    UNIQUE INDEX `employes_entrepriseId_codeEmploye_key`(`entrepriseId`, `codeEmploye`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cycles_paie` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titre` VARCHAR(191) NOT NULL,
    `periode` VARCHAR(191) NOT NULL,
    `dateDebut` DATETIME(3) NOT NULL,
    `dateFin` DATETIME(3) NOT NULL,
    `statut` ENUM('BROUILLON', 'APPROUVE', 'CLOTURE') NOT NULL DEFAULT 'BROUILLON',
    `totalBrut` DOUBLE NOT NULL DEFAULT 0,
    `totalNet` DOUBLE NOT NULL DEFAULT 0,
    `totalPaye` DOUBLE NOT NULL DEFAULT 0,
    `creeLe` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `misAJourLe` DATETIME(3) NOT NULL,
    `approuveLe` DATETIME(3) NULL,
    `clotureLe` DATETIME(3) NULL,
    `entrepriseId` INTEGER NOT NULL,

    UNIQUE INDEX `cycles_paie_entrepriseId_periode_key`(`entrepriseId`, `periode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bulletins_paie` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numeroBulletin` VARCHAR(191) NOT NULL,
    `joursTravailes` INTEGER NULL,
    `salaireBrut` DOUBLE NOT NULL,
    `deductions` DOUBLE NOT NULL DEFAULT 0,
    `salaireNet` DOUBLE NOT NULL,
    `montantPaye` DOUBLE NOT NULL DEFAULT 0,
    `statut` ENUM('EN_ATTENTE', 'PARTIEL', 'PAYE') NOT NULL DEFAULT 'EN_ATTENTE',
    `creeLe` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `misAJourLe` DATETIME(3) NOT NULL,
    `employeId` INTEGER NOT NULL,
    `cyclePaieId` INTEGER NOT NULL,

    UNIQUE INDEX `bulletins_paie_cyclePaieId_employeId_key`(`cyclePaieId`, `employeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paiements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `montant` DOUBLE NOT NULL,
    `methodePaiement` ENUM('ESPECES', 'VIREMENT_BANCAIRE', 'ORANGE_MONEY', 'WAVE', 'AUTRE') NOT NULL,
    `reference` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `numeroRecu` VARCHAR(191) NOT NULL,
    `creeLe` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `bulletinPaieId` INTEGER NOT NULL,
    `traiteParId` INTEGER NOT NULL,

    UNIQUE INDEX `paiements_numeroRecu_key`(`numeroRecu`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `utilisateurs` ADD CONSTRAINT `utilisateurs_entrepriseId_fkey` FOREIGN KEY (`entrepriseId`) REFERENCES `entreprises`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employes` ADD CONSTRAINT `employes_entrepriseId_fkey` FOREIGN KEY (`entrepriseId`) REFERENCES `entreprises`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cycles_paie` ADD CONSTRAINT `cycles_paie_entrepriseId_fkey` FOREIGN KEY (`entrepriseId`) REFERENCES `entreprises`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bulletins_paie` ADD CONSTRAINT `bulletins_paie_employeId_fkey` FOREIGN KEY (`employeId`) REFERENCES `employes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bulletins_paie` ADD CONSTRAINT `bulletins_paie_cyclePaieId_fkey` FOREIGN KEY (`cyclePaieId`) REFERENCES `cycles_paie`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paiements` ADD CONSTRAINT `paiements_bulletinPaieId_fkey` FOREIGN KEY (`bulletinPaieId`) REFERENCES `bulletins_paie`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paiements` ADD CONSTRAINT `paiements_traiteParId_fkey` FOREIGN KEY (`traiteParId`) REFERENCES `utilisateurs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
