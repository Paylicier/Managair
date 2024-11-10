import { CONFIG } from './config.js';
import { GameService } from './services/GameService.js';
import { MapManager } from './ui/MapManager.js';
import { UIManager } from './ui/UIManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const gameService = new GameService();
    const mapManager = new MapManager(maplibregl, 'map', gameService);
    const uiManager = new UIManager(gameService);

    window.gameService = gameService;
    window.mapManager = mapManager;
    window.uiManager = uiManager;

    setInterval(() => {
        if (gameService.isPlaying) {
            gameService.tick();
            uiManager.update();
        }
    }, CONFIG.GAME.TICK_INTERVAL);
});