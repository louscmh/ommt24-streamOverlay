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

window.addEventListener("contextmenu", (e) => e.preventDefault());

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

// API /////////////////////////////////////////////////////////////////
const file = [];
let api;
(async () => {
    try {
        const jsonData = await $.getJSON("../_data/api.json");
        jsonData.map((num) => {
            file.push(num);
        });
        api = file[0].api;
    } catch (error) {
        console.error("Could not read JSON file", error);
    }
})();

// HTML VARS /////////////////////////////////////////////////////////////////
let playerOne = document.getElementById("playerOneName");
let playerTwo = document.getElementById("playerTwoName");
let playerOneSeed = document.getElementById("playerOneSeed");
let playerTwoSeed = document.getElementById("playerTwoSeed");

let scoreBlue = document.getElementById("scoreBlue");
let scoreRed = document.getElementById("scoreRed");

let chatContainer = document.getElementById("chatContainer");

let playerOnePick = document.getElementById("playerOnePick");
let playerTwoPick = document.getElementById("playerTwoPick");

let sceneButton = document.getElementById("sceneButton");
let turnButton = document.getElementById("turnButton");
let autoButton = document.getElementById("autoButton");

let sceneContainer = document.getElementById("main");

let pickingText = document.getElementById("pickingText");
let leftPlayerOne = document.getElementById("leftPlayerOne");
let leftPlayerTwo = document.getElementById("leftPlayerTwo");
let rightPlayerOne = document.getElementById("rightPlayerOne");
let rightPlayerTwo = document.getElementById("rightPlayerTwo");

// PLACEHOLDER VARS /////////////////////////////////////////////////////////////////
let currentFile = "";
let gameState;
let currentStage;
let bestOfTemp;
let scoreBlueTemp;
let scoreRedTemp;
let scoreEvent;
let previousState;
let hasSetup;
let chatLen = 0;
let currentScene = 0;
let banCount = 0;
let currentBeatmap;
let currentTurn;
let autoPick = false;
const beatmaps = new Set(); // Store beatmapID;
const bms = []; // Store beatmaps

// BEATMAP DATA /////////////////////////////////////////////////////////////////
let beatmapSet = [];
let beatmapIDS = [];
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
        beatmapIDS.push(beatmapSet[index]["beatmapId"]);
    }
})();
console.log(beatmapSet);

// SEED DATA /////////////////////////////////////////////////////////////////
let seeds = [];
(async () => {
    try {
        const jsonData = await $.getJSON("../_data/seeds.json");
        jsonData.map((seed) => {
            seeds.push(seed);
        });
    } catch (error) {
        console.error("Could not read JSON file", error);
    }
})();
console.log(seeds);

const mods = {
    RC: 0,
    LN: 1,
    HB: 2,
    SV: 3,
    MD: 4,
    TB: 5,
};


// CONTROL PANELS //////////
sceneButton.addEventListener("click", function(event) {
    if (currentScene == 0) {
        currentScene = 1;
        sceneButton.innerHTML = "CURRENT SCENE: GAMEPLAY";
        sceneButton.style.backgroundColor = "blue";
        sceneContainer.style.height = "149px";
        pickingText.style.opacity = 0;
        pickingText.style.transform = "scale(0)";
    } else {
        currentScene = 0;
        sceneButton.innerHTML = "CURRENT SCENE: MAPPOOL";
        sceneButton.style.backgroundColor = "red";
        sceneContainer.style.height = "1080px";
        if (banCount == 2) {
            pickingText.style.opacity = 1;
            pickingText.style.transform = "scale(1)";
        }
    }
})

