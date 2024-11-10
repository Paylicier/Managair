export class Airport {
    constructor(properties, coordinates) {
        this.properties = properties;
        this.coordinates = coordinates;
        this.planes = [];
        this.isBlocked = false;
        this.bonus = 1;
    }

    getPrice() {
        const basePrice = this.properties.type.includes('small') ? 1_000_000 :
                         this.properties.type.includes('mid') ? 5_000_000 : 
                         10_000_000;
        return basePrice + Math.floor(1 + this.properties.cartodb_id / 100 * basePrice) - 1;
    }

    getLevel() {
        return this.properties.type.includes('small') ? 1 :
               this.properties.type.includes('mid') ? 2 : 3;
    }

    getTakeoffProbability() {
        const level = this.getLevel();
        return level === 1 ? 0.1 : level === 2 ? 0.5 : 0.8;
    }
}