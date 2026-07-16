import React from 'react';
import { Users, Home, ShieldAlert, Building } from 'lucide-react';
import { SelectedFeature } from '../types';

interface DashboardProps {
  selectedFeatures: SelectedFeature[];
}

export const Dashboard: React.FC<DashboardProps> = ({ selectedFeatures }) => {
  if (selectedFeatures.length === 0) {
    return null;
  }

  const count = selectedFeatures.length;
  let title = 'Selecione um local';
  let sumPop = 0;
  let sumDomPart = 0;
  let sumDomOcup = 0;
  let sumDomCol = 0;
  let sumDomTotal = 0;

  // Helper para obter valores numéricos de propriedades de forma tolerante
  const getNumVal = (props: Record<string, any>, keys: string[]): number => {
    for (const k of keys) {
      if (props[k] !== undefined && props[k] !== null) {
        let v = props[k];
        if (typeof v === 'string') {
          v = parseFloat(v.replace(',', '.'));
        }
        return Number(v) || 0;
      }
    }
    return 0;
  };

  if (count === 1) {
    const feat = selectedFeatures[0];
    title = feat.name;
    const props = feat.properties;

    sumPop = getNumVal(props, ['V0001', 'Total de pessoas', 'Total de pessoas']);
    sumDomPart = getNumVal(props, ['V0003', 'Total de Domicílios Particulares']);
    sumDomOcup = getNumVal(props, ['V0007', 'Total de Domicílios Particulares Ocupados']);
    sumDomCol = getNumVal(props, ['V0004', 'Total de Domicílios Coletivos']);
    
    let totalD = getNumVal(props, ['V0002', 'Total de Domicílios (Particulares + Coletivos)']);
    if (totalD === 0) {
      totalD = sumDomPart + sumDomCol;
    }
    sumDomTotal = totalD;
  } else {
    title = `Seleção Múltipla (${count} áreas)`;
    selectedFeatures.forEach(feat => {
      const props = feat.properties;
      sumPop += getNumVal(props, ['V0001', 'Total de pessoas', 'Total de pessoas']);
      sumDomPart += getNumVal(props, ['V0003', 'Total de Domicílios Particulares']);
      sumDomOcup += getNumVal(props, ['V0007', 'Total de Domicílios Particulares Ocupados']);
      sumDomCol += getNumVal(props, ['V0004', 'Total de Domicílios Coletivos']);
      
      let totalD = getNumVal(props, ['V0002', 'Total de Domicílios (Particulares + Coletivos)']);
      if (totalD === 0) {
        totalD = getNumVal(props, ['V0003', 'Total de Domicílios Particulares']) + getNumVal(props, ['V0004', 'Total de Domicílios Coletivos']);
      }
      sumDomTotal += totalD;
    });
  }

  const sumVagos = Math.max(0, sumDomPart - sumDomOcup);
  const taxaVac = sumDomPart > 0 ? ((sumVagos / sumDomPart) * 100).toFixed(1) : '0.0';
  const densidade = sumDomOcup > 0 ? (sumPop / sumDomOcup).toFixed(2) : '0.00';

  return (
    <div id="dashboard-container" className="w-full bg-slate-50 rounded-2xl shadow-xl p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 border-l-4 border-indigo-600 pl-3">
          Raio-X Territorial e Domiciliar: <span id="dash-local-name" className="text-indigo-600 font-normal">{title}</span>
        </h2>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: População */}
        <div 
          className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center hover:shadow-md transition-shadow cursor-help" 
          title="Soma total de habitantes residentes na área selecionada."
        >
          <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide flex items-center gap-1 font-semibold">
              População Total 
              <span className="text-[10px] bg-slate-100 px-1.5 rounded-full text-slate-400 font-bold">?</span>
            </p>
            <p id="dash-pop" className="text-2xl font-extrabold text-slate-800">
              {sumPop.toLocaleString('pt-BR')}
            </p>
            <p id="dash-dens" className="text-xs text-indigo-500 font-semibold mt-0.5">
              {densidade} mor./dom
            </p>
          </div>
        </div>

        {/* KPI 2: Domicílios */}
        <div 
          className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center hover:shadow-md transition-shadow cursor-help" 
          title="Soma de todos os domicílios particulares e coletivos cadastrados no censo para esta área."
        >
          <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 mr-4">
            <Home className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide flex items-center gap-1 font-semibold">
              Total Domicílios 
              <span className="text-[10px] bg-slate-100 px-1.5 rounded-full text-slate-400 font-bold">?</span>
            </p>
            <p id="dash-dom-total" className="text-2xl font-extrabold text-slate-800">
              {sumDomTotal.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Cadastrados</p>
          </div>
        </div>

        {/* KPI 3: Vacância */}
        <div 
          className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center hover:shadow-md transition-shadow relative overflow-hidden cursor-help" 
          title="Domicílios identificados como vagos ou de uso ocasional no momento do recenseamento."
        >
          <div className="absolute right-0 top-0 h-full w-1 bg-orange-500"></div>
          <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide flex items-center gap-1 font-semibold">
              Vagos / Ocasional 
              <span className="text-[10px] bg-slate-100 px-1.5 rounded-full text-slate-400 font-bold">?</span>
            </p>
            <p id="dash-vagos" className="text-2xl font-extrabold text-orange-600">
              {sumVagos.toLocaleString('pt-BR')}
            </p>
            <p id="dash-taxa-vac" className="text-xs text-orange-500 font-bold mt-0.5">
              Taxa: {taxaVac}%
            </p>
          </div>
        </div>

        {/* KPI 4: Coletivos */}
        <div 
          className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center hover:shadow-md transition-shadow cursor-help" 
          title="Instituições como asilos, prisões, quartéis, hospitais, alojamentos etc."
        >
          <div className="p-3 rounded-full bg-slate-100 text-slate-600 mr-4">
            <Building className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide flex items-center gap-1 font-semibold">
              Dom. Coletivos 
              <span className="text-[10px] bg-slate-100 px-1.5 rounded-full text-slate-400 font-bold">?</span>
            </p>
            <p id="dash-coletivos" className="text-2xl font-extrabold text-slate-800">
              {sumDomCol.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Instituições</p>
          </div>
        </div>
      </div>
    </div>
  );
};
