// Main application logic
import { GAME_PRESETS, getGamePreset } from './games.js';
import { saveToStorage, loadFromStorage, clearStorage } from './storage-manager.js';
import { deserializeFromURL, updateURL } from './url-manager.js';
import { renderCribbageBoard, updateCribbagePegs } from './cribbage-board.js';

// DATABASE INTEGRATION NOTES:
// 1. Replace GameState class methods with API calls
// 2. Add WebSocket connection in init()
// 3. On state change, emit to socket instead of just updating local
// 4. Listen for socket events and update UI
// 5. Implement conflict resolution (last-write-wins or operational transform)
// 6. Consider libraries: Socket.io (WebSockets), Firebase (realtime DB),
//    or Supabase (PostgreSQL + realtime)
// 7. Add room/game ID system (UUID in URL)
// 8. Lock mechanism for simultaneous edits

let playerIdCounter = 0;

// GameState class - manages all application state
class GameState {
    constructor() {
        this.players = [];
        this.gameMode = 'custom';
        this.settings = {
            colorTheme: 'purple',
            showRounds: true,
            numberOfRounds: 10,
            showBids: true,
            showTricks: true,
            showDeal: true
        };
        this.currentRound = 1;
        this.rounds = [];
        this.observers = [];
    }
    
    // Observer pattern for UI updates
    subscribe(callback) {
        this.observers.push(callback);
    }
    
    notify() {
        this.observers.forEach(callback => callback(this));
        this.persistState();
    }
    
    // Player management
    addPlayer(name = null) {
        const playerName = name || `Player ${this.players.length + 1}`;
        const player = {
            id: `player_${playerIdCounter++}`,
            name: playerName,
            score: 0,
            position: 0, // For cribbage
            roundData: {} // For games like Pooch
        };
        this.players.push(player);
        this.notify();
        return player;
    }
    
    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
        this.notify();
    }
    
    updatePlayer(playerId, updates) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            Object.assign(player, updates);
            this.notify();
        }
    }
    
    updatePlayerScore(playerId, delta) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.score += delta;
            if (player.score < 0) player.score = 0;
            
            // For cribbage, update position
            if (this.gameMode === 'cribbage') {
                player.position = player.score;
            }
            
            this.notify();
        }
    }
    
    setPlayerScore(playerId, score) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.score = Math.max(0, score);
            if (this.gameMode === 'cribbage') {
                player.position = player.score;
            }
            this.notify();
        }
    }
    
    // Game mode management
    setGameMode(mode) {
        this.gameMode = mode;
        this.currentRound = 1;
        this.rounds = [];
        
        // Reset player round data
        this.players.forEach(player => {
            player.roundData = {};
        });
        
        this.notify();
    }
    
    // Settings management
    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
        this.notify();
    }
    
    // Round management (for games like Pooch)
    updateRoundData(playerId, round, data) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            if (!player.roundData[round]) {
                player.roundData[round] = {};
            }
            Object.assign(player.roundData[round], data);
            this.notify();
        }
    }
    
    // Reset game
    resetGame() {
        this.players.forEach(player => {
            player.score = 0;
            player.position = 0;
            player.roundData = {};
        });
        this.currentRound = 1;
        this.rounds = [];
        this.notify();
    }
    
    // Persistence
    persistState() {
        // Save to localStorage (debounced)
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            saveToStorage(this.toJSON());
        }, 500);
        
        // Update URL
        updateURL(this.toJSON(), true);
    }
    
    // Serialization
    toJSON() {
        return {
            players: this.players,
            gameMode: this.gameMode,
            settings: this.settings,
            currentRound: this.currentRound,
            rounds: this.rounds
        };
    }
    
    fromJSON(data) {
        if (data.players) this.players = data.players;
        if (data.gameMode) this.gameMode = data.gameMode;
        if (data.settings) this.settings = { ...this.settings, ...data.settings };
        if (data.currentRound) this.currentRound = data.currentRound;
        if (data.rounds) this.rounds = data.rounds;
        
        // Update counter to avoid ID collisions
        this.players.forEach(player => {
            const idNum = parseInt(player.id.split('_')[1]);
            if (idNum >= playerIdCounter) {
                playerIdCounter = idNum + 1;
            }
        });
    }
}

