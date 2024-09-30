const map = L.map("map", {
  minZoom: -3,
}).setView([61.5, 24.5], 6);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

fetch(
  "https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326"
)
  .then((response) => response.json())
  .then((data) => {
    const geojsonLayer = L.geoJSON(data, {
      style: function (feature) {
        return {
          weight: 2,
          fillColor: getColor(feature.properties.nimi),
          fillOpacity: 0.5,
        };
      },
      onEachFeature: function (feature, layer) {
        if (feature.properties && feature.properties.nimi) {
          layer.bindTooltip(feature.properties.nimi, {
            permanent: false,
            direction: "auto",
          });

          layer.on("click", () => {
            fetchMigrationData(feature.properties.nimi)
              .then((migrationData) => {
                const popupContent = `
                    <strong>${feature.properties.nimi}</strong><br>
                    Positive Migration: ${migrationData.positive}<br>
                    Negative Migration: ${migrationData.negative}
                  `;
                layer.bindPopup(popupContent).openPopup();
              })
              .catch((error) => {
                console.error("Error fetching migration data:", error);
                layer.bindPopup("Error fetching migration data").openPopup();
              });
          });
        }
      },
    }).addTo(map);
    map.fitBounds(geojsonLayer.getBounds());
  })
  .catch((error) => console.error("Error fetching GeoJSON data:", error));

function fetchMigrationData(municipality) {
  const positiveUrl =
    "https://statfin.stat.fi/PxWeb/sq/4bb2c735-1dc3-4c5e-bde7-2165df85e65f";
  const negativeUrl =
    "https://statfin.stat.fi/PxWeb/sq/944493ca-ea4d-4fd9-a75c-4975192f7b6e";

  return Promise.all([
    fetch(positiveUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch positive data");
        return response.json();
      })
      .then((data) => {
        console.log("Positive migration data:", data);
        const positiveData = data.dataset.find(
          (item) => item["Kunta"] === municipality
        );
        return {
          positive: positiveData
            ? positiveData["Positiivinen muuttoliike"]
            : "N/A",
        };
      }),
    fetch(negativeUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch negative data");
        return response.json();
      })
      .then((data) => {
        console.log("Negative migration data:", data);
        const negativeData = data.dataset.find(
          (item) => item["Kunta"] === municipality
        );
        return {
          negative: negativeData
            ? negativeData["Negatiivinen muuttoliike"]
            : "N/A",
        };
      }),
  ])
    .then(([positive, negative]) => {
      return {
        positive: positive.positive,
        negative: negative.negative,
      };
    })
    .catch((error) => {
      console.error("Error fetching migration data:", error);
      return { positive: "Error", negative: "Error" };
    });
}

function getColor(municipality) {
  const positive = Math.random() * 100;
  const negative = Math.random() * 100;
  const hue = Math.min((positive / (negative || 1)) ** 3 * 60, 120);
  return `hsl(${hue}, 75%, 50%)`;
}
