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
        this.initializePulsingDot();
    }
    

    initializePulsingDot() {
        const map = this.map;
        console.log(map)
        const size = CONFIG.MAP.PULSING_DOT_SIZE;
        this.pulsingDot = {
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
                context.fillStyle = `rgba(255, 200, 200,${1 - t})`;
                context.fill();
        
                context.beginPath();
                context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
                context.fillStyle = 'rgba(255, 100, 100, 1)';
                context.strokeStyle = 'white';
                context.lineWidth = 2 + 4 * (1 - t);
                context.fill();
                context.stroke();
        
                this.data = context.getImageData(0, 0, this.width, this.height).data;
                map.triggerRepaint();
                return true;
            }
        };
        
        this.map.on('load', async () => {
            const boughtAirports = this.gameService.boughtAirports;
            let money = this.gameService.money;
            this.map.addImage('pulsing-dot', this.pulsingDot, { pixelRatio: 2 });
            const airportlist = await airports();
            const airportData = {
                'type': 'FeatureCollection',
                'features': airportlist.features.filter(airport => airport.geometry && airport.geometry.coordinates && airport.properties.type !== 'military' && airport.properties.type !== 'spaceport')
                };
            
        
            this.map.addSource('airports', {
                'type': 'geojson',
                'data': airportData
            });
        
            this.map.addLayer({
                'id': 'airport-points',
                'type': 'symbol',
                'source': 'airports',
                'layout': {
                    'icon-image': 'pulsing-dot'
                }
            });
        
            this.map.on('click', 'airport-points', async (e) => {
                const features = e.features[0];
                const airportInfo = features.properties;
                window.uiManager.updateAirportInfo(new Airport(airportInfo, features.geometry.coordinates));
            });
            this.map.on('mouseenter', 'airport-points', () => {
                map.getCanvas().style.cursor = 'pointer';
            });
            
            this.map.on('mouseleave', 'airport-points', () => {
                map.getCanvas().style.cursor = '';
            });
        });
    }
}