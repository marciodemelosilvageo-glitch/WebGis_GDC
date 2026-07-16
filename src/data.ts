import L from 'leaflet';

// ---------- Dicionários Oficiais (Censo / IBGE) ----------
export const situationMap: Record<string, string> = {
  "1": "Área urbana de alta densidade de edificações",
  "2": "Área urbana de baixa densidade de edificações",
  "3": "Núcleo urbano",
  "4": "Área rural (exclusive aglomerados)", 
  "5": "Aglomerado rural - Povoado",
  "6": "Aglomerado rural - Núcleo rural",
  "7": "Aglomerado rural - Lugarejo",
  "8": "Área rural (exclusive aglomerados)",
  "9": "Massas de água"
};

export const typeMap: Record<string, string> = {
  "0": "Não especial",
  "1": "Favela e Comunidade Urbana",
  "2": "Quartel e base militar",
  "3": "Alojamento / acampamento",
  "4": "Setor com baixo patamar domiciliar",
  "5": "Agrupamento indígena",
  "6": "Unidade prisional",
  "7": "Convento/hospital/ILPI/IACA",
  "8": "Agrovila do PA",
  "9": "Agrupamento quilombola"
};

// Nomes amigáveis para as propriedades das tabelas e KML/CSV
export const propertyNames: Record<string, string> = {
  'CD_SETOR': 'Geocódigo de Setor Censitário',
  'SITUACAO': 'Situação (Urbana/Rural)',
  'CD_SIT': 'Situação Detalhada', 
  'CD_TIPO': 'Tipo do Setor', 
  'Risp': 'RISP',
  'Area de desenvolvimento': 'Área de Desenvolvimento',
  'AREA_KM2': 'Área (km²)',
  'CD_REGIAO': 'Código da Grande Região',
  'NM_REGIAO': 'Nome da Grande Região',
  'CD_UF': 'Código da UF',
  'NM_UF': 'Nome da UF',
  'CD_MUN': 'Código do Município',
  'NM_MUN': 'Nome do Município',
  'CD_DIST': 'Código do Distrito',
  'NM_DIST': 'Nome do Distrito',
  'CD_SUBDIST': 'Código do Subdistrito',
  'NM_SUBDIST': 'Nome do Subdistrito',
  'CD_BAIRRO': 'Código do Bairro',
  'NM_BAIRRO': 'Nome do Bairro',
  'CD_NU': 'Código do Núcleo Urbano',
  'NM_NU': 'Nome do Núcleo Urbano',
  'CD_FCU': 'Código da Favela/Com. Urbana',
  'NM_FCU': 'Nome da Favela/Com. Urbana',
  'CD_AGLOM': 'Código do Aglomerado',
  'NM_AGLOM': 'Nome do Aglomerado',
  'CD_RGINT': 'Código da RG Intermediária',
  'NM_RGINT': 'Nome da RG Intermediária',
  'CD_RGI': 'Código da RG Imediata',
  'NM_RGI': 'Nome da RG Imediata',
  'CD_CONCURB': 'Código da Concentração Urbana',
  'NM_CONCURB': 'Nome da Concentração Urbana',
  'NM_TIPO': 'Tipo Descritivo',
  'NM_SIT': 'Situação Descritiva',
  'Aisp': 'AISP',
  'V0001': 'Total de pessoas',
  'V0002': 'Total de Domicílios (Particulares + Coletivos)',
  'V0003': 'Total de Domicílios Particulares',
  'V0004': 'Total de Domicílios Coletivos',
  'V0005': 'Média de moradores em Dom. Particulares Ocupados',
  'V0006': 'Percentual de Dom. Particulares Ocupados Imputados',
  'V0007': 'Total de Domicílios Particulares Ocupados',
  'Total de pessoas': 'Total de pessoas',
  'Nome': 'Nome',
  'Nome do município': 'Nome do Município',
  'CEP': 'CEP',
  'Localidade': 'Localidade',
  'LATITUDE': 'Latitude (Y)',
  'LONGITUDE': 'Longitude (X)',
  'Agromerado': 'Aglomerado',
  'id_Localidades': 'ID Localidades'
};

// ---------- Estilos e Legendas Temáticas ----------
export const getSectorsPopulationColor = (d: number): string => 
  d > 2000 ? '#B10026' : 
  d > 1500 ? '#E31A1C' : 
  d > 1000 ? '#FC4E2A' : 
  d > 750  ? '#FD8D3C' : 
  d > 500  ? '#FEB24C' : 
  d > 250  ? '#FED976' : 
  d > 100  ? '#FFFFB2' : '#FFFFE5';

export const getAreaDevColor = (d: number): string => 
  d > 389168 ? '#800026' : 
  d > 218862 ? '#B10026' : 
  d > 170528 ? '#E31A1C' : 
  d > 127442 ? '#FC4E2A' : 
  d > 112096 ? '#FD8D3C' : 
  d > 88281  ? '#FEB24C' : '#FFFFE5';

export const getGeneralPopulationColor = (d: number): string => 
  d > 200000 ? '#800026' : 
  d > 100000 ? '#BD0026' : 
  d > 50000  ? '#E31A1C' : 
  d > 20000  ? '#FC4E2A' : 
  d > 10000  ? '#FD8D3C' : 
  d > 5000   ? '#FEB24C' : 
  d > 1000   ? '#FED976' : '#FFEDA0';

