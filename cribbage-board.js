// Cribbage Board Visualization
// SVG-based cribbage board with animated pegging

const PLAYER_COLORS = [
    '#667eea', // Purple
    '#e74c3c', // Red
    '#2ecc71', // Green
    '#f39c12', // Orange
    '#3498db', // Blue
    '#9b59b6', // Violet
    '#1abc9c', // Turquoise
    '#e67e22', // Dark Orange
    '#34495e', // Dark Gray
    '#95a5a6'  // Gray
];

export function renderCribbageBoard(players) {
    const container = document.getElementById('cribbage-board-container');
    if (!container) return;
    
    // Create SVG board
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 800 400');
    svg.setAttribute('id', 'cribbage-board-svg');
    svg.style.width = '100%';
    svg.style.maxWidth = '800px';
    svg.style.height = 'auto';
    
    // Board background
    const boardBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    boardBg.setAttribute('width', '800');
    boardBg.setAttribute('height', '400');
    boardBg.setAttribute('fill', '#d4a574');
    boardBg.setAttribute('rx', '10');
    svg.appendChild(boardBg);
    
    // Create holes in "S" pattern
    // Row 1: 0-30 (left to right, top)
    // Row 2: 31-60 (right to left, top-mid)
    // Row 3: 61-90 (left to right, bottom-mid)
    // Row 4: 91-120 (right to left, bottom)
    // Finish: 121 (center)
    
    const holes = [];
    const holeRadius = 4;
    const startX = 40;
    const spacing = 24;
    
    // Row 1 (0-30): top row, left to right
    for (let i = 0; i <= 30; i++) {
        const x = startX + i * spacing;
        const y = 60;
        holes.push({ x, y, position: i });
    }
    
    // Row 2 (31-60): second row, right to left
    for (let i = 31; i <= 60; i++) {
        const x = startX + (60 - i) * spacing;
        const y = 140;
        holes.push({ x, y, position: i });
    }
    
    // Row 3 (61-90): third row, left to right
    for (let i = 61; i <= 90; i++) {
        const x = startX + (i - 61) * spacing;
        const y = 220;
        holes.push({ x, y, position: i });
    }
    
    // Row 4 (91-120): fourth row, right to left
    for (let i = 91; i <= 120; i++) {
        const x = startX + (120 - i) * spacing;
        const y = 300;
        holes.push({ x, y, position: i });
    }
    
    // Finish hole (121): center
    holes.push({ x: 400, y: 350, position: 121 });
    
    // Draw holes
    holes.forEach(hole => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', hole.x);
        circle.setAttribute('cy', hole.y);
        circle.setAttribute('r', holeRadius);
        circle.setAttribute('fill', '#8b6f47');
        circle.setAttribute('data-position', hole.position);
        svg.appendChild(circle);
        
        // Add position label every 5 holes
        if (hole.position % 5 === 0 && hole.position <= 120) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', hole.x);
            text.setAttribute('y', hole.y - 12);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '10');
            text.setAttribute('fill', '#5a4a2f');
            text.textContent = hole.position;
            svg.appendChild(text);
        }
    });
    
    // Draw pegs for each player
    players.forEach((player, index) => {
        const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
        const position = Math.min(player.position || 0, 121);
        
        // Each player has 2 pegs (front and back)
        const hole = holes.find(h => h.position === position);
        if (hole) {
            // Front peg
            const frontPeg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            frontPeg.setAttribute('cx', hole.x - 3);
            frontPeg.setAttribute('cy', hole.y);
            frontPeg.setAttribute('r', '5');
            frontPeg.setAttribute('fill', color);
            frontPeg.setAttribute('stroke', '#fff');
            frontPeg.setAttribute('stroke-width', '1');
            frontPeg.setAttribute('data-player-id', player.id);
            frontPeg.setAttribute('data-peg-type', 'front');
            frontPeg.classList.add('cribbage-peg');
            svg.appendChild(frontPeg);
            
            // Back peg (slightly offset)
            const backPeg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            backPeg.setAttribute('cx', hole.x + 3);
            backPeg.setAttribute('cy', hole.y);
            backPeg.setAttribute('r', '5');
            backPeg.setAttribute('fill', color);
            backPeg.setAttribute('fill-opacity', '0.7');
            backPeg.setAttribute('stroke', '#fff');
            backPeg.setAttribute('stroke-width', '1');
            backPeg.setAttribute('data-player-id', player.id);
            backPeg.setAttribute('data-peg-type', 'back');
            backPeg.classList.add('cribbage-peg');
            svg.appendChild(backPeg);
        }
    });
    
    // Clear and add to container
    container.innerHTML = '';
    container.appendChild(svg);
    
    // Store holes data for updates
    container.dataset.holes = JSON.stringify(holes);
}

export function updateCribbagePegs(players) {
    const svg = document.getElementById('cribbage-board-svg');
    if (!svg) return;
    
    const container = document.getElementById('cribbage-board-container');
    const holes = JSON.parse(container.dataset.holes || '[]');
    
    players.forEach((player, index) => {
        const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
        const position = Math.min(player.position || 0, 121);
        
        const frontPeg = svg.querySelector(`[data-player-id="${player.id}"][data-peg-type="front"]`);
        const backPeg = svg.querySelector(`[data-player-id="${player.id}"][data-peg-type="back"]`);
        
        const hole = holes.find(h => h.position === position);
        if (hole && frontPeg && backPeg) {
            // Animate pegs to new position
            frontPeg.style.transition = 'all 0.5s ease';
            backPeg.style.transition = 'all 0.5s ease';
            
            frontPeg.setAttribute('cx', hole.x - 3);
            frontPeg.setAttribute('cy', hole.y);
            
            backPeg.setAttribute('cx', hole.x + 3);
            backPeg.setAttribute('cy', hole.y);
        }
    });
}

