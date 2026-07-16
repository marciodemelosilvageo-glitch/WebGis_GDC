import React from 'react';
import { Download, Info, Check, Copy } from 'lucide-react';
import { SelectedFeature } from '../types';
import { propertyNames } from '../data';
import { 
  getIdentifier, 
  getTranslatedValue, 
  getFeatureCenter, 
  exportSelectionToCSV, 
  exportSelectionToKML, 
  sanitizeFilename 
} from '../utils';

interface PropertyTableProps {
  selectedFeatures: SelectedFeature[];
  showToast: (msg: string) => void;
}

export const PropertyTable: React.FC<PropertyTableProps> = ({ selectedFeatures, showToast }) => {
  if (selectedFeatures.length === 0) {
    return null;
  }

  const count = selectedFeatures.length;

  const handleExportCSV = () => {
    const id = count > 0 ? getIdentifier(selectedFeatures[0].properties) : 'selecao';
    const rawFeatures = selectedFeatures.map(f => f.layer);
    exportSelectionToCSV(`selecao_${sanitizeFilename(String(id))}.csv`, rawFeatures);
    showToast('Exportando planilha CSV...');
  };

  const handleExportKML = () => {
    const id = count > 0 ? getIdentifier(selectedFeatures[0].properties) : 'selecao';
    const rawFeatures = selectedFeatures.map(f => f.layer);
    exportSelectionToKML(`selecao_${sanitizeFilename(String(id))}.kml`, rawFeatures);
    showToast('Exportando arquivo KML (Google Earth)...');
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copiada com sucesso!`);
  };

  // Helper para obter valores numéricos
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

  return (
    <div id="info-table-container" className="w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-4 border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-2">Especificação das Feições</h3>
      
      <div className="flex flex-col gap-3 mb-4">
        {/* Botões de Exportação */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 text-sm flex items-center gap-1.5 transition-colors cursor-pointer" 
            title="Exportar CSV"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
          <button 
            onClick={handleExportKML}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 text-sm flex items-center gap-1.5 transition-colors cursor-pointer" 
            title="Exportar KML"
          >
            <Download className="h-4 w-4" />
            Exportar KML
          </button>
        </div>

        {/* Caixa de ajuda de Exportação de CSV */}
        <div className="bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 rounded-xl p-4 text-xs md:text-sm text-emerald-950 flex items-start gap-2.5 max-w-3xl">
          <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-emerald-900 block mb-1">📋 Evite colunas misturadas ao abrir o CSV no Excel:</span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs">
              Se as colunas abrirem sobrepostas, faça o seguinte no Excel:
              <br /><strong>Abra uma pasta de trabalho em branco &gt; vá na guia superior Dados &gt; clique em Obter Dados de Texto/CSV</strong> e selecione o arquivo baixado. O Excel organizará tudo de forma perfeita!
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Propriedade</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Valor</th>
            </tr>
          </thead>
          <tbody id="info-table-body" className="bg-white dark:bg-slate-900 divide-y divide-gray-200">
            {count === 1 ? (
              // EXIBIÇÃO DE ITEM ÚNICO
              (() => {
                const feat = selectedFeatures[0];
                const props = feat.properties;
                const center = getFeatureCenter(feat.layer);

                const pop = getNumVal(props, ['V0001', 'Total de pessoas', 'Total de pessoas']);
                const domPart = getNumVal(props, ['V0003', 'Total de Domicílios Particulares']);
                const domOcup = getNumVal(props, ['V0007', 'Total de Domicílios Particulares Ocupados']);
                const domCol = getNumVal(props, ['V0004', 'Total de Domicílios Coletivos']);

                const domVagos = Math.max(0, domPart - domOcup);
                const taxaVac = domPart > 0 ? ((domVagos / domPart) * 100).toFixed(1) : '0.0';
                const densidade = domOcup > 0 ? (pop / domOcup).toFixed(2) : '0.00';

                const rows: React.ReactNode[] = [];

                // 1. Coordenadas
                if (center) {
                  const latStr = center.lat.toFixed(6);
                  const lngStr = center.lng.toFixed(6);
                  const fullCoords = `${latStr}, ${lngStr}`;
                  rows.push(
                    <tr key="coords-row" className="hover:bg-gray-50 bg-slate-50 dark:bg-slate-800 border-b border-gray-200">
                      <td className="px-6 py-3 text-sm font-bold text-indigo-700 max-w-[240px]">
                        Coordenadas (Centro Territorial)
                        <p className="text-[10px] font-normal text-slate-400 italic mt-0.5 leading-tight">
                          *Refere-se ao centro geográfico (centroide) do polígono territorial selecionado.
                        </p>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono bg-indigo-50 dark:bg-indigo-900/40 px-2 py-1 rounded text-xs text-indigo-800 font-semibold">{fullCoords}</span>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleCopy(latStr, 'Latitude')}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-xs rounded text-gray-700 font-medium cursor-pointer" 
                              title="Copiar Latitude"
                            >
                              Lat
                            </button>
                            <button 
                              onClick={() => handleCopy(lngStr, 'Longitude')}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-xs rounded text-gray-700 font-medium cursor-pointer" 
                              title="Copiar Longitude"
                            >
                              Long
                            </button>
                            <button 
                              onClick={() => handleCopy(fullCoords, 'Coordenada completa')}
                              className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-xs rounded text-indigo-700 font-bold flex items-center gap-0.5 cursor-pointer" 
                              title="Copiar Tudo"
                            >
                              <Copy className="h-3 w-3" />
                              Copiar
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                // 2. Loop de propriedades GeoJSON
                Object.keys(props).forEach(key => {
                  const low = key.toLowerCase();
                  if (low === 'fid' || low === 'id') return;

                  const isCode = key.toUpperCase().startsWith('CD_') || key.toUpperCase().startsWith('COD_');
                  const isTranslated = (key === 'CD_SIT' || key === 'CD_TIPO');
                  if (isCode && !isTranslated) return; // Ignora códigos numéricos crus que já têm tradução

                  const val = props[key];
                  if (val == null || String(val).trim() === '') return;

                  const translatedVal = getTranslatedValue(key, val);
                  const disp = propertyNames[key] || key;

                  const isHighlighted = key === 'NM_MUN' || key === 'NM_BAIRRO' || key === 'Nome';

                  rows.push(
                    <tr key={`prop-${key}`} className={`hover:bg-gray-50 ${isHighlighted ? 'bg-indigo-50 dark:bg-indigo-900/40/20 font-bold' : ''}`}>
                      <td className="px-6 py-2 font-medium text-slate-800 dark:text-slate-200">{disp}</td>
                      <td className="px-6 py-2 text-slate-700 dark:text-slate-300">{translatedVal}</td>
                    </tr>
                  );
                });

                // 3. Métricas adicionadas pelo painel
                rows.push(
                  <tr key="calc-vagos" className="hover:bg-gray-50">
                    <td className="px-6 py-2 font-medium text-slate-800 dark:text-slate-200">Total de Domicílios Vagos</td>
                    <td className="px-6 py-2 text-slate-700 dark:text-slate-300">{domVagos.toLocaleString('pt-BR')}</td>
                  </tr>,
                  <tr key="calc-vacancia" className="hover:bg-gray-50">
                    <td className="px-6 py-2 font-medium text-slate-800 dark:text-slate-200">Taxa de Vacância</td>
                    <td className="px-6 py-2 text-slate-700 dark:text-slate-300">{taxaVac}%</td>
                  </tr>,
                  <tr key="calc-densidade" className="hover:bg-gray-50 border-t border-gray-100">
                    <td className="px-6 py-2 font-semibold text-indigo-900 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-900/40/5">Média de Moradores por Domicílio (Densidade)</td>
                    <td className="px-6 py-2 font-bold text-indigo-900 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-900/40/5">{densidade}</td>
                  </tr>
                );

                return rows;
              })()
            ) : (
              // EXIBIÇÃO DE MÚLTIPLOS ITENS (CONSOLIDADO)
              (() => {
                let sumPop = 0;
                let sumDomPart = 0;
                let sumDomOcup = 0;
                let sumDomCol = 0;
                let sumDomTotal = 0;

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

                const sumVagos = Math.max(0, sumDomPart - sumDomOcup);
                const avgTaxaVac = sumDomPart > 0 ? ((sumVagos / sumDomPart) * 100).toFixed(1) : '0.0';
                const avgDensidade = sumDomOcup > 0 ? (sumPop / sumDomOcup).toFixed(2) : '0.00';

                const metrics = [
                  { label: 'População Total Consolidada', val: sumPop.toLocaleString('pt-BR') },
                  { label: 'Total de Domicílios Geral', val: sumDomTotal.toLocaleString('pt-BR') },
                  { label: 'Total de Domicílios Particulares', val: sumDomPart.toLocaleString('pt-BR') },
                  { label: 'Total de Domicílios Ocupados', val: sumDomOcup.toLocaleString('pt-BR') },
                  { label: 'Total de Domicílios Coletivos', val: sumDomCol.toLocaleString('pt-BR') },
                  { label: 'Domicílios Vagos/Ocasional', val: sumVagos.toLocaleString('pt-BR') },
                  { label: 'Taxa de Vacância Média Consolidada', val: avgTaxaVac + '%' },
                  { label: 'Densidade Média (Habitantes/Domicílio)', val: avgDensidade }
                ];

                return (
                  <>
                    <tr className="bg-indigo-50 dark:bg-indigo-900/40/50">
                      <td className="px-6 py-3 font-bold text-indigo-900 dark:text-indigo-200">Total Consolidado</td>
                      <td className="px-6 py-3 font-bold text-indigo-900 dark:text-indigo-200">{count} áreas territoriais selecionadas</td>
                    </tr>
                    {metrics.map((m, idx) => (
                      <tr key={`metric-${idx}`} className="hover:bg-gray-50">
                        <td className="px-6 py-2 font-medium text-slate-800 dark:text-slate-200">{m.label}</td>
                        <td className="px-6 py-2 text-slate-700 dark:text-slate-300 font-semibold">{m.val}</td>
                      </tr>
                    ))}
                  </>
                );
              })()
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
