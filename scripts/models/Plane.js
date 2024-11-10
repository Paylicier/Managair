import { CONFIG } from '../config.js';
export class Plane {
    constructor(tier = 1) {
        this.uuid = Math.random().toString(36).substring(7);
        this.company = CONFIG.COMPANIES[Math.floor(Math.random() * CONFIG.COMPANIES.length)];
        this.name = CONFIG.PLANE_PREFIXES[Math.floor(Math.random() * CONFIG.PLANE_PREFIXES.length)] + CONFIG.PLANE_SUFFIXES[Math.floor(Math.random() * CONFIG.PLANE_SUFFIXES.length)];
        this.tier = tier;
    }

    getPrice() {
        return CONFIG.GAME.PLANE_BASE_PRICE * this.tier;
    }
}