import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, ZoomIn, Copy, Compass, ExternalLink, MousePointerClick } from 'lucide-react';
import { DataSource, SelectedFeature, ContextMenuState } from '../types';
import { dataSources, situationMap, typeMap, propertyNames } from '../data';
import { getIdentifier, getTranslatedValue, getFeatureCenter } from '../utils';

interface MapComponentProps {
  isMultiSelectMode: boolean;
  selectedFeatures: SelectedFeature[];
  onSelectionChange: (features: SelectedFeature[]) => void;
  showToast: (msg: string) => void;
  statusText: string;
  setStatusText: (text: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  activeLayers: string[];
  setActiveLayers: (layers: string[]) => void;
  setMapInstance: (map: L.Map | null) => void;
  registerMapActions: (actions: {
    loadLayerByName: (name: string) => Promise<L.GeoJSON>;
    zoomToFeature: (layer: L.Layer) => void;
    selectFeature: (layer: L.Layer, feature: any, sourceName: string) => void;
  }) => void;
  searchCoordinate: { lat: number; lng: number } | null;
  onToggleMultiSelect: () => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  isMultiSelectMode,
  selectedFeatures,
  onSelectionChange,
  showToast,
  statusText,
  setStatusText,
  isLoading,
  setIsLoading,
  activeLayers,
  setActiveLayers,
  setMapInstance,
  registerMapActions,
  searchCoordinate,
  onToggleMultiSelect
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  // Cache de camadas carregadas para evitar novos fetches
  const loadedLayersRef = useRef<Record<string, L.GeoJSON>>({});
  
  // Estados para UI do Mapa
  const [basemap, setBasemap] = useState<string>('osm');
  const [layersPanelOpen, setLayersPanelOpen] = useState<boolean>(false);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [layerOpacities, setLayerOpacities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    dataSources.forEach(s => {
      initial[s.name] = 0.7;
    });
    return initial;
  });

