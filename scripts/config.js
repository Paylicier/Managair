export const CONFIG = {
    GAME: {
        INITIAL_MONEY: 40_000_000,
        MAX_PLANES_PER_AIRPORT: 15,
        PLANE_BASE_PRICE: 10_000,
        TICK_INTERVAL: 1000,
        DAY_LENGTH: 1440
    },
    MAP: {
        STYLE_URL: '', // Add your own style URL here
        INITIAL_CENTER: [0, 0],
        INITIAL_ZOOM: 3,
        AIRPORTS_URL: './assets/airports.geojson',
        PULSING_DOT_SIZE: 200
    },
    COMPANIES: ["SkyHansa" , "Air Listembourg", "NordFlyer", "SwissWings", "AeroItalia", "Britavia", "SkyItalia", "EuroJet", "PolarAir", "FlyDutch"],
    PLANE_PREFIXES: ["Sky", "Aero", "Jet", "Air", "Cloud", "Storm", "Star", "Wind", "Sun", "Skyline", "Astra", "Globe", "Nova", "Turbo", "Galaxy", "Vista", "Comet", "Strato", "Solar", "Thunder"],
    PLANE_SUFFIXES: ["Lander", "Wing", "Jet", "Flyer", "Glider", "Cruiser", "Runner", "Bird", "Voyager", "Stream", "Surfer", "Star", "Rider", "Seeker", "Blaze", "Ranger", "Storm", "Whisper", "Shuttle", "Glide"],
    EVENTS: [
        {
            "name": "Strike",
            "description": "Pilots are on strike. No planes will take off for the next 24 hours from <b>{AIRPORT}</b>.",
            "duration": 1440,
            "image": "./assets/events/strike.png",
            "effect": (airport) => {
                airport.isBlocked = true;
                setTimeout(() => {
                    airport.isBlocked = false;
                }, 1440);
            }
        },
        {
            "name": "Weather",
            "description": "Bad weather conditions. No planes will take off for the next 12 hours from <b>{AIRPORT}</b>.",
            "duration": 720,
            "image": "./assets/events/weather.png",
            "effect": (airport) => {
                airport.isBlocked = true;
                setTimeout(() => {
                    airport.isBlocked = false;
                }, 720);
            }
        },
        {
            "name": "Security Alert",
            "description": "Security alert. No planes will take off for the next 6 hours from <b>{AIRPORT}</b>.",
            "duration": 360,
            "image": "./assets/events/technical.png",
            "effect": (airport) => {
                airport.isBlocked = true;
                setTimeout(() => {
                    airport.isBlocked = false;
                }, 360000);
            }
        },
        {
            "name": "Technical Issue",
            "description": "Technical issue. No planes will take off for the next 3 hours from <b>{AIRPORT}</b>.",
            "duration": 180,
            "image": "./assets/events/technical.png",
            "effect": (airport) => {
                airport.isBlocked = true;
                setTimeout(() => {
                    airport.isBlocked = false;
                }, 180000);
            }
        },
        {
            "name": "State subsidy",
            "description": "The state is giving a subsidy to all airports. You will receive $500 per airport.",
            "duration": 0,
            "image": "./assets/events/subsidy.png",
            "effect": () => {
                window.gameService.money += 500 * boughtAirports.length;
            }
        },
        {
            "name": "Tourism Boom",
            "description": "A recent travel trend has increased passenger numbers by 15% for the next day!",
            "duration": 1440,
            "image": "./assets/events/tourism.png",
            "effect": () => {
                setTimeout(() => {
                    window.gameService.boughtAirports.forEach(airport => {
                        airport.bonus = 1.15;
                    });
                }, 1440);
            }
        },
        {
            name: "Airline Partnership",
            description: "An airline has partnered with <b>{AIRPORT}</b>, increasing the number of flights by 20% for the next day!",
            duration: 1440,
            image: "./assets/events/partnership.png",
            effect: (airport) => {
                setTimeout(() => {
                    airport.bonus = 1.20;
                }, 1440);
            }
        }
    
    ]
};

export const airports = async () => {
    return fetch(CONFIG.MAP.AIRPORTS_URL)
        .then(response => response.json())
        .then(data => data);
};