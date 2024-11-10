import { CONFIG } from '../config.js';
export class Plane {
    constructor(tier = 1, uuid = Math.random().toString(36).substring(7), company = CONFIG.COMPANIES[Math.floor(Math.random() * CONFIG.COMPANIES.length)], name = CONFIG.PLANE_PREFIXES[Math.floor(Math.random() * CONFIG.PLANE_PREFIXES.length)] + CONFIG.PLANE_SUFFIXES[Math.floor(Math.random() * CONFIG.PLANE_SUFFIXES.length)]) {
        this.uuid = uuid;
        this.tier = tier;
        this.company = company;
        this.name = name;
    }

    getPrice() {
        return CONFIG.GAME.PLANE_BASE_PRICE * this.tier;
    }
}