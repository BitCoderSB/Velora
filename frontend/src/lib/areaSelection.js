// Utility functions for area selection

// Calculate distance between two points in kilometers using Haversine formula
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Generate a circle as GeoJSON polygon
export function generateCircleGeoJSON(centerLat, centerLon, radiusKm) {
  const points = 64; // Number of points to approximate circle
  const coordinates = [];
  
  for (let i = 0; i <= points; i++) {
    const angle = (i * 360) / points;
    const point = pointAtDistance(centerLat, centerLon, radiusKm, angle);
    coordinates.push([point.lon, point.lat]);
  }
  
  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coordinates]
    },
    properties: {
      type: "circle",
      center: [centerLon, centerLat],
      radius: radiusKm
    }
  };
}

// Calculate point at distance and bearing from origin
function pointAtDistance(lat, lon, distanceKm, bearingDegrees) {
  const R = 6371; // Earth's radius in km
  const d = distanceKm / R; // Angular distance
  const bearing = toRadians(bearingDegrees);
  const lat1 = toRadians(lat);
  const lon1 = toRadians(lon);
  
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
    Math.cos(lat1) * Math.sin(d) * Math.cos(bearing)
  );
  
  const lon2 = lon1 + Math.atan2(
    Math.sin(bearing) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
  );
  
  return {
    lat: lat2 * (180 / Math.PI),
    lon: lon2 * (180 / Math.PI)
  };
}

// Convert drawing points to GeoJSON polygon
export function pointsToGeoJSON(points) {
  if (points.length < 3) return null;
  
  // Close the polygon by adding first point at the end if not already closed
  const coordinates = [...points.map(p => [p.lon, p.lat])];
  if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || 
      coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
    coordinates.push(coordinates[0]);
  }
  
  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coordinates]
    },
    properties: {
      type: "polygon"
    }
  };
}

// Calculate centroid of polygon
export function calculateCentroid(points) {
  if (points.length === 0) return null;
  
  let sumLat = 0;
  let sumLon = 0;
  
  points.forEach(point => {
    sumLat += point.lat;
    sumLon += point.lon;
  });
  
  return [sumLon / points.length, sumLat / points.length];
}

// Validate if all points in polygon are within maxDistance from first point
export function validatePolygonDistance(points, maxDistanceKm = 40) {
  if (points.length < 2) return true;
  
  const firstPoint = points[0];
  
  for (let i = 1; i < points.length; i++) {
    const distance = calculateDistance(
      firstPoint.lat, firstPoint.lon,
      points[i].lat, points[i].lon
    );
    
    if (distance > maxDistanceKm) {
      return false;
    }
  }
  
  return true;
}

// Check if point is close to another point (for closing polygon)
export function isPointClose(point1, point2, thresholdKm = 1.5) {
  const distance = calculateDistance(
    point1.lat, point1.lon,
    point2.lat, point2.lon
  );
  return distance <= thresholdKm;
}