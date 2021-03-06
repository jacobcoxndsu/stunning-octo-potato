class Util {
    static getRandomId() {
        return Math.random().toString(20).substr(2, 11);
    }

    static getRandomInt(min, max) {
        return Math.random() * (max - min) + min;
    }

    static getRandomColor() {
        var hue = 'rgb(' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ')';

        return hue;
    }

    static map(value, inMin, inMax, outMin, outMax){
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }
}

module.exports = Util;
