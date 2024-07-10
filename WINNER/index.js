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

// SHOWCASE DATES DATA /////////////////////////////////////////////////////////////////
let dates = [];
(async () => {
    try {
        const jsonData = await $.getJSON("../_data/showcase.json");
        jsonData.map((round) => {
            dates.push(round);
        });
    } catch (error) {
        console.error("Could not read JSON file", error);
    }
})();
console.log(dates);

// HTML VARS /////////////////////////////////////////////////////////////////
let beatmapTitle = document.getElementById("songName");
let beatmapArtist = document.getElementById("artistName");
let beatmapMapper = document.getElementById("mapperName");
let pickID = document.getElementById("pickID");
let mapOD = document.getElementById("mapOD");
let mapSR = document.getElementById("mapSR");
let mapBPM = document.getElementById("mapBPM");
let mapLength = document.getElementById("mapLength");
let stageText = document.getElementById("stageText");
let statDetails = document.getElementById("statDetails");

let beatmapTitleDelay = document.getElementById("songDelay");
let beatmapArtistDelay = document.getElementById("artistDelay");

// PLACEHOLDER VARS /////////////////////////////////////////////////////////////////
let currentFile = "";
let gameState;
let currentStage;

socket.onmessage = event => {
    let data = JSON.parse(event.data);

    let file = data.menu.bm.path.file;
    if (currentFile != file) {
        updateDetails(data);
    }

    if (currentStage != getCurrentStage()) {
        currentStage = getCurrentStage()
        stageText.innerHTML = currentStage;
    }
}

async function updateDetails(data) {
	let { id } = data.menu.bm;
	let { memoryOD, fullSR, BPM: { min, max } } = data.menu.bm.stats;
	let { full } = data.menu.bm.time;
    let { mapper, artist, title } = data.menu.bm.metadata;
    let file = data.menu.bm.path.file;
    let pick;

    console.log(file);

    // CHECKER FOR MAPPICK
    if (beatmaps.includes(id)) {
        pick = beatmapSet.find(beatmap => beatmap["beatmapId"] === id)["pick"];
    } else if (beatmaps.includes(file)) {
        pick = beatmapSet.find(beatmap => beatmap["beatmapId"] === file)["pick"];
    }
    pickID.innerHTML = pick == null ? "XX1" : pick;

    beatmapTitle.innerHTML = title;
    beatmapArtist.innerHTML = artist;
    beatmapMapper.innerHTML = mapper;
    mapOD.innerHTML = memoryOD.toFixed(1);
    mapSR.innerHTML = fullSR.toFixed(2);
    mapBPM.innerHTML = min === max ? min : `${min} - ${max}`;
    mapLength.innerHTML = parseTime(full);

    makeScrollingText(beatmapTitle, beatmapTitleDelay,20,620,40);
    makeScrollingText(beatmapArtist, beatmapArtistDelay,20,620,40);
}

const parseTime = ms => {
	const second = Math.floor(ms / 1000) % 60 + '';
	const minute = Math.floor(ms / 1000 / 60) + '';
	return `${'0'.repeat(2 - minute.length) + minute}:${'0'.repeat(2 - second.length) + second}`;
}

function getCurrentStage() {
    var date = new Date();
    var day = date.getUTCDate();
    var month = date.getUTCMonth()+1;

    console.log(`${day}, ${month}`);

    for (let stage of dates) {
        stageDate = parseDateTime(stage["date"]);
        // console.log(`${stageDate.getUTCDate()}, ${stageDate.getUTCMonth()}`);
        if (stageDate.getUTCDate() == day && stageDate.getUTCMonth()+1 == month) {
            return stage["stage"];
        }
    }
    return "No Stage Detected";
}

function parseDateTime(dateTimeString) {
    // console.log(dateTimeString);
    if (dateTimeString == "") return null;
    
    var [day, month] = dateTimeString.split('/').map(Number);

    var date = new Date();
    var currentYear = date.getFullYear();

    date.setUTCFullYear(currentYear);
    date.setUTCMonth(month - 1);
    date.setUTCDate(day);

    return date;
}

async function makeScrollingText(title, titleDelay, rate, boundaryWidth, padding) {
    if (title.scrollWidth > boundaryWidth) {
        titleDelay.innerHTML = title.innerHTML;
		let ratio = (title.scrollWidth/boundaryWidth)*rate
		title.style.animation = `scrollText ${ratio}s linear infinite`;
		titleDelay.style.animation = `scrollText ${ratio}s linear infinite`;
		titleDelay.style.animationDelay = `${-ratio/2}s`;
		titleDelay.style.paddingRight = `${padding}px`;
		title.style.paddingRight = `${padding}px`;
        titleDelay.style.marginTop = `-${title.offsetHeight}px`;
        titleDelay.style.display = "initial";
    } else {
        titleDelay.style.display = "none";
		title.style.animation = "none";
		titleDelay.style.animation = "none";
		titleDelay.style.paddingRight = "0px";
        titleDelay.style.marginTop = `0px`;
		title.style.paddingRight = "0px";
	}
}