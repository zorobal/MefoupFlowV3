import React, { useState, useMemo } from 'react';
import {
  Champ,
  Parcelle,
  Culture,
  Troupeau,
  Animal,
  Intervention,
  Recolte
} from '../types';
import {
  MapPin,
  Trees,
  Compass,
  Search,
  Filter,
  Eye,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Download,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Activity,
  Calculator,
  Sprout
} from 'lucide-react';

interface TerrainsBIViewProps {
  champs: Champ[];
  parcelles: Parcelle[];
  cultures: Culture[];
  troupeaux: Troupeau[];
  animaux: Animal[];
  interventions?: Intervention[];
  recoltes?: Recolte[];
}

export default function TerrainsBIView({
  champs = [],
  parcelles = [],
  cultures = [],
  troupeaux = [],
  animaux = [],
  interventions = [],
  recoltes = []
}: TerrainsBIViewProps) {
  const [selectedTerrainFilter, setSelectedTerrainFilter] = useState<string>('all');
  const [vocationFilter, setVocationFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Interactive allocation simulator state
  const [simulationTerrainId, setSimulationTerrainId] = useState<string>(champs[0]?.id || '');
  const [simulatedParcelSurface, setSimulatedParcelSurface] = useState<number>(3.5);
  const [simulatedVocation, setSimulatedVocation] = useState<'Agricole' | 'Pastorale' | 'Mixte'>('Agricole');

  // Accordion state
  const [expandedTerrains, setExpandedTerrains] = useState<Record<string, boolean>>({});
  
  // Modal detail for parcel
  const [selectedParcelForModal, setSelectedParcelForModal] = useState<Parcelle | null>(null);

  const toggleTerrain = (id: string) => {
    setExpandedTerrains(prev => ({
      ...prev,
      [id]: prev[id] !== undefined ? !prev[id] : false
    }));
  };

  // Helper: Aggregate calculations for each terrain
  const terrainStats = useMemo(() => {
    return champs.map(champ => {
      const terrainParcelles = parcelles.filter(p => p.idChamp === champ.id);
      const surfaceTotale = Number(champ.superficieTotale) || 0;
      const surfaceOccupee = terrainParcelles.reduce((acc, p) => acc + (Number(p.surface) || 0), 0);
      const surfaceRestante = Math.max(0, surfaceTotale - surfaceOccupee);
      const tauxOccupation = surfaceTotale > 0 ? Math.min(100, (surfaceOccupee / surfaceTotale) * 100) : 0;

      const surfaceAgri = terrainParcelles
        .filter(p => p.vocation === 'Agricole' || (!p.vocation && p.typeExploitation !== 'Élevage / Pâturage'))
        .reduce((acc, p) => acc + (Number(p.surface) || 0), 0);

      const surfacePastorale = terrainParcelles
        .filter(p => p.vocation === 'Pastorale' || p.typeExploitation === 'Élevage / Pâturage')
        .reduce((acc, p) => acc + (Number(p.surface) || 0), 0);

      const surfaceMixte = terrainParcelles
        .filter(p => p.vocation === 'Mixte')
        .reduce((acc, p) => acc + (Number(p.surface) || 0), 0);

      return {
        champ,
        parcelles: terrainParcelles,
        surfaceTotale,
        surfaceOccupee,
        surfaceRestante,
        tauxOccupation,
        surfaceAgri,
        surfacePastorale,
        surfaceMixte
      };
    });
  }, [champs, parcelles]);

  // Global aggregates
  const globalTotalSurface = terrainStats.reduce((acc, t) => acc + t.surfaceTotale, 0);
  const globalTotalOccupee = terrainStats.reduce((acc, t) => acc + t.surfaceOccupee, 0);
  const globalTotalRestante = Math.max(0, globalTotalSurface - globalTotalOccupee);
  const globalTaux = globalTotalSurface > 0 ? (globalTotalOccupee / globalTotalSurface) * 100 : 0;
  const globalAgri = terrainStats.reduce((acc, t) => acc + t.surfaceAgri, 0);
  const globalPastorale = terrainStats.reduce((acc, t) => acc + t.surfacePastorale, 0);
  const globalMixte = terrainStats.reduce((acc, t) => acc + t.surfaceMixte, 0);

  // Active terrain for the simulator
  const activeSimChamp = champs.find(c => c.id === simulationTerrainId) || champs[0];
  const activeSimStat = terrainStats.find(t => t.champ.id === activeSimChamp?.id);
  const simCurrentOccupee = activeSimStat?.surfaceOccupee || 0;
  const simTotal = activeSimStat?.surfaceTotale || 0;
  const simProjectedOccupee = simCurrentOccupee + Number(simulatedParcelSurface || 0);
  const simProjectedRestante = Math.max(0, simTotal - simProjectedOccupee);
  const simIsExceeded = simProjectedOccupee > simTotal;
  const simExceededBy = simIsExceeded ? simProjectedOccupee - simTotal : 0;

  // Filtered terrains list
  const filteredTerrainStats = useMemo(() => {
    return terrainStats.filter(stat => {
      // Filter by specific terrain
      if (selectedTerrainFilter !== 'all' && stat.champ.id !== selectedTerrainFilter) {
        return false;
      }

      // Filter by vocation
      if (vocationFilter === 'Agricole' && stat.surfaceAgri === 0) return false;
      if (vocationFilter === 'Pastorale' && stat.surfacePastorale === 0) return false;
      if (vocationFilter === 'Mixte' && stat.surfaceMixte === 0) return false;
      if (vocationFilter === 'disponible' && stat.surfaceRestante <= 0.1) return false;

      // Filter by text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchChamp = stat.champ.nom.toLowerCase().includes(q) ||
          stat.champ.code.toLowerCase().includes(q) ||
          stat.champ.ville.toLowerCase().includes(q);

        const matchParcel = stat.parcelles.some(p => {
          const matchCode = p.code.toLowerCase().includes(q) || p.nom.toLowerCase().includes(q);
          const matchTroupeau = p.troupeauAffecte?.toLowerCase().includes(q);
          // Check culture
          const pCultures = cultures.filter(c => c.idParcelle === p.id);
          const matchCult = pCultures.some(c => c.nom.toLowerCase().includes(q) || c.variete.toLowerCase().includes(q));
          // Check animal races
          const matchAnimal = animaux.some(a => a.race?.toLowerCase().includes(q) && (a.localisation === p.nom || a.idTroupeau === p.troupeauAffecte));
          return matchCode || matchTroupeau || matchCult || matchAnimal;
        });

        if (!matchChamp && !matchParcel) return false;
      }

      return true;
    });
  }, [terrainStats, selectedTerrainFilter, vocationFilter, searchQuery, cultures, animaux]);

  // Helper: Find animal breeds on a parcel
  const getParcelAnimalBreeds = (parcelle: Parcelle) => {
    const races: string[] = [];
    
    // Look up herd by name or id
    const matchingTroupeau = troupeaux.find(t => 
      t.id === parcelle.troupeauAffecte || 
      t.nom === parcelle.troupeauAffecte ||
      (parcelle.troupeauAffecte && t.nom.toLowerCase().includes(parcelle.troupeauAffecte.toLowerCase()))
    );

    if (matchingTroupeau?.race && !races.includes(matchingTroupeau.race)) {
      races.push(matchingTroupeau.race);
    }

    // Look up individual animals associated with this parcel or matching herd
    const matchingAnimaux = animaux.filter(a => 
      (matchingTroupeau && a.idTroupeau === matchingTroupeau.id) ||
      a.localisation === parcelle.nom ||
      a.localisation === parcelle.code
    );

    matchingAnimaux.forEach(a => {
      if (a.race && !races.includes(a.race)) {
        races.push(a.race);
      }
    });

    // Fallback parsing from troupeauAffecte name if needed
    if (races.length === 0 && parcelle.troupeauAffecte) {
      if (parcelle.troupeauAffecte.toLowerCase().includes('goudali')) races.push('Bovin Zébu Goudali');
      else if (parcelle.troupeauAffecte.toLowerCase().includes('peul')) races.push('Zébu Peul');
      else if (parcelle.troupeauAffecte.toLowerCase().includes('djallonke') || parcelle.troupeauAffecte.toLowerCase().includes('djallonké')) races.push('Mouton Djallonké');
      else if (parcelle.troupeauAffecte.toLowerCase().includes('goliath')) races.push('Volaille Goliath');
      else if (parcelle.troupeauAffecte.toLowerCase().includes('large white')) races.push('Porc Large White');
      else races.push(parcelle.troupeauAffecte);
    }

    return {
      races: races.length > 0 ? races : ['Non spécifiée (Troupeau local)'],
      troupeau: matchingTroupeau,
      totalAnimaux: matchingTroupeau?.effectifTotal || matchingAnimaux.length || 0
    };
  };

  const handleExportLandAudit = () => {
    alert(`📥 [RAPPORT FONCIER & OCCUPATION BI]\nLe rapport d'audit foncier consolidé a été généré.\n\nDonnées exportées :\n• ${champs.length} Domaines et Terrains\n• ${parcelles.length} Parcelles cartographiées\n• Superficie globale : ${globalTotalSurface} ha\n• Surface allouée : ${globalTotalOccupee} ha\n• Réserve disponible : ${globalTotalRestante} ha`);
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER & TOP BANNER */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 opacity-10 pointer-events-none flex items-center justify-center">
          <Trees className="h-64 w-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[11px] font-bold tracking-wider uppercase border border-emerald-400/30 flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5" /> Intelligence Foncière & Aménagement
              </span>
              <span className="text-xs text-emerald-200/80">Temps Réel BI</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">
              Gestion des Terrains, Parcelles & Réserve Foncière
            </h2>
            <p className="text-xs md:text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
              Superviser la surface occupée par les parcelles, la superficie restante sur chaque terrain, 
              simuler l'impact d'une nouvelle parcelle en direct et suivre l'historique complet de ce qui a été fait dessus (races en élevage & cultures végétales).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportLandAudit}
              className="px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs shadow-sm flex items-center gap-2 transition"
            >
              <Download className="h-4 w-4 text-emerald-700" />
              Exporter Bilan Foncier
            </button>
          </div>
        </div>
      </div>

      {/* 2. GLOBAL FONCIER METRICS (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Surface */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Superficie Foncière Globale</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{globalTotalSurface.toFixed(1)}</span>
            <span className="text-xs font-bold text-slate-500">Hectares</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Répartie sur <strong className="text-slate-700">{champs.length}</strong> domaines et titres fonciers
          </p>
        </div>

        {/* Metric 2: Occupied Surface */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Surface Occupée Découpée</span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-700">{globalTotalOccupee.toFixed(1)}</span>
            <span className="text-xs font-bold text-slate-500">ha ({globalTaux.toFixed(1)}%)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Aménagée en <strong className="text-slate-700">{parcelles.length}</strong> parcelles actives
          </p>
        </div>

        {/* Metric 3: Remaining Surface */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Surface Restante Disponible</span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
              <Trees className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{globalTotalRestante.toFixed(1)}</span>
            <span className="text-xs font-bold text-slate-500">ha ({(100 - globalTaux).toFixed(1)}%)</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            Réserve foncière vierge & jachères disponibles
          </p>
        </div>

        {/* Metric 4: Vocation Breakdown */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Répartition des Vocations</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-700">
            <span className="text-emerald-700">{globalAgri.toFixed(1)} ha Végétal</span>
            <span>•</span>
            <span className="text-amber-700">{globalPastorale.toFixed(1)} ha Élevage</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden flex">
            <div 
              style={{ width: `${globalTotalSurface > 0 ? (globalAgri / globalTotalSurface) * 100 : 0}%` }} 
              className="bg-emerald-500 h-full" 
              title={`Agriculture: ${globalAgri.toFixed(1)} ha`} 
            />
            <div 
              style={{ width: `${globalTotalSurface > 0 ? (globalPastorale / globalTotalSurface) * 100 : 0}%` }} 
              className="bg-amber-500 h-full" 
              title={`Élevage: ${globalPastorale.toFixed(1)} ha`} 
            />
            <div 
              style={{ width: `${globalTotalSurface > 0 ? (globalMixte / globalTotalSurface) * 100 : 0}%` }} 
              className="bg-teal-500 h-full" 
              title={`Mixte: ${globalMixte.toFixed(1)} ha`} 
            />
            <div 
              style={{ width: `${globalTotalSurface > 0 ? (globalTotalRestante / globalTotalSurface) * 100 : 0}%` }} 
              className="bg-slate-200 h-full" 
              title={`Réserve: ${globalTotalRestante.toFixed(1)} ha`} 
            />
          </div>
        </div>
      </div>

      {/* 3. SIMULATEUR D'EMPRISE PARCELLE EN TEMPS RÉEL */}
      <div className="bg-white rounded-2xl border-2 border-indigo-200/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                Simulateur d'Emprise & Utilisation de Parcelle en Temps Réel
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-extrabold uppercase">
                  Calcul Dynamique
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Visualisez instantanément comment l'allocation d'une parcelle réduit la surface disponible du terrain et la superficie qui reste.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Terrain à tester :</span>
            <select
              value={simulationTerrainId || champs[0]?.id || ''}
              onChange={e => setSimulationTerrainId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
            >
              {champs.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.superficieTotale} ha - {c.ville})
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeSimChamp ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Controls */}
            <div className="lg:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">
                  Superficie de la nouvelle parcelle :
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0.1"
                    max={simTotal}
                    step="0.5"
                    value={simulatedParcelSurface}
                    onChange={e => setSimulatedParcelSurface(Math.max(0.1, parseFloat(e.target.value) || 0))}
                    className="w-20 px-2.5 py-1 text-right font-black text-sm text-indigo-600 bg-white border border-indigo-300 rounded-lg focus:outline-none"
                  />
                  <span className="text-xs font-bold text-slate-500">ha</span>
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="0.5"
                max={Math.max(5, simTotal)}
                step="0.5"
                value={simulatedParcelSurface}
                onChange={e => setSimulatedParcelSurface(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>0.5 ha</span>
                <span>Terrain max : {simTotal} ha</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Vocation simulée :</span>
                <div className="flex gap-1.5">
                  {(['Agricole', 'Pastorale', 'Mixte'] as const).map(voc => (
                    <button
                      key={voc}
                      onClick={() => setSimulatedVocation(voc)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                        simulatedVocation === voc
                          ? voc === 'Agricole' ? 'bg-emerald-600 text-white' : voc === 'Pastorale' ? 'bg-amber-600 text-white' : 'bg-teal-600 text-white'
                          : 'bg-white text-slate-600 border hover:bg-slate-100'
                      }`}
                    >
                      {voc === 'Agricole' ? '🌱 Végétal' : voc === 'Pastorale' ? '🐄 Élevage' : '🌾 Mixte'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dynamic Results Display */}
            <div className="lg:col-span-7 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-100 p-3 rounded-xl text-center border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Surface Totale</span>
                  <span className="text-lg font-black text-slate-800">{simTotal.toFixed(1)} ha</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Titre foncier</span>
                </div>

                <div className="bg-indigo-50 p-3 rounded-xl text-center border border-indigo-200">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block">Occupation Projetée</span>
                  <span className="text-lg font-black text-indigo-800">
                    {simProjectedOccupee.toFixed(1)} ha
                  </span>
                  <span className="text-[10px] text-indigo-600 block mt-0.5">
                    ({simCurrentOccupee.toFixed(1)} existant + {simulatedParcelSurface.toFixed(1)} simulé)
                  </span>
                </div>

                <div className={`p-3 rounded-xl text-center border transition ${
                  simIsExceeded 
                    ? 'bg-rose-50 border-rose-300 text-rose-800' 
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                }`}>
                  <span className="text-[10px] uppercase font-bold block">
                    {simIsExceeded ? 'Dépassement Foncier' : 'Surface Restante'}
                  </span>
                  <span className="text-lg font-black">
                    {simIsExceeded ? `-${simExceededBy.toFixed(1)} ha` : `${simProjectedRestante.toFixed(1)} ha`}
                  </span>
                  <span className="text-[10px] block mt-0.5">
                    {simIsExceeded ? '⚠️ Capacité dépassée' : 'Réserve après découpage'}
                  </span>
                </div>
              </div>

              {/* Multi-segment progressive bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span>Visualisation de l'emprise sur le terrain :</span>
                  <span>
                    {simTotal > 0 ? ((simProjectedOccupee / simTotal) * 100).toFixed(1) : 0}% exploité
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden flex relative shadow-inner">
                  {/* Existing parcels */}
                  <div
                    style={{ width: `${simTotal > 0 ? (simCurrentOccupee / simTotal) * 100 : 0}%` }}
                    className="bg-slate-700 h-full"
                    title={`Parcelles déjà existantes: ${simCurrentOccupee.toFixed(1)} ha`}
                  />
                  {/* Simulated parcel */}
                  <div
                    style={{
                      width: `${simTotal > 0 ? Math.min((simulatedParcelSurface / simTotal) * 100, 100 - (simCurrentOccupee / simTotal) * 100) : 0}%`
                    }}
                    className={`h-full animate-pulse ${
                      simulatedVocation === 'Agricole'
                        ? 'bg-emerald-500'
                        : simulatedVocation === 'Pastorale'
                        ? 'bg-amber-500'
                        : 'bg-teal-500'
                    }`}
                    title={`Nouvelle parcelle simulée: +${simulatedParcelSurface} ha`}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-slate-700 rounded-xs" />
                    <span className="text-slate-600">Parcelles existantes ({simCurrentOccupee.toFixed(1)} ha)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-xs ${
                      simulatedVocation === 'Agricole' ? 'bg-emerald-500' : simulatedVocation === 'Pastorale' ? 'bg-amber-500' : 'bg-teal-500'
                    }`} />
                    <span className="font-bold text-slate-800">
                      Nouvelle parcelle simulée (+{simulatedParcelSurface.toFixed(1)} ha)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-slate-200 rounded-xs border border-slate-300" />
                    <span className="text-slate-600">
                      Surface qui reste ({simProjectedRestante.toFixed(1)} ha)
                    </span>
                  </div>
                </div>
              </div>

              {/* Status banner */}
              <div className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                simIsExceeded 
                  ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {simIsExceeded ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>
                      <strong>Dépassement :</strong> Cette parcelle de {simulatedParcelSurface} ha est trop grande pour la réserve actuelle ({activeSimStat?.surfaceRestante.toFixed(1)} ha). 
                      Réduisez la parcelle d'au moins {simExceededBy.toFixed(1)} ha.
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                    <span>
                      <strong>Découpage Faisable :</strong> L'allocation de cette parcelle de {simulatedParcelSurface} ha est acceptée. 
                      La surface du terrain diminuera de {activeSimStat?.surfaceRestante.toFixed(1)} ha à <strong>{simProjectedRestante.toFixed(1)} ha</strong> de réserve restante.
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-3 text-center">Aucun terrain disponible pour la simulation.</p>
        )}
      </div>

      {/* 4. FILTERS & SEARCH BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher par culture, race d'animal, parcelle..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-600 bg-slate-50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedTerrainFilter}
            onChange={e => setSelectedTerrainFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 bg-white rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">Tous les Terrains ({champs.length})</option>
            {champs.map(c => (
              <option key={c.id} value={c.id}>{c.nom} ({c.ville})</option>
            ))}
          </select>

          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            {[
              { id: 'all', label: 'Toutes vocations' },
              { id: 'Agricole', label: '🌱 Végétal' },
              { id: 'Pastorale', label: '🐄 Élevage' },
              { id: 'disponible', label: '🌿 Avec Réserve' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setVocationFilter(tab.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  vocationFilter === tab.id
                    ? 'bg-white text-slate-800 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. LISTE DÉTAILLÉE DES TERRAINS AVEC PARCELLES & CE QU'ON A FAIT DESSUS */}
      <div className="space-y-6">
        {filteredTerrainStats.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
            <Trees className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Aucun terrain ne correspond aux critères</h3>
            <p className="text-xs text-slate-400 mt-1">
              Modifiez vos filtres de recherche ou sélectionnez un autre statut de vocation.
            </p>
          </div>
        ) : (
          filteredTerrainStats.map(({ champ, parcelles: terrainParcelles, surfaceTotale, surfaceOccupee, surfaceRestante, tauxOccupation }) => {
            const isExpanded = expandedTerrains[champ.id] !== false; // expanded by default

            return (
              <div key={champ.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition">
                {/* TERRAIN HEADER */}
                <div className="p-5 border-b border-slate-200 bg-slate-50/70">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                          {champ.code}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-700">
                          {champ.statutJuridique || 'Titre Foncier'}
                        </span>
                        {champ.numeroTitre && (
                          <span className="text-xs text-slate-500 font-mono">
                            N° {champ.numeroTitre}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {champ.localite || champ.ville}, {champ.region || 'Cameroun'}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-slate-800 mt-1 flex items-center gap-2">
                        {champ.nom}
                        <span className="text-xs font-medium text-slate-400 font-mono">({champ.coordonneesGps})</span>
                      </h3>
                      
                      {champ.notes && (
                        <p className="text-xs text-slate-500 mt-0.5 italic">{champ.notes}</p>
                      )}
                    </div>

                    {/* Quick Land Stat Counters */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-center shadow-2xs">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Surface Totale</span>
                        <span className="text-base font-black text-slate-800">{surfaceTotale.toFixed(1)} ha</span>
                      </div>

                      <div className="bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-200 text-center shadow-2xs">
                        <span className="text-[10px] text-indigo-700 uppercase font-bold block">Surface Occupée</span>
                        <span className="text-base font-black text-indigo-800">
                          {surfaceOccupee.toFixed(1)} ha <span className="text-xs text-indigo-600 font-medium">({tauxOccupation.toFixed(1)}%)</span>
                        </span>
                      </div>

                      <div className="bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 text-center shadow-2xs">
                        <span className="text-[10px] text-emerald-700 uppercase font-bold block">Surface Restante</span>
                        <span className="text-base font-black text-emerald-700">{surfaceRestante.toFixed(1)} ha</span>
                      </div>

                      <button
                        onClick={() => toggleTerrain(champ.id)}
                        className="p-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 transition"
                        title={isExpanded ? 'Réduire' : 'Déplier'}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Visual allocation bar for this specific terrain */}
                  <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
                      <span>Répartition de l'occupation foncière du domaine :</span>
                      <span>
                        <strong className="text-slate-800">{terrainParcelles.length}</strong> parcelles découpées • <strong className="text-emerald-700">{surfaceRestante.toFixed(1)} ha</strong> en réserve
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex border border-slate-200 shadow-inner">
                      {terrainParcelles.map((p, pIdx) => {
                        const widthPct = surfaceTotale > 0 ? (Number(p.surface || 0) / surfaceTotale) * 100 : 0;
                        const isAgri = p.vocation === 'Agricole' || (!p.vocation && p.typeExploitation !== 'Élevage / Pâturage');
                        const isPastoral = p.vocation === 'Pastorale' || p.typeExploitation === 'Élevage / Pâturage';

                        return (
                          <div
                            key={p.id || pIdx}
                            style={{ width: `${widthPct}%` }}
                            className={`h-full border-r border-white/40 transition hover:brightness-110 cursor-pointer ${
                              isAgri ? 'bg-emerald-600' : isPastoral ? 'bg-amber-500' : 'bg-teal-500'
                            }`}
                            title={`${p.nom} : ${p.surface} ha (${widthPct.toFixed(1)}% du terrain)`}
                            onClick={() => setSelectedParcelForModal(p)}
                          />
                        );
                      })}

                      {/* Remaining Surface segment */}
                      {surfaceRestante > 0 && (
                        <div
                          style={{ width: `${surfaceTotale > 0 ? (surfaceRestante / surfaceTotale) * 100 : 0}%` }}
                          className="bg-slate-200/80 h-full"
                          title={`Surface restante disponible : ${surfaceRestante.toFixed(1)} ha`}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* PARCELLES LIST ON THIS TERRAIN */}
                {isExpanded && (
                  <div className="p-5 space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                      <span>Parcelles Aménagées sur ce Terrain ({terrainParcelles.length})</span>
                      <span className="text-[11px] font-normal text-slate-400 lowercase">
                        cliquez sur une parcelle pour voir sa fiche d'intervention complète
                      </span>
                    </h4>

                    {terrainParcelles.length === 0 ? (
                      <div className="p-6 bg-slate-50 rounded-xl text-center border border-dashed border-slate-300">
                        <p className="text-xs text-slate-500 italic">
                          Aucune parcelle découpée sur ce domaine pour le moment. La totalité de la superficie ({surfaceTotale} ha) est actuellement en réserve disponible.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {terrainParcelles.map(parcel => {
                          const isAgri = parcel.vocation === 'Agricole' || (!parcel.vocation && parcel.typeExploitation !== 'Élevage / Pâturage');
                          const isPastoral = parcel.vocation === 'Pastorale' || parcel.typeExploitation === 'Élevage / Pâturage';
                          const isMixte = parcel.vocation === 'Mixte';

                          // Agricultural details
                          const parcelCultures = cultures.filter(c => c.idParcelle === parcel.id);
                          const parcelInterventions = interventions.filter(i => i.idParcelle === parcel.id || parcelCultures.some(c => c.id === i.idCulture));
                          const parcelRecoltes = recoltes.filter(r => r.idParcelle === parcel.id || parcelCultures.some(c => c.id === r.idCulture));

                          // Pastoral details
                          const pastoralData = getParcelAnimalBreeds(parcel);

                          return (
                            <div
                              key={parcel.id}
                              className={`p-4 rounded-xl border transition hover:shadow-xs space-y-3 ${
                                isPastoral 
                                  ? 'border-amber-200 bg-amber-50/20' 
                                  : isMixte 
                                  ? 'border-teal-200 bg-teal-50/20' 
                                  : 'border-emerald-200 bg-emerald-50/20'
                              }`}
                            >
                              {/* Parcel Title & Badge */}
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[11px] font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-300">
                                      {parcel.code}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                      isPastoral 
                                        ? 'bg-amber-100 text-amber-800' 
                                        : isMixte 
                                        ? 'bg-teal-100 text-teal-800' 
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {isPastoral ? '🐄 Élevage / Pâturage' : isMixte ? '🌾 Agro-Pastoral Mixte' : '🌱 Culture Végétale'}
                                    </span>
                                  </div>

                                  <h5 className="font-bold text-slate-800 text-sm mt-1">
                                    {parcel.nom}
                                  </h5>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="text-sm font-black text-slate-800 block">
                                    {parcel.surface} ha
                                  </span>
                                  <span className="text-[10px] text-slate-400 block font-medium">
                                    {surfaceTotale > 0 ? ((parcel.surface / surfaceTotale) * 100).toFixed(1) : 0}% du terrain
                                  </span>
                                </div>
                              </div>

                              {/* Soil & Tech characteristics */}
                              <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 bg-white/70 p-2 rounded-lg border border-slate-200/80">
                                <span>Sol : <strong>{parcel.typeSol || 'Ferrallitique'}</strong></span>
                                <span>•</span>
                                <span>pH : <strong>{parcel.ph || 6.2}</strong></span>
                                <span>•</span>
                                <span>Eau : <strong>{parcel.sourceEau || 'Forage / Rivière'}</strong></span>
                              </div>

                              {/* DETAIL SECTION: CE QU'ON A FAIT DESSUS (Élevage vs Agriculture) */}
                              
                              {/* 1. If Élevage / Pastoral: Breeds & Herd */}
                              {(isPastoral || isMixte) && (
                                <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                                      🐄 Activité Élevage & Races Présentes
                                    </span>
                                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">
                                      {parcel.statutParcelle || 'Pâturage Actif'}
                                    </span>
                                  </div>

                                  <div className="space-y-1">
                                    <div className="text-xs">
                                      <span className="text-slate-500 text-[11px]">Race(s) sur cette parcelle : </span>
                                      <span className="font-bold text-amber-950">
                                        {pastoralData.races.join(', ')}
                                      </span>
                                    </div>

                                    {parcel.troupeauAffecte && (
                                      <div className="text-[11px] text-slate-600">
                                        Troupeau : <strong>{parcel.troupeauAffecte}</strong>
                                        {pastoralData.totalAnimaux > 0 && (
                                          <span> ({pastoralData.totalAnimaux} têtes • {(pastoralData.totalAnimaux / parcel.surface).toFixed(1)} têtes/ha)</span>
                                        )}
                                      </div>
                                    )}

                                    {parcel.expertDescription && (
                                      <p className="text-[11px] text-slate-500 italic mt-1 border-t border-slate-100 pt-1">
                                        Aménagement : {parcel.expertDescription}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* 2. If Agriculture / Végétal: Crops, Interventions & Harvests */}
                              {(isAgri || isMixte) && (
                                <div className="bg-white p-3 rounded-lg border border-emerald-200 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                                      <Sprout className="h-3.5 w-3.5 text-emerald-700" /> Cultures & Interventions Réalisées
                                    </span>
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                                      {parcel.statutParcelle || 'En Culture'}
                                    </span>
                                  </div>

                                  {/* Cultures planted */}
                                  {parcelCultures.length > 0 ? (
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Culture(s) Implantée(s) :</span>
                                      {parcelCultures.map(cult => (
                                        <div key={cult.id} className="text-xs flex justify-between items-center bg-emerald-50/50 p-1.5 rounded">
                                          <div>
                                            <strong className="text-emerald-950">{cult.nom}</strong>
                                            <span className="text-slate-500 text-[11px]"> ({cult.variete})</span>
                                          </div>
                                          <span className="text-[10px] font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                            {cult.statut}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-slate-500 italic">
                                      Aucune culture en cours enregistrée sur cette parcelle.
                                    </div>
                                  )}

                                  {/* Interventions / Works done */}
                                  {parcelInterventions.length > 0 && (
                                    <div className="pt-2 border-t border-slate-100 space-y-1">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Travaux réalisés dessus :</span>
                                      <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                        {parcelInterventions.slice(0, 3).map(iv => (
                                          <div key={iv.id} className="text-[11px] flex justify-between items-center text-slate-600">
                                            <span>• {iv.type} {iv.substanceIntrant ? `(${iv.substanceIntrant})` : ''}</span>
                                            <span className="text-[10px] text-slate-400 font-mono">{iv.date}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Harvests */}
                                  {parcelRecoltes.length > 0 && (
                                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                                      <span className="text-[11px] text-slate-500 font-medium">Récolte(s) obtenue(s) :</span>
                                      <span className="font-bold text-emerald-800">
                                        {parcelRecoltes.reduce((a, r) => a + r.quantite, 0)} Kg
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Detailed inspection button */}
                              <button
                                onClick={() => setSelectedParcelForModal(parcel)}
                                className="w-full py-1.5 text-center text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-1.5 transition"
                              >
                                <Eye className="h-3.5 w-3.5 text-slate-400" />
                                Voir Fiche Complète & Historique Détaillé
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 6. MODAL FICHE COMPLÈTE DE LA PARCELLE */}
      {selectedParcelForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4 my-8">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {selectedParcelForModal.code}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-700 text-slate-200">
                    {selectedParcelForModal.vocation || 'Agricole'}
                  </span>
                </div>
                <h3 className="text-lg font-black">{selectedParcelForModal.nom}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Superficie : {selectedParcelForModal.surface} Hectares • GPS : ({selectedParcelForModal.latitude}, {selectedParcelForModal.longitude})
                </p>
              </div>

              <button
                onClick={() => setSelectedParcelForModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {/* Agronomic info */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Type de Sol</span>
                  <span className="font-bold text-slate-800 text-xs">{selectedParcelForModal.typeSol || 'Ferrallitique'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Acidité (pH)</span>
                  <span className="font-bold text-slate-800 text-xs">{selectedParcelForModal.ph || 6.2}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Source d'Eau</span>
                  <span className="font-bold text-slate-800 text-xs">{selectedParcelForModal.sourceEau || 'Forage'}</span>
                </div>
              </div>

              {/* Expert diagnostic */}
              {selectedParcelForModal.expertDescription && (
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block mb-1">
                    Diagnostic Agronomique & Aménagement :
                  </span>
                  <p className="text-xs text-slate-700 italic">
                    "{selectedParcelForModal.expertDescription}"
                  </p>
                </div>
              )}

              {/* Livestock & Breeds info */}
              {(selectedParcelForModal.vocation === 'Pastorale' || selectedParcelForModal.typeExploitation === 'Élevage / Pâturage') && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-amber-900 block">
                    🐄 Informations Détaillées Élevage & Races Présentes :
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Race(s) animale(s) :</span>
                      <strong className="text-amber-950">{getParcelAnimalBreeds(selectedParcelForModal).races.join(', ')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Troupeau rattaché :</span>
                      <strong className="text-slate-800">{selectedParcelForModal.troupeauAffecte || 'Non spécifié'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Agricultural work done */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Historique des Travaux & Interventions Réalisés :
                </span>
                {interventions.filter(i => i.idParcelle === selectedParcelForModal.id).length === 0 ? (
                  <p className="text-slate-400 italic">Aucune intervention technique archivée sur cette parcelle.</p>
                ) : (
                  <div className="space-y-1.5">
                    {interventions.filter(i => i.idParcelle === selectedParcelForModal.id).map(iv => (
                      <div key={iv.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                        <div>
                          <strong className="text-slate-800 block">{iv.type}</strong>
                          <span className="text-[10px] text-slate-400">
                            {iv.date} • {iv.responsable || 'Technicien'} {iv.substanceIntrant ? `• Intrant : ${iv.substanceIntrant} (${iv.quantiteIntrant || ''} ${iv.uniteIntrant || ''})` : ''}
                          </span>
                        </div>
                        {iv.mainDOeuvreCoût ? (
                          <span className="text-xs font-bold text-slate-700">{iv.mainDOeuvreCoût.toLocaleString()} FCFA</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Harvests */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Récoltes Enregistrées :
                </span>
                {recoltes.filter(r => r.idParcelle === selectedParcelForModal.id).length === 0 ? (
                  <p className="text-slate-400 italic">Aucune récolte enregistrée pour le moment.</p>
                ) : (
                  <div className="space-y-1.5">
                    {recoltes.filter(r => r.idParcelle === selectedParcelForModal.id).map(rc => (
                      <div key={rc.id} className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 flex justify-between items-center text-xs">
                        <div>
                          <strong className="text-emerald-950 block">Récolte du {rc.date}</strong>
                          <span className="text-[10px] text-emerald-700">Qualité : {rc.qualite}</span>
                        </div>
                        <span className="text-xs font-black text-emerald-800">{rc.quantite} Kg</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedParcelForModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition"
              >
                Fermer la Fiche
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
