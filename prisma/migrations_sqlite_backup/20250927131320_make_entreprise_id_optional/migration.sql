-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_utilisateurs" (
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
    "entrepriseId" TEXT,
    CONSTRAINT "utilisateurs_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "entreprises" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_utilisateurs" ("creeLe", "derniereConnexion", "email", "entrepriseId", "estActif", "id", "misAJourLe", "motDePasse", "nom", "prenom", "role") SELECT "creeLe", "derniereConnexion", "email", "entrepriseId", "estActif", "id", "misAJourLe", "motDePasse", "nom", "prenom", "role" FROM "utilisateurs";
DROP TABLE "utilisateurs";
ALTER TABLE "new_utilisateurs" RENAME TO "utilisateurs";
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