// Global state instance
const gameState = new GameState();

// Initialize application
function init() {
    // Load state from URL first, then localStorage, then defaults
    const urlState = deserializeFromURL();
    const savedState = loadFromStorage();
    
    if (urlState) {
        gameState.fromJSON(urlState);
    } else if (savedState) {
        gameState.fromJSON(savedState);
    } else {
        // Default: add 2 players
        gameState.addPlayer('Player 1');
        gameState.addPlayer('Player 2');
    }
    
    // Subscribe to state changes
    gameState.subscribe(renderUI);
    
    // Initial render
    renderUI(gameState);
    
    // Apply theme
    applyTheme(gameState.settings.colorTheme);
    
    // Setup event listeners
    setupEventListeners();
}

// Render the entire UI
function renderUI(state) {
    renderGameModeSelector(state);
    renderPlayers(state);
    updateAddPlayerButton(state);
    
    // Special rendering for cribbage
    if (state.gameMode === 'cribbage') {
        renderCribbageBoard(state.players);
    }
}

// Render game mode selector
function renderGameModeSelector(state) {
    const selector = document.getElementById('game-mode-selector');
    selector.innerHTML = '';
    
    Object.keys(GAME_PRESETS).forEach(mode => {
        const preset = GAME_PRESETS[mode];
        const button = document.createElement('button');
        button.className = 'game-mode-btn';
        if (mode === state.gameMode) {
            button.classList.add('active');
        }
        button.textContent = preset.name;
        button.title = preset.description || '';
        button.onclick = () => {
            if (confirm('Switching game modes will reset all scores. Continue?')) {
                gameState.setGameMode(mode);
            }
        };
        selector.appendChild(button);
    });
}

// Render players based on game mode
function renderPlayers(state) {
    const container = document.getElementById('players-container');
    const preset = getGamePreset(state.gameMode);
    
    if (state.gameMode === 'pooch') {
        renderPoochTable(state, container, preset);
    } else if (state.gameMode === 'cribbage') {
        renderCribbagePlayers(state, container, preset);
    } else {
        renderCustomPlayers(state, container);
    }
}

// Render custom mode players
function renderCustomPlayers(state, container) {
    container.className = 'players-grid';
    container.innerHTML = '';
    
    state.players.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.innerHTML = `
            <div class="player-header">
                <input 
                    type="text" 
                    class="player-name-input" 
                    value="${player.name}"
                    data-player-id="${player.id}"
                />
                <button class="delete-player-btn" data-player-id="${player.id}" title="Remove player">×</button>
            </div>
            <div class="score" data-player-id="${player.id}">${player.score}</div>
            <div class="player-controls">
                <button class="score-btn minus" data-player-id="${player.id}" data-delta="-1">-1</button>
                <button class="score-btn plus" data-player-id="${player.id}" data-delta="1">+1</button>
                <button class="score-btn plus-five" data-player-id="${player.id}" data-delta="5">+5</button>
            </div>
        `;
        container.appendChild(playerCard);
    });
}

