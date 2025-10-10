/*
  Warnings:

  - The primary key for the `bulletins_paie` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `cyclePaieId` on the `bulletins_paie` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `employeId` on the `bulletins_paie` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `id` on the `bulletins_paie` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `cycles_paie` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `entrepriseId` on the `cycles_paie` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `id` on the `cycles_paie` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `employes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `entrepriseId` on the `employes` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `id` on the `employes` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `entreprises` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `entreprises` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `paiements` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `bulletinPaieId` on the `paiements` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `id` on the `paiements` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `traiteParId` on the `paiements` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `utilisateurs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `entrepriseId` on the `utilisateurs` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `id` on the `utilisateurs` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bulletins_paie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numeroBulletin" TEXT NOT NULL,
    "joursTravailes" INTEGER,
    "salaireBrut" REAL NOT NULL,
    "deductions" REAL NOT NULL DEFAULT 0,
    "salaireNet" REAL NOT NULL,
    "montantPaye" REAL NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" DATETIME NOT NULL,
    "employeId" INTEGER NOT NULL,
    "cyclePaieId" INTEGER NOT NULL,
    CONSTRAINT "bulletins_paie_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "employes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bulletins_paie_cyclePaieId_fkey" FOREIGN KEY ("cyclePaieId") REFERENCES "cycles_paie" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_bulletins_paie" ("creeLe", "cyclePaieId", "deductions", "employeId", "id", "joursTravailes", "misAJourLe", "montantPaye", "numeroBulletin", "salaireBrut", "salaireNet", "statut") SELECT "creeLe", "cyclePaieId", "deductions", "employeId", "id", "joursTravailes", "misAJourLe", "montantPaye", "numeroBulletin", "salaireBrut", "salaireNet", "statut" FROM "bulletins_paie";
DROP TABLE "bulletins_paie";
ALTER TABLE "new_bulletins_paie" RENAME TO "bulletins_paie";
CREATE UNIQUE INDEX "bulletins_paie_cyclePaieId_employeId_key" ON "bulletins_paie"("cyclePaieId", "employeId");
CREATE TABLE "new_cycles_paie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titre" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "dateDebut" DATETIME NOT NULL,
    "dateFin" DATETIME NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'BROUILLON',
    "totalBrut" REAL NOT NULL DEFAULT 0,
    "totalNet" REAL NOT NULL DEFAULT 0,
    "totalPaye" REAL NOT NULL DEFAULT 0,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" DATETIME NOT NULL,
    "approuveLe" DATETIME,
    "clotureLe" DATETIME,
    "entrepriseId" INTEGER NOT NULL,
    CONSTRAINT "cycles_paie_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprises" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_cycles_paie" ("approuveLe", "clotureLe", "creeLe", "dateDebut", "dateFin", "entrepriseId", "id", "misAJourLe", "periode", "statut", "titre", "totalBrut", "totalNet", "totalPaye") SELECT "approuveLe", "clotureLe", "creeLe", "dateDebut", "dateFin", "entrepriseId", "id", "misAJourLe", "periode", "statut", "titre", "totalBrut", "totalNet", "totalPaye" FROM "cycles_paie";
DROP TABLE "cycles_paie";
ALTER TABLE "new_cycles_paie" RENAME TO "cycles_paie";
CREATE UNIQUE INDEX "cycles_paie_entrepriseId_periode_key" ON "cycles_paie"("entrepriseId", "periode");
CREATE TABLE "new_employes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codeEmploye" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "poste" TEXT NOT NULL,
    "typeContrat" TEXT NOT NULL,
    "salaireBase" REAL,
    "tauxJournalier" REAL,
    "compteBancaire" TEXT,
    "estActif" BOOLEAN NOT NULL DEFAULT true,
    "dateEmbauche" DATETIME NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" DATETIME NOT NULL,
    "entrepriseId" INTEGER NOT NULL,
    CONSTRAINT "employes_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprises" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_employes" ("codeEmploye", "compteBancaire", "creeLe", "dateEmbauche", "email", "entrepriseId", "estActif", "id", "misAJourLe", "nom", "poste", "prenom", "salaireBase", "tauxJournalier", "telephone", "typeContrat") SELECT "codeEmploye", "compteBancaire", "creeLe", "dateEmbauche", "email", "entrepriseId", "estActif", "id", "misAJourLe", "nom", "poste", "prenom", "salaireBase", "tauxJournalier", "telephone", "typeContrat" FROM "employes";
DROP TABLE "employes";
ALTER TABLE "new_employes" RENAME TO "employes";
CREATE UNIQUE INDEX "employes_entrepriseId_codeEmploye_key" ON "employes"("entrepriseId", "codeEmploye");
CREATE TABLE "new_entreprises" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "logo" TEXT,
    "adresse" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "devise" TEXT NOT NULL DEFAULT 'XOF',
    "periodePaie" TEXT NOT NULL DEFAULT 'MENSUELLE',
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" DATETIME NOT NULL
);
INSERT INTO "new_entreprises" ("adresse", "creeLe", "devise", "email", "id", "logo", "misAJourLe", "nom", "periodePaie", "telephone") SELECT "adresse", "creeLe", "devise", "email", "id", "logo", "misAJourLe", "nom", "periodePaie", "telephone" FROM "entreprises";
DROP TABLE "entreprises";
ALTER TABLE "new_entreprises" RENAME TO "entreprises";
CREATE TABLE "new_paiements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "montant" REAL NOT NULL,
    "methodePaiement" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "numeroRecu" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bulletinPaieId" INTEGER NOT NULL,
    "traiteParId" INTEGER NOT NULL,
    CONSTRAINT "paiements_bulletinPaieId_fkey" FOREIGN KEY ("bulletinPaieId") REFERENCES "bulletins_paie" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "paiements_traiteParId_fkey" FOREIGN KEY ("traiteParId") REFERENCES "utilisateurs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_paiements" ("bulletinPaieId", "creeLe", "id", "methodePaiement", "montant", "notes", "numeroRecu", "reference", "traiteParId") SELECT "bulletinPaieId", "creeLe", "id", "methodePaiement", "montant", "notes", "numeroRecu", "reference", "traiteParId" FROM "paiements";
DROP TABLE "paiements";
ALTER TABLE "new_paiements" RENAME TO "paiements";
CREATE UNIQUE INDEX "paiements_numeroRecu_key" ON "paiements"("numeroRecu");
CREATE TABLE "new_utilisateurs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "estActif" BOOLEAN NOT NULL DEFAULT true,
    "derniereConnexion" DATETIME,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" DATETIME NOT NULL,
    "entrepriseId" INTEGER,
    CONSTRAINT "utilisateurs_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprises" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_utilisateurs" ("creeLe", "derniereConnexion", "email", "entrepriseId", "estActif", "id", "misAJourLe", "motDePasse", "nom", "prenom", "role") SELECT "creeLe", "derniereConnexion", "email", "entrepriseId", "estActif", "id", "misAJourLe", "motDePasse", "nom", "prenom", "role" FROM "utilisateurs";
DROP TABLE "utilisateurs";
ALTER TABLE "new_utilisateurs" RENAME TO "utilisateurs";
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
