/**
 * Parse WKT (Well-Known Text) geometry into coordinates
 * Supports POLYGON and MULTIPOLYGON formats
 */

export interface ParsedGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

/**
 * Parse a WKT POLYGON string into coordinate arrays
 * Example: "POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))"
 */
function parsePolygon(wkt: string): number[][][] {
  // Remove "POLYGON" prefix and trim
  const coordsStr = wkt.replace(/^POLYGON\s*\(\s*/, '').replace(/\s*\)\s*$/, '');

  // Split into rings (outer ring and holes)
  const rings = coordsStr.split(/\),\s*\(/);

  return rings.map(ring => {
    // Remove any remaining parentheses
    const cleanRing = ring.replace(/[()]/g, '').trim();

    // Split into coordinate pairs and parse
    return cleanRing.split(',').map(pair => {
      const [lon, lat] = pair.trim().split(/\s+/).map(Number);
      return [lon, lat];
    });
  });
}

/**
 * Parse a WKT MULTIPOLYGON string into coordinate arrays
 * Example: "MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)))"
 */
function parseMultiPolygon(wkt: string): number[][][][] {
  // Remove "MULTIPOLYGON" prefix and trim
  const coordsStr = wkt.replace(/^MULTIPOLYGON\s*\(\s*/, '').replace(/\s*\)\s*$/, '');

  // Split into polygons
  const polygons: string[] = [];
  let depth = 0;
  let currentPolygon = '';

  for (let i = 0; i < coordsStr.length; i++) {
    const char = coordsStr[i];

    if (char === '(') {
      depth++;
      currentPolygon += char;
    } else if (char === ')') {
      depth--;
      currentPolygon += char;

      if (depth === 0) {
        polygons.push(currentPolygon);
        currentPolygon = '';
        // Skip comma and whitespace
        while (i + 1 < coordsStr.length && /[,\s]/.test(coordsStr[i + 1])) {
          i++;
        }
      }
    } else {
      currentPolygon += char;
    }
  }

  return polygons.map(polygon => {
    const rings = polygon.replace(/^\(\s*/, '').replace(/\s*\)$/, '').split(/\),\s*\(/);

    return rings.map(ring => {
      const cleanRing = ring.replace(/[()]/g, '').trim();

      return cleanRing.split(',').map(pair => {
        const [lon, lat] = pair.trim().split(/\s+/).map(Number);
        return [lon, lat];
      });
    });
  });
}

/**
 * Parse WKT geometry string into a structured format
 */
export function parseWKT(wkt: string): ParsedGeometry {
  const trimmedWkt = wkt.trim();

  if (trimmedWkt.startsWith('POLYGON')) {
    return {
      type: 'Polygon',
      coordinates: parsePolygon(trimmedWkt)
    };
  } else if (trimmedWkt.startsWith('MULTIPOLYGON')) {
    return {
      type: 'MultiPolygon',
      coordinates: parseMultiPolygon(trimmedWkt)
    };
  }

  throw new Error(`Unsupported WKT geometry type: ${trimmedWkt.split('(')[0]}`);
}