turnButton.addEventListener("click", function(event) {
    if (currentTurn == 0 && banCount == 2) {
        currentTurn = 1;
        currentScene == 1 ? null : pickingText.innerHTML = `${currentTurn == 0 ? playerOne.innerHTML : playerTwo.innerHTML} is currently picking${temporaryString}`;
        turnButton.innerHTML = "CURRENTLY PICKING: RIGHT TEAM";
        currentScene == 1 ? null : pickingText.style.opacity = 1;
        currentScene == 1 ? null : pickingText.style.transform = "scale(1)";
        turnButton.style.backgroundColor = "rgb(105, 80, 54)";
        playerOnePick.style.opacity = "0";
        playerTwoPick.style.opacity = "0";
        turnButton.style.color = "white";
        stopPulse();
    } else if (currentTurn == 1 && banCount == 2) {
        currentTurn = 0;
        currentScene == 1 ? null : pickingText.innerHTML = `${currentTurn == 0 ? playerOne.innerHTML : playerTwo.innerHTML} is currently picking${temporaryString}`;
        turnButton.innerHTML = "CURRENTLY PICKING: LEFT TEAM";
        currentScene == 1 ? null  : pickingText.style.opacity = 1;
        currentScene == 1 ? null  : pickingText.style.transform = "scale(1)";
        turnButton.style.backgroundColor = "rgb(103, 54, 105)";
        playerOnePick.style.opacity = "0";
        playerTwoPick.style.opacity = "0";
        turnButton.style.color = "white";
        stopPulse();
    } else {
        pickingText.style.opacity = 0;
        pickingText.style.transform = "scale(0)";
        turnButton.innerHTML = "TURN NOT AVAILABLE: BAN 2 MAPS FIRST";
        turnButton.style.backgroundColor = "rgb(49, 41, 33)";
        turnButton.style.color = "rgba(255, 255, 255, 0.473)";
    }
})

autoButton.addEventListener("click", function(event) {
    if (autoPick == 0) {
        autoPick = 1;
        autoButton.innerHTML = "AUTO PICK: ON";
        // #007A14
        autoButton.style.backgroundColor = "#00CA22";
    } else {
        autoPick = 0;
        autoButton.innerHTML = "AUTO PICK: OFF";
        autoButton.style.backgroundColor = "#007A14";
    }
})

class Beatmap {
    constructor(mods, beatmapID, layerName) {
        this.mods = mods;
        this.beatmapID = beatmapID;
        this.layerName = layerName;
        this.isBan = false;
    }
    generate() {
        let mappoolContainer = document.getElementById(`${this.mods}`);

        this.clicker = document.createElement("div");
        this.clicker.id = `${this.layerName}Clicker`;

        mappoolContainer.appendChild(this.clicker);
        let clickerObj = document.getElementById(this.clicker.id);

        this.bg = document.createElement("div");
        this.map = document.createElement("div");
        this.overlay = document.createElement("div");
        this.metadata = document.createElement("div");
        this.title = document.createElement("div");
        this.titleDelay = document.createElement("div");
        this.difficulty = document.createElement("div");
        this.stats = document.createElement("div");
        this.modIcon = document.createElement("div");
        this.modText = document.createElement("div");
        this.pickedStatus = document.createElement("div");
        this.currentPick = document.createElement("div");

        this.bg.id = this.layerName;
        this.map.id = `${this.layerName}BG`;
        this.overlay.id = `${this.layerName}Overlay`;
        this.metadata.id = `${this.layerName}META`;
        this.title.id = `${this.layerName}TITLE`;
        this.titleDelay.id = `${this.layerName}TITLEDELAY`;
        this.difficulty.id = `${this.layerName}DIFF`;
        this.stats.id = `${this.layerName}Stats`;
        this.modIcon.id = `${this.layerName}ModIcon`;
        this.modText.id = `${this.layerName}ModText`;
        this.pickedStatus.id = `${this.layerName}STATUS`;
        this.currentPick.id = `${this.layerName}PICKED`;

        this.metadata.setAttribute("class", "mapInfo");
        this.title.setAttribute("class", "title");
        this.titleDelay.setAttribute("class", "titleDelay");
        this.difficulty.setAttribute("class", "mapInfoStat");
        this.map.setAttribute("class", "map");
        this.pickedStatus.setAttribute("class", "pickingStatus");
        this.overlay.setAttribute("class", "overlay");
        this.modIcon.setAttribute("class", "modIcon");
        this.modIcon.innerHTML = this.mods;
        this.currentPick.setAttribute("class", "pickIcon");
        this.currentPick.style.backgroundImage = `url("../_shared_assets/design/highlight.png")`;
        
        this.mods == "MD" ? this.clicker.setAttribute("class", "clicker glow") : this.clicker.setAttribute("class", "clicker");
        clickerObj.appendChild(this.map);
        document.getElementById(this.map.id).appendChild(this.overlay);
        document.getElementById(this.map.id).appendChild(this.metadata);
        document.getElementById(this.metadata.id).appendChild(this.title);
        document.getElementById(this.metadata.id).appendChild(this.titleDelay);
        document.getElementById(this.map.id).appendChild(this.difficulty);
        clickerObj.appendChild(this.pickedStatus);
        clickerObj.appendChild(this.bg);
        clickerObj.appendChild(this.stats);
        clickerObj.appendChild(this.modIcon);
        clickerObj.appendChild(this.currentPick);

        this.clicker.style.transform = "translateY(0)";
    }
    grayedOut() {
        this.overlay.style.opacity = '1';
    }
}

