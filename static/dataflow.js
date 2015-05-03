var tileSize = 16; // size in pixels of each tile
var rows = 16;     // number of rows of tiles
var cols = 32;     // number of columns of tiles
var fontImageTileSize = 8;
var cursor = 0;

var nesPalette = [
    "#7c7c7c", "#bcbcbc", "#fcfcfc",            // lgray
    "#0000fc", "#0078f8", "#3cbcfc", "#a4e4fc", // azure
    "#0000bc", "#0058f8", "#6888fc", "#b8b8f8", // blue
    "#4428bc", "#6844fc", "#9878f8", "#d8b8f8", // violet
    "#940084", "#d800cc", "#f878f8", "#f8b8f8", // magenta
    "#a80020", "#e40058", "#f85898", "#f8a4c0", // red
    "#a81000", "#f83800", "#f87858", "#f87858", // red-orange
    "#881400", "#e45c10", "#fca044", "#fce0a8", // orange
    "#503000", "#ac7c00", "#f8b800", "#f8d878", // yellow
    "#007800", "#00b800", "#b8f818", "#d8f878", // lgreen
    "#006800", "#00a800", "#58d854", "#b8f8b8", // dgreen
    "#005800", "#00a844", "#58f898", "#b8f8d8", // emerald
    "#004058", "#008888", "#01e8d8", "#01fcfc", // cyan
    "#000000", "#d8d8d8"
]; // total colors: 53
var FAVORITE = 3;
var RETWEET = 26;
var DELIMITER = 9;

var threshold = 8;

/* Frame containing display state.
 * frameData[row][col][color][color0/1]
 * or
 * frameData[row][col][char]
 */
var frameData = makeFrame();
var fontImage = new Image();
fontImage.src = 'static/bios.png';
var canvas0;
var context0;
var queue = [];
var max_id;
var finished = false;
var loadingTweets = false;
var username = "";
var cursorColor = [2, 51];

function randomPaletteColor() {
    return Math.floor(Math.random() * nesPalette.length);
}

function extractHexColor(hex, rgb) {
    return parseInt(hex.substring(1 + 2 * rgb, 1 + 2 * (rgb + 1)), 16);
}

/**
 * moreTweets()
 * Pulls down a chunk of tweets and prints them to the console.
 * @returns nothing.
 */
function moreTweets(response) {
    var json = JSON.parse(response);
    console.log("pulled tweets: " + json.length);
    if(json.length == 0) {
        finished = true;
        loadingTweets = false;
        console.log("FINISHED!");
    } else {
        for (var x = 0; x < json.length; x++) {
            queue.push(json[x]);
        }
        max_id = bigInt(json[json.length - 1].id_str);
        loadingTweets = false;
    }
}

function writeFromQueue() {
    if(queue.length > 0) {
        var dequeuedTweet = queue.shift();
        writeTweet(dequeuedTweet);
    }
    if(queue.length < threshold && !finished) {
        ajaxThing();
    }
}

/**
 * writeTweet()
 * Writes to the console.
 * @returns nothing.
 */
function writeTweet(json) {
    cursorColor = [randomPaletteColor(), randomPaletteColor()];
    writeString(json.name);
    writeChar(0);
    writeString("(" + json.screen_name + ")");
    writeChar(0);
    writeString(json.date);

    writeChar(0);
    writeChar(DELIMITER);
    writeChar(0);

    writeString(json.text);

    writeChar(0);
    writeChar(DELIMITER);
    writeChar(0);

    writeString(json.retweets.toString());
    writeChar(RETWEET);

    writeChar(0);

    writeString(json.favorites.toString());
    writeChar(FAVORITE);

    writeChar(0);
    writeThumbprint(json.id_str);
    writeChar(0);
    writeChar(0);

    paintFrame(context0);
}

function thumbStringToArray(thumb512) {
    var thumbArray = [];
    while(thumb512.length > 0) {
        if(thumb512.charAt(0) == '<') {
            var closingBracket = thumb512.indexOf('>');
            thumbArray.push(thumb512.slice(1, closingBracket));
            thumb512 = thumb512.slice(closingBracket + 1);
        } else {
            thumbArray.push(thumb512.charAt[0]);
            thumb512 = thumb512.slice(1);
        }
    }
    return thumbArray;
}

/**
 * Writes a unique thumbprint for the given tweet based on its id.
 * @param idString
 */
function writeThumbprint(idString) {
    var thumb10 = bigInt(idString);
    var thumb512 = thumb10.toString(512);
    var thumbArray = thumbStringToArray(thumb512);
    for(var x = 0; x < thumbArray.length; x++) {
        writeChar(thumbArray[x]);
    }
}