export const thematicStyleGeneral = (f: any): L.PathOptions => ({
  fillColor: getGeneralPopulationColor(f.properties?.['Total de pessoas'] || f.properties?.['V0001'] || 0),
  weight: 1,
  opacity: 1,
  color: 'black',
  fillOpacity: 0.7
});

export const thematicStyleSectors = (f: any): L.PathOptions => ({
  fillColor: getSectorsPopulationColor(f.properties?.['Total de pessoas'] || f.properties?.['V0001'] || 0),
  weight: 1,
  opacity: 1,
  color: 'black',
  fillOpacity: 0.7
});

export const thematicStyleAreaDev = (f: any): L.PathOptions => ({
  fillColor: getAreaDevColor(f.properties?.['Total de pessoas'] || f.properties?.['V0001'] || 0),
  weight: 1,
  opacity: 1,
  color: 'black',
  fillOpacity: 0.7
});

export const thematicStylePoints = (_f: any): L.CircleMarkerOptions => ({
  radius: 3.5,
  fillColor: "#f97316",
  color: "#ffffff",
  weight: 1,
  opacity: 0.8,
  fillOpacity: 0.8
});

export const layerStyles: Record<string, (f: any) => L.PathOptions> = {
  "Situação (Urbana/Rural)": thematicStyleGeneral,
  "Situação detalhada - Nivel Municipio": thematicStyleGeneral,
  "Situação detalhada - Nivel Bairros": thematicStyleSectors,
  "Tipo do Setor - Nivel Municipio": thematicStyleGeneral,
  "Tipo do Setor - Nivel Bairros": thematicStyleSectors,
  "AISP": thematicStyleGeneral,
  "Aglomerados Rurais": thematicStyleGeneral,
  "Áreas de Desenvolvimento": thematicStyleAreaDev,
  "Bairros": thematicStyleSectors,
  "Comunidades Rurais de Teresina": thematicStyleSectors,
  "Favelas e Comunidades": thematicStyleSectors,
  "Localidades (Piauí)": thematicStylePoints as any,
  "Municipios": thematicStyleGeneral,
  "Núcleos Urbanos": thematicStyleSectors,
  "RISP": thematicStyleGeneral
};

// ---------- Definição de Fontes de Dados (GeoJSON) ----------
export const dataSources = [
  { name: "AISP", url: 'https://raw.githubusercontent.com/marciodemelosilvageo-glitch/web/main/geojsom/Aisp.geojson', popupProperty: 'Aisp' },
  { name: "Aglomerados Rurais", url: 'https://raw.githubusercontent.com/marciodemelosilvageo-glitch/web/main/geojsom/NM_AGLOM.geojson', popupProperty: 'NM_AGLOM' },
  { name: "Áreas de Desenvolvimento", url: 'https://raw.githubusercontent.com/marciodemelosilvageo-glitch/web/main/geojsom/Area%20de%20desenvolvimento.geojson', popupProperty: 'Area de desenvolvimento' },
  { name: "Bairros", url: 'https://raw.githubusercontent.com/marciodemelosilvageo-glitch/web/main/geojsom/NM_BAIRRO.geojson', popupProperty: 'NM_BAIRRO' },
  { name: "Comunidades Rurais de Teresina", url: 'https://raw.githubusercontent.com/marciodemelosilvageo-glitch/web/main/geojsom/Comunidades%20rurais%20de%20teresina.geojson', popupProperty: 'Nome' },
  { name: "Favelas e Comunidades", url: 'https://raw.githubusercontent.com/marciodemelosilvageo-glitch/web/main/geojsom/NM_FCU.geojson', popupProperty: 'NM_FCU' },
  { name: "Localidades (Piauí)", url: 'https://raw.githubusercontent.com/marciodemelosilvageo-glitch/web_Gis_Pesquisa/main/povoados/Localidades.geojson', popupProperty: 'Localidade' },
  { name: "Municipios", url: 'https://raw.githubusercontent.com/marciodemelosilvageo-glitch/web/main/geojsom/NM_MUN.geojson', popupProperty: 'NM_MUN' },
  { name: "Núcleos Urbanos", url: 'https://raw.githubusercontent.com/marciodemelosilvageo-glitch/web/main/geojsom/NM_NU.geojson', popupProperty: 'NM_NU' },
  { name: "RISP", url: 'https://raw.githubusercontent.com/marciodemelosilvageo-glitch/web/main/geojsom/Risp.geojson', popupProperty: 'Risp' }
].map(s => ({
  ...s,
  style: layerStyles[s.name] || thematicStyleGeneral
}));

// Chaves para identificação do local de forma amigável
export const PRIORITY_KEYS = [
  'Localidade', 'NM_AGLOM', 'NM_FCU', 'NM_NU', 'NM_BAIRRO', 'NM_DIST', 'NM_SUBDIST', 'Nome', 
  'NM_MUN', 'NM_CONCURB', 'NM_RGI', 'NM_RGINT', 'NM_UF', 
  'Aisp', 'Risp', 'Area de desenvolvimento', 'NM_TIPO', 'NM_SIT', 'SITUACAO', 'CD_SETOR'
];

export const CODE_KEYS = ['CD_MUN', 'CD_BAIRRO', 'CD_SIT', 'CD_TIPO', 'Cod_Risp', 'CD_FCU'];