let team1 = "Red",
    team2 = "Blue";

socket.onmessage = event => {
    let data = JSON.parse(event.data);

    let beatmapID = data.menu.bm.id;
    console.log(banCount);
    if (currentBeatmap != beatmapID) {
        console.log("happened");
        currentBeatmap = beatmapID;
        banCount == 2 && autoPick ? updateDetails(beatmapID) : null;
    }

    tempLeft = data.tourney.manager.teamName.left;
    tempRight = data.tourney.manager.teamName.right;
    // Player Names
    if (tempLeft != playerOne.innerHTML && tempLeft != "") {
        setTimeout(function(event) {
            playerOne.innerHTML = tempLeft;
            seeds.find(seed => seed["Team"] == tempLeft)["Seed"] > 0 ? 
                playerOneSeed.innerHTML = `Seed ${seeds.find(seed => seed["Team"] === tempLeft)["Seed"]}` : 
                    playerOneSeed.innerHTML = "Seed X";
            leftPlayerOne.innerHTML = seeds.find(seed => seed["Team"] === playerOne.innerHTML)["playerOne"];
            leftPlayerTwo.innerHTML = seeds.find(seed => seed["Team"] === playerOne.innerHTML)["playerTwo"];
        }, 150);
    }
    if (tempRight != playerTwo.innerHTML && tempRight != "") {
        setTimeout(function(event) {
            playerTwo.innerHTML = tempRight;
            seeds.find(seed => seed["Team"] === tempRight)["Seed"] > 0 ?
                playerTwoSeed.innerHTML = `Seed ${seeds.find(seed => seed["Team"] === tempRight)["Seed"]}` : 
                    playerTwoSeed.innerHTML = "Seed X";
            rightPlayerOne.innerHTML = seeds.find(seed => seed["Team"] === playerTwo.innerHTML)["playerOne"];
            rightPlayerTwo.innerHTML = seeds.find(seed => seed["Team"] === playerTwo.innerHTML)["playerTwo"];
        }, 150);
    }

    if (currentStage != getCurrentStage()) {
        currentStage = getCurrentStage()
        stageText.innerHTML = currentStage;
    }

    if (!hasSetup) {
        setupBeatmaps();
        updateElipsis();
    }

    if (chatLen != data.tourney.manager.chat.length) {
        updateChat(data);
    }

    if (bestOfTemp !== Math.ceil(data.tourney.manager.bestOF / 2) || scoreBlueTemp !== data.tourney.manager.stars.left || scoreRedTemp !== data.tourney.manager.stars.right) {

		// Courtesy of Victim-Crasher
		bestOfTemp = Math.ceil(data.tourney.manager.bestOF / 2);

        if ((bestOfTemp-data.tourney.manager.stars.left) == 1 && (bestOfTemp-data.tourney.manager.stars.right) == 1) {
            pickingText.style.opacity = 0;
            pickingText.style.transform = "scale(0)";
        }

		// To know where to blow or pop score
		if (scoreBlueTemp < data.tourney.manager.stars.left) {
			scoreEvent = "blue-add";
		} else if (scoreBlueTemp > data.tourney.manager.stars.left) {
			scoreEvent = "blue-remove";
		} else if (scoreRedTemp < data.tourney.manager.stars.right) {
			scoreEvent = "red-add";
		} else if (scoreRedTemp > data.tourney.manager.stars.right) {
			scoreEvent = "red-remove";
		}

		scoreBlueTemp = data.tourney.manager.stars.left;
		scoreBlue.innerHTML = "";
		for (var i = 0; i < scoreBlueTemp; i++) {
			if (scoreEvent === "blue-add" && i === scoreBlueTemp - 1) {
				let scoreFill = document.createElement("div");
				scoreFill.setAttribute("class", "score");
                scoreFill.style.backgroundImage = `url("../_shared_assets/design/point_full.png")`;
				scoreBlue.appendChild(scoreFill);
			} else {
				let scoreFill = document.createElement("div");
				scoreFill.setAttribute("class", "score");
                scoreFill.style.backgroundImage = `url("../_shared_assets/design/point_full.png")`;
				scoreBlue.appendChild(scoreFill);
			}
		}
		for (var i = 0; i < bestOfTemp - scoreBlueTemp; i++) {
			if (scoreEvent === "blue-remove" && i === 0) {
				let scoreNone = document.createElement("div");
				scoreNone.setAttribute("class", "score");
                scoreNone.style.backgroundImage = `url("../_shared_assets/design/point_empty.png")`;
				scoreBlue.appendChild(scoreNone);
			} else {
				let scoreNone = document.createElement("div");
				scoreNone.setAttribute("class", "score");
                scoreNone.style.backgroundImage = `url("../_shared_assets/design/point_empty.png")`;
				scoreBlue.appendChild(scoreNone);
			}
		}

		scoreRedTemp = data.tourney.manager.stars.right;
		scoreRed.innerHTML = "";
		for (var i = 0; i < bestOfTemp - scoreRedTemp; i++) {
			if (scoreEvent === "red-remove" && i === bestOfTemp - scoreRedTemp - 1) {
				let scoreNone = document.createElement("div");
				scoreNone.setAttribute("class", "score");
                scoreNone.style.backgroundImage = `url("../_shared_assets/design/point_empty.png")`;
				scoreRed.appendChild(scoreNone);
			} else {
				let scoreNone = document.createElement("div");
				scoreNone.setAttribute("class", "score");
                scoreNone.style.backgroundImage = `url("../_shared_assets/design/point_empty.png")`;
				scoreRed.appendChild(scoreNone);
			}
		}
		for (var i = 0; i < scoreRedTemp; i++) {
			if (scoreEvent === "red-add" && i === 0) {
				let scoreFill = document.createElement("div");
				scoreFill.setAttribute("class", "score");
                scoreFill.style.backgroundImage = `url("../_shared_assets/design/point_full.png")`;
				scoreRed.appendChild(scoreFill);
			} else {
				let scoreFill = document.createElement("div");
				scoreFill.setAttribute("class", "score");
                scoreFill.style.backgroundImage = `url("../_shared_assets/design/point_full.png")`;
				scoreRed.appendChild(scoreFill);
			}
		}
	}

    if (previousState != data.tourney.manager.ipcState) {
        checkState(data.tourney.manager.ipcState);
        previousState = data.tourney.manager.ipcState;
    }
}

