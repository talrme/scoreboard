// URL Manager
// Handles serialization and deserialization of game state to/from URL parameters

export function serializeToURL(gameState) {
    const params = new URLSearchParams();
    
    // Basic game info
    params.set('game', gameState.gameMode);
    
    // Players (names only, scores are ephemeral)
    if (gameState.players.length > 0) {
        params.set('players', gameState.players.map(p => p.name).join(','));
    }
    
    // Settings
    params.set('theme', gameState.settings.colorTheme);
    params.set('showRounds', gameState.settings.showRounds);
    params.set('numRounds', gameState.settings.numberOfRounds);
    params.set('showBids', gameState.settings.showBids);
    params.set('showTricks', gameState.settings.showTricks);
    params.set('showDeal', gameState.settings.showDeal);
    
    return params.toString();
}

export function deserializeFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.toString() === '') {
        return null; // No URL params
    }
    
    const state = {
        gameMode: params.get('game') || 'custom',
        players: [],
        settings: {
            colorTheme: params.get('theme') || 'purple',
            showRounds: params.get('showRounds') !== 'false',
            numberOfRounds: parseInt(params.get('numRounds')) || 10,
            showBids: params.get('showBids') !== 'false',
            showTricks: params.get('showTricks') !== 'false',
            showDeal: params.get('showDeal') !== 'false'
        },
        currentRound: 1,
        rounds: []
    };
    
    // Parse players
    const playersParam = params.get('players');
    if (playersParam) {
        const playerNames = playersParam.split(',');
        state.players = playerNames.map((name, index) => ({
            id: `player_${index}`,
            name: name.trim(),
            score: 0,
            position: 0,
            roundData: {}
        }));
    }
    
    return state;
}

export function updateURL(gameState, debounced = true) {
    const url = new URL(window.location);
    url.search = serializeToURL(gameState);
    
    if (debounced) {
        // Debounce to avoid excessive history updates
        clearTimeout(updateURL.timeout);
        updateURL.timeout = setTimeout(() => {
            window.history.replaceState({}, '', url);
        }, 300);
    } else {
        window.history.replaceState({}, '', url);
    }
}

