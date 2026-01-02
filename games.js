// Game Presets
// Defines different game modes with their specific rules and layouts

export const GAME_PRESETS = {
    custom: {
        name: 'Custom',
        columns: ['Score'],
        logic: null,
        description: 'Simple scoreboard with customizable players'
    },
    
    pooch: {
        name: 'Pooch (Oh, Shit)',
        columns: ['Round', 'Bid', 'Tricks', 'Score', 'Total'],
        description: 'Trick-taking game where you must match your bid',
        maxRounds: 10,
        roundCards: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1], // Cards dealt per round
        
        logic: {
            calculateScore: (bid, tricks) => {
                // If you make your bid exactly, you get bid + 10
                // Otherwise, you lose 2 points per trick difference
                if (bid === tricks) {
                    return bid + 10;
                }
                return -Math.abs(bid - tricks) * 2;
            },
            
            validateBid: (round, totalBids, playerCount) => {
                const roundCards = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
                const maxCards = roundCards[round - 1] || 10;
                return { min: 0, max: maxCards };
            },
            
            validateTricks: (round) => {
                const roundCards = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
                const maxCards = roundCards[round - 1] || 10;
                return { min: 0, max: maxCards };
            }
        }
    },
    
    cribbage: {
        name: 'Cribbage',
        columns: ['Front', 'Back', 'Total'],
        description: 'Traditional cribbage with board visualization',
        winScore: 121,
        visualize: 'board',
        
        logic: {
            renderBoard: true,
            
            calculatePosition: (score) => {
                // Returns which hole on the board (0-121)
                return Math.min(score, 121);
            },
            
            checkWin: (score) => {
                return score >= 121;
            }
        }
    }
};

export function getGamePreset(gameMode) {
    return GAME_PRESETS[gameMode] || GAME_PRESETS.custom;
}

