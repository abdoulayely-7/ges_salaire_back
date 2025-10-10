import puppeteer from 'puppeteer';

export class PDFService {
  private static readonly defaultOptions = {
    format: 'A4' as const,
    printBackground: true,
    margin: {
      top: '1cm',
      bottom: '1cm',
      left: '1cm',
      right: '1cm'
    }
  };

  /**
   * Génère un PDF à partir d'un template HTML
   */
  private static async generatePDF(html: string, options = {}): Promise<Buffer> {
    const pdfOptions = {
      ...this.defaultOptions,
      ...options
    };

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf(pdfOptions);
      
      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      throw new Error('Erreur lors de la génération du PDF');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Génère un reçu de paiement PDF
   */
  static async genererRecuPaiement(paiement: any, bulletin: any, employe: any, entreprise: any): Promise<Buffer> {
    const html = this.getRecuTemplate(paiement, bulletin, employe, entreprise);
    return await this.generatePDF(html);
  }

  /**
   * Génère un bulletin de paie PDF
   */
  static async genererBulletinPaie(bulletin: any, employe: any, entreprise: any, cycle: any): Promise<Buffer> {
    const html = this.getBulletinTemplate(bulletin, employe, entreprise, cycle);
    return await this.generatePDF(html);
  }

  /**
   * Génère une liste de paiements PDF
   */
  static async genererListePaiements(paiements: any[], entreprise: any, periode: string): Promise<Buffer> {
    const html = this.getListePaiementsTemplate(paiements, entreprise, periode);
    return await this.generatePDF(html, { format: 'A4', orientation: 'landscape' });
  }

  /**
   * Template HTML pour reçu de paiement
   */
  private static getRecuTemplate(paiement: any, bulletin: any, employe: any, entreprise: any): string {
    const dateFormatee = new Date(paiement.creeLe).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const montantEnLettres = this.nombreEnLettres(paiement.montant);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reçu de Paiement - ${paiement.numeroRecu}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            font-size: 12px;
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .company-info {
            text-align: left;
            margin-bottom: 20px;
          }
          .receipt-title {
            background-color: #f0f0f0;
            padding: 10px;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
          }
          .info-section {
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
          }
          .info-section h3 {
            margin-top: 0;
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
          }
          .amount-section {
            background-color: #f9f9f9;
            border: 2px solid #333;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
          }
          .amount-words {
            font-style: italic;
            margin-top: 10px;
            color: #666;
          }
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 50px;
            text-align: center;
          }
          .signature-box {
            border-top: 1px solid #333;
            padding-top: 10px;
            margin-top: 40px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 10px;
          }
          .method-badge {
            display: inline-block;
            background-color: #10b981;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            margin-left: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h2>${entreprise.nom}</h2>
            ${entreprise.adresse ? `<p>${entreprise.adresse}</p>` : ''}
            ${entreprise.telephone ? `<p>Tél: ${entreprise.telephone}</p>` : ''}
            ${entreprise.email ? `<p>Email: ${entreprise.email}</p>` : ''}
          </div>
        </div>

        <div class="receipt-title">
          REÇU DE PAIEMENT N° ${paiement.numeroRecu}
        </div>

        <div class="info-grid">
          <div class="info-section">
            <h3>📋 Informations Employé</h3>
            <p><strong>Code:</strong> ${employe.codeEmploye}</p>
            <p><strong>Nom:</strong> ${employe.prenom} ${employe.nom}</p>
            <p><strong>Poste:</strong> ${employe.poste}</p>
            ${employe.email ? `<p><strong>Email:</strong> ${employe.email}</p>` : ''}
          </div>

          <div class="info-section">
            <h3>📄 Détails du Paiement</h3>
            <p><strong>Date:</strong> ${dateFormatee}</p>
            <p><strong>Bulletin:</strong> ${bulletin.numeroBulletin}</p>
            <p><strong>Méthode:</strong> ${this.getMethodePaiementLabel(paiement.methodePaiement)}
              <span class="method-badge">${paiement.methodePaiement}</span>
            </p>
            ${paiement.reference ? `<p><strong>Référence:</strong> ${paiement.reference}</p>` : ''}
          </div>
        </div>

        <div class="amount-section">
          <div class="amount">${paiement.montant.toLocaleString('fr-FR')} ${entreprise.devise || 'XOF'}</div>
          <div class="amount-words">${montantEnLettres}</div>
          ${paiement.notes ? `<p style="margin-top: 15px; font-size: 12px;"><strong>Notes:</strong> ${paiement.notes}</p>` : ''}
        </div>

        <div class="signatures">
          <div>
            <p><strong>Signature de l'employé</strong></p>
            <div class="signature-box">Date: ___________</div>
          </div>
          <div>
            <p><strong>Signature du caissier</strong></p>
            <div class="signature-box">Date: ___________</div>
          </div>
        </div>

        <div class="footer">
          <p>Ce reçu fait foi de paiement • Généré le ${new Date().toLocaleString('fr-FR')}</p>
          <p>Système de Gestion de Paie - ${entreprise.nom}</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template HTML pour bulletin de paie
   */
  private static getBulletinTemplate(bulletin: any, employe: any, entreprise: any, cycle: any): string {
    const dateFormatee = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bulletin de Paie - ${bulletin.numeroBulletin}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 15px; 
            font-size: 11px;
            line-height: 1.3;
          }
          .header {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .bulletin-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            background-color: #f0f0f0;
            padding: 10px;
            margin: 15px 0;
          }
          .info-section {
            border: 1px solid #ddd;
            margin: 10px 0;
            border-radius: 4px;
          }
          .info-header {
            background-color: #f8f9fa;
            padding: 8px 12px;
            font-weight: bold;
            border-bottom: 1px solid #ddd;
          }
          .info-content {
            padding: 12px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .salary-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          .salary-table th,
          .salary-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          .salary-table th {
            background-color: #f8f9fa;
            font-weight: bold;
          }
          .salary-table .number {
            text-align: right;
          }
          .total-row {
            background-color: #e3f2fd !important;
            font-weight: bold;
          }
          .net-pay {
            background-color: #c8e6c9 !important;
            font-weight: bold;
            font-size: 13px;
          }
          .contract-badge {
            display: inline-block;
            background-color: #6c757d;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            margin-left: 5px;
          }
          .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
          }
          .status-active { background-color: #d4edda; color: #155724; }
          .status-inactive { background-color: #f8d7da; color: #721c24; }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 9px;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2 style="margin: 0;">${entreprise.nom}</h2>
            ${entreprise.adresse ? `<p style="margin: 2px 0;">${entreprise.adresse}</p>` : ''}
            ${entreprise.telephone ? `<p style="margin: 2px 0;">Tél: ${entreprise.telephone}</p>` : ''}
            ${entreprise.email ? `<p style="margin: 2px 0;">Email: ${entreprise.email}</p>` : ''}
          </div>
          <div style="text-align: right;">
            <p><strong>Période:</strong> ${cycle.periode}</p>
            <p><strong>Du:</strong> ${new Date(cycle.dateDebut).toLocaleDateString('fr-FR')}</p>
            <p><strong>Au:</strong> ${new Date(cycle.dateFin).toLocaleDateString('fr-FR')}</p>
            <p><strong>Émis le:</strong> ${dateFormatee}</p>
          </div>
        </div>

        <div class="bulletin-title">
          BULLETIN DE PAIE N° ${bulletin.numeroBulletin}
        </div>

        <div class="info-grid">
          <div class="info-section">
            <div class="info-header">👤 Informations Employé</div>
            <div class="info-content">
              <p><strong>Code:</strong> ${employe.codeEmploye}</p>
              <p><strong>Nom:</strong> ${employe.prenom} ${employe.nom}</p>
              <p><strong>Poste:</strong> ${employe.poste}</p>
              <p><strong>Type de contrat:</strong> ${this.getTypeContratLabel(employe.typeContrat)}
                <span class="contract-badge">${employe.typeContrat}</span>
              </p>
              <p><strong>Statut:</strong> 
                <span class="status-badge ${employe.estActif ? 'status-active' : 'status-inactive'}">
                  ${employe.estActif ? 'ACTIF' : 'INACTIF'}
                </span>
              </p>
              <p><strong>Date d'embauche:</strong> ${new Date(employe.dateEmbauche).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          <div class="info-section">
            <div class="info-header">💼 Détails du Contrat</div>
            <div class="info-content">
              ${employe.salaireBase ? `<p><strong>Salaire de base:</strong> ${employe.salaireBase.toLocaleString('fr-FR')} ${entreprise.devise || 'XOF'}</p>` : ''}
              ${employe.tauxJournalier ? `<p><strong>Taux journalier:</strong> ${employe.tauxJournalier.toLocaleString('fr-FR')} ${entreprise.devise || 'XOF'}</p>` : ''}
              ${bulletin.joursTravailes ? `<p><strong>Jours travaillés:</strong> ${bulletin.joursTravailes}</p>` : ''}
              ${employe.typeContrat === 'HONORAIRE' && bulletin.heuresTravaillees ? `<p><strong>Heures travaillées:</strong> ${bulletin.heuresTravaillees}h</p>` : ''}
              ${employe.compteBancaire ? `<p><strong>Compte bancaire:</strong> ${employe.compteBancaire}</p>` : ''}
              ${employe.telephone ? `<p><strong>Téléphone:</strong> ${employe.telephone}</p>` : ''}
              ${employe.email ? `<p><strong>Email:</strong> ${employe.email}</p>` : ''}
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-header">💰 Détail de la Rémunération</div>
          <div class="info-content">
            <table class="salary-table">
              <thead>
                <tr>
                  <th>Libellé</th>
                  <th style="text-align: right;">Montant (${entreprise.devise || 'XOF'})</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Salaire brut</td>
                  <td class="number">${bulletin.salaireBrut.toLocaleString('fr-FR')}</td>
                </tr>
                ${bulletin.deductions > 0 ? `
                <tr>
                  <td>Déductions</td>
                  <td class="number">-${bulletin.deductions.toLocaleString('fr-FR')}</td>
                </tr>
                ` : ''}
                <tr class="net-pay">
                  <td><strong>SALAIRE NET À PAYER</strong></td>
                  <td class="number"><strong>${bulletin.salaireNet.toLocaleString('fr-FR')}</strong></td>
                </tr>
                <tr>
                  <td>Montant déjà payé</td>
                  <td class="number">${bulletin.montantPaye.toLocaleString('fr-FR')}</td>
                </tr>
                <tr class="total-row">
                  <td><strong>SOLDE RESTANT</strong></td>
                  <td class="number"><strong>${(bulletin.salaireNet - bulletin.montantPaye).toLocaleString('fr-FR')}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center;">
          <div>
            <p><strong>Signature de l'employé</strong></p>
            <div style="border-top: 1px solid #333; margin-top: 40px; padding-top: 5px;">
              Date: ___________
            </div>
          </div>
          <div>
            <p><strong>Signature de l'employeur</strong></p>
            <div style="border-top: 1px solid #333; margin-top: 40px; padding-top: 5px;">
              Date: ___________
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Ce bulletin de paie fait foi • Généré le ${new Date().toLocaleString('fr-FR')}</p>
          <p>Système de Gestion de Paie - ${entreprise.nom}</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template pour liste des paiements
   */
  private static getListePaiementsTemplate(paiements: any[], entreprise: any, periode: string): string {
    const total = paiements.reduce((sum, p) => sum + p.montant, 0);
    const dateFormatee = new Date().toLocaleDateString('fr-FR');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Liste des Paiements - ${periode}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 15px; 
            font-size: 10px;
            line-height: 1.3;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .title {
            font-size: 16px;
            font-weight: bold;
            margin: 15px 0;
            background-color: #f0f0f0;
            padding: 10px;
            text-align: center;
          }
          .summary {
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            padding: 10px;
            margin: 15px 0;
            text-align: center;
          }
          .payments-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 9px;
          }
          .payments-table th,
          .payments-table td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
          }
          .payments-table th {
            background-color: #f8f9fa;
            font-weight: bold;
          }
          .payments-table .number {
            text-align: right;
          }
          .payments-table .center {
            text-align: center;
          }
          .total-row {
            background-color: #e3f2fd;
            font-weight: bold;
          }
          .method-badge {
            display: inline-block;
            padding: 1px 4px;
            border-radius: 2px;
            font-size: 8px;
            color: white;
          }
          .method-ESPECES { background-color: #28a745; }
          .method-VIREMENT_BANCAIRE { background-color: #007bff; }
          .method-ORANGE_MONEY { background-color: #ff6900; }
          .method-WAVE { background-color: #00d4aa; }
          .method-AUTRE { background-color: #6c757d; }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 8px;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${entreprise.nom}</h2>
          ${entreprise.adresse ? `<p>${entreprise.adresse}</p>` : ''}
        </div>

        <div class="title">
          LISTE DES PAIEMENTS - ${periode}
        </div>

        <div class="summary">
          <strong>Résumé:</strong> ${paiements.length} paiement(s) • 
          Total: ${total.toLocaleString('fr-FR')} ${entreprise.devise || 'XOF'}
        </div>

        <table class="payments-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>N° Reçu</th>
              <th>Employé</th>
              <th>Code</th>
              <th>Bulletin</th>
              <th>Méthode</th>
              <th>Référence</th>
              <th style="text-align: right;">Montant</th>
            </tr>
          </thead>
          <tbody>
            ${paiements.map(paiement => `
              <tr>
                <td class="center">${new Date(paiement.creeLe).toLocaleDateString('fr-FR')}</td>
                <td>${paiement.numeroRecu}</td>
                <td>${paiement.bulletinPaie?.employe?.prenom} ${paiement.bulletinPaie?.employe?.nom}</td>
                <td class="center">${paiement.bulletinPaie?.employe?.codeEmploye}</td>
                <td class="center">${paiement.bulletinPaie?.numeroBulletin}</td>
                <td>
                  <span class="method-badge method-${paiement.methodePaiement}">
                    ${paiement.methodePaiement}
                  </span>
                </td>
                <td>${paiement.reference || '-'}</td>
                <td class="number">${paiement.montant.toLocaleString('fr-FR')}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="7"><strong>TOTAL GÉNÉRAL</strong></td>
              <td class="number"><strong>${total.toLocaleString('fr-FR')} ${entreprise.devise || 'XOF'}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p>Liste générée le ${dateFormatee} • Système de Gestion de Paie - ${entreprise.nom}</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Utilitaires
   */
  private static getMethodePaiementLabel(methode: string): string {
    const labels: Record<string, string> = {
      'ESPECES': 'Espèces',
      'VIREMENT_BANCAIRE': 'Virement Bancaire',
      'ORANGE_MONEY': 'Orange Money',
      'WAVE': 'Wave',
      'AUTRE': 'Autre'
    };
    return labels[methode] || methode;
  }

  private static getTypeContratLabel(type: string): string {
    const labels: Record<string, string> = {
      'FIXE': 'Salaire Fixe',
      'JOURNALIER': 'Journalier',
      'HONORAIRE': 'Honoraire'
    };
    return labels[type] || type;
  }

  private static nombreEnLettres(nombre: number): string {
    // Implémentation simple - peut être améliorée
    return `${nombre.toLocaleString('fr-FR')} francs CFA`;
  }
}