const express = require('express');
const app = express();
const fs = require('fs');
const hostname = 'localhost';
const port = 3001;
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql');
const { log } = require('console');

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'public/img/');
    },

    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const imageFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

// ใส่ค่าตามที่เราตั้งไว้ใน mysql
const con = mysql.createConnection({
    host: "localhost",
    user: "mdt_web_game",
    password: "tutorthanva",
    database: "web_game"
})

con.connect(err => {
    if (err) throw (err);
    else {
        console.log("MySQL connected");
    }
})

const queryDB = (sql) => {
    return new Promise((resolve, reject) => {
        // query method
        con.query(sql, (err, result, fields) => {
            if (err) reject(err);
            else
                resolve(result)
        })
    })
}

//ทำให้สมบูรณ์
app.post('/regisDB', async (req, res) => {
    var existUser = await queryDB(`select username from userinfo`);
    var isErr = false;
    async function check() {
        var keys = Object.keys(existUser);
        for (var key in keys) {
            if (existUser[key].username == req.body.username) {
                console.log("if 1");
                isErr = true;
                return res.redirect('register.html?error=2');
            }
        }
        if (req.body.repassword != req.body.password) {
            console.log("if 2");
            isErr = true;
            console.log("password not match");
            return res.redirect('register.html?error=1');
        }
    }
    await check();
    let now_date = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let sql = "CREATE TABLE IF NOT EXISTS userInfo (username VARCHAR(255) unique, password VARCHAR(100),primary key (username))";
    let result = await queryDB(sql);

    sql = `insert into userInfo (username,password) values ('${req.body.username}','${req.body.password}')`;
    if (!isErr) {
        console.log("query insert");
        result = await queryDB(sql);
        console.log("registered")
        res.redirect('login.html');
    }

})



//ทำให้สมบูรณ์
app.get('/logout', (req, res) => {
    res.clearCookie('username');
    return res.redirect('login.html');
})

//ทำให้สมบูรณ์
app.get('/readPlayerData', async (req, res) => {
    var sql = await queryDB("CREATE TABLE IF NOT EXISTS leaderboardDB (rank INT(3), username VARCHAR(255), highscore INT(11), primary key (username))");
    sql = await queryDB("CREATE TABLE IF NOT EXISTS likeDB (like_id INT(8) unique auto_increment, username VARCHAR(255), post_id VARCHAR(255), primary key (like_id))");
    var jsonObj = await queryDB("select rank, username, highscore from leaderboardDB order by highscore desc");
    console.log("read player data" + "-->" + JSON.stringify(jsonObj));
    var keys = Object.keys(jsonObj);
    for (var key in keys) {
        await queryDB(`update leaderboardDB set rank = ${parseInt(key) + 1} where username = '${jsonObj[key].username}'`)
    }
    res.send(jsonObj);
})

app.post('/updateLikeIcon', async (req, res) => {
    var likeData = await queryDB(`select * from likeDB where username = '${req.body.username}'`);
    res.send(likeData);
});

app.post('/pressLike', async (req, res) => {
    var likeData = await queryDB(`select * from likeDB where username = '${req.body.username}'`);
    var keys = Object.keys(likeData);
    var isLiked = false;
    for (var key in keys) {
        if (req.body.post_id == likeData[key].post_id) {
            isLiked = true;
            break;
        }
    }
    if (isLiked) {
        console.log("cancel like");
        var updatesql = await queryDB(`delete from likeDB where username = '${req.body.username}' AND post_id = '${req.body.post_id}'`);
        res.send({
            body: "cancel"
        });
    } else {
        console.log("press like");
        var updatesql = await queryDB(`insert into likeDB (username, post_id) values('${req.body.username}','${req.body.post_id}')`)
        res.send({
            body: "like"
        });
    }
});
app.post('/updateRank', async (req, res) => {
    var sql = await queryDB(`update leaderboardDB set rank = '${req.body.rank} ' where username = '${req.body.username}'`);
    console.log("update rank: " + req.body.username);
})

app.post('/writePlayerScore', async (req, res) => {
    console.log("username: " + req.body.username);
    var lastHighScore = await queryDB(`select highscore from leaderboardDB where username = '${req.body.username}'`);
    if (lastHighScore == '') {
        console.log("null high score");
        var sql = await queryDB(`insert into leaderboardDB(username, highscore) values ('${req.body.username}', '${req.body.score}')`);

    } else if (lastHighScore[0].highscore <= req.body.score) {
        console.log("updated high score");

        sql = await queryDB(`update leaderboardDB set highscore = '${req.body.score} ' where username = '${req.body.username}'`);
    }
    res.end();
})

app.post('/initialPlayerScore', async (req, res) => {
    var sql = await queryDB(`insert into leaderboardDB(username,highscore) values('${req.body.username}','${req.body.score}')`);
    res.end();
})

app.get('/readPost', async (req, res) => {
    await queryDB("CREATE TABLE IF NOT EXISTS postDB (post_id int unique auto_increment, username VARCHAR(255), message VARCHAR(255), primary key (post_id))");
    var jsonObj = await queryDB("select postdb.post_id, postdb.username, message, like_count.total_like from postDB left join (select post_id, count(username) as total_like from likeDB GROUP BY likeDB.post_id) as like_count on postDB.post_id = like_count.post_id order by post_id");
    res.send(jsonObj);
})

app.post('/writePost', async (req, res) => {
    var message = await queryDB(`insert into postDB(username,message) values('${req.body.username}','${req.body.message}')`);
    res.end();
})

app.post('/checkLogin', async (req, res) => {
    // ถ้าเช็คแล้ว username และ password ถูกต้อง
    // return res.redirect('feed.html');
    // ถ้าเช็คแล้ว username และ password ไม่ถูกต้อง
    // return res.redirect('login.html?error=1')
    let sql = "CREATE TABLE IF NOT EXISTS userInfo (username VARCHAR(255) unique, password VARCHAR(100),primary key (username))";
    var createTable = await queryDB(sql);
    var jsonObj = await queryDB("select username,password from userinfo");
    var keys = Object.keys(jsonObj);
    var isMatched = false;
    for (var key of keys) {
        if (req.body.username == jsonObj[key].username && req.body.password == jsonObj[key].password) {
            console.log("matched");
            isMatched = true;
            res.cookie("username", jsonObj[key].username);
            return res.redirect('leaderboard.html');
            return res.redirect('game.html');
        }
    }
    if (!isMatched) {
        console.log("not matched");

        return res.redirect('login.html?error=1');
    }

})


app.listen(port, hostname, () => {
    console.log(`Server running at   http://${hostname}:${port}/login.html`);
});
