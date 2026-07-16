import L from 'leaflet';
import { situationMap, typeMap, propertyNames, PRIORITY_KEYS, CODE_KEYS } from './data';

// Normalizar texto para buscas sem acentos ou capitalização
export const normalizeString = (s: string): string => {
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

// Algoritmo de Levenshtein para busca fuzzy (aproximação ortográfica)
export const levenshteinDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const dp: number[] = new Array(b.length + 1);
  for (let i = 0; i <= b.length; i++) dp[i] = i;
  for (let j = 1; j <= a.length; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= b.length; i++) {
      const temp = dp[i];
      dp[i] = (a[j - 1] === b[i - 1]) ? prev : Math.min(prev + 1, dp[i] + 1, dp[i - 1] + 1);
      prev = temp;
    }
  }
  return dp[b.length];
};

// Sanitização de HTML e XML contra ataques XSS ou quebras de sintaxe
export const escapeHtml = (s: string): string => {
  return String(s).replace(/[&<>"'`=\\/]/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#96;',
    '=': '&#61;',
    '/': '&#47;'
  }[ch] || ch));
};

export const escapeXml = (s: string): string => {
  return String(s).replace(/[<>&'"]/g, ch => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;'
  }[ch] || ch));
};

// Sanitizar nome do arquivo para exportação segura
export const sanitizeFilename = (s: string): string => {
  return String(s).replace(/[\\/:*?"<>|]+/g, '_').slice(0, 120);
};

// Traduzir valores codificados (Ex: Situação 1, Tipo do Setor 1) para descrições legíveis
export const getTranslatedValue = (key: string, value: any): string => {
  const valStr = String(value).trim();
  if (key === 'CD_SIT' && situationMap[valStr]) {
    return `${valStr} - ${situationMap[valStr]}`;
  }
  if (key === 'CD_TIPO' && typeMap[valStr]) {
    return `${valStr} - ${typeMap[valStr]}`;
  }
  return String(value);
};

// Identificar dinamicamente o nome da feição por prioridade de chaves de texto
export const getIdentifier = (props: Record<string, any> | undefined): string => {
  if (!props) return 'Item';
  for (const k of PRIORITY_KEYS) {
    if (props[k] != null && String(props[k]).trim() !== '') {
      return String(props[k]);
    }
  }
  for (const k of CODE_KEYS) {
    if (props[k] != null && String(props[k]).trim() !== '') {
      return getTranslatedValue(k, props[k]);
    }
  }
  return 'Item Territorial';
};

// Calcular centro geográfico de um polígono/ponto
export const getFeatureCenter = (layer: L.Layer): L.LatLng | null => {
  if (typeof (layer as any).getBounds === 'function') {
    const bounds = (layer as any).getBounds();
    if (bounds.isValid()) {
      return bounds.getCenter();
    }
  } else if (typeof (layer as any).getLatLng === 'function') {
    return (layer as any).getLatLng();
  }
  return null;
};

// Download de arquivos genérico
export const downloadFile = (filename: string, content: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Exportar feições selecionadas para formato CSV compatível com Excel
export const exportSelectionToCSV = (filename: string, features: any[]): void => {
  if (features.length === 0) {
    alert('Não há dados selecionados para exportar.');
    return;
  }
  const allKeys = new Set<string>();
  features.forEach(layer => {
    const props = layer.feature?.properties || {};
    Object.keys(props).forEach(k => {
      const low = k.toLowerCase();
      if (low !== 'fid' && low !== 'id') {
        allKeys.add(k);
      }
    });
  });

  const keys = Array.from(allKeys).sort();
  const headers = keys.map(k => `"${(propertyNames[k] || k).replace(/"/g, '""')}"`);
  let csv = headers.join(',') + '\r\n';

  features.forEach(layer => {
    const props = layer.feature?.properties || {};
    const row = keys.map(k => {
      let v = props[k];
      if (k === 'CD_SIT' || k === 'CD_TIPO') {
        v = getTranslatedValue(k, v);
      }
      const s = (v != null) ? String(v) : '';
      return `"${s.replace(/"/g, '""')}"`;
    });
    csv += row.join(',') + '\r\n';
  });

  downloadFile(filename, csv, 'text/csv;charset=utf-8');
};

// Converter coordenadas de polígono para string KML
const coordsToStr = (coords: any[]): string => {
  return coords.map(c => `${c[0]},${c[1]},0`).join(' ');
};

const polygonToKml = (coords: any[][]): string => {
  let kml = `        <Polygon>\n          <outerBoundaryIs>\n            <LinearRing>\n              <coordinates>${coordsToStr(coords[0])}</coordinates>\n            </LinearRing>\n          </outerBoundaryIs>\n`;
  for (let i = 1; i < coords.length; i++) {
    kml += `          <innerBoundaryIs>\n            <LinearRing>\n              <coordinates>${coordsToStr(coords[i])}</coordinates>\n            </LinearRing>\n          </innerBoundaryIs>\n`;
  }
  kml += `        </Polygon>\n`;
  return kml;
};

// Converter feição GeoJSON para Placemark KML
export const featureToKMLPlacemark = (feature: any): string => {
  const props = feature.properties || {};
  const geom = feature.geometry || {};
  const name = getIdentifier(props);

  let xml = `    <Placemark>\n      <name>${escapeXml(String(name))}</name>\n      <ExtendedData>\n`;
  for (const key in props) {
    const low = key.toLowerCase();
    if (low === 'fid' || low === 'id') continue;
    let v = props[key];
    if (key === 'CD_SIT' || key === 'CD_TIPO') {
      v = getTranslatedValue(key, v);
    }
    const display = propertyNames[key] || key;
    xml += `        <Data name="${escapeXml(String(display))}"><value>${escapeXml(String(v))}</value></Data>\n`;
  }
  xml += '      </ExtendedData>\n';

  if (geom.type === 'Polygon') {
    xml += polygonToKml(geom.coordinates);
  } else if (geom.type === 'MultiPolygon') {
    xml += '      <MultiGeometry>\n';
    geom.coordinates.forEach((p: any) => {
      xml += polygonToKml(p);
    });
    xml += '      </MultiGeometry>\n';
  } else if (geom.type === 'LineString') {
    xml += `      <LineString>\n        <coordinates>${geom.coordinates.map((c: any) => `${c[0]},${c[1]},0`).join(' ')}</coordinates>\n      </LineString>\n`;
  } else if (geom.type === 'MultiLineString') {
    xml += '      <MultiGeometry>\n';
    geom.coordinates.forEach((line: any) => {
      xml += `        <LineString>\n          <coordinates>${line.map((c: any) => `${c[0]},${c[1]},0`).join(' ')}</coordinates>\n        </LineString>\n`;
    });
    xml += '      </MultiGeometry>\n';
  } else if (geom.type === 'Point') {
    xml += `      <Point>\n        <coordinates>${geom.coordinates[0]},${geom.coordinates[1]},0</coordinates>\n      </Point>\n`;
  } else if (geom.type === 'MultiPoint') {
    xml += '      <MultiGeometry>\n';
    geom.coordinates.forEach((pt: any) => {
      xml += `        <Point>\n          <coordinates>${pt[0]},${pt[1]},0</coordinates>\n        </Point>\n`;
    });
    xml += '      </MultiGeometry>\n';
  }

  xml += '    </Placemark>';
  return xml;
};

// Exportar feições selecionadas para formato KML do Google Earth
export const exportSelectionToKML = (filename: string, features: any[]): void => {
  if (features.length === 0) {
    alert('Nenhum elemento selecionado para exportar.');
    return;
  }
  let placemarks = '';
  features.forEach(layer => {
    if (layer.feature) {
      placemarks += featureToKMLPlacemark(layer.feature) + '\n';
    }
  });

  const fullKML = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n  <Document>\n${placemarks}  </Document>\n</kml>`;
  downloadFile(filename, fullKML, 'application/vnd.google-earth.kml+xml');
};
