import { CONFIG, airports } from '../config.js';
import { WikipediaService } from '../services/WikipediaService.js';
import { Airport } from '../models/Airport.js';

export class MapManager {
    constructor(maplibregl, container, gameService) {
        this.map = new maplibregl.Map({
            container,
            style: CONFIG.MAP.STYLE_URL,
            center: CONFIG.MAP.INITIAL_CENTER,
            zoom: CONFIG.MAP.INITIAL_ZOOM
        });
        this.gameService = gameService;
        this.initializeAirportLayers();
    }
   
    initializeAirportLayers() {
        const map = this.map;
        const size = CONFIG.MAP.PULSING_DOT_SIZE;

        // Create different colored dots
        const createDot = (color) => ({
            width: size,
            height: size,
            data: new Uint8Array(size * size * 4),
            onAdd() {
                const canvas = document.createElement('canvas');
                canvas.width = this.width;
                canvas.height = this.height;
                this.context = canvas.getContext('2d');
            },
            render() {
                const duration = 1000;
                const t = (performance.now() % duration) / duration;
                const radius = (size / 2) * 0.3;
                const outerRadius = (size / 2) * 0.7 * t + radius;
                const context = this.context;
       
                context.clearRect(0, 0, this.width, this.height);
                context.beginPath();
                context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
                context.fillStyle = `rgba(${color}, ${1 - t})`;
                context.fill();
       
                context.beginPath();
                context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
                context.fillStyle = `rgba(${color}, 1)`;
                context.strokeStyle = 'white';
                context.lineWidth = 2 + 4 * (1 - t);
                context.fill();
                context.stroke();
       
                this.data = context.getImageData(0, 0, this.width, this.height).data;
                map.triggerRepaint();
                return true;
            }
        });

        this.map.on('load', async () => {

            

            // Add different colored dots
            this.map.addImage('gray-dot', createDot('160, 174, 192'), { pixelRatio: 2 });
            this.map.addImage('red-dot', createDot('245, 101, 101'), { pixelRatio: 2 });
            this.map.addImage('yellow-dot', createDot('236, 201, 75'), { pixelRatio: 2 });
            this.map.addImage('green-dot', createDot('72, 187, 120'), { pixelRatio: 2 });

            const airportList = await airports();
            
            // Transform the airport data into proper GeoJSON
            const airportData = {
                type: 'FeatureCollection',
                features: airportList.features
                    .filter(airport => 
                        airport.geometry && 
                        airport.geometry.coordinates && 
                        airport.properties.type !== 'military' && 
                        airport.properties.type !== 'spaceport'
                    )
                    .map(airport => ({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: airport.geometry.coordinates
                        },
                        properties: {
                            ...airport.properties,
                            owned: this.isAirportOwned(airport.properties.cartodb_id),
                            planeCount: this.getAirportPlaneCount(airport.properties.cartodb_id)
                        }
                    }))
            };

            // Add source
            this.map.addSource('airports', {
                type: 'geojson',
                data: airportData
            });

            // Add layers for different states
            this.addAirportLayer('unowned-airports', [
                'all',
                ['!', ['get', 'owned']],
                ['has', 'cartodb_id']
            ], 'gray-dot');
            
            this.addAirportLayer('empty-airports', [
                'all',
                ['get', 'owned'],
                ['==', ['get', 'planeCount'], 0]
            ], 'red-dot');
            
            this.addAirportLayer('single-plane-airports', [
                'all',
                ['get', 'owned'],
                ['==', ['get', 'planeCount'], 1]
            ], 'yellow-dot');
            
            this.addAirportLayer('multi-plane-airports', [
                'all',
                ['get', 'owned'],
                ['>', ['get', 'planeCount'], 1]
            ], 'green-dot');

            // Add click handlers
            ['unowned-airports', 'empty-airports', 'single-plane-airports', 'multi-plane-airports'].forEach(layerId => {
                this.map.on('click', layerId, (e) => {
                    if (e.features.length > 0) {
                        const feature = e.features[0];
                        window.uiManager.updateAirportInfo(
                            new Airport(feature.properties, feature.geometry.coordinates)
                        );
                    }
                });

                this.map.on('mouseenter', layerId, () => {
                    map.getCanvas().style.cursor = 'pointer';
                });
                
                this.map.on('mouseleave', layerId, () => {
                    map.getCanvas().style.cursor = '';
                });
            });
        });
    }

    isAirportOwned(cartodbId) {
        return this.gameService.boughtAirports.some(
            airport => airport.properties.cartodb_id === cartodbId
        );
    }

    getAirportPlaneCount(cartodbId) {
        const airport = this.gameService.boughtAirports.find(
            airport => airport.properties.cartodb_id === cartodbId
        );
        return airport ? airport.planes.length : 0;
    }

    addAirportLayer(id, filter, icon) {
        this.map.addLayer({
            id,
            type: 'symbol',
            source: 'airports',
            layout: {
                'icon-image': icon,
                'icon-allow-overlap': id != 'unowned-airports',
                'icon-ignore-placement': id != 'unowned-airports'
            },
            filter
        });
    }

    updateAirportData() {
        const source = this.map.getSource('airports');
        if (!source) return;

        const currentData = source._data;
        const updatedFeatures = currentData.features.map(feature => ({
            ...feature,
            properties: {
                ...feature.properties,
                owned: this.isAirportOwned(feature.properties.cartodb_id),
                planeCount: this.getAirportPlaneCount(feature.properties.cartodb_id)
            }
        }));

        source.setData({
            type: 'FeatureCollection',
            features: updatedFeatures
        });
    }
}