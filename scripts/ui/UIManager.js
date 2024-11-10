import { WikipediaService } from '../services/WikipediaService.js';
import { CONFIG } from '../config.js';
export class UIManager {
    constructor(gameService) {
        this.gameService = gameService;
        this.setupEventListeners();
        this.selectedAirport = null;
        this.planeUpdateInterval = null;
    }

    updateMoneyDisplay() {
        document.getElementById('player-money').textContent = 
            `$${Math.round(this.gameService.money).toLocaleString()}`;
    }

    updateTimeDisplay() {
        const minutes = Math.floor(this.gameService.time / 60);
        const seconds = this.gameService.time % 60;
        document.getElementById('ig-time').innerHTML = 
            `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    }

    update() {
        this.updateMoneyDisplay();
        this.updateTimeDisplay();
    }

    async updateAirportInfo(airport) {
        if (!airport) return;
        document.getElementById('player-airports').textContent = "🏣 "+this.gameService.boughtAirports.length;
        this.selectedAirport = airport;
        const isOwned = this.gameService.boughtAirports.some(a => 
            a.properties.cartodb_id === airport.properties.cartodb_id
        );

        const imageUrl = await WikipediaService.fetchImage(airport?.wikipedia?.split('/').pop() || airport.name);

        // Update airport information
        const airportName = document.getElementById('airport-name');
        const airportType = document.getElementById('airport-type');
        const airportTypeText = document.getElementById('airport-type-text');
        const buyButton = document.getElementById('airport-buy');
        const sellButton = document.getElementById('airport-sell');
        const planeMonitor = document.getElementById('plane-monitor');

        airportName.textContent = `${airport.properties.name}${airport.properties.iata_code ? ` (${airport.properties.iata_code})` : ''}`;
        airportTypeText.textContent = airport.properties.type.toUpperCase();

        document.getElementById('airport-image').src = imageUrl || './assets/airport_placeholder.png';
        document.getElementById('airport-image').alt = airport.properties.name || 'Airport';
        
        // Update type styling
        airportType.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-red-500', 'hidden');
        airportType.classList.add(
            airport.properties.type.includes('small') ? 'bg-green-500' : 
            airport.properties.type.includes('mid') ? 'bg-yellow-500' : 
            'bg-red-500'
        );

        // Show/hide appropriate buttons
        buyButton.classList.toggle('hidden', isOwned);
        sellButton.classList.toggle('hidden', !isOwned);
        planeMonitor.classList.toggle('hidden', !isOwned);

        if (!isOwned) {
            const price = airport.getPrice();
            buyButton.textContent = `$${price.toLocaleString()}`;
            buyButton.classList.toggle('enabled', this.gameService.money >= price);
            buyButton.classList.toggle('disabled', this.gameService.money < price);
            buyButton.classList.toggle('bg-green-500', this.gameService.money >= price);
            buyButton.classList.toggle('bg-gray-500', this.gameService.money < price);
        }

        this.updatePlaneList();
        this.startPlaneListUpdate();
        document.getElementById('info').classList.remove('hidden');
        document.body.classList.remove('full-map');
    }

    updatePlaneList() {
        //update the plane number
        document.getElementById('player-planes').textContent = "✈️ "+this.gameService.boughtAirports.reduce((acc, a) => acc + a.planes.length, 0);
        const planeList = document.getElementById('plane-list');
        planeList.innerHTML = '';

        const airport = this.gameService.boughtAirports.find(a => 
            a.properties.cartodb_id === this.selectedAirport.properties.cartodb_id
        );

        if (!airport) return;

        airport.planes.forEach(plane => {
            const button = document.createElement('button');
            const color = plane.tier === 1 ? 'bg-green-200' : 
                         plane.tier === 2 ? 'bg-yellow-200' : 
                         'bg-red-200';
            
            button.classList.add(color, 'text-black', 'px-5', 'py-5', 'rounded-md', 'm-1');
            button.textContent = '✈️';
            button.onclick = () => this.onPlaneClick(plane);
            planeList.appendChild(button);
        });
    }
    startPlaneListUpdate() {
        if (this.planeUpdateInterval) {
            clearInterval(this.planeUpdateInterval);
        }
        this.planeUpdateInterval = setInterval(() => this.updatePlaneList(), 2000);
    }

    setupEventListeners() {

        // Implement any UI event listeners needed
        document.getElementById('close-info')?.addEventListener('click', () => {
            document.getElementById('info').classList.add('hidden');
            document.body.classList.add('full-map');
        });

        document.body.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal('infoModal');
                this.closeModal('sureModal');
                this.closeModal('planeModal');
                this.closeModal('settingsModal');
            }
        });

        // Buy airport
        document.getElementById('airport-buy').addEventListener('click', () => {
            if (this.selectedAirport) {
                const success = this.gameService.buyAirport(this.selectedAirport);
                if (success) {
                    this.updateAirportInfo(this.selectedAirport);
                }
            }
        });

        // Sell airport
        document.getElementById('airport-sell').addEventListener('click', () => {
            if (this.selectedAirport) {
                this.openSureModal(
                    'Are you sure you want to sell this airport?',
                    () => {
                        const success = this.gameService.sellAirport(this.selectedAirport);
                        if (success) {
                            this.updateAirportInfo(this.selectedAirport);
                        }
                    }
                );
            }
        });

        // Buy plane
        document.getElementById('plane-buy').addEventListener('click', () => {
            if (this.selectedAirport) {
                const airport = this.gameService.boughtAirports.find(a => 
                    a.properties.cartodb_id === this.selectedAirport.properties.cartodb_id
                );

                if (airport && airport.planes.length >= CONFIG.GAME.MAX_PLANES_PER_AIRPORT) {
                    this.openInfoModal(
                        `You can't buy more planes for ${airport.properties.name}. You already have ${CONFIG.GAME.MAX_PLANES_PER_AIRPORT} planes.`,
                        './assets/airport_placeholder.png'
                    );
                    return;
                }

                const newPlane = this.gameService.buyPlane(this.selectedAirport);
                if (newPlane) {
                    this.updatePlaneList();
                }
            }
        });

        // Close info panel
        document.getElementById('close-info')?.addEventListener('click', () => {
            document.getElementById('info').classList.add('hidden');
            document.body.classList.add('full-map');
            if (this.planeUpdateInterval) {
                clearInterval(this.planeUpdateInterval);
                this.planeUpdateInterval = null;
            }
            this.selectedAirport = null;
        });
    }

    openSureModal(message, onConfirm) {
        const modal = document.getElementById('sureModal');
        const messageEl = document.getElementById('sureModalMessage');
        const confirmBtn = document.getElementById('sureModalButton');

        messageEl.textContent = message;
        
        // Replace old button with new one to remove old event listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', () => {
            onConfirm();
            this.closeModal('sureModal');
        });

        modal.style.display = 'block';
        document.body.classList.add('overflow-y-hidden');
        newConfirmBtn.focus();
    }

    openInfoModal(message, image, airportName = '') {
        const modal = document.getElementById('infoModal');
        const messageEl = document.getElementById('infoModalMessage');
        const imageEl = document.getElementById('infoModalImage');
        
        messageEl.innerHTML = message.replace('{AIRPORT}', airportName || 'your airport');
        imageEl.src = image || './assets/airport_placeholder.png';
        
        modal.style.display = 'block';
        document.body.classList.add('overflow-y-hidden');
        document.getElementById('infoModalButton').focus();
    }

    openSettingsModal() {
        const modal = document.getElementById('settingsModal');

        modal.style.display = 'block';
        document.body.classList.add('overflow-y-hidden');
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        document.body.classList.remove('overflow-y-hidden');
    }

