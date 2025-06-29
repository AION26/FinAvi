import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster/dist/leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Extend Leaflet types to include MarkerCluster typings
declare module 'leaflet' {
  interface MarkerClusterGroupOptions extends L.LayerOptions {
    iconCreateFunction?: (cluster: L.MarkerCluster) => L.Icon | L.DivIcon;
    spiderfyOnMaxZoom?: boolean;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    maxClusterRadius?: number;
    chunkedLoading?: boolean;
    chunkInterval?: number;
  }

  

  interface MarkerCluster extends L.Marker {
    getChildCount(): number;
    getAllChildMarkers(): L.Marker[];
  }
}

type ConflictEvent = {
  id: string;
  date: string;
  type: string;
  location: string;
  notes: string;
  position: [number, number];
};

type ConflictZoneLayerProps = {
  data: ConflictEvent[];
  map: L.Map | null;
  onClusterClick?: (cluster: L.MarkerCluster) => void;
};

const ConflictZoneLayer: React.FC<ConflictZoneLayerProps> = ({ data, map, onClusterClick }) => {
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    const clusterOptions = {
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 60,
      chunkedLoading: true,
      chunkInterval: 200,
      iconCreateFunction: (cluster: L.MarkerCluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div class="cluster-marker">${count}</div>`,
          className: 'custom-cluster',
          iconSize: L.point(40, 40, true),
        });
      },
    } as L.MarkerClusterGroupOptions;

    const markers = new L.MarkerClusterGroup(clusterOptions);

    // Add markers to cluster group
    data.forEach((point) => {
      const marker = L.marker(point.position, {
        title: point.location,
      });

      marker.bindPopup(`
        <div class="conflict-popup">
          <h4>${point.location}</h4>
          <p><strong>Event Type:</strong> ${point.type}</p>
          <p><strong>Date:</strong> ${point.date}</p>
          <p class="notes">${point.notes}</p>
        </div>
      `);

      markers.addLayer(marker);
    });

    // Add click handler for clusters
    if (onClusterClick) {
      markers.on('clusterclick', (event) => {
        onClusterClick(event.layer as L.MarkerCluster); // Type-safe cast
      });
    }

    map.addLayer(markers);
    clusterRef.current = markers;

    return () => {
      if (map && clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }
    };
  }, [data, map, onClusterClick]);

  return null;
};

export default ConflictZoneLayer;
