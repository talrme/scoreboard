let scores = {
    A: 0,
    B: 0
};

function updateScore(team, delta) {
    scores[team] += delta;
    
    // Prevent negative scores
    if (scores[team] < 0) {
        scores[team] = 0;
    }
    
    updateDisplay(team);
}

function updateDisplay(team) {
    const scoreElement = document.getElementById(`score${team}`);
    scoreElement.textContent = scores[team];
    
    // Add a little animation
    scoreElement.style.transform = 'scale(1.2)';
    setTimeout(() => {
        scoreElement.style.transform = 'scale(1)';
    }, 200);
}

function resetScores() {
    scores.A = 0;
    scores.B = 0;
    updateDisplay('A');
    updateDisplay('B');
}

// Add transition style to score elements
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.score').forEach(el => {
        el.style.transition = 'transform 0.2s ease';
    });
});

