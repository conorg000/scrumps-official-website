// 8-bit color palette
if (typeof COLORS === 'undefined') {
    const COLORS = {
        // Room colors
        FLOOR_LIGHT: '#6b8e5a',
        FLOOR_DARK: '#4a5d3a',
        WALL_LIGHT: '#8b7355',
        WALL_DARK: '#5d4c37',
        
        // Furniture colors
        WOOD_LIGHT: '#d2b48c',
        WOOD_DARK: '#8b7355',
        BED_RED: '#cd5c5c',
        BED_DARK: '#8b3a3a',
        TABLE_BROWN: '#a0522d',
        CHAIR_BROWN: '#8b4513',
        
        // Character colors
        BANANA_YELLOW: '#ffeb3b',
        BANANA_DARK: '#fbc02d',
        BANANA_SHADOW: '#f57f17',
        
        // UI colors
        BLACK: '#000000',
        WHITE: '#ffffff',
        SHADOW: '#00000080'
    };
    window.COLORS = COLORS;
}

// Utility functions
if (typeof drawPixelRect === 'undefined') {
    function drawPixelRect(ctx, x, y, width, height, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
    }
    window.drawPixelRect = drawPixelRect;
}

if (typeof drawDitheredRect === 'undefined') {
    function drawDitheredRect(ctx, x, y, width, height, lightColor, darkColor) {
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                const isDark = (i + j) % 2 === 0;
                ctx.fillStyle = isDark ? darkColor : lightColor;
                ctx.fillRect(Math.floor(x + i), Math.floor(y + j), 1, 1);
            }
        }
    }
    window.drawDitheredRect = drawDitheredRect;
}

if (typeof isometricToScreen === 'undefined') {
    function isometricToScreen(isoX, isoY) {
        const screenX = (isoX - isoY) * 24;
        const screenY = (isoX + isoY) * 12;
        return { x: screenX, y: screenY };
    }
    window.isometricToScreen = isometricToScreen;
}

if (typeof screenToIsometric === 'undefined') {
    function screenToIsometric(screenX, screenY) {
        const isoX = (screenX / 24 + screenY / 12) / 2;
        const isoY = (screenY / 12 - screenX / 24) / 2;
        return { x: Math.floor(isoX), y: Math.floor(isoY) };
    }
    window.screenToIsometric = screenToIsometric;
}

// Extended isometric conversion with custom tile dimensions and offset
if (typeof isoToScreen === 'undefined') {
    function isoToScreen(isoX, isoY, tileWidth, tileHeight, offsetX, offsetY) {
        const screenX = (isoX - isoY) * (tileWidth / 2) + offsetX;
        const screenY = (isoX + isoY) * (tileHeight / 2) + offsetY;
        return { x: screenX, y: screenY };
    }
    window.isoToScreen = isoToScreen;
}