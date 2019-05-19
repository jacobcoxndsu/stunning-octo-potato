//Import Required Libraries
var Log = require('./js/log.js');
var Util = require('./js/util.js');
var express = require('express');
var fs = require('fs');
var Player = require('./js/player.js');
var Map = require('./js/map.js');
var Cell = require('./js/cell.js');
var QuadTreeModule = require('./js/quadtree.js');

//Load Config Data
var rawdata = fs.readFileSync('./config.json');
var c = JSON.parse(rawdata);

//Create Server Variables
var app = express();
var serv = require('http').Server(app);
var gameport = c.port;
var DEBUG = c.debug;

//Generate the map using the config file
var map = new Map(c.mapwidth * c.tileWidth, c.mapheight * c.tileHeight, c);

//Create the rectangle for the quadtree
var rectangle = new QuadTreeModule.Rectangle((c.mapwidth * c.tileWidth) / 2, (c.mapheight * c.tileHeight) / 2, (c.mapwidth * c.tileWidth) / 2, (c.mapheight * c.tileHeight) / 2,);

//Create the quadtree
var QUADTREE = new QuadTreeModule.QuadTree(rectangle, 10);

//Default location for the client
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

//If the client specifies something specific, it has to be in the client folder.
app.use('/client', express.static(__dirname + '/client'));

serv.listen(gameport);

Log("app", "Server Started", "info", true);

var SOCKET_LIST = {};
var PLAYER_LIST = [];
var CELL_LIST = [];
var BLOB_LIST = {};

//Create socket connection.
var io = require('socket.io')(serv, {});

//Apply connection to all players who enter the game.
io.sockets.on('connection', function (socket) {
    socket.id = Util.getRandomId();
    SOCKET_LIST[socket.id] = socket;

    socket.emit('connected', {
        id: socket.id,
        debug: DEBUG
    });

    if (DEBUG) {
        Log("app", "Socket Created: " + socket.id, "info", false);
    }

    //Create the Player
    var randomX = Math.floor(Util.getRandomInt(0, c.mapwidth * c.tileWidth));
    var randomY = Math.floor(Util.getRandomInt(0, c.mapheight * c.tileHeight));
    var player = new Player(socket.id, randomX, randomY);
    //Add the player to the player list at the id of the socket
    PLAYER_LIST[socket.id] = player;

    //Create the players first cell
    var cell = new Cell(socket.id, randomX, randomY);
    cell.color = player.color;
    CELL_LIST.push(cell);

    //INSERT ALL POINTS INTO THE QUADTREE!!!!
    var point = new QuadTreeModule.Point(cell.x, cell.y, cell);

    var blobList = [];
    BLOB_LIST[socket.id] = blobList; 

    //When the player disconnects
    socket.on('disconnect', function () {
        if (DEBUG)
            Log("app", "Socket Deleted: " + socket.id, "info", false);
        delete PLAYER_LIST[socket.id];
        delete SOCKET_LIST[socket.id];

        //Delete the cells when the player leaves
        CELL_LIST = [];
        for(var i in CELL_LIST)
        {
            if(cell.id != socket.id){
                CELL_LIST.push(CELL_LIST[i]);
            }
        }

        delete BLOB_LIST[socket.id];
    });

    //When the players window is resized
    socket.on('windowResized', function (data) {
        player.updateScreen(data.w, data.h);
    });

    //When the player presses a key
    socket.on('keyPress', function (data) {
        if (data.inputId === 'left') {
            player.pressingLeft = data.state;
        } else if (data.inputId === 'right') {
            player.pressingRight = data.state;
        } else if (data.inputId === 'up') {
            player.pressingUp = data.state;
        } else if (data.inputId === 'down') {
            player.pressingDown = data.state;
        } else if (data.inputId === 'space') {
            player.pressingSpace = data.state;
        } else if (data.inputId === 'shift') {
            player.pressingShift = data.state;
        } else if (data.inputId === 'ctrl') {
            player.pressingCtrl = data.state;
        }
    });

    //When the players mouse moves. 
    socket.on('mousemove', function (data) {
        player.mouseX = data.x;
        player.mouseY = data.y;
    });

    //When the player clicks the mouse down.
    socket.on('leftmousedown', function (data) {
        player.mouseDown = data.state;
        player.mouseSelectFirstX = data.x;
        player.mouseSelectFirstY = data.y;
    });

    //When the player clicks the mouse down.
    socket.on('rightmousedown', function (data) {
        player.rightclicked(CELL_LIST, BLOB_LIST, data.x, data.y);
    });

    //When the player lets the mouse go. 
    socket.on('mouseup', function (data) {
        player.mouseDown = data.state;
        player.mouseSelectSecondX = data.x;
        player.mouseSelectSecondY = data.y;

        for(var i in BLOB_LIST){
            var blobi = BLOB_LIST[i]
            for(var j in blobi)
            {
                var b = blobi[j];
                b.selected = false;
            }
        }

        player.clicked(CELL_LIST, BLOB_LIST);
    });
});

//The current "game loop" -This needs to be updated later to be more functional. 
setInterval(function () {
    for (var p in PLAYER_LIST) {
        var player = PLAYER_LIST[p];
        var socket = SOCKET_LIST[player.socket_id]
        socket.emit('updateLocation', player.getInfo());

        socket.emit("map", map.getInfo(player));

        var cells = [];

        for (var c in CELL_LIST) {
            var cell = CELL_LIST[c];
            cell.update(BLOB_LIST[socket.id]);
            cells.push(cell.getInfo());
        }

        socket.emit('cells', cells);

        var blobs = [];

        for(var b1 in BLOB_LIST){
            var blobArray = BLOB_LIST[b1];
            for(var b2 in blobArray){
                var blob = blobArray[b2];
                blob.update();
                blobs.push(blob.getInfo());
            }
        }

        socket.emit('blobs', blobs);
        //console.log(blobs);

        player.updatePosition();
    }
}, 1000 / 60); //60 times a second