/**
 * writeString()
 * @param string
 */
function writeString(string) {
    for(var x=0; x<string.length; x++) {
        writeChar(string.charCodeAt(x));
    }
}

/**
 * writeChar()
 * Writes a character to the console.
 * @param charValue numerical value of chara to write.
 * @returns nothing.
 */
function writeChar(charValue) {
    if(cursor >= cols) {
        scrollUp();
        cursor = 0;
    }
    frameData[rows - 1][cursor] = [charValue, cursorColor[0], cursorColor[1]];
    cursor++;
}

function scrollUp() {
    for(var r=0; r<rows-1; r++) {
        for(var c=0; c<cols; c++) {
            frameData[r][c] = frameData[r+1][c].slice(0);
        }
    }
    for(c=0; c<cols; c++) {
        frameData[rows-1][c][0] = 0;
    }
}

/**
 * makeFrame()
 * Constructs the initial frame.
 * @returns {Array}
 */
function makeFrame() {
    cursorColor = [51, 2];
    var buildFrame = new Array(rows);
    for(var r=0; r<rows; r++) {
        buildFrame[r] = new Array(cols);
        for(var c=0; c<cols; c++) {
            //buildFrame[r][c] = [r*cols+c, randomPaletteColor(), randomPaletteColor()];
            buildFrame[r][c] = [7, 2, 51];
        }
    }
    return buildFrame;
}

/**
 * paintFrame(context)
 * Paint the console as it currently exists to the canvas.
 * @param context
 */
function paintFrame(context) {
    for(var r=0; r<rows; r++) {
        for(var c=0; c<cols; c++) {
            // paint base shade (out of date)
            context.fillStyle = nesPalette[frameData[r][c][1]];
            context.fillRect(tileSize * c, tileSize * r, tileSize, tileSize);
            // draw character
            var fontImageRow = Math.floor((frameData[r][c][0] / (fontImage.width / fontImageTileSize)) % (fontImage.height / fontImageTileSize));
            var fontImageCol = Math.floor(frameData[r][c][0] % (fontImage.width / fontImageTileSize));
            context.drawImage(fontImage, fontImageCol * fontImageTileSize, fontImageRow * fontImageTileSize, fontImageTileSize, fontImageTileSize, tileSize * c, tileSize * r, tileSize, tileSize);
        }
    }
    var imageData = context.getImageData(0, 0, cols*tileSize, rows*tileSize);
    // Modify colors of each pixel.

    for(var i=0; i<imageData.data.length; i+=4) {
        var charImageRow = Math.floor(Math.floor((i/4)/(cols*tileSize)) / tileSize);
        var charImageCol = Math.floor(((i/4)%(cols*tileSize)) / tileSize);
        var charColor = "";
        if(imageData.data[i] == 0) {
            charColor = nesPalette[frameData[charImageRow][charImageCol][1]];
        } else {
            charColor = nesPalette[frameData[charImageRow][charImageCol][2]];
        }
        imageData.data[i] = extractHexColor(charColor, 0);
        imageData.data[i+1] = extractHexColor(charColor, 1);
        imageData.data[i+2] = extractHexColor(charColor, 2);
    }
    context.putImageData(imageData, 0, 0);
}

/**
 * ajax function
 */
function ajaxThing() {
    if(!loadingTweets && !finished) {
        loadingTweets = true;
        if (max_id == null) {
            $.ajax({
                url: '/tweets',
                data: {screen_name: username},
                type: 'GET',
                success: function (response) {
                    moreTweets(response);
                },
                error: function (error) {
                    console.log('wow failure');
                    clearName();
                }
            });
        } else {
            var test = max_id.subtract(1).toString();
            $.ajax({
                url: '/tweets',
                data: {screen_name: username, max_id: test},
                type: 'GET',
                success: function (response) {
                    moreTweets(response);
                },
                error: function (error) {
                    console.log('wow failure');
                }
            });

        }
    }
}

function clearName() {
    console.log("Unable to fetch tweets for user " + username);
    loadingTweets = false;
    username = "";
}

function submitName() {
    if(username == "") {
        username = document.getElementById("usernameField").value;
        console.log("Fetching tweets for user " + username);
        var intervalWrite = setInterval(writeFromQueue, 200);
    }
}

window.onload = function() {
    canvas0 = document.getElementById("canvas0");
    context0 = canvas0.getContext("2d");
    context0.imageSmoothingEnabled = false;
    context0.mozImageSmoothingEnabled = false;

    paintFrame(context0);
};