async function checkState(ipcState) {
    // map has ended and its the next player's turn
    if (ipcState == 4 && (scoreBlueTemp != bestOfTemp || scoreRedTemp != bestOfTemp)) {
        stopPulse();
        turnButton.click();
        setTimeout(function () {
            currentScene == 1 ? sceneButton.click() : null
        }, 25000)
    } else if (ipcState == 3) {
        currentScene == 0 ? sceneButton.click() : null;
    }
}

async function setupBeatmaps() {
    hasSetup = true;

    const modsCount = {
        RC: 0,
        LN: 0,
        HB: 0,
        SV: 0,
        MD: 0,
        TB: 0,
    };

    try {
        const jsonData = await $.getJSON("../_data/beatmaps.json");
        jsonData.map((beatmap) => {
            bms.push(beatmap);
        });
    } catch (error) {
        console.error("Could not read JSON file", error);
    }

    (function countMods() {
        bms.map((beatmap) => {
            modsCount[beatmap.pick.substring(0,2)]++;
        });
    })();

    let row = -1;
    let preMod = 0;
    let colIndex = 0;
    bms.map(async(beatmap, index) => {
        if (beatmap.mods !== preMod || colIndex % 3 === 0) {
            preMod = beatmap.pick.substring(0,2);
            colIndex = 0;
            row++;
        }
        const bm = new Beatmap(beatmap.pick.substring(0,2), beatmap.beatmapId, `map${index}`);
        bm.generate();
        bm.clicker.addEventListener("click", function(event) {
            if (event.shiftKey) {
                if (banCount < 2) {
                    bm.pickedStatus.style.color = "#b285c9";
                    bm.pickedStatus.style.backgroundColor = "rgba(0, 0, 0, 0)";
                    bm.pickedStatus.style.top = "0px";
                    bm.pickedStatus.style.right = "0px";
                    bm.pickedStatus.style.width = "430px";
                    bm.pickedStatus.style.height = "60px";
                    bm.pickedStatus.style.lineHeight = "65px";
                    bm.pickedStatus.style.fontSize = "25px";
                    bm.overlay.style.zIndex = 3;
                    bm.overlay.style.opacity = "0.8";
                    bm.isBan == true ? null : banCount++;
                    bm.isBan == true ? null : bm.isBan = true;
                    banCount == 2 ? currentTurn = 1 : null;
                    turnButton.click();
                    setTimeout(function() {
                        bm.pickedStatus.style.opacity = "1";
                        bm.pickedStatus.innerHTML = `Banned by T1`;
                    }, 150);
                }
            } else if (event.ctrlKey) {
                bm.pickedStatus.style.right = "50px";
                bm.overlay.style.opacity = "0";
                bm.metadata.style.opacity = "1";
                bm.difficulty.style.opacity = "1";
                bm.overlay.style.zIndex = 0;
                // bm.pickedStatus.style.left = "100px";
                bm.pickedStatus.style.opacity = "0";
                bm.pickedStatus.style.backgroundColor = "rgba(0,0,0,0)";
                stopPulse();
                bm.isBan == true ? banCount-- : null;
                bm.isBan == true ? bm.isBan = false  : null;
                banCount < 2 ? turnButton.click() : null;
                setTimeout(function() {
                    playerOnePick.style.opacity = "0";
                    playerTwoPick.style.opacity = "0";
                    bm.pickedStatus.style.opacity = "1";
                    bm.pickedStatus.innerHTML = "";
                }, 150);
            } else {
                if (!bm.isBan) {
                    if (bm.mods == "TB") {
                        bm.overlay.style.zIndex = 0;
                        bm.overlay.style.opacity = "0";
                        stopPulse();
                        bm.isBan == true ? banCount-- : null;
                        bm.isBan == true ? bm.isBan == false  : null;
                        banCount < 2 ? turnButton.click() : null;
                        setTimeout(function() {
                            pickingText.style.opacity = 0;
                            pickingText.style.transform = "scale(0)";
                            playerOnePick.style.opacity = "0";
                            playerTwoPick.style.opacity = "0";
                            bm.currentPick.style.opacity = "1";
                            bm.mods != "MD" ? bm.clicker.style.animation = "pick 2s infinite" : bm.clicker.style.animation = "pulsepick 2s infinite";
                        }, 150);
                    } else {
                        bm.pickedStatus.style.right = "20px";
                        bm.pickedStatus.style.color = "#fff";
                        bm.pickedStatus.style.backgroundColor = "#b285c9";
                        bm.pickedStatus.style.top = "35px";
                        bm.pickedStatus.style.width = "100px";
                        bm.pickedStatus.style.height = "20px";
                        bm.pickedStatus.style.lineHeight = "25px";
                        bm.pickedStatus.style.fontSize = "13px";
                        bm.overlay.style.zIndex = 0;
                        bm.overlay.style.opacity = "0";
                        stopPulse();
                        setTimeout(function() {
                            pickingText.style.opacity = 0;
                            pickingText.style.transform = "scale(0)";
                            playerOnePick.style.opacity = "1";
                            playerTwoPick.style.opacity = "0";
                            bm.pickedStatus.style.opacity = "1";
                            bm.pickedStatus.innerHTML = "T1 PICK";
                            bm.currentPick.style.opacity = "1";
                            bm.mods != "MD" ? bm.clicker.style.animation = "pick 2s infinite" : bm.clicker.style.animation = "pulsepick 2s infinite";
                        }, 150);
                    }
                }
            }
        });
        bm.clicker.addEventListener("contextmenu", function(event) {
            if (event.shiftKey) {
                if (banCount < 2) {
                    bm.pickedStatus.style.color = "#b285c9";
                    bm.pickedStatus.style.backgroundColor = "rgba(0, 0, 0, 0)";
                    bm.pickedStatus.style.top = "0px";
                    bm.pickedStatus.style.right = "0px";
                    bm.pickedStatus.style.width = "430px";
                    bm.pickedStatus.style.height = "60px";
                    bm.pickedStatus.style.lineHeight = "65px";
                    bm.pickedStatus.style.fontSize = "25px";
                    bm.overlay.style.zIndex = 3;
                    bm.overlay.style.opacity = "0.8";
                    bm.isBan == true ? null : banCount++;
                    bm.isBan == true ? null : bm.isBan = true;
                    banCount == 2 ? currentTurn = 0 : null;
                    turnButton.click();
                    setTimeout(function() {
                        bm.pickedStatus.style.opacity = "1";
                        bm.pickedStatus.innerHTML = `Banned by T2`;
                    }, 150);
                }
            } else if (event.ctrlKey) {
                bm.pickedStatus.style.right = "50px";
                bm.overlay.style.opacity = "0";
                bm.metadata.style.opacity = "1";
                bm.difficulty.style.opacity = "1";
                bm.stats.style.opacity = "1";
                bm.bg.style.opacity = "1";
                bm.overlay.style.zIndex = 0;
                bm.pickedStatus.style.opacity = "0";
                bm.pickedStatus.style.backgroundColor = "rgba(0,0,0,0)";
                stopPulse();
                bm.isBan == true ? banCount-- : null;
                bm.isBan == true ? bm.isBan = false  : null;
                banCount < 2 ? turnButton.click() : null;
                setTimeout(function() {
                    playerOnePick.style.opacity = "0";
                    playerTwoPick.style.opacity = "0";
                    bm.pickedStatus.style.opacity = "1";
                    bm.pickedStatus.innerHTML = "";
                }, 150);
            } else {
                if (!bm.isBan) {
                    if (bm.mods == "TB") {
                        bm.overlay.style.zIndex = 0;
                        bm.overlay.style.opacity = "0";
                        stopPulse();
                        bm.isBan == true ? banCount-- : null;
                        bm.isBan == true ? bm.isBan == false  : null;
                        banCount < 2 ? turnButton.click() : null;
                        setTimeout(function() {
                            pickingText.style.opacity = 0;
                            pickingText.style.transform = "scale(0)";
                            playerOnePick.style.opacity = "0";
                            playerTwoPick.style.opacity = "0";
                            bm.currentPick.style.opacity = "1";
                            bm.mods != "MD" ? bm.clicker.style.animation = "pick 2s infinite" : bm.clicker.style.animation = "pulsepick 2s infinite";
                        }, 150);
                    } else {
                        bm.pickedStatus.style.right = "20px";
                        bm.pickedStatus.style.color = "#fff";
                        bm.pickedStatus.style.backgroundColor = "#b285c9";
                        bm.pickedStatus.style.top = "35px";
                        bm.pickedStatus.style.width = "100px";
                        bm.pickedStatus.style.height = "20px";
                        bm.pickedStatus.style.lineHeight = "25px";
                        bm.pickedStatus.style.fontSize = "13px";
                        bm.overlay.style.zIndex = 0;
                        bm.overlay.style.opacity = "0";
                        bm.bg.style.opacity = "1";
                        stopPulse();
                        setTimeout(function() {
                            pickingText.style.opacity = 0;
                            pickingText.style.transform = "scale(0)";
                            playerOnePick.style.opacity = "0";
                            playerTwoPick.style.opacity = "1";
                            bm.pickedStatus.style.opacity = "1";
                            bm.pickedStatus.innerHTML = "T2 PICK";
                            bm.currentPick.style.opacity = "1";
                            bm.mods != "MD" ? bm.clicker.style.animation = "pick 2s infinite" : bm.clicker.style.animation = "pulsepick 2s infinite";
                        }, 150);
                    }
                }
            }
        });
        const mapData = await getDataSet(beatmap.beatmapId);
        bm.map.style.backgroundImage = `url('../_shared_assets/design/mappick.png')`;
        bm.title.innerHTML = mapData.artist + ' - ' + mapData.title;
        makeScrollingText(bm.title, bm.titleDelay, 20, 300, 20);
        bm.difficulty.innerHTML = `[${mapData.version}]` + '&emsp;&emsp;Mapper: ' + mapData.creator;
        beatmaps.add(bm);
    });
}

