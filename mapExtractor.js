import fs from 'fs';
import { resolve } from 'node:path';
import { defaultMaps } from './defaultmappool.js';

export function getActiveMapsFromFile(absoluteFilePath, seasonNumber) {
    const normalizedPath = resolve(absoluteFilePath);

    if (!fs.existsSync(normalizedPath)) {
        throw new Error(`File not found at absolute path: ${normalizedPath}`);
    }

    const fileContent = fs.readFileSync(normalizedPath, 'utf8');
    const seasonRegex = new RegExp(`\\[${seasonNumber}\\]\\s*=\\s*\\{([\\s\\S]*?)\\}(?:,|\\s*\\n)`, 'm'); //regex i didn't write
    const match = fileContent.match(seasonRegex);

    let targetBlock = '';

    if (!match) {
        console.warn(`Season [${seasonNumber}] mappool not found, falling back to all maps.`);
        return defaultMaps;
    } else {
        targetBlock = match[1];
    }



    const activeMaps = [];
    const lines = targetBlock.split('\n');

    for (let line of lines) {
        line = line.trim();
        
        if (!line || line.startsWith('--')) {
            continue;
        }

        const mapNameMatch = line.match(/["']([^"']+)["']/);
        if (mapNameMatch) {
            activeMaps.push(mapNameMatch[1]);
        }
    }

    console.log(`Retrieved ${activeMaps.length} maps for season ${seasonNumber}`);

    return activeMaps;
}