  // Estado do Menu de Contexto (Botão Direito)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    lat: 0,
    lng: 0
  });

  // Definição dos Basemaps
  const tileLayersRef = useRef<Record<string, L.TileLayer>>({});
  const searchMarkerRef = useRef<L.Marker | null>(null);

  // Estilo de seleção destacado
  const selectedStyle: L.PathOptions = { 
    weight: 4, 
    color: '#FFD700', 
    dashArray: '', 
    fillOpacity: 0.7 
  };

  // Sincronizar seleção com os estilos visuais no mapa
  useEffect(() => {
    // Redefine todos os estilos para os padrões antes de aplicar a nova seleção
    Object.values(loadedLayersRef.current).forEach((geoJsonLayer: any) => {
      geoJsonLayer.eachLayer((lyr: any) => {
        if (typeof lyr.setStyle === 'function') {
          lyr.setStyle(lyr.defaultStyle);
        }
      });
    });

    // Aplica o estilo destacado na lista atualizada de selecionados
    selectedFeatures.forEach(feat => {
      const lyr = feat.layer as any;
      if (lyr && typeof lyr.setStyle === 'function') {
        lyr.setStyle(selectedStyle);
      }
    });
  }, [selectedFeatures]);

  // Inicializar o Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // preferCanvas: true para excelente performance de renderização
    const map = L.map(mapContainerRef.current, { 
      preferCanvas: true,
      zoomControl: true
    }).setView([-5.09, -42.8], 7);

    mapRef.current = map;
    setMapInstance(map);

    // Configurar as opções de Basemaps
    tileLayersRef.current = {
      osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
        attribution: '&copy; OpenStreetMap' 
      }),
      googleSat: L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', { 
        maxZoom: 20, 
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], 
        attribution: '&copy; Google Satélite' 
      }),
      googleHybrid: L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { 
        maxZoom: 20, 
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], 
        attribution: '&copy; Google Híbrido' 
      }),
      esri: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { 
        attribution: 'Tiles &copy; Esri' 
      }),
      carto: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { 
        attribution: '&copy; Carto' 
      })
    };

    // Adiciona o basemap padrão
    tileLayersRef.current.osm.addTo(map);

    // Eventos Globais de cliques fora do menu de contexto
    const handleGlobalClick = () => {
      setContextMenu(prev => prev.visible ? { ...prev, visible: false } : prev);
    };

    map.on('click', (e: any) => {
      // Clique no mapa sem feição limpa a seleção
      if (e.originalEvent && (e.originalEvent as any)._simulated) return;
      onSelectionChange([]);
      handleGlobalClick();
    });

    map.on('dragstart', handleGlobalClick);
    map.on('zoomstart', handleGlobalClick);

    // Registrar o evento de Context Menu (Botão Direito) no mapa
    map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      
      const menuWidth = 240;
      const menuHeight = 200;
      let x = e.originalEvent.clientX;
      let y = e.originalEvent.clientY;

      if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
      if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;

      setContextMenu({
        visible: true,
        x,
        y,
        lat,
        lng
      });
    });

    // Função de limpeza do mapa ao desmontar
    return () => {
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
    };
  }, []);

  // Monitorar mudança de Basemap
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Remover basemaps antigos
    Object.values(tileLayersRef.current).forEach(layer => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    // Adicionar novo basemap
    const selectedTile = tileLayersRef.current[basemap];
    if (selectedTile) {
      selectedTile.addTo(map);
    }
  }, [basemap]);

  // Monitorar busca por coordenada para exibir marcador temporário destacado
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (searchCoordinate) {
      const { lat, lng } = searchCoordinate;
      
      // Remover marcador antigo se existir
      if (searchMarkerRef.current) {
        map.removeLayer(searchMarkerRef.current);
      }

      // Ícone com pin pulsante usando Tailwind
      const searchIcon = L.divIcon({
        className: 'custom-search-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 bg-indigo-500/30 rounded-full animate-ping"></div>
            <div class="w-5 h-5 bg-indigo-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <div class="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      // Adicionar marcador
      const marker = L.marker([lat, lng], { icon: searchIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px; text-align: center;">
          <strong style="color: #4f46e5; display: block; margin-bottom: 2px;">Coordenada Localizada</strong>
          <div style="font-family: monospace; font-size: 11px; color: #4b5563;">${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
        </div>
      `).openPopup();


      searchMarkerRef.current = marker;
      map.setView([lat, lng], 14);
    } else {
      if (searchMarkerRef.current && map.hasLayer(searchMarkerRef.current)) {
        map.removeLayer(searchMarkerRef.current);
        searchMarkerRef.current = null;
      }
    }
  }, [searchCoordinate]);

  // Sincronizar de forma reativa as camadas presentes no mapa com o array activeLayers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    dataSources.forEach(async (source) => {
      const isActive = activeLayers.includes(source.name);
      
      if (isActive) {
        // Deve estar ativa no mapa
        try {
          const layer = await loadLayer(source);
          if (mapRef.current && !mapRef.current.hasLayer(layer)) {
            layer.addTo(mapRef.current);
          }
        } catch (err) {
          console.error(`Erro ao carregar camada reativa: ${source.name}`, err);
        }
      } else {
        // Não deve estar ativa no mapa
        const layer = loadedLayersRef.current[source.name];
        if (layer && map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
        
        // Remover quaisquer duplicadas ou camadas órfãs associadas a este source name
        map.eachLayer((lyr: any) => {
          if (lyr.customSourceName === source.name) {
            map.removeLayer(lyr);
          }
        });
      }
    });
  }, [activeLayers]);

  // Registrar ações do mapa para o componente pai App.tsx
  useEffect(() => {
    registerMapActions({
      loadLayerByName: async (name: string) => {
        const src = dataSources.find(s => s.name === name);
        if (!src) throw new Error(`Layer ${name} not found`);
        return await loadLayer(src);
      },
      zoomToFeature: (layer: L.Layer) => {
        if (!mapRef.current) return;
        if (typeof (layer as any).getBounds === 'function' && (layer as any).getBounds().isValid()) {
          mapRef.current.fitBounds((layer as any).getBounds().pad(0.1));
        } else if (typeof (layer as any).getLatLng === 'function') {
          mapRef.current.setView((layer as any).getLatLng(), 14);
        }
      },
      selectFeature: (layer: L.Layer, feature: any, sourceName: string) => {
        const props = feature?.properties || {};
        const source = dataSources.find(s => s.name === sourceName);
        const rawValue = props[source?.popupProperty || ''];
        const displayValue = getTranslatedValue(source?.popupProperty || '', rawValue);
        const title = displayValue != null && String(displayValue).trim() !== '' ? String(displayValue) : getIdentifier(props);

        onSelectionChange([{
          id: String((layer as any)._leaflet_id),
          name: title,
          sourceName: sourceName,
          layer: layer,
          properties: props
        }]);
      }
    });
  }, [activeLayers, registerMapActions]);

  // Função para carregar a camada de forma assíncrona
  const loadLayer = async (source: DataSource): Promise<L.GeoJSON> => {
    if (loadedLayersRef.current[source.name]) {
      return loadedLayersRef.current[source.name];
    }

    setIsLoading(true);
    setStatusText(`Carregando dados de ${source.name}...`);

    try {
      const resp = await fetch(source.url);
      if (!resp.ok) {
        throw new Error(`Falha ao obter os dados de ${source.name}: ${resp.status}`);
      }
      const data = await resp.json();

      const geojsonOptions: L.GeoJSONOptions = {
        style: (feature: any) => {
          const baseStyle = typeof source.style === 'function' 
            ? source.style(feature) 
            : (typeof source.style === 'object' && source.style ? { ...(source.style as any) } : {});
          const opacity = layerOpacities[source.name] ?? 0.7;
          return {
            ...baseStyle,
            fillOpacity: opacity
          } as any;
        },
        onEachFeature: (feature, layer: any) => {
          layer.customSourceName = source.name;
          layer.defaultStyle = typeof source.style === 'function' ? source.style(feature) : source.style;
          
          const props = feature?.properties || {};
          const rawValue = props[source.popupProperty];
          const displayValue = getTranslatedValue(source.popupProperty, rawValue);
          const title = displayValue != null && String(displayValue).trim() !== '' ? String(displayValue) : getIdentifier(props);
          const fieldLabel = propertyNames[source.popupProperty] || source.popupProperty || 'Identificador';

          // Pop-up nativo elegante
          layer.bindPopup(`
            <div style="font-family: sans-serif; padding: 2px;">
              <strong style="color: #4338ca; display: block; margin-bottom: 4px; font-size: 13px;">${source.name}</strong>
              <div style="text-transform: uppercase; font-size: 9px; color: #6b7280; font-weight: bold;">${fieldLabel}</div>
              <div style="font-size: 12px; font-weight: 600; color: #1f2937; margin-top: 2px;">${title}</div>
            </div>
          `);

          // Clique na feição
          layer.on('click', (ev: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(ev);
            
            const isCtrl = ev.originalEvent ? (ev.originalEvent.ctrlKey || ev.originalEvent.metaKey) : false;
            const multi = isCtrl || isMultiSelectMode;

            onSelectionChange((prevSelected) => {
              const alreadySelected = prevSelected.some(item => item.id === String(layer._leaflet_id));

              if (multi) {
                if (alreadySelected) {
                  // Remove da seleção múltipla
                  layer.setStyle(layer.defaultStyle);
                  return prevSelected.filter(item => item.id !== String(layer._leaflet_id));
                } else {
                  // Adiciona à seleção múltipla
                  layer.setStyle(selectedStyle);
                  const newFeat: SelectedFeature = {
                    id: String(layer._leaflet_id),
                    name: title,
                    sourceName: source.name,
                    layer: layer,
                    properties: props
                  };
                  return [...prevSelected, newFeat];
                }
              } else {
                // Seleção simples: limpa outros estilos
                prevSelected.forEach(item => {
                  const l = item.layer as any;
                  if (l && typeof l.setStyle === 'function') {
                    l.setStyle(l.defaultStyle);
                  }
                });

                if (alreadySelected) {
                  layer.setStyle(layer.defaultStyle);
                  return [];
                } else {
                  layer.setStyle(selectedStyle);
                  return [{
                    id: String(layer._leaflet_id),
                    name: title,
                    sourceName: source.name,
                    layer: layer,
                    properties: props
                  }];
                }
              }
            });
          });
        }
      };

      // Se for a camada de Localidades (Pontos), usar CircleMarker otimizado
      if (source.name === "Localidades (Piauí)") {
        geojsonOptions.pointToLayer = (feature, latlng) => {
          const st = typeof source.style === 'function' ? source.style(feature) : source.style;
          return L.circleMarker(latlng, st as L.CircleMarkerOptions);
        };
      }

      const leafletLayer = L.geoJSON(data, geojsonOptions);
      (leafletLayer as any).customSourceName = source.name;
      loadedLayersRef.current[source.name] = leafletLayer;
      
      setStatusText(`Camada ${source.name} pronta.`);
      return leafletLayer;
    } catch (err) {
      console.error(err);
      showToast(`Erro ao carregar a camada ${source.name}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Alternar camada ativa
  const toggleLayerActive = async (sourceName: string) => {
    const isActive = activeLayers.includes(sourceName);
    if (isActive) {
      // Desativar
      setActiveLayers(activeLayers.filter(name => name !== sourceName));
      onSelectionChange((prev) => prev.filter(f => f.sourceName !== sourceName));
    } else {
      // Ativar
      setActiveLayers([...activeLayers, sourceName]);
    }
  };

  // Ajustar opacidade de uma camada
  const handleOpacityChange = (sourceName: string, opacity: number) => {
    setLayerOpacities(prev => ({ ...prev, [sourceName]: opacity }));
    const layer = loadedLayersRef.current[sourceName];
    if (layer) {
      layer.eachLayer((lyr: any) => {
        if (lyr.defaultStyle) {
          lyr.defaultStyle.fillOpacity = opacity;
        }
        if (typeof lyr.setStyle === 'function') {
          lyr.setStyle({ fillOpacity: opacity });
        }
      });
    }
  };

  // Zoom para extensão total da camada
  const zoomToLayer = async (source: DataSource) => {
    try {
      const layer = await loadLayer(source);
      const map = mapRef.current;
      if (!map) return;

      if (!activeLayers.includes(source.name)) {
        setActiveLayers([...activeLayers, source.name]);
      }

      if (typeof (layer as any).getBounds === 'function') {
        const bounds = (layer as any).getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds.pad(0.05));
        }
      } else {
        const pts: L.LatLng[] = [];
        layer.eachLayer((lyr: any) => {
          if (typeof lyr.getLatLng === 'function') {
            pts.push(lyr.getLatLng());
          }
        });
        if (pts.length > 0) {
          map.fitBounds(L.latLngBounds(pts).pad(0.05));
        }
      }
      showToast(`Enquadrando mapa em: ${source.name}`);
    } catch (err) {
      console.error(err);
      showToast('Não foi possível obter a extensão desta camada.');
    }
  };

  // Carregar camada de Municípios por padrão no Boot
  useEffect(() => {
    const bootLayer = async () => {
      const muniSource = dataSources.find(s => s.name === 'Municipios');
      if (muniSource && mapRef.current) {
        try {
          const l = await loadLayer(muniSource);
          setActiveLayers(['Municipios']);
          const bounds = l.getBounds();
          if (bounds.isValid()) {
            mapRef.current.fitBounds(bounds.pad(0.05));
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    // Espera o mapa ser inicializado
    setTimeout(bootLayer, 100);
  }, []);

  // Ligar Tudo
  const handleTurnAllOn = () => {
    showToast('Ligando todas as camadas...');
    setActiveLayers(dataSources.map(s => s.name));
  };

  // Desligar Tudo
  const handleTurnAllOff = () => {
    showToast('Desligando todas as camadas.');
    setActiveLayers([]);
    onSelectionChange([]);
  };

  // Expandir / Recolher todos os accordions de camadas
  const toggleAllDetails = (open: boolean) => {
    const next: Record<string, boolean> = {};
    dataSources.forEach(s => {
      next[s.name] = open;
    });
    setExpandedDetails(next);
  };

  // Copiar Coordenadas do Context Menu
  const copyCoords = (type: 'all' | 'lat' | 'lng') => {
    const lat = contextMenu.lat.toFixed(6);
    const lng = contextMenu.lng.toFixed(6);
    if (type === 'all') {
      navigator.clipboard.writeText(`${lat}, ${lng}`);
      showToast(`Coordenadas copiadas: ${lat}, ${lng}`);
    } else if (type === 'lat') {
      navigator.clipboard.writeText(lat);
      showToast(`Latitude copiada: ${lat}`);
    } else {
      navigator.clipboard.writeText(lng);
      showToast(`Longitude copiada: ${lng}`);
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  return (
    <div className="space-y-4">
      {/* Botões de Ações Rápidas de Camada */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div id="active-layer-display" className="w-full sm:w-auto text-center sm:text-left text-slate-700 text-sm font-semibold" aria-live="polite">
          {activeLayers.length > 0 
            ? `Camadas ativas: ${activeLayers.join(', ')}` 
            : 'Camadas ativas: nenhuma'}
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center sm:justify-end">
          <button 
            id="btn-multi-select" 
            onClick={onToggleMultiSelect}
            className={`px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isMultiSelectMode 
                ? 'bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-700' 
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            title="Permite selecionar várias áreas tocando nelas sem precisar do teclado"
          >
            <MousePointerClick className="h-4 w-4" />
            Multiseleção: {isMultiSelectMode ? 'ON' : 'OFF'}
          </button>
          <button 
            onClick={handleTurnAllOn}
            className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-bold border border-indigo-200 transition-colors cursor-pointer" 
            title="Ligar todas as camadas"
          >
            Ligar tudo
          </button>
          <button 
            onClick={handleTurnAllOff}
            className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs sm:text-sm font-bold border border-red-200 transition-colors cursor-pointer" 
            title="Desligar todas as camadas"
          >
            Desligar tudo
          </button>
        </div>
      </div>

      {/* Caixa do Mapa com Controles Absolutos */}
      <div className="relative">
        <div 
          ref={mapContainerRef} 
          id="map" 
          style={{ height: '75vh' }}
          className="w-full rounded-2xl border-2 border-gray-200 shadow-inner overflow-hidden z-10" 
          role="region" 
          aria-label="Mapa interativo"
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div id="loading-overlay" className="absolute inset-0 bg-white/80 flex items-center justify-center z-[1000] rounded-2xl">
            <div className="text-center bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
              <svg className="animate-spin h-9 w-9 text-indigo-700 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p id="status" className="text-slate-700 mt-3 text-sm font-bold" role="status" aria-live="polite">
                {statusText}
              </p>
            </div>
          </div>
        )}

        {/* CONTROLES DE CAMADA SOBREPOSTOS NO MAPA */}
        <div id="custom-map-controls" className="absolute top-3 right-3 z-[999] flex flex-col items-end gap-2 max-w-[280px] sm:max-w-[320px]">
          
          {/* 1. Seletor de Mapa de Fundo */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200/80 p-2.5 flex gap-2.5 items-center backdrop-blur-md">
            <label htmlFor="basemap-select" className="text-xs text-slate-700 font-bold uppercase tracking-wider">Fundo</label>
            <select 
              id="basemap-select" 
              value={basemap}
              onChange={(e) => setBasemap(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-slate-50 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="osm">OSM Padrão</option>
              <option value="googleSat">Google Satélite</option>
              <option value="googleHybrid">Google Híbrido</option>
              <option value="esri">Esri Satélite</option>
              <option value="carto">Carto Light</option>
            </select>
          </div>
          
          {/* 2. Painel de Camadas Vetoriais */}
          <div id="custom-layers-control" className="flex flex-col items-end w-full">
            <button 
              onClick={() => setLayersPanelOpen(!layersPanelOpen)}
              className={`p-3 rounded-xl shadow-lg border transition-all flex items-center justify-center cursor-pointer ${
                layersPanelOpen 
                  ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700' 
                  : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
              }`}
              title="Alternar painel de camadas"
              aria-expanded={layersPanelOpen}
            >
              <Layers className="w-5 h-5" />
            </button>

            {layersPanelOpen && (
              <div id="layers-panel" className="bg-white rounded-xl shadow-2xl mt-2 w-[260px] sm:w-[300px] border border-slate-200 overflow-hidden flex flex-col max-h-[380px]">
                {/* Cabeçalho do Painel */}
                <div className="p-2 border-b border-slate-100 flex gap-1 bg-slate-50 shrink-0">
                  <button 
                    onClick={() => toggleAllDetails(true)} 
                    className="flex-grow px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-[11px] font-bold text-slate-700 cursor-pointer"
                  >
                    Expandir
                  </button>
                  <button 
                    onClick={() => toggleAllDetails(false)} 
                    className="flex-grow px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-[11px] font-bold text-slate-700 cursor-pointer"
                  >
                    Recolher
                  </button>
                </div>

                {/* Lista de Camadas com Opacidade e Zoom */}
                <div id="layers-list" className="p-2.5 space-y-1 overflow-y-auto custom-scrollbar flex-grow">
                  {dataSources.map(source => {
                    const isOpen = !!expandedDetails[source.name];
                    const isActive = activeLayers.includes(source.name);

                    return (
                      <div key={source.name} className="border border-slate-100 rounded-lg overflow-hidden bg-white hover:border-slate-200/60 transition-colors">
                        <div className="flex items-center justify-between p-2">
                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              id={`layer-${source.name}`} 
                              checked={isActive}
                              onChange={() => toggleLayerActive(source.name)}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                            />
                            <label 
                              htmlFor={`layer-${source.name}`} 
                              className={`text-xs font-semibold cursor-pointer ${isActive ? 'text-indigo-900 font-bold' : 'text-slate-600'}`}
                            >
                              {source.name}
                            </label>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => zoomToLayer(source)}
                              className="p-1 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 rounded cursor-pointer" 
                              title={`Centralizar em ${source.name}`}
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => setExpandedDetails(prev => ({ ...prev, [source.name]: !isOpen }))}
                              className="text-slate-400 hover:text-slate-700 font-mono text-xs font-bold px-1 py-0.5 rounded"
                            >
                              {isOpen ? '−' : '+'}
                            </button>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="px-3 pb-2.5 pt-1 bg-slate-50/50 border-t border-slate-50 flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                              <span>Opacidade</span>
                              <span>{Math.round(layerOpacities[source.name] * 100)}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="1" 
                              step="0.1" 
                              value={layerOpacities[source.name]} 
                              onChange={(e) => handleOpacityChange(source.name, parseFloat(e.target.value))}
                              className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" 
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MENU DE CONTEXTO DO BOTÃO DIREITO PERSONALIZADO */}
        {contextMenu.visible && (
          <div 
            id="map-context-menu" 
            style={{ 
              left: `${contextMenu.x}px`, 
              top: `${contextMenu.y}px` 
            }} 
            className="fixed z-[4000] bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 w-60 text-sm overflow-hidden transition-all duration-150 origin-top-left"
          >
            <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Coordenadas do Ponto</p>
              <p id="context-coords-display" className="font-mono text-xs text-indigo-700 font-semibold break-all">
                {contextMenu.lat.toFixed(6)}, {contextMenu.lng.toFixed(6)}
              </p>
            </div>
            
            <button 
              onClick={() => copyCoords('all')}
              className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-colors flex items-center gap-2 font-medium cursor-pointer"
            >
              <Copy className="h-4 w-4 text-slate-400" />
              Copiar Lat e Long
            </button>
            <button 
              onClick={() => copyCoords('lat')}
              className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-colors flex items-center gap-2 font-medium cursor-pointer"
            >
              <span className="w-4" />
              Copiar apenas Latitude
            </button>
            <button 
              onClick={() => copyCoords('lng')}
              className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-colors flex items-center gap-2 font-medium cursor-pointer"
            >
              <span className="w-4" />
              Copiar apenas Longitude
            </button>
            
            <div className="h-px bg-slate-200 my-1"></div>
            
            <a 
              id="ctx-street-view" 
              href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${contextMenu.lat.toFixed(6)},${contextMenu.lng.toFixed(6)}`}
              target="_blank" 
              rel="noreferrer"
              onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}
              className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-emerald-700 transition-colors flex items-center gap-2 font-bold flex"
            >
              <Compass className="h-4 w-4" />
              Abrir no Street View
              <ExternalLink className="h-3 w-3 ml-auto opacity-60" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
