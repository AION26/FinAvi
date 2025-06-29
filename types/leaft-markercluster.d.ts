// types/leaflet-markercluster.d.ts
import 'leaflet.markercluster';

declare module 'leaflet.markercluster' {
  interface MarkerClusterGroupOptions {
    maxClusterRadius?: number | ((zoom: number) => number);
    // Add other custom options you need
  }
}