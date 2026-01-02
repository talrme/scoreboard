// LocalStorage Manager
// Handles persistence of game state to browser localStorage

const STORAGE_KEY = 'scoreboard_state';

export function saveToStorage(gameState) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }
}

export function loadFromStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        console.error('Failed to load from localStorage:', e);
        return null;
    }
}

export function clearStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error('Failed to clear localStorage:', e);
    }
}

