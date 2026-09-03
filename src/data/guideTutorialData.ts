export interface GuideTutorialItem {
  id: string;
  tabKey: string;
  title: string;
  shortSummary: string; // bulle d'information au survol
  description: string;  // description complète au clic (popup modal)
  objectifs: string[];  // étapes pas à pas / objectifs clés
  conseilPro: string;   // conseil du Cultivateur / bonnes pratiques
  category: 'Cockpit' | 'Opérations Terrain' | 'Finance & Gestion' | 'Système & Sécurité';
}

export const GUIDE_TUTORIAL_ITEMS: Record<string, GuideTutorialItem> = {
  dashboard: {
    id: 'tuto-dashboard',
    tabKey: 'dashboard',
    title: 'Cockpit Exécutif & Météo',
    category: 'Cockpit',
    shortSummary: 'Pilotage global en temps réel : météo locale, alertes critiques, alertes stock et trésorerie.',
    description: "Le Cockpit Exécutif est le tableau de bord décisionnel central de l'exploitation. Il agrège en direct les prévisions météorologiques hyperlocales, la situation de trésorerie nette, le taux d'occupation des parcelles et les alertes sanitaires ou phytosanitaires.",
    objectifs: [
      'Consulter les prévisions météorologiques locales (pluviométrie, température, vent) pour programmer les semis ou pulvérisations.',
      'Vérifier les alertes critiques (ruptures de stock d\'intrants, pannes machines, seuils sanitaires dépassés).',
      'Contrôler la santé financière synthétique et les volumes récoltés sur la campagne active.'
    ],
    conseilPro: "Commencez chaque journée par ce cockpit pour ajuster les équipes terrain selon la météo et traiter immédiatement les alertes prioritaires."
  },
  'bi-reporting': {
    id: 'tuto-bi-reporting',
    tabKey: 'bi-reporting',
    title: 'BI & Rapports Décisionnels',
    category: 'Cockpit',
    shortSummary: 'Indicateurs clés de performance (KPI), tableaux de bord personnalisés et exports automatisés.',
    description: "Le module Business Intelligence (BI) vous permet d'analyser la rentabilité par hectare, l'efficacité des intrants, les ratios de conversion zootechnique et les coûts de revient. Vous pouvez concevoir des rapports programmés pour les partenaires ou banques.",
    objectifs: [
      'Suivre les KPI financiers et agronomiques en temps réel (Marge brute/ha, Coût machine/heure).',
      'Créer et filtrer des tableaux de bord sur-mesure selon les besoins de la direction ou des coopérateurs.',
      'Programmer l\'envoi automatique de bilans d\'exploitation hebdomadaires ou mensuels en PDF/Excel.'
    ],
    conseilPro: "Configurez des alertes BI pour être notifié automatiquement dès qu'un coût unitaire dépasse votre marge cible de 10%."
  },
  agriculture: {
    id: 'tuto-agriculture',
    tabKey: 'agriculture',
    title: 'Production Végétale & Foncier',
    category: 'Opérations Terrain',
    shortSummary: 'Gestion complète du foncier : terrains acquis, découpage en parcelles, cultures, interventions et récoltes.',
    description: "Ce module gère toute l'arborescence foncière et agricole de votre entreprise ou coopérative. Vous y suivez individuellement chaque terrain/domaine acquis dans différentes villes avec ses titres juridiques, le découpez en parcelles géolocalisées, et pilotez les cycles culturaux du semis à la récolte.",
    objectifs: [
      '1. Enregistrer vos Domaines & Terrains acquis (titre foncier, ville, superficie, coûts d\'aménagement).',
      '2. Découper chaque terrain en Parcelles avec leurs caractéristiques (analyse sol, pH, point d\'eau, vocation).',
      '3. Lancer des Campagnes et affecter les Cultures (variétés, prévisionnel de rendement, budget prévisionnel).',
      '4. Journaliser les Interventions culturales (labour, fertilisation, traitements avec DAR respecté) et consigner les Récoltes.'
    ],
    conseilPro: "Pour un nouveau client, commencez par l'onglet 'Domaines & Terrains' pour enregistrer votre première propriété, puis subdivisez-la en parcelles avant de planifier les cultures."
  },
  elevage: {
    id: 'tuto-elevage',
    tabKey: 'elevage',
    title: 'Production Animale & Élevage',
    category: 'Opérations Terrain',
    shortSummary: 'Suivi zootechnique : sites, cheptel individuel, troupeaux, carnet sanitaire, alimentation et reproduction.',
    description: "Gérez l'ensemble des activités pastorales et avicoles : fiches d'identification des animaux (bovins, ovins, porcins, volailles), gestion des troupeaux par bâtiment/enclos, suivi de la reproduction, courbes de ponte/lait et carnet sanitaire.",
    objectifs: [
      'Structurer vos sites d\'élevage et bâtiments pastoraux (porcheries, étables, poulaillers).',
      'Identifier vos animaux et troupeaux avec traçabilité généalogique et statuts de santé.',
      'Planifier les vaccinations et soins vétérinaires dans le carnet sanitaire.',
      'Suivre les rations alimentaires (feed logs) et enregistrer les productions journalières (œufs, lait).'
    ],
    conseilPro: "Associez chaque troupeau à une parcelle pastorale dédiée pour assurer une rotation saine des pâturages."
  },
  stocks: {
    id: 'tuto-stocks',
    tabKey: 'stocks',
    title: 'Stocks & Magasins',
    category: 'Opérations Terrain',
    shortSummary: 'Contrôle des intrants, semences, récoltes et matériels : mouvements, seuils d\'alerte et valorisation CUMP.',
    description: "Le magasin centralise les intrants (fertilisants, produits phyto, aliments pour bétail), les semences et les stocks de récoltes prêtes à la vente. Il assure la valorisation comptable (CUMP) et prévient les ruptures via des seuils de réapprovisionnement.",
    objectifs: [
      'Créer les magasins et entrepôts de stockage par site d\'exploitation.',
      'Gérer le catalogue des articles avec prix unitaire d\'achat, stock minimum et unité de mesure.',
      'Tracer rigoureusement chaque mouvement d\'entrée, de sortie consommation terrain ou d\'inventaire.'
    ],
    conseilPro: "Liez toujours une sortie de stock à une intervention agricole ou un lot de nutrition animale pour une traçabilité parfaite des coûts."
  },
  'parc-materiel': {
    id: 'tuto-parc-materiel',
    tabKey: 'parc-materiel',
    title: 'Parc Engins & Maintenance',
    category: 'Opérations Terrain',
    shortSummary: 'Parc roulant et machines : compteurs horaires, carnets d\'entretien préventif, pannes et carburant.',
    description: "Assurez la longévité de votre matériel agricole et logistique (tracteurs, motopompes, camions, moissonneuses). Suivez les compteurs d'utilisation, programmez les révisions périodiques et surveillez les consommations de carburant.",
    objectifs: [
      'Enregistrer le parc de machines avec fiches techniques, dates d\'acquisition et assurances.',
      'Mettre à jour les compteurs horaires ou kilométriques après chaque chantier.',
      'Déclencher les ordres de maintenance préventive et curative pour limiter les temps d\'arrêt.'
    ],
    conseilPro: "Consignez chaque plein de carburant pour détecter immédiatement les surconsommations suspectes ou les fuites motrices."
  },
  commercial: {
    id: 'tuto-commercial',
    tabKey: 'commercial',
    title: 'Facturation & Ventes',
    category: 'Finance & Gestion',
    shortSummary: 'Cycle client complet : devis, bons de commande, factures normalisées, livraisons et encaissements.',
    description: "Gérez l'ensemble des relations commerciales avec vos acheteurs (grossistes, coopératives d'achat, supermarchés, particuliers). Émettez des devis proforma, transformez-les en factures conformes et suivez les règlements bancaires ou cash.",
    objectifs: [
      'Constituer le fichier de vos clients acheteurs et conditions de règlement.',
      'Éditer des devis chiffrés et transformer les ventes validées en factures normalisées.',
      'Enregistrer les encaissements partiels ou totaux et surveiller les créances échues.'
    ],
    conseilPro: "Activez les alertes d'échéance de paiement pour relancer automatiquement les clients avant d'engager de nouvelles livraisons."
  },
  compta: {
    id: 'tuto-compta',
    tabKey: 'compta',
    title: 'Comptabilité SYSCOHADA',
    category: 'Finance & Gestion',
    shortSummary: 'Normes OHADA : journaux des ventes/achats, grand livre, balance, budgets et comptes de résultat.',
    description: "Tenue comptable certifiée selon le plan comptable SYSCOHADA Révisé. Générez automatiquement vos écritures comptables à partir des opérations commerciales et agricoles, suivez les journaux auxiliaires et comparez les dépenses aux budgets alloués.",
    objectifs: [
      'Générer et valider les pièces comptables sur les journaux (Achats, Ventes, Banque, Caisse, OD).',
      'Éditer la Balance Générale et le Grand Livre analytique en devise locale (FCFA).',
      'Construire des budgets prévisionnels par catégorie et suivre la consommation en temps réel.'
    ],
    conseilPro: "Rapprochez mensuellement le journal de trésorerie avec vos relevés bancaires réels pour garantir l'exactitude du bilan."
  },
  rh: {
    id: 'tuto-rh',
    tabKey: 'rh',
    title: 'Ressources Humaines & Paie',
    category: 'Système & Sécurité',
    shortSummary: 'Gestion du personnel : contrats, registre des ouvriers, pointage des présences et bulletins de paie CNPS.',
    description: "Pilotez le capital humain de votre exploitation : employés permanents, cadres techniques et journaliers agricoles. Gérez les pointages de présence journaliers, calculez les salaires avec cotisations sociales (CNPS) et éditez les bulletins de paie officiels.",
    objectifs: [
      'Tenir le registre unique du personnel (matricule, fonction, contrat, salaire de base).',
      'Pointer les présences, heures supplémentaires ou absences sur le terminal terrain.',
      'Éditer les fiches de paie mensuelles avec déductions légales et primes de rendement.'
    ],
    conseilPro: "Attribuez un matricule distinct aux ouvriers saisonniers pour simplifier les décomptes à la tâche lors des pointes de récolte."
  },
  ged: {
    id: 'tuto-ged',
    tabKey: 'ged',
    title: 'Archivage Électronique GED',
    category: 'Système & Sécurité',
    shortSummary: 'Gestion Électronique des Documents : classeurs numériques, titres fonciers, analyses et contrats sécurisés.',
    description: "Coffre-fort numérique pour numériser, indexer et sécuriser l'ensemble des documents cruciaux de l'exploitation : plans cadastraux, attestations villageoises, contrats de travail, factures fournisseurs scannées et certificats phytosanitaires.",
    objectifs: [
      'Classer vos pièces selon une arborescence claire (Administratif, Foncier, RH, Technique).',
      'Téléverser des documents avec indexation par mots-clés pour une recherche instantanée.',
      'Garantir la conformité et la pérennité des justificatifs lors des audits ou contrôles fiscaux.'
    ],
    conseilPro: "Scannez immédiatement tout reçu papier d'achat d'intrant ou PV coutumier d'acquisition foncière pour éviter toute perte physique."
  },
  settings: {
    id: 'tuto-settings',
    tabKey: 'settings',
    title: 'Paramètres & Droits d\'Accès',
    category: 'Système & Sécurité',
    shortSummary: 'Configuration avancée : rôles utilisateurs, personnalisation des libellés et règles de sécurité.',
    description: "Personnalisez l'application selon votre organisation : définissez les rôles (SuperAdmin, Agronome, Vétérinaire, Comptable, Chef d'équipe), configurez les droits d'accès par module, et adaptez le vocabulaire métier à vos réalités régionales.",
    objectifs: [
      'Configurer les rôles utilisateurs et restreindre l\'accès aux seuls modules autorisés.',
      'Personnaliser les libellés de l\'application (Cultures, Parcelles, Villes, Quartiers).',
      'Consulter les journaux d\'audit technique pour garantir la traçabilité intégrale des actions.'
    ],
    conseilPro: "N'accordez le rôle Super Administrateur qu'aux gestionnaires de confiance et utilisez des profils spécialisés pour vos collaborateurs."
  }
};
