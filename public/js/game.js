function checkCookie() {
	var username = "";
	if (getCookie("username") == false) {
		window.location = "login.html";
	}
}


function getCookie(name) {
	var value = "";
	try {
		value = document.cookie.split("; ").find(row => row.startsWith(name)).split('=')[1]
		return value
	} catch (err) {
		return false
	}
}

checkCookie();

window.onload = pageLoad;
var boxAmount = 0;
var currentScore = 0;
var highScore = 0;
var username = "";

function pageLoad() {
	startGame()
	document.getElementById('Startbutton').onclick = clickStart;
}

async function showHighScore() {
	await fetch("/readPlayerData").then((dat) => {
		dat.json().then((jsonData) => {
			var keys = Object.keys(jsonData);
			for (var key in keys) {
				if (jsonData[key].username == getCookie("username")) {
					highScore = jsonData[key].highscore;
					console.log("highscoer: " + highScore)
					document.getElementById("showHighScore").innerHTML = "High Score: " + jsonData[key].highscore;
					break;
				}
			}
		})
	})
}

async function writePlayerScore(score) {
	await fetch("/writePlayerScore", {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			username: getCookie("username"),
			score: score
		})
	});
}

function startGame() {
	initialUsername();
	InitialHighScoreDB();
}

function clickStart(){
	var btstart = document.getElementById("Startbutton");

	btstart.remove();
	var gameLayer = document.getElementById("layer");

	var timeStartCountText = document.createElement("p");
	timeStartCountText.id = "timeStartCountText";
	timeStartCountText.innerHTML = 3;
	gameLayer.appendChild(timeStartCountText);
	timeToStart();
}

function timeToStart() {
	var TIMER_TICK = 1000;
	var timer = null;
	var min = 0.05;
	var second = min * 60;
	var x = document.getElementById("timeStartCountText");
	x.innerHTML = second;
	timer = setInterval(timeCount, TIMER_TICK);
	function timeCount() {
		var time = document.getElementById("timeStartCountText");
		if (time.innerHTML > 1) {
			time.innerHTML -= 1;
		} else if (time.innerHTML <= 1) {
			clearInterval(timer);
			timer = null;
			addBox();
			timeStart();
			time.remove();
		}
	}
}

function initialUsername() {
	var user = document.getElementById("username");
	username = getCookie("username");
	user.innerHTML = username;
}

function timeStart() {
	var TIMER_TICK = 1000;
	var timer = null;
	var min = 0.5; // 0.5 minute
	var second = min * 60;
	var x = document.getElementById("timetext");
	x.innerHTML = second;
	timer = setInterval(timeCount, TIMER_TICK);
	function timeCount() {
		var time = document.getElementById("timetext");
		if (time.innerHTML > 0) {
			time.innerHTML -= 1;
		} else if (time.innerHTML == 0) {
			UpdateHighScore(currentScore);
			clearInterval(timer);
			timer = null;
			clearScreen();
			Summary();
			showHighScore();

		}
	}
}
async function InitialHighScoreDB() {
	var data = await fetch("/readPlayerData");
	var keys = Object.keys(data);
	for (var key in keys) {
		if (data[key].username = username && data[key].highscore == -1) {
			console.log("return initial");
			await initScore();
			return;
		}
	}
	async function initScore() {
		await fetch("/initialPlayerScore", {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				username: username,
				score: -1
			})
		})
	}

}
async function UpdateHighScore(score) {
	console.log("Write!")
	await writePlayerScore(score)
}
function addBox() {
	var gameLayer = document.getElementById("layer");
	var i = 0;

	while (boxAmount < 5) {
		var tempbox = document.createElement("div");
		tempbox.className = "square";
		tempbox.id = "box" + i;
		i++;
		boxAmount++;
		tempbox.style.left = Math.random() * (500 - 25) + "px";
		tempbox.style.top = Math.random() * (500 - 25) + "px";
		//add element to HTML node
		gameLayer.appendChild(tempbox);
		bindBox(tempbox);
	}
}
function Summary() {
	var gameLayer = document.getElementById("layer");
	var summarybox = document.createElement("div");
	summarybox.className = "summarybox";

	var showHighScore = document.createElement("h4");
	showHighScore.className = "showHighScore";
	showHighScore.id = "showHighScore";
	summarybox.appendChild(showHighScore);

	var showScore = document.createElement("h4");
	showScore.className = "showScore";
	showScore.innerHTML = "Score: " + currentScore;
	summarybox.appendChild(showScore);

	var bottomdiv = document.createElement("div");
	bottomdiv.className = "bottomdiv";

	var bottomagain = document.createElement("button");
	bottomagain.className = "bottomagain";
	bottomagain.innerHTML = "Play Again";
	bottomagain.onclick = () => {
		window.location = "index.html";
	}
	bottomdiv.appendChild(bottomagain);

	var bottomleader = document.createElement("button");
	bottomleader.className = "bottomleader";
	bottomleader.id = "bottomleader";
	bottomleader.innerHTML = "Leader Board";
	bottomleader.onclick = () => {
		window.location = 'leaderBoard.html';
	}
	bottomdiv.appendChild(bottomleader);
	summarybox.appendChild(bottomdiv);
	gameLayer.appendChild(summarybox);
}

function bindBox(box) {
	var score = document.getElementById("scoretext");
	var time = document.getElementById("timetext");
	box.onclick = function () {
		box.parentNode.removeChild(box);
		boxAmount--;
		currentScore++;
		score.innerHTML = currentScore;
		if (time.innerHTML > 0) {
			addBox()
		}
	}
}

function clearScreen() {
	var allbox = document.querySelectorAll("#layer div");

	for (var i = 0; i < allbox.length; i++) {
		allbox[i].parentNode.removeChild(allbox[i]);
	}
}