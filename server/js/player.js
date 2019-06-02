/*
 * Created by Jacob Cox
*/

var Blob = require('./blob.js');
var Util = require('./util.js');

class Player {
    constructor(id, n, x, y) {
        //socket
        this.socket_id = id;

        //Name
        this.name = n;

        //cells
        this.color = Util.getRandomColor();

        //position and movement
        this.x = x;
        this.y = y;
        this.moveSpeed = 8;

        //controls
        this.pressingRight = false;
        this.pressingLeft = false;
        this.pressingUp = false;
        this.pressingDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        this.pressingShift = false;
        this.pressingCtrl = false;

        //Select variables
        this.mouseSelectFirstX = 0;
        this.mouseSelectFirstY = 0;
        this.mouseSelectSecondX = 0;
        this.mouseSelectSecondY = 0;

        //Screen variables
        this.screenWidth = 0;
        this.screenHeight = 0;
        this.canvasXZero = 0;
        this.canvasYZero = 0;
        this.canvasXMax = 0;
        this.canvasYMax = 0;
    }

    clicked(cells, blobs) {
        if ((this.mouseSelectFirstX == this.mouseSelectSecondX) && (this.mouseSelectFirstY == this.mouseSelectSecondY)) {

            var x = this.mouseSelectFirstX + this.canvasXZero;
            var y = this.mouseSelectFirstY + this.canvasYZero;

            for (var i in cells) {
                var cell = cells[i];
                if (cell.id == this.socket_id) {
                    if (((x - cell.x) * (x - cell.x)) + ((y - cell.y) * (y - cell.y)) < (cell.size * cell.size)) {
                        cell.selected = true;
                    } else {
                        if (!this.pressingShift && !this.pressingCtrl)
                            cell.selected = false;
                    }
                }
            }
        } else {

            var x1 = this.mouseSelectFirstX + this.canvasXZero;
            var y1 = this.mouseSelectFirstY + this.canvasYZero;

            var x2 = this.mouseSelectSecondX + this.canvasXZero;
            var y2 = this.mouseSelectSecondY + this.canvasYZero;

            if(x1 > x2){
                var temp = x1;
                x1 = x2;
                x2 = temp;
            }

            if(y1 > y2){
                var temp = y1;
                y1 = y2;
                y2 = temp;
            }

            for (var i in blobs) {
                var blobi = blobs[i];
                for (var j in blobs[i]) {
                    var blob = blobi[j];
                    if (blob.x > x1 && blob.y > y1 && blob.x < x2 && blob.y < y2) {
                        blob.selected = true;
                    } else {}
                }
            }
        }

        this.mouseSelectFirstX = this.mouseSelectSecondX;
        this.mouseSelectFirstY = this.mouseSelectSecondY;
    }

    rightclicked(cells, blobs, x, y) {
        for (var i in cells) {
            var cell = cells[i];
            if (cell.id == this.socket_id && cell.selected == true) {

                var sendx = Math.floor(x + this.canvasXZero);
                var sendy = Math.floor(y + this.canvasYZero);

                cell.tx = sendx;
                cell.ty = sendy;
            }
        }

        for (var i in blobs) {
            var blobi = blobs[i];
            for (var j in blobi) {
                var blob = blobi[j];

                if (blob.id == this.socket_id && blob.selected == true) {

                    var sendx = Math.floor(x + this.canvasXZero);
                    var sendy = Math.floor(y + this.canvasYZero);

                    blob.tx = sendx;
                    blob.ty = sendy;
                }
            }
        }
    }

    getInfo() {
        return {
            x: this.x,
            y: this.y,
        }
    }

    updatePosition() {

        this.canvasXZero = Math.floor(this.x - (this.screenWidth / 2));
        this.canvasYZero = Math.floor(this.y - (this.screenHeight / 2));
        this.canvasXMax = this.canvasXZero + this.screenWidth - 50;
        this.canvasYMax = this.canvasYZero + this.screenHeight - 50;


        var moveX = 0;
        var moveY = 0;


        if (this.pressingUp) {
            moveY = -this.moveSpeed;
        }

        if (this.pressingDown) {
            moveY = this.moveSpeed;
        }

        if (this.pressingLeft) {
            moveX = -this.moveSpeed;
        }

        if (this.pressingRight) {
            moveX = this.moveSpeed;
        }

        if (moveX != 0 && moveY != 0) {
            moveX = Math.ceil(moveX / 1.5);
            moveY = Math.ceil(moveY / 1.5);
        }

        this.x += moveX;
        this.y += moveY;
    }

    updateScreen(w, h) {
        this.screenWidth = w;
        this.screenHeight = h;
    }
}

module.exports = Player;
