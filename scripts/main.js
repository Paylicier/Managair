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

    console.log('___  ___                          _         _      \r\n|  \\\/  |                         ( )       (_)     \r\n| .  . | __ _ _ __   __ _  __ _  |\/    __ _ _ _ __ \r\n| |\\\/| |\/ _` | \'_ \\ \/ _` |\/ _` |      \/ _` | | \'__|\r\n| |  | | (_| | | | | (_| | (_| |     | (_| | | |   \r\n\\_|  |_\/\\__,_|_| |_|\\__,_|\\__, |      \\__,_|_|_|   \r\n                           __\/ |                   \r\n                          |___\/                    \n\nA simple airport management game by paylicier\n\n');

    setInterval(() => {
        if (gameService.isPlaying) {
            gameService.tick();
            uiManager.update();
        }
    }, CONFIG.GAME.TICK_INTERVAL);
});