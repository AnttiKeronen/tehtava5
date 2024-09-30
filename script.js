const map = L.map("map", { minZoom: -3 }).setView([64.9631, 25.3375], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

fetch(
  "https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326"
)
  .then((response) => response.json())
  .then((data) => {
    const geojsonLayer = L.geoJSON(data, {
      style: (feature) => {
        const positiveMigration = feature.properties.positive_migration || 0;
        const negativeMigration = feature.properties.negative_migration || 1;
        const hue = Math.min(
          (positiveMigration / negativeMigration) ** 3 * 60,
          120
        );
        return { color: `hsl(${hue}, 75%, 50%)`, weight: 2 };
      },
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: () => {
            layer.bindTooltip(feature.properties.nimi).openTooltip();
          },
          click: () => {
            const positiveMigration =
              feature.properties.positive_migration || 0;
            const negativeMigration =
              feature.properties.negative_migration || 0;
            layer
              .bindPopup(
                `Municipality: ${feature.properties.nimi}<br>Positive Migration: ${positiveMigration}<br>Negative Migration: ${negativeMigration}`
              )
              .openPopup();
          },
        });
      },
    }).addTo(map);
    map.fitBounds(geojsonLayer.getBounds());
  })
  .catch((err) => console.error(err));

fetch("https://statfin.stat.fi/PxWeb/sq/4bb2c735-1dc3-4c5e-bde7-2165df85e65f")
  .then((response) => response.json())
  .then((data) => {
    // Process positive migration data
  })
  .catch((err) => console.error(err));

fetch("https://statfin.stat.fi/PxWeb/sq/944493ca-ea4d-4fd9-a75c-4975192f7b6e")
  .then((response) => response.json())
  .then((data) => {
    // Process negative migration data
  })
  .catch((err) => console.error(err));
