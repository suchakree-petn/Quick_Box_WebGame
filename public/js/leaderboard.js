// checkCookie();
window.onload = pageLoad;

function getCookie(name) {
    var value = "";
    try {
        value = document.cookie.split("; ").find(row => row.startsWith(name)).split('=')[1]
        return value
    } catch (err) {
        return false
    }
}

function pageLoad() {
    document.getElementById('postbutton').onclick = getData;
    // document.getElementById('fileField').onchange = fileSubmit;
    document.getElementById('playbutton').onclick = goPlay;
    var username = getCookie('username');

    document.getElementById("username").innerHTML = "Welcome " + username;
    readPlayerData();
    readPost();
}

function goPlay() {
    window.location = "game.html";
}

async function readPlayerData() {
    console.log("readPlayerData")
    return await fetch("/readPlayerData")
        .then((data) => {
            data.json().then((jsonData) => {
                console.log("succes read")
                showLeaderBoard(JSON.parse(JSON.stringify(jsonData)));
            })
        })

}


function showLeaderBoard(data) {
    var keys = Object.keys(data);
    var table = document.getElementById("tableBody");
    table.innerHTML = "";
    console.log(keys.length)
    for (var key in keys) {

        var tr = document.createElement("tr");

        var td1 = document.createElement("td");
        td1.innerHTML = data[key].rank;
        tr.appendChild(td1);

        var td2 = document.createElement("td");
        td2.innerHTML = data[key].username;
        tr.appendChild(td2);

        var td3 = document.createElement("td");
        td3.innerHTML = data[key].highscore;
        tr.appendChild(td3);

        table.appendChild(tr);
        console.log(tr);
    }
}
function getData() {
    var msg = document.getElementById("textmsg").value;
    document.getElementById("textmsg").value = "";
    writePost(msg);
}
async function readPost() {
    await fetch("/readPost").then((data) => {
        data.json().then((jsonData) => {
            var jsonObj = JSON.parse(JSON.stringify(jsonData));
            showPost(jsonObj);
        });
    });

}
async function writePost(msg) {
    await fetch("/writepost", {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: getCookie("username"),
            message: msg
        })
    });
    readPost();
}
function showPost(data) {
    var keys = Object.keys(data);
    var divTag = document.getElementById("feed-container");
    divTag.innerHTML = "";
    for (var i = keys.length - 1; i >= 0; i--) {
        console.log(i + "index")
        var temp = document.createElement("div");
        temp.className = "newsfeed";
        divTag.appendChild(temp);
        var temp1 = document.createElement("div");
        temp1.className = "postmsg";
        var h = document.createElement("h4");
        h.className = "postuser";
        h.innerHTML = data[keys[i]]["username"];
        var p = document.createElement("p");
        p.className = "posttext";
        p.innerHTML = data[keys[i]]["message"];
        var divamountlike = document.createElement("div");
        divamountlike.className = "divamountlike";
        var amountlike = document.createElement("img");
        amountlike.className = "amountlikeicon";
        amountlike.src = "img/amountlike.png";
        var amountliketext = document.createElement("div");
        amountliketext.className = "amountliketext";
        updateLikeAmount(amountliketext,data[keys[i]]["post_id"]);
        temp1.appendChild(h);
        temp1.appendChild(p);
        divamountlike.appendChild(amountlike);
        divamountlike.appendChild(amountliketext);
        temp1.appendChild(divamountlike);

        temp.appendChild(temp1);

        var likebutton = document.createElement("button");
        likebutton.className = "likebutton";
        var likeicon = document.createElement("img");
        likeicon.className = "likeicon";
        likeicon.src = "img/like.png";
        likeicon.alt = "like icon";
        likeicon.id = `like-icon_${data[keys[i]]["post_id"]}`;
        likebutton.appendChild(likeicon);
        var liketext = document.createElement("p");
        liketext.className = "liketext";
        liketext.innerHTML = "like";
        likebutton.appendChild(liketext);

        console.log(data[keys[i]]["post_id"] + "post_id");
        onlike(likebutton, data[keys[i]]["post_id"], likeicon, amountliketext)

        temp.appendChild(likebutton);
    }
    updateLikeIcon();
}
async function updateLikeIcon() {
    await fetch('/updateLikeIcon', {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: getCookie("username")
        })
    }).then((res) => {
        res.json().then((jsonData) => {
            console.log("Updateddd   " + JSON.stringify(jsonData))
            var res = JSON.parse(JSON.stringify(jsonData));
            var keys = Object.keys(res);
            for (var key in keys) {
                var likeIcon = document.getElementById(`like-icon_${res[key].post_id}`);
                console.log(likeIcon);
                updateIcon(likeIcon, "like");
            }
        })
    })
}

async function updateLikeAmount(amountliketext, post_id) {

    await fetch('/readPost').then((data) => {
        data.json().then((jsonData) => {
            var jsonObj = JSON.parse(JSON.stringify(jsonData));
            var keys = Object.keys(jsonObj);
            for (var key in keys) {
            console.log(jsonObj[key].post_id +"_____"+ post_id)
            console.log(JSON.stringify(jsonData))

                if (jsonObj[key].post_id == post_id) {
                    var amount = jsonObj[key].total_like;
                    if(amount === null){
                        amount = 0;
                    }
                    console.log(amount)
                    amountliketext.innerHTML = amount;
                    break;
                }
            }
        })
    })
}

function onlike(likebutton, post_id, likeicon, amountliketext) {
    likebutton.onclick = async function pressLike() {
        await fetch('/pressLike', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: getCookie("username"),
                post_id: post_id
            })
        }).then((res) => {
            res.json().then((jsonData) => {
                var res = JSON.parse(JSON.stringify(jsonData));
                updateIcon(likeicon, res.body);
                updateLikeAmount(amountliketext, post_id);
            })
        })
    }

}
function updateIcon(likeIcon, state) {
    if (state == "like") {
        console.log(state);
        likeIcon.src = "img/liked.png"
    } else {
        console.log(state);

        likeIcon.src = "img/like.png"
    }
}