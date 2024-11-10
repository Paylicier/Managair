import { CONFIG } from '../config.js';
import { Plane } from '../models/Plane.js';
import { Airport } from '../models/Airport.js';
export class GameService {
    constructor() {
        this.money = CONFIG.GAME.INITIAL_MONEY;
        this.time = 0;
        this.isPlaying = false;
        this.boughtAirports = [];
        if(localStorage.getItem('save')) {
            try {
            const save = JSON.parse(localStorage.getItem('save'));
            this.money = save.money;
            this.time = save.time;
            this.boughtAirports = save.boughtAirports.map(airport => {
                //create new airport object and planes with the same properties
                const airportObj = new Airport(airport.properties, airport.coordinates);
                airportObj.planes = airport.planes.map(plane => new Plane(plane.tier, plane.uuid, plane.company, plane.name));
                return airportObj;
            })
        } catch (e) {
            console.error('Error loading save', e);
            localStorage.removeItem('save');
        }
        }
    }

    processAirportOperations() {
        this.boughtAirports.forEach(airport => {
            if (airport.planes.length < 1) return;

            if (Math.random() < airport.getTakeoffProbability() && !airport.isBlocked) {
                this.processFlight(airport);
            }
            this.money -= airport.planes.length * 10; // maintenance cost
        });
    }

    processFlight(origin) {
        const plane = origin.planes[Math.floor(Math.random() * origin.planes.length)];
        const destLevel = Math.random() < 0.1 ? 1 : Math.random() < 0.5 ? 2 : 3;
        const destination = this.boughtAirports.filter(
            airport => airport.getLevel() === destLevel && 
            airport.properties.gps_code !== origin.properties.gps_code && 
            !airport.isBlocked && airport.planes.length < CONFIG.GAME.MAX_PLANES_PER_AIRPORT
        )[Math.floor(Math.random() * this.boughtAirports.length)];

        if (!destination) return;

        const distance = Math.sqrt(
            Math.pow(origin.coordinates[0] - destination.coordinates[0], 2) + 
            Math.pow(origin.coordinates[1] - destination.coordinates[1], 2)
        );

        const revenue = (10 * plane.tier * (Math.floor(Math.random() * 100) + 100) * 
                        origin.bonus) * origin.getLevel() * (1 + distance / 10);
        this.money += revenue;

        const travelTime = Math.floor(distance / 10);
        origin.planes.splice(origin.planes.indexOf(plane), 1);

        console.log(`Plane ${plane.name} is flying from ${origin.properties.name} to ${destination.properties.name} and will take ${travelTime} seconds. Revenue: $${revenue}`);
        
        setTimeout(() => {
            destination.planes.push(plane);
            mapManager.updateAirportData();
            console.log(`Plane ${plane.name} has arrived at ${destination.properties.name}`);
        }, travelTime * 1000);
    }

    tick() {
        this.time++;
        if (this.time === CONFIG.GAME.DAY_LENGTH) {
            this.time = 0;
            this.triggerRandomEvent();
        }
        this.processAirportOperations();
        this.saveGame();
        if(this.money < 0) {
            window.uiManager.openInfoModal('Gameover ! You have gone bankrupt! <br> <i>Use the reset game button in the settings to play again</i>', './assets/gameover.png');
            this.isPlaying = false;
            localStorage.removeItem('save');
        }
    }

    saveGame() {
        localStorage.setItem('save', JSON.stringify({
            money: this.money,
            time: this.time,
            boughtAirports: this.boughtAirports
        }));
    }

    triggerRandomEvent() {
        console.log('Triggering random event');
        if (!this.boughtAirports.length) return;
        const event = CONFIG.EVENTS[Math.floor(Math.random() * CONFIG.EVENTS.length)];
        const eventAirport = this.boughtAirports[Math.floor(Math.random() * this.boughtAirports.length)];
        //trigger the modal
        window.uiManager.openInfoModal(`<b>${event.name}</b><br>${event.description}`, event.image, eventAirport.properties.name);
        
        event.effect(eventAirport);
        return { event, airport: eventAirport };
    }

    buyAirport(airport) {
        const price = airport.getPrice();
        if (this.money < price) return false;
        
        this.money -= price;
        airport.planes = [];
        airport.isBlocked = false;
        airport.bonus = 1;
        this.boughtAirports.push(airport);
        window.mapManager.updateAirportData()
        return true;
    }

    sellAirport(airport) {
        const index = this.boughtAirports.findIndex(a => a.properties.cartodb_id === airport.properties.cartodb_id);
        if (index === -1) return false;

        // Get 60% of the airport price back
        const sellPrice = airport.getPrice() * 0.6;
        this.money += sellPrice;

        // Sell all planes at 60% value
        airport.planes.forEach(plane => {
            this.money += plane.getPrice() * 0.6;
        });

        window.mapManager.updateAirportData()

        this.boughtAirports.splice(index, 1);
        return true;
    }

    buyPlane(airport, tier = 1) {
        const price = CONFIG.GAME.PLANE_BASE_PRICE * tier;
        if (this.money < price) return false;
        
        const airportObj = this.boughtAirports.find(a => a.properties.cartodb_id === airport.properties.cartodb_id);
        if (!airportObj) return false;
        
        if (airportObj.planes.length >= CONFIG.GAME.MAX_PLANES_PER_AIRPORT) return false;

        this.money -= price;
        const newPlane = new Plane(tier);
        airportObj.planes.push(newPlane);
        mapManager.updateAirportData();
        return newPlane;
    }
}