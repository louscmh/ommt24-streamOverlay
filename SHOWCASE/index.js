// SOCKET /////////////////////////////////////////////////////////////////
let socket = new ReconnectingWebSocket("ws://" + location.host + "/ws");
socket.onopen = () => {
    console.log("Successfully Connected");
};
socket.onclose = event => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!");
};
socket.onerror = error => {
    console.log("Socket Error: ", error);
};

// BEATMAP DATA /////////////////////////////////////////////////////////////////
let beatmapSet = [];
let beatmaps = [];
(async () => {
    try {
        const jsonData = await $.getJSON("../_data/beatmaps.json");
        jsonData.map((beatmap) => {
            beatmapSet.push(beatmap);
        });
    } catch (error) {
        console.error("Could not read JSON file", error);
    }
    for (index = 0; index < beatmapSet.length; index++) {
        beatmaps.push(beatmapSet[index]["beatmapId"]);
    }
})();
console.log(beatmapSet);

// HTML VARS /////////////////////////////////////////////////////////////////
let beatmapTitle = document.getElementById("beatmapTitle");
let beatmapArtist = document.getElementById("beatmapArtist");
let beatmapMapper = document.getElementById("mapper");
let beatmapDiff = document.getElementById("difficulty");
let pickID = document.getElementById("pickID");
let mapOD = document.getElementById("mapOD");
let mapAR = document.getElementById("mapAR");
let mapCS = document.getElementById("mapCS");
let mapSR = document.getElementById("mapSR");
let mapBPM = document.getElementById("mapBPM");
let mapLength = document.getElementById("mapLength");

// PLACEHOLDER VARS /////////////////////////////////////////////////////////////////
let currentFile = "";
let gameState;

socket.onmessage = event => {
    let data = JSON.parse(event.data);

    let file = data.menu.bm.path.file;
    if (currentFile != file) {
        updateDetails(data);
    }
}

async function updateDetails(data) {
	let { id } = data.menu.bm;
	let { memoryOD, memoryCS, memoryAR, fullSR, BPM: { min, max } } = data.menu.bm.stats;
	let { full } = data.menu.bm.time;
    let { difficulty, mapper, artist, title } = data.menu.bm.metadata;
    let file = data.menu.bm.path.file;
    let pick;
    let customMapper = "";

    if (data.menu.mods.str.includes("DT") || data.menu.mods.str.includes("NC")) {
        return;
    }

    // CHECKER FOR MAPPICK & MODS (TO RECALCULATE STATS)
    if (beatmaps.includes(id)) {
        pick = beatmapSet.find(beatmap => beatmap["beatmapId"] === id)["pick"];
        customMapper = beatmapSet.find(beatmap => beatmap["beatmapId"] === id)["mappers"];
        let mod = pick.substring(0,2).toUpperCase();
        if (mod == "HR") {
            memoryOD = Math.min(memoryOD*1.4, 10).toFixed(1);
            memoryCS = Math.min(memoryCS*1.3, 10).toFixed(1);
            memoryAR = Math.min(memoryAR*1.4, 10).toFixed(1);
            fullSR = beatmapSet.find(beatmap => beatmap["beatmapId"] === id)["modSR"];
        } else if (mod == "DT") {
            // thanks schdewz
            memoryOD = Math.min((79.5 - (Math.min(79.5, Math.max(19.5, 79.5 - Math.ceil(6 * memoryOD))) / 1.5)) / 6, 1.5 > 1.5 ? 12 : 11).toFixed(1);
            let ar_ms = Math.max(Math.min(memoryAR <= 5 ? 1800 - 120 * memoryAR : 1200 - 150 * (memoryAR - 5), 1800), 450) / 1.5;
            memoryAR = ar_ms > 1200 ? ((1800 - ar_ms) / 120).toFixed(2) : (5 + (1200 - ar_ms) / 150).toFixed(1);
        
            min = Math.round(min * 1.5);
            max = Math.round(max * 1.5);
            full = Math.round(full/1.5);
        
            fullSR = beatmapSet.find(beatmap => beatmap["beatmapId"] === id)["modSR"];
        }
    } else if (beatmaps.includes(file)) {
        pick = beatmapSet.find(beatmap => beatmap["beatmapId"] === file)["pick"];
        customMapper = beatmapSet.find(beatmap => beatmap["beatmapId"] === file)["mappers"];
        let mod = pick.substring(0,2).toUpperCase();
        if (mod == "HR") {
            memoryOD = Math.min(memoryOD*1.4, 10).toFixed(1);
            memoryCS = Math.min(memoryCS*1.3, 10).toFixed(1);
            memoryAR = Math.min(memoryAR*1.4, 10).toFixed(1);
            fullSR = beatmapSet.find(beatmap => beatmap["beatmapId"] === id)["modSR"];
        } else if (mod == "DT") {
            // thanks schdewz
            memoryOD = Math.min((79.5 - (Math.min(79.5, Math.max(19.5, 79.5 - Math.ceil(6 * memoryOD))) / 1.5)) / 6, 1.5 > 1.5 ? 12 : 11).toFixed(1);
            let ar_ms = Math.max(Math.min(memoryAR <= 5 ? 1800 - 120 * memoryAR : 1200 - 150 * (memoryAR - 5), 1800), 450) / 1.5;
            memoryAR = ar_ms > 1200 ? ((1800 - ar_ms) / 120).toFixed(2) : (5 + (1200 - ar_ms) / 150).toFixed(1);
        
            min = Math.round(min * 1.5);
            max = Math.round(max * 1.5);
            full = Math.round(full/1.5);
        
            fullSR = beatmapSet.find(beatmap => beatmap["beatmapId"] === id)["modSR"];
        }
    }
    pickID.innerHTML = pick == null ? "XX1" : pick;

    beatmapTitle.innerHTML = title;
    beatmapArtist.innerHTML = `${artist} -`;
    beatmapDiff.innerHTML = difficulty;
    beatmapMapper.innerHTML = customMapper != "" ? customMapper:mapper;
    mapOD.innerHTML = memoryOD;
    // mapAR.innerHTML = memoryAR;
    // mapCS.innerHTML = memoryCS;
    mapSR.innerHTML = fullSR;
    mapBPM.innerHTML = min === max ? min : `${min}-${max}`;
    mapLength.innerHTML = parseTime(full);
}

async function adjustFont(title, boundaryWidth, originalFontSize) {
    if (title.scrollWidth > boundaryWidth) {
		let ratio = (title.scrollWidth/boundaryWidth);
        title.style.fontSize = `${originalFontSize/ratio}px`;
    } else {
		title.style.fontSize = `${originalFontSize}px`;
	}
}

const parseTime = ms => {
	const second = Math.floor(ms / 1000) % 60 + '';
	const minute = Math.floor(ms / 1000 / 60) + '';
	return `${'0'.repeat(2 - minute.length) + minute}:${'0'.repeat(2 - second.length) + second}`;
}
