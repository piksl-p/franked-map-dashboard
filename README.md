# Forts Rankedstats
## Quick overview:

- Graphical view of the number of [Forts](https://store.steampowered.com/news/app/410900) ranked games you play on a season's maps
- Runs a local `nodejs` server to grab and process data from filenames, which is displayed in the browser dashboard   
- Uses React to update live in the browser as you play (*at 60s intervals**)

It may support more advanced features such as ranked points over time by using [forts-tools](https://forts-tools.com/)' API to get data from log2.dat


**Default setting for performance*

## Getting it running:

#### 1. **Install nodejs** [(download here)](https://nodejs.org/en/download)

(or on linux):

```bash
sudo apt update
sudo apt install nodejs
```

#### 2. Download/clone the repo

#### 3. Install dependencies

Run in project folder

```bash
npm ci
```
*downloads the required packages in `package.json`folder*

#### 4. Open `.env` file and change:
    
| Parameter    | Type     | Description                         |
| :------------| :--------| :-----------------------------------|
| `FORTS_PATH` | `string` | your absolute file path for forts   |
| `STEAM_ID`   | `string` | your steamID                        |

#### 5. Start the server

- **Windows:** Open `run.bat` *or* 

- **Linux:** run 
    ```bash
    node index.js
    ```
    in the project folder

    And then navigate to http://localhost:4000/

## Troubleshooting

There are a few boolean variables you can set to see more info, namely:

- `showDiscoveredFiles` which logs (the first 3) discovered filenames as arrays and lists the remainder

    ```javascript
    [
    '44',                   // season
    'Forts v1.39.0',        // forts version
    'Spirals',              // map name
    '20261031',             // ?
    '141642',               // ?
    '1',                    // ?
    'r60.fwr'               // ?
    ] 
    ...  4 Remaining items not shown
    ```

- `logActions` gives brief summaries of functions run, the most important being the number of files found at the target location and the data being sent to the browser

    ```javascript
    5 Files identified at {FORTS_PATH}/{STEAM_ID}/replays
    Determined Ranked season 44
    Creating map array
    Updating map frequencies
    Ordering maps by popularity
    {
    success: true,
    data: [
        { mapName: 'Abyss', frequency: 1 },
        { mapName: 'Spirals', frequency: 1 },
        { mapName: 'Hillfort', frequency: 0 },
        { mapName: 'Pillars', frequency: 0 },
        { mapName: 'Desert Ruins', frequency: 0 },
        { mapName: 'Split', frequency: 0 }
    ],
    newestSeason: '44',
    SteamID: '76561199796853030',
    gamesPlayed: 2
    }
    ```