// Add these methods to your UIManager class

onPlaneClick(plane) {
    const modal = document.getElementById('planeModal');
    const upgradeBtn = document.getElementById('planeUpgrade');
    const sellBtn = document.getElementById('planeSell');
    
    // Update plane info
    document.getElementById('planeName').textContent = `${plane.company} ${plane.name}`;
    document.getElementById('planeTier').textContent = plane.tier;
    document.getElementById('planePrice').textContent = (CONFIG.GAME.PLANE_BASE_PRICE * plane.tier).toLocaleString();
    document.getElementById('planeMaintenance').textContent = (10 * plane.tier).toLocaleString();
    
    // Calculate upgrade and sell prices
    const upgradePrice = CONFIG.GAME.PLANE_BASE_PRICE * (plane.tier + 1);
    const sellPrice = Math.floor(CONFIG.GAME.PLANE_BASE_PRICE * plane.tier * 0.6);

    upgradeBtn.innerHTML = 'Upgrade ($<span id="upgradePrice">0</span>)';
    
    document.getElementById('upgradePrice').textContent = upgradePrice.toLocaleString();
    document.getElementById('sellPrice').textContent = sellPrice.toLocaleString();
    
    // Handle upgrade button
    upgradeBtn.classList.remove('bg-gray-500', 'bg-blue-600');
    upgradeBtn.classList.add(this.gameService.money >= upgradePrice ? 'bg-blue-600' : 'bg-gray-500');
    upgradeBtn.disabled = this.gameService.money < upgradePrice || plane.tier >= 3;
    
    if (plane.tier >= 3) {
        upgradeBtn.innerHTML = 'Max Tier <span id="upgradePrice"></span>';
    }
    
    // Clear old event listeners
    const newUpgradeBtn = upgradeBtn.cloneNode(true);
    const newSellBtn = sellBtn.cloneNode(true);
    upgradeBtn.parentNode.replaceChild(newUpgradeBtn, upgradeBtn);
    sellBtn.parentNode.replaceChild(newSellBtn, sellBtn);
    
    // Add new event listeners
    newUpgradeBtn.addEventListener('click', () => {
        if (this.gameService.money >= upgradePrice && plane.tier < 3) {
            this.gameService.money -= upgradePrice;
            plane.tier++;
            this.updateMoneyDisplay();
            this.onPlaneClick(plane); // Refresh modal
            this.updatePlaneList(); // Update plane list display
        }
    });
    
    newSellBtn.addEventListener('click', () => {
        this.closeModal('planeModal');
        this.openSureModal('Are you sure you want to sell this plane?', () => {
            const airport = this.gameService.boughtAirports.find(a => 
                a.properties.cartodb_id === this.selectedAirport.properties.cartodb_id
            );
            
            if (airport) {
                const planeIndex = airport.planes.indexOf(plane);
                if (planeIndex > -1) {
                    airport.planes.splice(planeIndex, 1);
                    this.gameService.money += sellPrice;
                    this.updateMoneyDisplay();
                    this.updatePlaneList();
                    window.mapManager.updateAirportData();
                }
            }
        });
    });
    
    // Show modal
    modal.style.display = 'block';
    document.body.classList.add('overflow-y-hidden');
}

}