// Render Pooch game table
function renderPoochTable(state, container, preset) {
    container.className = 'pooch-table-container';
    container.innerHTML = '';
    
    const table = document.createElement('table');
    table.className = 'pooch-table';
    
    // Header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Player</th>';
    
    for (let round = 1; round <= state.settings.numberOfRounds; round++) {
        const cards = preset.roundCards[round - 1];
        headerRow.innerHTML += `<th class="round-header">R${round}<br><span class="cards-count">${cards} cards</span></th>`;
    }
    headerRow.innerHTML += '<th class="total-header">Total</th>';
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Player rows
    const tbody = document.createElement('tbody');
    state.players.forEach(player => {
        const row = document.createElement('tr');
        
        // Player name cell
        const nameCell = document.createElement('td');
        nameCell.className = 'player-name-cell';
        nameCell.innerHTML = `
            <input 
                type="text" 
                class="player-name-input-inline" 
                value="${player.name}"
                data-player-id="${player.id}"
            />
            <button class="delete-player-btn-inline" data-player-id="${player.id}" title="Remove">×</button>
        `;
        row.appendChild(nameCell);
        
        // Round cells
        for (let round = 1; round <= state.settings.numberOfRounds; round++) {
            const roundCell = document.createElement('td');
            roundCell.className = 'round-cell';
            
            const roundData = player.roundData[round] || {};
            const bid = roundData.bid !== undefined ? roundData.bid : '';
            const tricks = roundData.tricks !== undefined ? roundData.tricks : '';
            const score = roundData.score !== undefined ? roundData.score : '';
            
            roundCell.innerHTML = `
                <div class="round-inputs">
                    <input 
                        type="number" 
                        class="bid-input" 
                        placeholder="B"
                        value="${bid}"
                        min="0"
                        max="${preset.roundCards[round - 1]}"
                        data-player-id="${player.id}"
                        data-round="${round}"
                        title="Bid"
                    />
                    <input 
                        type="number" 
                        class="tricks-input" 
                        placeholder="T"
                        value="${tricks}"
                        min="0"
                        max="${preset.roundCards[round - 1]}"
                        data-player-id="${player.id}"
                        data-round="${round}"
                        title="Tricks"
                    />
                    <div class="round-score ${score > 0 ? 'positive' : score < 0 ? 'negative' : ''}">${score || '-'}</div>
                </div>
            `;
            row.appendChild(roundCell);
        }
        
        // Total cell
        const totalCell = document.createElement('td');
        totalCell.className = 'total-cell';
        totalCell.textContent = player.score;
        row.appendChild(totalCell);
        
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    container.appendChild(table);
}

// Render Cribbage players
function renderCribbagePlayers(state, container) {
    container.className = 'cribbage-container';
    container.innerHTML = '';
    
    // Create board container
    const boardContainer = document.createElement('div');
    boardContainer.id = 'cribbage-board-container';
    container.appendChild(boardContainer);
    
    // Render the board
    renderCribbageBoard(state.players);
    
    // Create score controls
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'cribbage-controls';
    
    state.players.forEach(player => {
        const playerControl = document.createElement('div');
        playerControl.className = 'cribbage-player-control';
        playerControl.innerHTML = `
            <div class="player-header">
                <input 
                    type="text" 
                    class="player-name-input" 
                    value="${player.name}"
                    data-player-id="${player.id}"
                />
                <button class="delete-player-btn" data-player-id="${player.id}" title="Remove player">×</button>
            </div>
            <div class="cribbage-score-display">
                <span class="score-label">Score:</span>
                <span class="score-value">${player.score}</span>
            </div>
            <div class="player-controls">
                <button class="score-btn minus" data-player-id="${player.id}" data-delta="-1">-1</button>
                <button class="score-btn plus" data-player-id="${player.id}" data-delta="1">+1</button>
                <button class="score-btn plus" data-player-id="${player.id}" data-delta="2">+2</button>
                <button class="score-btn plus" data-player-id="${player.id}" data-delta="5">+5</button>
            </div>
        `;
        controlsContainer.appendChild(playerControl);
    });
    
    container.appendChild(controlsContainer);
}

// Update add player button state
function updateAddPlayerButton(state) {
    const btn = document.getElementById('add-player-btn');
    if (state.players.length >= 10) {
        btn.disabled = true;
        btn.title = 'Maximum 10 players';
    } else {
        btn.disabled = false;
        btn.title = 'Add player';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add player button
    document.getElementById('add-player-btn').addEventListener('click', () => {
        gameState.addPlayer();
    });
    
    // Reset button
    document.getElementById('reset-btn').addEventListener('click', () => {
        if (confirm('Reset all scores? This cannot be undone.')) {
            gameState.resetGame();
        }
    });
    
    // Settings button
    document.getElementById('settings-btn').addEventListener('click', openSettings);
    
    // Event delegation for dynamic elements
    document.getElementById('players-container').addEventListener('click', handlePlayerContainerClick);
    document.getElementById('players-container').addEventListener('input', handlePlayerContainerInput);
    document.getElementById('players-container').addEventListener('change', handlePlayerContainerChange);
}

// Handle clicks in players container
function handlePlayerContainerClick(e) {
    // Score buttons
    if (e.target.classList.contains('score-btn')) {
        const playerId = e.target.dataset.playerId;
        const delta = parseInt(e.target.dataset.delta);
        gameState.updatePlayerScore(playerId, delta);
        
        // Animation
        const scoreEl = document.querySelector(`.score[data-player-id="${playerId}"], .score-value`);
        if (scoreEl) {
            scoreEl.style.transform = 'scale(1.2)';
            setTimeout(() => {
                scoreEl.style.transform = 'scale(1)';
            }, 200);
        }
        
        // Update cribbage pegs if in cribbage mode
        if (gameState.gameMode === 'cribbage') {
            updateCribbagePegs(gameState.players);
        }
    }
    
    // Delete player buttons
    if (e.target.classList.contains('delete-player-btn') || e.target.classList.contains('delete-player-btn-inline')) {
        const playerId = e.target.dataset.playerId;
        if (gameState.players.length > 2) {
            if (confirm('Remove this player?')) {
                gameState.removePlayer(playerId);
            }
        } else {
            alert('You must have at least 2 players');
        }
    }
}

// Handle input in players container
function handlePlayerContainerInput(e) {
    // Player name inputs
    if (e.target.classList.contains('player-name-input') || e.target.classList.contains('player-name-input-inline')) {
        const playerId = e.target.dataset.playerId;
        const newName = e.target.value;
        gameState.updatePlayer(playerId, { name: newName });
    }
}

// Handle change events (for number inputs)
function handlePlayerContainerChange(e) {
    // Pooch bid/tricks inputs
    if (e.target.classList.contains('bid-input') || e.target.classList.contains('tricks-input')) {
        const playerId = e.target.dataset.playerId;
        const round = parseInt(e.target.dataset.round);
        const isBid = e.target.classList.contains('bid-input');
        const value = parseInt(e.target.value) || 0;
        
        // Get current round data
        const player = gameState.players.find(p => p.id === playerId);
        const roundData = player.roundData[round] || {};
        
        if (isBid) {
            roundData.bid = value;
        } else {
            roundData.tricks = value;
        }
        
        // Calculate score if both bid and tricks are entered
        if (roundData.bid !== undefined && roundData.tricks !== undefined) {
            const preset = getGamePreset(gameState.gameMode);
            roundData.score = preset.logic.calculateScore(roundData.bid, roundData.tricks);
            
            // Update player's total score
            const totalScore = Object.values(player.roundData)
                .reduce((sum, rd) => sum + (rd.score || 0), 0);
            player.score = totalScore;
        }
        
        gameState.updateRoundData(playerId, round, roundData);
    }
}

// Settings modal functions
function openSettings() {
    document.getElementById('settings-modal').classList.add('active');
    
    // Populate current settings
    document.getElementById('theme-select').value = gameState.settings.colorTheme;
    document.getElementById('show-rounds').checked = gameState.settings.showRounds;
    document.getElementById('num-rounds').value = gameState.settings.numberOfRounds;
    document.getElementById('show-bids').checked = gameState.settings.showBids;
    document.getElementById('show-tricks').checked = gameState.settings.showTricks;
    document.getElementById('show-deal').checked = gameState.settings.showDeal;
}

function closeSettings() {
    document.getElementById('settings-modal').classList.remove('active');
}

function saveSettings() {
    const newSettings = {
        colorTheme: document.getElementById('theme-select').value,
        showRounds: document.getElementById('show-rounds').checked,
        numberOfRounds: parseInt(document.getElementById('num-rounds').value),
        showBids: document.getElementById('show-bids').checked,
        showTricks: document.getElementById('show-tricks').checked,
        showDeal: document.getElementById('show-deal').checked
    };
    
    gameState.updateSettings(newSettings);
    applyTheme(newSettings.colorTheme);
    closeSettings();
}

function clearHistory() {
    if (confirm('Clear all saved data? This will not reset the current game.')) {
        clearStorage();
        alert('History cleared!');
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

// Settings modal event listeners
document.getElementById('close-settings').addEventListener('click', closeSettings);
document.getElementById('save-settings').addEventListener('click', saveSettings);
document.getElementById('clear-history-btn').addEventListener('click', clearHistory);
document.getElementById('settings-modal').addEventListener('click', (e) => {
    if (e.target.id === 'settings-modal') {
        closeSettings();
    }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
