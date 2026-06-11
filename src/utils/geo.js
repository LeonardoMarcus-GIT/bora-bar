const EARTH_RADIUS_KM = 6371;

export function isValidCoordinate(value) {
  return Number.isFinite(value);
}

export function calculateDistanceKm(origin, destination) {
  if (
    !origin ||
    !destination ||
    !isValidCoordinate(origin.latitude) ||
    !isValidCoordinate(origin.longitude) ||
    !isValidCoordinate(destination.latitude) ||
    !isValidCoordinate(destination.longitude)
  ) {
    return null;
  }

  const originLat = toRadians(origin.latitude);
  const destinationLat = toRadians(destination.latitude);
  const deltaLat = toRadians(destination.latitude - origin.latitude);
  const deltaLng = toRadians(destination.longitude - origin.longitude);

  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(originLat) *
      Math.cos(destinationLat) *
      Math.sin(deltaLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function formatDistanceKm(value) {
  if (!Number.isFinite(value)) {
    return "Distancia indisponivel";
  }

  if (value < 1) {
    return `${Math.round(value * 1000)} m`;
  }

  return `${value.toFixed(1).replace(".", ",")} km`;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}
