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

let score = document.getElementById("score");
let playerOneScore = document.getElementById("playerOneScore");
let playerTwoScore = document.getElementById("playerTwoScore");
let diffLeft = document.getElementById("diffLeft");
let diffRight = document.getElementById("diffRight");

let leftContent = document.getElementById("leftContent");
let rightContent = document.getElementById("rightContent");

let winLeft = document.getElementById("winLeft");
let winRight = document.getElementById("winRight");

// let playerOne = document.getElementById("playerOneName");
// let playerTwo = document.getElementById("playerTwoName");

// PLACEHOLDER VARS /////////////////////////////////////////////////////////////////
let currentFile = "";
let gameState;
// let currentStage;
let bestOfTemp;
let scoreBlueTemp;
let scoreRedTemp;
let scoreEvent;
let previousState;
let cachedPlayerOneScore;
let cachedPlayerTwoScore;
let cachedDifference;
let cachedComboOne;
let cachedComboTwo;
let barThreshold = 250000;

// FOR ANIMATION //////////////////////////////////////////////////
let animationScore = {
	playerOneScore: new CountUp('playerOneScore', 0, 0, 0, .2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
	playerTwoScore: new CountUp('playerTwoScore', 0, 0, 0, .2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
    diffLeft: new CountUp('diffLeft', 0, 0, 0, .2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
    diffRight: new CountUp('diffRight', 0, 0, 0, .2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
    urOne: new CountUp('urOne', 0, 0, 2, { useEasing: true, useGrouping: true, separator: "", decimal: ".", decimalPlaces:2}),
    urTwo: new CountUp('urTwo', 0, 0, 2, { useEasing: true, useGrouping: true, separator: "", decimal: ".", decimalPlaces:2 })
}

socket.onmessage = event => {
    let data = JSON.parse(event.data);

    let file = data.menu.bm.path.file;
    if (currentFile != file) {
        updateDetails(data);
    }
    
    if (previousState != data.tourney.manager.ipcState) {
        checkState(data.tourney.manager.ipcState);
        previousState = data.tourney.manager.ipcState;
    }

    if (data.tourney.manager.bools.scoreVisible) {
        updateScore(data.tourney.manager.gameplay.score.left, data.tourney.manager.gameplay.score.right);
    }
}

async function updateDetails(data) {
	let { id } = data.menu.bm;
	let { memoryOD, fullSR, BPM: { min, max } } = data.menu.bm.stats;
	let { full } = data.menu.bm.time;
    let { mapper, artist, title } = data.menu.bm.metadata;
    let file = data.menu.bm.path.file;
    let pick;

    // console.log(file);

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

async function updateScore(playScoreOne, playScoreTwo) {
    difference = Math.abs(playScoreOne-playScoreTwo);
    animationScore.playerOneScore.update(playScoreOne);
    animationScore.playerTwoScore.update(playScoreTwo);
    animationScore.diffLeft.update(difference);
    animationScore.diffRight.update(difference);
    cachedPlayerOneScore = playScoreOne;
    cachedPlayerTwoScore = playScoreTwo;
    cachedDifference = difference;
    if (playScoreOne > playScoreTwo) {
        leftContent.style.width = `${(difference/barThreshold > 1 ? 1 : difference/barThreshold)*710}px`;
        rightContent.style.width = "0px";
        diffLeft.style.opacity = 1;
        diffRight.style.opacity = 0;
        playerOneScore.style.fontFamily = "Neue-Regrade-Bold-Italic";
        playerTwoScore.style.fontFamily = "Neue-Regrade-Regular-Italic";
    } else if (playScoreOne < playScoreTwo) {
        rightContent.style.width = `${(difference/barThreshold > 1 ? 1 : difference/barThreshold)*710}px`;
        leftContent.style.width = "0px";
        diffRight.style.opacity = 1;
        diffLeft.style.opacity = 0;
        playerTwoScore.style.fontFamily = "Neue-Regrade-Bold-Italic";
        playerOneScore.style.fontFamily = "Neue-Regrade-Regular-Italic";
    } else {
        leftContent.style.width = "0px";
        rightContent.style.width = "0px";
        diffRight.style.opacity = 0;
        diffLeft.style.opacity = 0;
        playerOneScore.style.fontFamily = "Neue-Regrade-Regular-Italic";
        playerTwoScore.style.fontFamily = "Neue-Regrade-Regular-Italic";
    }
}

async function checkState(ipcState) {
    if (ipcState == 3) {
        score.style.opacity = 1;
        winLeft.style.opacity = 0;
        winRight.style.opacity = 0;
    } else if (ipcState == 4 & cachedPlayerOneScore != cachedPlayerTwoScore) {
        let oneWinner = cachedPlayerOneScore > cachedPlayerTwoScore ? true : false;
        winLeft.style.opacity = oneWinner ? 1 : 0;
        winRight.style.opacity = oneWinner ? 0 : 1;
        score.style.opacity = 1;
    } else {
        winLeft.style.opacity = 0;
        winRight.style.opacity = 0;
        score.style.opacity = 0;
    }
}

const parseTime = ms => {
	const second = Math.floor(ms / 1000) % 60 + '';
	const minute = Math.floor(ms / 1000 / 60) + '';
	return `${'0'.repeat(2 - minute.length) + minute}:${'0'.repeat(2 - second.length) + second}`;
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