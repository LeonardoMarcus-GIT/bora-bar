import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { formatDistanceKm } from "../utils/geo.js";

const DEFAULT_CENTER = [-14.235, -51.9253];

export default function BarMap({ bars, onSelectBar, userLocation }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  const barsWithCoordinates = useMemo(
    () =>
      bars.filter(
        (bar) =>
          Number.isFinite(bar.latitude) &&
          Number.isFinite(bar.longitude)
      ),
    [bars]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(containerRef.current, {
      attributionControl: false,
      scrollWheelZoom: false,
      zoomControl: false
    }).setView(DEFAULT_CENTER, 4);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(map);

    L.control.attribution({ prefix: false }).addAttribution("© OpenStreetMap").addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;

    if (!map || !layer) {
      return;
    }

    layer.clearLayers();

    const bounds = [];

    barsWithCoordinates.forEach((bar) => {
      const position = [bar.latitude, bar.longitude];
      const marker = L.marker(position, {
        icon: L.divIcon({
          className: "bar-map-marker",
          html: `<span>${bar.priceLevel}</span>`,
          iconAnchor: [18, 18],
          iconSize: [36, 36]
        }),
        title: bar.name
      });

      marker.bindTooltip(
        `<strong>${bar.name}</strong><br>${bar.neighborhood}, ${bar.city}<br>${formatDistanceKm(bar.distanceKm)}`,
        { direction: "top", offset: [0, -12] }
      );
      marker.on("click", () => onSelectBar(bar));
      marker.addTo(layer);
      bounds.push(position);
    });

    if (userLocation) {
      const userPosition = [userLocation.latitude, userLocation.longitude];
      L.circleMarker(userPosition, {
        className: "user-location-marker",
        color: "#ffc744",
        fillColor: "#ffc744",
        fillOpacity: 0.28,
        radius: 10,
        weight: 2
      })
        .bindTooltip("Voce esta aqui", { direction: "top" })
        .addTo(layer);
      bounds.push(userPosition);
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds, {
        maxZoom: 14,
        padding: [28, 28]
      });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    } else {
      map.setView(DEFAULT_CENTER, 4);
    }

    window.setTimeout(() => map.invalidateSize(), 120);
  }, [barsWithCoordinates, onSelectBar, userLocation]);

  return (
    <section className="bar-map-section" aria-label="Mapa de bares">
      <div className="section-heading map-heading">
        <div>
          <p className="section-kicker">Mapa</p>
          <h2>Bares no mapa</h2>
        </div>
        <span>{barsWithCoordinates.length} pins</span>
      </div>
      <div className="bar-map" ref={containerRef} />
    </section>
  );
}
