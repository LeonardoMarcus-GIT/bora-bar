export const mockBarLocations = {
  "esquina-77": {
    address: "Rua 33, 77 - Vila Santa Cecilia, Volta Redonda",
    city: "Volta Redonda",
    latitude: -22.51965,
    longitude: -44.10398,
    neighborhood: "Vila Santa Cecilia"
  },
  "boteco-do-porto": {
    address: "Rua 14, 420 - Aterrado, Volta Redonda",
    city: "Volta Redonda",
    latitude: -22.51028,
    longitude: -44.09478,
    neighborhood: "Aterrado"
  },
  "varanda-aurora": {
    address: "Rua Paulo de Frontin, 1200 - Jardim Amalia, Volta Redonda",
    city: "Volta Redonda",
    latitude: -22.51692,
    longitude: -44.11322,
    neighborhood: "Jardim Amalia"
  },
  "marola-bar": {
    address: "Av. Sávio Gama, 1888 - Retiro, Volta Redonda",
    city: "Volta Redonda",
    latitude: -22.49782,
    longitude: -44.10635,
    neighborhood: "Retiro"
  },
  "quintal-boa-prosa": {
    address: "Rua Gustavo Lira, 310 - Centro, Volta Redonda",
    city: "Volta Redonda",
    latitude: -22.52346,
    longitude: -44.10391,
    neighborhood: "Centro"
  },
  "samba-da-rua": {
    address: "Rua Sessenta, 91 - Conforto, Volta Redonda",
    city: "Volta Redonda",
    latitude: -22.52694,
    longitude: -44.08384,
    neighborhood: "Conforto"
  }
};

export const barCoordinates = Object.fromEntries(
  Object.entries(mockBarLocations).map(([id, location]) => [
    id,
    {
      latitude: location.latitude,
      longitude: location.longitude
    }
  ])
);