async function stopPulse() {
    for (let bm of beatmaps) {
        bm.currentPick.style.opacity = "0";
        bm.mods != "MD" ? bm.clicker.style.animation = "" : bm.clicker.style.animation = "pulse 2s infinite";
    }
}

async function getDataSet(beatmapID) {
    try {
        const data = (
            await axios.get("/get_beatmaps", {
                baseURL: "https://osu.ppy.sh/api",
                params: {
                    k: api,
                    b: beatmapID,
                },
            })
        )["data"];
        return data.length !== 0 ? data[0] : null;
    } catch (error) {
        console.error(error);
    }
};

const parseTime = ms => {
	const second = Math.floor(ms / 1000) % 60 + '';
	const minute = Math.floor(ms / 1000 / 60) + '';
	return `${'0'.repeat(2 - minute.length) + minute}:${'0'.repeat(2 - second.length) + second}`;
}

function getCurrentStage() {
    var date = new Date();
    var day = date.getUTCDate();
    var month = date.getUTCMonth()+1;

    // console.log(`${day}, ${month}`);

    let currentStage;

    for (let stage of dates) {
        stageDate = parseDateTime(stage["date"]);
        // console.log(`${stageDate.getUTCDate()}, ${stageDate.getUTCMonth()}`);
        if (stageDate.getUTCDate() >= day && stageDate.getUTCMonth()+1 >= month) {
            return currentStage["stage"];
        }
        currentStage = stage;
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

function updateChat(data) {
    if (chatLen == 0 || (chatLen > 0 && chatLen > data.tourney.manager.chat.length)) {
        // Starts from bottom
        chats.innerHTML = "";
        chatLen = 0;
    }

    // Add the chats
    for (var i = chatLen; i < data.tourney.manager.chat.length; i++) {
        tempClass = data.tourney.manager.chat[i].team;

        // Chat variables
        let chatParent = document.createElement('div');
        chatParent.setAttribute('class', 'chat');

        let chatTime = document.createElement('div');
        chatTime.setAttribute('class', 'chatTime');

        let chatName = document.createElement('div');
        chatName.setAttribute('class', 'chatName');

        let chatText = document.createElement('div');
        chatText.setAttribute('class', 'chatText');

        chatTime.innerText = data.tourney.manager.chat[i].time;
        chatName.innerText = data.tourney.manager.chat[i].name + ":\xa0";
        chatText.innerText = data.tourney.manager.chat[i].messageBody;

        chatName.classList.add(tempClass);

        chatParent.append(chatTime);
        chatParent.append(chatName);
        chatParent.append(chatText);
        chats.append(chatParent);
    }

    // Update the Length of chat
    chatLen = data.tourney.manager.chat.length;

    // Update the scroll so it's sticks at the bottom by default
    chats.scrollTop = chats.scrollHeight;
}

async function updateDetails(beatmapID) {
    if (beatmapIDS.includes(beatmapID)) {
        for (let bm of beatmaps) {
            if (bm.beatmapID == beatmapID) {
                setTimeout(() => {
                    currentTurn == 0 ? bm.clicker.dispatchEvent(leftClick) : bm.clicker.dispatchEvent(rightClick);
                }, 100);
            }
        }
    }
}

var rightClick = new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    view: window,
    button: 2, // Indicates a right-click
    buttons: 2 // Indicates the right mouse button is pressed
});

var leftClick = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
});

let temporaryString = ".";
function updateElipsis() {
    setInterval(function () {
        pickingText.innerHTML = `${currentTurn == 0 ? playerOne.innerHTML : playerTwo.innerHTML} is currently picking${temporaryString}`
        if (temporaryString.length == 3) {
            temporaryString = "";
        } else {
            temporaryString += ".";
        }
    },1000);
}