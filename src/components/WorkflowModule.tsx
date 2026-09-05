import React, { useState, useEffect } from 'react';
import {
  Compass,
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Sprout,
  Egg,
  Package,
  Wrench,
  ShoppingBag,
  LineChart,
  BookOpen,
  Layers,
  Sparkles,
  TrendingUp,
  RotateCcw,
  CheckCheck,
  AlertCircle
} from 'lucide-react';
import {
  Exploitation,
  Champ,
  Parcelle,
  Culture,
  Troupeau,
  Animal,
  Article,
  MouvementStock,
  Intervention,
  Recolte,
  FactureClient,
  EncaissementClient
} from '../types';

interface WorkflowModuleProps {
  exploitations: Exploitation[];
  champs: Champ[];
  parcelles: Parcelle[];
  cultures: Culture[];
  troupeaux: Troupeau[];
  animaux: Animal[];
  articles: Article[];
  mouvementsStock: MouvementStock[];
  interventions: Intervention[];
  recoltes: Recolte[];
  factures: FactureClient[];
  encaissements: EncaissementClient[];
  tenantId?: string;
  onNavigateTab: (tab: any, subTab?: string) => void;
}

interface WorkflowTask {
  id: string;
  title: string;
  description: string;
  targetTab: string;
  targetSubTab?: string;
  hint: string;
}

interface WorkflowStep {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  agriAdvice: string;
  targetTab: string;
  targetSubTab?: string;
  tasks: WorkflowTask[];
}

