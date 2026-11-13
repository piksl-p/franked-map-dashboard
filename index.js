import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getActiveMapsFromFile } from './mapExtractor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: 'http://localhost:5173' })); // allow react vite app access

app.use(express.static(path.join(__dirname, 'dist'))); // link to static built dist folder

// get path from .env, or default to standard Steam install location if not provided
const baseFortsPath = process.env.FORTS_PATH || "C:/Program Files (x86)/Steam/steamapps/common/Forts";
const SteamID = process.env.STEAM_ID;
const filePath = path.join(baseFortsPath, "users");
const constantsLuaPath = path.join(baseFortsPath, "data", "db", "constants.lua");

let newestSeason;
let mapData;
const consoleDisplayLength = 3;

const showDiscoveredFiles = false; // debug
const logActions = false;

async function listFiles(replayFilePath) {
    try {
        const folderPath = path.resolve(replayFilePath);

        let filenames = await readdir(folderPath);
        
        if (logActions == true) {
            console.log(filenames.length, "Files identified at", replayFilePath);
        }

        return filenames;
    }   catch (error) {
        console.error('Failed to read filenames', error.message);
    }
    return [];
}

function createFilePath(steamID) {
    let rFP = path.join(filePath, steamID, "/replays");
    return rFP;
}

function splitFileNames(filenames) {
    let sptFilenames = [];
    for (let i = 0; i < filenames.length; i++) {
        sptFilenames[i] = filenames[i].split('_');
    }
    
    if (showDiscoveredFiles == true) {
        limitConsoleDisplay(sptFilenames, consoleDisplayLength);
    }

    return(sptFilenames);
}

function checkIfRanked(sptFilenames) {
    let rankedFiles = []
    for (let i = 0; i < sptFilenames.length; i++) {
        let dataLength = sptFilenames[i].length;
        let extension = sptFilenames[i][dataLength - 1];
        let extensionArr = extension.split('.');
        let fileExtension = extensionArr[1];
        if (dataLength == 7 && fileExtension == 'fwr') { // 7 is the amount of identifiers in ranked replays as well as checking file extension
            rankedFiles.push(sptFilenames[i]);
        }
    }
    return rankedFiles;
}

function filterRankedFiles(rankedFiles, rankedFilesLength, newestSeason) {
    let filteredRankedFiles = [];
    for (let i = 0; i < rankedFilesLength; i++) {
        let season = rankedFiles[i][0];
        if (season == newestSeason) {
            filteredRankedFiles.push(rankedFiles[i]);
        }
    }
    return filteredRankedFiles;
}

function limitConsoleDisplay(arrayName, consoleDisplayLength) {
    for (let a = 0; a < consoleDisplayLength; a++) {
        console.log(arrayName[a]);
    }
    let remainingItems = arrayName.length - consoleDisplayLength;
    if (remainingItems > 0) {
        console.log("... ", remainingItems, "Remaining items not shown");
    }
}

// limitConsoleDisplay usage reduced to not flood terminal

function determineRankedSeason(rankedFiles, rankedFilesLength) {
    let lastPosition = rankedFilesLength - 1;
    newestSeason = rankedFiles[lastPosition][0];

    if (logActions == true) {
        console.log("Determined Ranked season", newestSeason);
    }

    return newestSeason;
}

function createMapArray(mappool) {
    if (logActions == true) {
        console.log("Creating map array");
    }

    return mappool.map(mapName => ({
        mapName: mapName,
        frequency: 0
    }))
}

function sortMapsByPop(mapFrequencies) {
    if (logActions == true) {
        console.log("Ordering maps by popularity");
    }

    let sortedByPopularity = [...mapFrequencies].sort((a,b) => b.frequency - a.frequency);
    return sortedByPopularity;
}

function updateMapArray(rankedFiles, rankedFilesLength, mapFrequencies) {
    if (logActions == true) {
        console.log("Updating map frequencies");
    }
    for (let i = 0; i < rankedFilesLength; i++) {
        let mapPlayed = rankedFiles[i][2];
        let mapPlayedTrue = mapFrequencies.find(map => map.mapName === mapPlayed);
        if (mapPlayedTrue) {
            mapPlayedTrue.frequency++
        } 
    }
}

async function updateMapData() {
    const replayFilePath = createFilePath(SteamID);
    let filenames = await listFiles(replayFilePath); 
    let sptFilenames = splitFileNames(filenames); 
    let rankedFiles = checkIfRanked(sptFilenames); 
    let rankedFilesLength = rankedFiles.length;

    if (rankedFilesLength == 0) {
        return res.json({ success: true, data: [], newestSeason: null, SteamID: SteamID,});
    }

    newestSeason = determineRankedSeason(rankedFiles, rankedFilesLength);
    let filteredRankedFiles = filterRankedFiles(rankedFiles, rankedFilesLength, newestSeason);
    let filteredRankedFileLength = filteredRankedFiles.length;

    let mappool = [];
    try {
        mappool = getActiveMapsFromFile(constantsLuaPath, newestSeason); 
    } catch (error) {
        console.error("Error reading mappool", error);
    }

    let mapFrequencies = createMapArray(mappool);
    updateMapArray(filteredRankedFiles, filteredRankedFileLength, mapFrequencies);
    let sortedByPopularity = sortMapsByPop(mapFrequencies);

    mapData = { 
        success: true, 
        data: sortedByPopularity,
        newestSeason: newestSeason,
        SteamID: SteamID,
        gamesPlayed: filteredRankedFileLength,
    };

    if (logActions == true) {
        console.log(mapData);
    }
}

updateMapData(); // run once for initial load
setInterval(updateMapData, 60000);

app.get('/api/map-data', async (req, res) => {
    try {
        res.json(mapData);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('*any', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(4000, () => console.info('Forts map data dashboard on http://localhost:4000'));
