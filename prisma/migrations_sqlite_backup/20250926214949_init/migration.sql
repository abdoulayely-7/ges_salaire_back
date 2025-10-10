-- CreateTable
CREATE TABLE "entreprises" (
    "id" TEXT NOT NULL PRIMARY KEY,
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

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "estActif" BOOLEAN NOT NULL DEFAULT true,
    "derniereConnexion" DATETIME,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" DATETIME NOT NULL,
    "entrepriseId" TEXT NOT NULL,
    CONSTRAINT "utilisateurs_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprises" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "employes" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "entrepriseId" TEXT NOT NULL,
    CONSTRAINT "employes_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprises" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cycles_paie" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "entrepriseId" TEXT NOT NULL,
    CONSTRAINT "cycles_paie_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprises" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bulletins_paie" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroBulletin" TEXT NOT NULL,
    "joursTravailes" INTEGER,
    "salaireBrut" REAL NOT NULL,
    "deductions" REAL NOT NULL DEFAULT 0,
    "salaireNet" REAL NOT NULL,
    "montantPaye" REAL NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" DATETIME NOT NULL,
    "employeId" TEXT NOT NULL,
    "cyclePaieId" TEXT NOT NULL,
    CONSTRAINT "bulletins_paie_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "employes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bulletins_paie_cyclePaieId_fkey" FOREIGN KEY ("cyclePaieId") REFERENCES "cycles_paie" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "montant" REAL NOT NULL,
    "methodePaiement" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "numeroRecu" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bulletinPaieId" TEXT NOT NULL,
    "traiteParId" TEXT NOT NULL,
    CONSTRAINT "paiements_bulletinPaieId_fkey" FOREIGN KEY ("bulletinPaieId") REFERENCES "bulletins_paie" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "paiements_traiteParId_fkey" FOREIGN KEY ("traiteParId") REFERENCES "utilisateurs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employes_entrepriseId_codeEmploye_key" ON "employes"("entrepriseId", "codeEmploye");

-- CreateIndex
CREATE UNIQUE INDEX "cycles_paie_entrepriseId_periode_key" ON "cycles_paie"("entrepriseId", "periode");

-- CreateIndex
CREATE UNIQUE INDEX "bulletins_paie_cyclePaieId_employeId_key" ON "bulletins_paie"("cyclePaieId", "employeId");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_numeroRecu_key" ON "paiements"("numeroRecu");