export default function WorkflowModule({
  exploitations,
  champs,
  parcelles,
  cultures,
  troupeaux,
  animaux,
  articles,
  mouvementsStock,
  interventions,
  recoltes,
  factures,
  encaissements,
  tenantId = 'default',
  onNavigateTab
}: WorkflowModuleProps) {
  // Define 8 comprehensive lifecycle steps
  const steps: WorkflowStep[] = [
    {
      id: 1,
      slug: 'foncier',
      title: 'Foncier, Terrains & Découpage en Parcelles',
      subtitle: 'Acquisition, bornage et division parcellaire',
      badge: 'Foncier & Terrains',
      icon: <MapPin className="h-5 w-5" />,
      color: 'emerald',
      description:
        "La base de toute exploitation agricole ou pastorale réside dans la maîtrise de son assise foncière. Enregistrez vos terrains ou domaines (titre foncier, bail), puis découpez-les en parcelles en attribuant à chacune une vocation claire : parcelles pour les cultures végétales, parcelles pastorales pour l'élevage (pâturage tournant, enclos), et parcelles en réserve.",
      agriAdvice:
        "💡 Bonnes pratiques : Prévoyez toujours une zone tampon entre les parcelles de maraîchage et les enclos d'élevage pour éviter les divagations d'animaux, tout en organisant la circulation facile du fumier vers les zones cultivées pour l'amendement organique.",
      targetTab: 'agriculture',
      targetSubTab: 'champs',
      tasks: [
        {
          id: 't-1-1',
          title: "Enregistrer vos terrains et domaines fonciers",
          description: "Déclarez vos terrains avec leur superficie totale, statut juridique (titre, bail) et localisation GPS.",
          targetTab: 'agriculture',
          targetSubTab: 'champs',
          hint: `${champs.length} terrain(s) déjà enregistré(s)`
        },
        {
          id: 't-1-2',
          title: "Découper des parcelles pour la Culture Végétale",
          description: "Morcelez le terrain en créant des parcelles agricoles avec type de sol, pH et source d'eau.",
          targetTab: 'agriculture',
          targetSubTab: 'parcelles',
          hint: `${parcelles.filter(p => (p.vocation || 'Agricole') === 'Agricole').length} parcelle(s) agricole(s)`
        },
        {
          id: 't-1-3',
          title: "Découper des parcelles dédiées à la Production Animale",
          description: "Allouez dans le même terrain des parcelles pour le pâturage de troupeau, stabulation ou volaille plein air.",
          targetTab: 'agriculture',
          targetSubTab: 'parcelles',
          hint: `${parcelles.filter(p => p.vocation === 'Pastorale').length} parcelle(s) pastorale(s)`
        },
        {
          id: 't-1-4',
          title: "Vérifier la réserve foncière restante",
          description: "Consultez les hectares restants libres sur chaque terrain pour planifier les futures extensions.",
          targetTab: 'agriculture',
          targetSubTab: 'champs',
          hint: "Visualisation de la barre d'allocation tricolore dans l'onglet Terrains"
        }
      ]
    },
    {
      id: 2,
      slug: 'planification',
      title: 'Planification des Productions Végétale & Animale',
      subtitle: 'Affectation des cultures et des troupeaux',
      badge: 'Affectations & Assolement',
      icon: <Sprout className="h-5 w-5" />,
      color: 'teal',
      description:
        "Une fois les parcelles créées, attribuez à chaque parcelle agricole sa culture de campagne (Maïs, Cacao, Tomate, etc.) et assignez à vos parcelles pastorales les troupeaux d'animaux (bovins, caprins, porcins, volailles) pour optimiser l'occupation de vos terres.",
      agriAdvice:
        "💡 Bonnes pratiques : Pratiquez la rotation des cultures (céréales suivies de légumineuses fixatrices d'azote) et le pâturage tournant pour régénérer la biomasse fourragère sans dégrader les sols.",
      targetTab: 'agriculture',
      targetSubTab: 'cultures',
      tasks: [
        {
          id: 't-2-1',
          title: "Créer vos campagnes agricoles",
          description: "Définissez la saisonnalité (saison des pluies, saison sèche, contre-saison).",
          targetTab: 'agriculture',
          targetSubTab: 'cultures',
          hint: "Calendrier cultural et objectifs"
        },
        {
          id: 't-2-2',
          title: "Assigner les cultures aux parcelles végétales",
          description: "Enregistrez les cultures actives avec variété, date de semis et rendement cible.",
          targetTab: 'agriculture',
          targetSubTab: 'cultures',
          hint: `${cultures.length} culture(s) active(s)`
        },
        {
          id: 't-2-3',
          title: "Créer les troupeaux et lots d'animaux",
          description: "Enregistrez vos effectifs animaux (bovins laitiers/viande, ovins, porcs, poulets).",
          targetTab: 'elevage',
          targetSubTab: 'troupeaux',
          hint: `${troupeaux.length} troupeau(x), ${animaux.length} animal/animaux`
        },
        {
          id: 't-2-4',
          title: "Assigner les troupeaux aux parcelles pastorales",
          description: "Positionnez chaque groupe d'animaux sur sa parcelle de pâturage ou son enclos.",
          targetTab: 'agriculture',
          targetSubTab: 'parcelles',
          hint: "Fiche parcelle -> Vocation Pastorale"
        }
      ]
    },
    {
      id: 3,
      slug: 'approvisionnements',
      title: 'Approvisionnements, Achats & Intrants',
      subtitle: 'Semences, fertilisants, aliments bétail et matériel',
      badge: 'Stocks & Achats',
      icon: <Package className="h-5 w-5" />,
      color: 'blue',
      description:
        "Garantissez la disponibilité des intrants indispensables : semences certifiées, compost, fertilisants NPK, tourteaux, provendes pour animaux et vaccins vétérinaires. Réceptionnez-les dans vos magasins et suivez les niveaux d'alerte.",
      agriAdvice:
        "💡 Bonnes pratiques : Négociez les achats groupés d'engrais et de concentrés alimentaires au moins 4 semaines avant le début de campagne pour bénéficier des meilleurs tarifs et éviter les ruptures en pleine saison.",
      targetTab: 'stocks',
      targetSubTab: 'catalogue',
      tasks: [
        {
          id: 't-3-1',
          title: "Référencer les fournisseurs agricoles & vétérinaires",
          description: "Enregistrez vos partenaires d'approvisionnement en semences et alimentation bétail.",
          targetTab: 'commercial',
          targetSubTab: 'fournisseurs',
          hint: "Module Commercial -> Fournisseurs"
        },
        {
          id: 't-3-2',
          title: "Cataloguer les articles et intrants dans les magasins",
          description: "Créez les articles avec stock de sécurité, coût unitaire et emplacement magasin.",
          targetTab: 'stocks',
          targetSubTab: 'catalogue',
          hint: `${articles.length} article(s) référencé(s)`
        },
        {
          id: 't-3-3',
          title: "Enregistrer les réceptions d'intrants en stock",
          description: "Effectuez les entrées de stock pour valoriser les disponibilités dans l'exploitation.",
          targetTab: 'stocks',
          targetSubTab: 'mouvements',
          hint: `${mouvementsStock.length} mouvement(s) de stock`
        }
      ]
    },
    {
      id: 4,
      slug: 'operations',
      title: 'Opérations Quotidiennes & Soins',
      subtitle: 'Travaux du sol, fertilisation, rations et santé animale',
      badge: 'Conduite & Suivi',
      icon: <Wrench className="h-5 w-5" />,
      color: 'indigo',
      description:
        "Au quotidien, consigne l'ensemble des travaux réalisés sur les parcelles (labour, traitement, arrosage) et les actes de suivi d'élevage (pesées, distributions d'aliments, vaccinations, carnet sanitaire). Tout est historisé pour une traçabilité totale.",
      agriAdvice:
        "💡 Bonnes pratiques : Notez chaque intervention le jour même. En élevage, la détection précoce des symptômes sanitaires et le respect strict du calendrier de vaccination évitent les hécatombes.",
      targetTab: 'agriculture',
      targetSubTab: 'interventions',
      tasks: [
        {
          id: 't-4-1',
          title: "Consigner les interventions culturales au champ",
          description: "Enregistrez chaque opération (semis, sarclage, fertilisation) sur la parcelle concernée.",
          targetTab: 'agriculture',
          targetSubTab: 'interventions',
          hint: `${interventions.length} intervention(s) agricole(s)`
        },
        {
          id: 't-4-2',
          title: "Suivre la distribution alimentaire du bétail",
          description: "Renseignez les rations d'ensilage, fourrage vert, tourteau et concentrés servis aux animaux.",
          targetTab: 'elevage',
          targetSubTab: 'alimentation',
          hint: "Module Élevage -> Alimentation"
        },
        {
          id: 't-4-3',
          title: "Tenir le carnet de santé et prophylaxie",
          description: "Enregistrez les vaccins, déparasitages et soins vétérinaires administrés.",
          targetTab: 'elevage',
          targetSubTab: 'sanitaire',
          hint: "Module Élevage -> Carnet Sanitaire"
        },
        {
          id: 't-4-4',
          title: "Consulter la fiche historique de la parcelle",
          description: "Vérifiez dans l'onglet Terrains ce qui a été fait sur chaque parcelle pour tracer le sol.",
          targetTab: 'agriculture',
          targetSubTab: 'champs',
          hint: "Bouton 'Historique & Ce qu'on a fait dessus' sur chaque parcelle"
        }
      ]
    },
    {
      id: 5,
      slug: 'recoltes',
      title: 'Récoltes & Collecte des Productions Animales',
      subtitle: 'Sortie des parcelles, pesée et rendements réels',
      badge: 'Production & Rendements',
      icon: <Egg className="h-5 w-5" />,
      color: 'amber',
      description:
        "C'est l'étape de concrétisation : saisissez les tonnages récoltés sur chaque parcelle pour mesurer le rendement par hectare, et enregistrez la production animale continue (traite de lait, ramassage des œufs, poids d'animaux finis pour la boucherie).",
      agriAdvice:
        "💡 Bonnes pratiques : Pesez rigoureusement les récoltes dès la sortie de parcelle avant séchage ou transport pour calculer l'écart exact entre rendement théorique et rendement réel au champ.",
      targetTab: 'agriculture',
      targetSubTab: 'recoltes',
      tasks: [
        {
          id: 't-5-1',
          title: "Enregistrer les récoltes végétales par parcelle",
          description: "Indiquez la quantité récoltée (kg ou tonnes), la qualité et la date pour clôturer le cycle.",
          targetTab: 'agriculture',
          targetSubTab: 'recoltes',
          hint: `${recoltes.length} récolte(s) enregistrée(s)`
        },
        {
          id: 't-5-2',
          title: "Enregistrer la production d'élevage (lait, œufs, ponte)",
          description: "Enregistrez la collecte journalière de lait (litres) ou les plateaux d'œufs ramassés.",
          targetTab: 'elevage',
          targetSubTab: 'production',
          hint: "Module Élevage -> Production"
        },
        {
          id: 't-5-3',
          title: "Analyser les écarts de rendement agronomique",
          description: "Comparez le rendement effectif obtenu au rendement cible initial.",
          targetTab: 'agriculture',
          targetSubTab: 'cultures',
          hint: "Onglet Cultures -> Suivi analytique"
        }
      ]
    },
    {
      id: 6,
      slug: 'stockage',
      title: 'Stockage des Produits, Lots & Conservation',
      subtitle: 'Entrée en silos, Bio-Stocks et gestion de la conservation',
      badge: 'Conditionnement & Lots',
      icon: <Package className="h-5 w-5" />,
      color: 'rose',
      description:
        "Après la récolte ou la collecte, intégrez les produits agricoles et d'élevage dans les magasins de stockage (silos à grains, chambres tempérées, hangars ventilés). Générez des lots pour assurer la traçabilité complète de l'origine parcellaire.",
      agriAdvice:
        "💡 Bonnes pratiques : Contrôlez systématiquement le taux d'humidité des grains (ex: 12% à 14% pour le maïs) avant ensachage pour éviter les moisissures et mycotoxines en stockage prolongé.",
      targetTab: 'stocks',
      targetSubTab: 'biostocks',
      tasks: [
        {
          id: 't-6-1',
          title: "Entrer les récoltes dans les magasins de stockage",
          description: "Générez les fiches de lots avec parcelle d'origine et magasin de destination.",
          targetTab: 'stocks',
          targetSubTab: 'biostocks',
          hint: "Module Stocks -> Bio-Stocks Agricole"
        },
        {
          id: 't-6-2',
          title: "Surveiller les pertes et aléas de conservation",
          description: "Notez tout déclassement ou perte d'humidité pour ajuster les inventaires.",
          targetTab: 'stocks',
          targetSubTab: 'biostocks',
          hint: "Gestion des aléas de stock"
        }
      ]
    },
    {
      id: 7,
      slug: 'ventes',
      title: 'Commercialisation, Vente & Règlements',
      subtitle: 'Devis, bons de commande, facturation et encaissements',
      badge: 'Ventes & Trésorerie',
      icon: <ShoppingBag className="h-5 w-5" />,
      color: 'violet',
      description:
        "Monétisez vos productions : établissez des devis pour vos clients grossistes, transformateurs ou supermarchés, confirmez les commandes, émettez les factures et validez les encaissements (Mobile Money, Espèces, Virement bancaire).",
      agriAdvice:
        "💡 Bonnes pratiques : Formalisez chaque vente par un bon de commande et exigez un acompte à la commande pour sécuriser le fonds de roulement de la ferme.",
      targetTab: 'commercial',
      targetSubTab: 'factures',
      tasks: [
        {
          id: 't-7-1',
          title: "Enregistrer vos clients acheteurs & distributeurs",
          description: "Créez les fiches clients (revendeurs, coopératives, industriels, particuliers).",
          targetTab: 'commercial',
          targetSubTab: 'clients',
          hint: "Module Commercial -> Clients Acheteurs"
        },
        {
          id: 't-7-2',
          title: "Émettre des devis et bons de commande",
          description: "Formalisez les commandes avec quantités, prix unitaire convenu et date de livraison.",
          targetTab: 'commercial',
          targetSubTab: 'commandes',
          hint: "Module Commercial -> Commandes Clients"
        },
        {
          id: 't-7-3',
          title: "Générer les factures de vente officielles",
          description: "Émettez les factures conformes OHADA avec TVA ou exonération agricole.",
          targetTab: 'commercial',
          targetSubTab: 'factures',
          hint: `${factures.length} facture(s) émise(s)`
        },
        {
          id: 't-7-4',
          title: "Encaisser les règlements des clients",
          description: "Validez les réceptions d'argent (MTN MoMo, Orange Money, Virement bancaire).",
          targetTab: 'commercial',
          targetSubTab: 'encaissements',
          hint: `${encaissements.length} encaissement(s) enregistré(s)`
        }
      ]
    },
    {
      id: 8,
      slug: 'pilotage',
      title: 'Pilotage Décisionnel, BI & Clôture',
      subtitle: 'Marges par hectare, rentabilité et reporting direction',
      badge: 'BI & Rentabilité',
      icon: <LineChart className="h-5 w-5" />,
      color: 'emerald',
      description:
        "Analysez la rentabilité nette de votre campagne agricole : calculez la marge brute par hectare pour chaque parcelle, la rentabilité de vos ateliers d'élevage, et générez les états comptables révisés SYSCOHADA pour orienter la prochaine saison.",
      agriAdvice:
        "💡 Bonnes pratiques : Identifiez les parcelles les plus rentables et celles qui ont sous-performé pour ajuster l'amendement du sol ou changer de variété pour la campagne suivante.",
      targetTab: 'bi-reporting',
      targetSubTab: 'kpi',
      tasks: [
        {
          id: 't-8-1',
          title: "Consulter les indicateurs clés (KPI) et marges brutes",
          description: "Analysez le coût de revient par kg récolté et par tête de bétail.",
          targetTab: 'bi-reporting',
          targetSubTab: 'kpi',
          hint: "Module BI -> Indicateurs & KPIs"
        },
        {
          id: 't-8-2',
          title: "Examiner la balance et le compte de résultat OHADA",
          description: "Validez l'équilibre comptable entre charges d'intrants et chiffre d'affaires.",
          targetTab: 'compta',
          targetSubTab: 'grandlivre',
          hint: "Module Comptabilité SYSCOHADA"
        },
        {
          id: 't-8-3',
          title: "Exporter le bilan de campagne global",
          description: "Générez un rapport de synthèse PDF/Excel pour les associés et banquiers.",
          targetTab: 'bi-reporting',
          targetSubTab: 'rapports',
          hint: "Module BI -> Rapports & Exportations"
        }
      ]
    }
  ];

  // Store completed tasks in localStorage scoped per tenant
  const storageKey = `ka_workflow_completed_${tenantId}`;
  const [completedTasks, setCompletedTasks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Track active step in UI
  const [activeStepId, setActiveStepId] = useState<number>(1);

  // Sync with localStorage when tenantId changes or tasks update
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`ka_workflow_completed_${tenantId}`);
      if (saved) {
        setCompletedTasks(JSON.parse(saved));
      } else {
        // Auto-check tasks if data already exists in the system!
        const autoChecked: string[] = [];
        if (champs.length > 0) autoChecked.push('t-1-1');
        if (parcelles.some(p => (p.vocation || 'Agricole') === 'Agricole')) autoChecked.push('t-1-2');
        if (parcelles.some(p => p.vocation === 'Pastorale')) autoChecked.push('t-1-3');
        if (cultures.length > 0) autoChecked.push('t-2-2');
        if (troupeaux.length > 0) autoChecked.push('t-2-3');
        if (articles.length > 0) autoChecked.push('t-3-2');
        if (mouvementsStock.length > 0) autoChecked.push('t-3-3');
        if (interventions.length > 0) autoChecked.push('t-4-1');
        if (recoltes.length > 0) autoChecked.push('t-5-1');
        if (factures.length > 0) autoChecked.push('t-7-3');
        if (encaissements.length > 0) autoChecked.push('t-7-4');

        setCompletedTasks(autoChecked);
        localStorage.setItem(`ka_workflow_completed_${tenantId}`, JSON.stringify(autoChecked));
      }
    } catch (e) {}
  }, [tenantId]);

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => {
      const updated = prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId];
      try {
        localStorage.setItem(`ka_workflow_completed_${tenantId}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const markStepAllTasks = (step: WorkflowStep, complete: boolean) => {
    setCompletedTasks(prev => {
      const taskIds = step.tasks.map(t => t.id);
      let updated: string[];
      if (complete) {
        updated = Array.from(new Set([...prev, ...taskIds]));
      } else {
        updated = prev.filter(id => !taskIds.includes(id));
      }
      try {
        localStorage.setItem(`ka_workflow_completed_${tenantId}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const totalTasksCount = steps.reduce((sum, s) => sum + s.tasks.length, 0);
  const totalCompletedCount = completedTasks.length;
  const overallProgressPct = Math.round((totalCompletedCount / Math.max(1, totalTasksCount)) * 100);

  const activeStep = steps.find(s => s.id === activeStepId) || steps[0];
  const activeStepTasks = activeStep.tasks;
  const activeStepCompletedCount = activeStepTasks.filter(t => completedTasks.includes(t.id)).length;
  const activeStepPct = Math.round((activeStepCompletedCount / activeStepTasks.length) * 100);

  return (
    <div className="space-y-6 pb-12">
      {/* BANNER HEADER */}
      <div className="bg-gradient-to-r from-[#0F3D2E] via-[#1E7A44] to-[#2B2D30] text-white p-6 rounded-2xl shadow-lg border border-[#8CC63F]/30 relative overflow-hidden">
        <div className="relative z-10 max-w-4xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#8CC63F] text-[#0F3D2E] text-[10px] font-black rounded-full uppercase tracking-wider">
              Parcours Intégré ERP
            </span>
            <span className="text-xs text-emerald-200 font-mono">
              Instance : {tenantId}
            </span>
          </div>

          <h2 className="text-2xl font-black text-white flex items-center gap-2.5 tracking-tight">
            <Compass className="h-7 w-7 text-[#8CC63F]" />
            Workflow Opérationnel Pas à Pas
          </h2>

          <p className="text-xs text-slate-200 leading-relaxed max-w-3xl">
            Ce module structure l'utilisation de votre ERP en <strong>8 étapes logiques et chronologiques</strong>,
            depuis l'acquisition et le découpage de vos terrains (agricoles et élevage), jusqu'à la commercialisation
            et le reporting décisionnel. Suivez les étapes pas à pas pour configurer et exploiter sereinement votre ferme.
          </p>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-5 pt-4 border-t border-white/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 w-full sm:w-2/3">
            <span className="font-extrabold text-white text-xs shrink-0">
              Progression globale du cycle :
            </span>
            <div className="w-full bg-black/30 h-3.5 rounded-full overflow-hidden p-0.5 border border-white/20">
              <div
                className="bg-gradient-to-r from-[#8CC63F] to-emerald-400 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-1 text-[9px] font-black text-[#0F3D2E]"
                style={{ width: `${Math.max(5, overallProgressPct)}%` }}
              >
                {overallProgressPct}%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-200 text-xs font-semibold">
            <CheckCheck className="h-4 w-4 text-[#8CC63F]" />
            <span>
              <strong className="text-white font-bold">{totalCompletedCount}</strong> / {totalTasksCount} tâches accomplies
            </span>
          </div>
        </div>
      </div>

      {/* HORIZONTAL STEPPER NAVIGATION */}
      <div className="bg-white border rounded-2xl p-3 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[760px] gap-2">
          {steps.map((step, idx) => {
            const isCurrent = step.id === activeStepId;
            const stepTasks = step.tasks;
            const stepDone = stepTasks.every(t => completedTasks.includes(t.id));
            const someDone = stepTasks.some(t => completedTasks.includes(t.id));

            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setActiveStepId(step.id)}
                  className={`flex-1 p-2.5 rounded-xl text-left transition flex flex-col gap-1.5 cursor-pointer relative ${
                    isCurrent
                      ? 'bg-[#0F3D2E] text-white shadow-md border-2 border-[#8CC63F]'
                      : stepDone
                      ? 'bg-emerald-50/70 border border-emerald-200 text-slate-800 hover:bg-emerald-100'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                        isCurrent
                          ? 'bg-[#8CC63F] text-[#0F3D2E]'
                          : stepDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {stepDone ? '✓' : step.id}
                    </span>

                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        isCurrent
                          ? 'bg-emerald-800 text-emerald-200'
                          : stepDone
                          ? 'bg-emerald-200 text-emerald-900 font-bold'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {stepDone ? 'Terminé' : someDone ? 'En cours' : 'À faire'}
                    </span>
                  </div>

                  <span className={`text-xs font-bold truncate ${isCurrent ? 'text-white' : 'text-slate-900'}`}>
                    {step.title.split('&')[0]}
                  </span>
                </button>

                {idx < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ACTIVE STEP CARD DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Main Tasks & Direct Action */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-5">
            
            {/* Step Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-full">
                    Étape {activeStep.id} sur 8 : {activeStep.badge}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {activeStepCompletedCount} / {activeStepTasks.length} tâches ({activeStepPct}%)
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {activeStep.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeStep.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => markStepAllTasks(activeStep, activeStepPct < 100)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  {activeStepPct === 100 ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" />
                      Décocher tout
                    </>
                  ) : (
                    <>
                      <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Tout cocher
                    </>
                  )}
                </button>

                <button
                  onClick={() => onNavigateTab(activeStep.targetTab, activeStep.targetSubTab)}
                  className="px-4 py-1.5 bg-[#1E7A44] hover:bg-[#0F3D2E] text-white rounded-lg text-xs font-extrabold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Aller au Module</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Step Long Explanation */}
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              {activeStep.description}
            </p>

            {/* Checklist of Tasks */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-emerald-600" />
                Checklist d'Exécution Guidée ({activeStepCompletedCount}/{activeStepTasks.length})
              </h4>

              <div className="space-y-2.5">
                {activeStepTasks.map((task) => {
                  const isDone = completedTasks.includes(task.id);

                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-xl border transition flex items-start justify-between gap-3 ${
                        isDone
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleTask(task.id)}
                          className="mt-0.5 text-emerald-600 hover:text-emerald-700 cursor-pointer shrink-0 transition"
                        >
                          {isDone ? (
                            <CheckCircle className="h-5 w-5 fill-emerald-600 text-white" />
                          ) : (
                            <Circle className="h-5 w-5 text-slate-300 hover:text-emerald-500" />
                          )}
                        </button>

                        <div className="space-y-1">
                          <span
                            onClick={() => toggleTask(task.id)}
                            className={`font-bold text-xs cursor-pointer block ${
                              isDone ? 'line-through text-slate-500' : 'text-slate-900'
                            }`}
                          >
                            {task.title}
                          </span>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {task.description}
                          </p>
                          {task.hint && (
                            <span className="inline-block text-[10px] font-mono text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded font-semibold">
                              📊 {task.hint}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => onNavigateTab(task.targetTab, task.targetSubTab)}
                        className="p-1.5 px-2.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 rounded-lg text-[11px] font-bold transition shrink-0 flex items-center gap-1 cursor-pointer"
                        title="Basculer vers l'écran dédié"
                      >
                        <span>Exécuter</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stepper Footer Buttons */}
            <div className="flex justify-between items-center pt-4 border-t text-xs">
              <button
                disabled={activeStepId === 1}
                onClick={() => setActiveStepId(prev => Math.max(1, prev - 1))}
                className={`px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 transition ${
                  activeStepId === 1
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ArrowLeft className="h-4 w-4" />
                Étape précédente
              </button>

              <button
                disabled={activeStepId === steps.length}
                onClick={() => setActiveStepId(prev => Math.min(steps.length, prev + 1))}
                className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition ${
                  activeStepId === steps.length
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'bg-[#1E7A44] hover:bg-[#0F3D2E] text-white shadow-xs'
                }`}
              >
                Étape suivante
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Right 1 Col: Live ERP Data Status & Agronomic Advice */}
        <div className="space-y-4">
          
          {/* Advice & Best Practices Card */}
          <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-2xl space-y-2.5">
            <h4 className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-600" />
              Conseil d'Expert Agro-Pastoral
            </h4>
            <p className="text-xs text-amber-900 leading-relaxed">
              {activeStep.agriAdvice}
            </p>
          </div>

          {/* Current Live System Indicators Card */}
          <div className="bg-white border rounded-2xl p-5 shadow-xs space-y-3.5">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Données Détectées dans Votre Espace
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-600">Terrains / Domaines :</span>
                <span className="font-mono font-bold text-slate-900">{champs.length}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-600">Parcelles Végétales :</span>
                <span className="font-mono font-bold text-emerald-700">
                  {parcelles.filter(p => (p.vocation || 'Agricole') === 'Agricole').length}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-600">Parcelles Élevage / Pastorales :</span>
                <span className="font-mono font-bold text-amber-700">
                  {parcelles.filter(p => p.vocation === 'Pastorale').length}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-600">Cultures Végétales actives :</span>
                <span className="font-mono font-bold text-slate-900">{cultures.length}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-600">Troupeaux & Lots d'Animaux :</span>
                <span className="font-mono font-bold text-slate-900">{troupeaux.length} ({animaux.length} têtes)</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-600">Interventions culturales :</span>
                <span className="font-mono font-bold text-slate-900">{interventions.length}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-600">Récoltes saisies :</span>
                <span className="font-mono font-bold text-slate-900">{recoltes.length}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-600">Factures Clients émises :</span>
                <span className="font-mono font-bold text-slate-900">{factures.length}</span>
              </div>
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="bg-[#0F3D2E]/10 border border-[#1E7A44]/30 p-4 rounded-2xl text-xs text-[#0F3D2E] space-y-1.5">
            <span className="font-black flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-[#1E7A44]" />
              Besoin d'aide sur une étape ?
            </span>
            <p className="text-[11px] leading-relaxed text-slate-700">
              Chaque module de l'ERP intègre des infobulles explicatives et des guides complets.
              Vous pouvez à tout moment cliquer sur le bouton <strong>"Guide Tuto"</strong> dans
              la barre supérieure pour ouvrir les tutoriels détaillés.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
