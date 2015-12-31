var _mapArray = [];
var _cols = 13;
var _rows = 15;
var _rifleSquads = 0;
var _mgTeams = 0;
var _sniperTeams = 0;
var _opforArray = [];
var _friendlyArray = [];
var _squareSize = 50;
var _canvas = null;
var _ctx = null;
var _imgInfSquad = new Image();
var _imgMGTeam = new Image();
var _imgMortarSection = new Image();
var _imgHQ = new Image();
var _imgInfPlatoon = new Image();
var _imgSniperTeam = new Image();
var _activeSq = null;
var _strokeColorHighlight = "#0000ff";
var _turnCurrent = "ai";
var _turnNumber = 0;
var _debugOn = true;

// ==========================
// **** helper functions ***
// ==========================

function endTurn() {
  // just switch turn
  switchTurn();
}

function alertMessage(txt) {
  if (_debugOn) {
    alert(txt);
  }
}

// return distance between two squares 
function getDistanceBetweenSquares(x1, y1, x2, y2) {
  //return Math.abs(row1 - row2) + Math.abs(col1 - col2)

  var dx = Math.abs(x2 - x1);
  var dy = Math.abs(y2 - y1);

  var min = Math.min(dx, dy);
  var max = Math.max(dx, dy);

  var diagonalSteps = min;
  var straightSteps = max - min;

  return Math.floor(Math.sqrt(2) * diagonalSteps + straightSteps);

}


// used to look for an object within an array
function contains(a, obj) {
  var i = a.length;
  while (i--) {
    if (a[i] === obj) {
      return true;
    }
  }
  return false;
}

// used to determine random starting position on map
function getRandomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// return map array pos for the row and col position
function getArrayPosforRowCol(arr, row, col) {
  for (var pos = 0; pos < arr.length; pos++) {
    if ((arr[pos].row === row) && (arr[pos].col === col)) {
      return pos;
    }
  }
}

// see if there is already a unit in this spot on the map 
function isMapSpotTaken(a, t) {

  var retVal = false;

  // if no items in array, then ok to add
  if (a.length === 0) {
    return retVal;
  } else {
    // need to make sure that spot not already taken
    for (var i = 0; i < a.length; i++) {
      if (t.equals(a[i])) {
        retVal = true;
        break;
      }
    }
  }

  return retVal;
}

// get coordinates based on canvas rectangle, not the page or screen
function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: Math.round(evt.clientX - rect.left),
    y: Math.round(evt.clientY - rect.top)
  };
}

// ==========================
// **** mainfunctions ***
// ==========================

// set up the game itself
function switchTurn() {

  var txt = "";
  var sq = null;

  // loop through all the units and reset move, attack and supression flag
  for (var x = 0; x < _mapArray.length; x++) {
    if (_mapArray[x].unit != null) {
      sq = _mapArray[x];
      sq.unit.move_cur = sq.unit.move_max;
      sq.unit.is_suppressed = 0;
      sq.unit.has_attacked = 0;
      _mapArray[x].sq = sq;
    }
  }

  // increment the turn counter and flip whose turn it is
  _turnNumber++;
  txt = "Turn #" + _turnNumber + ":&nbsp;";
  if (_turnCurrent == "ai") {
    _turnCurrent = "player";
    txt += "Player's ";
  } else {
    _turnCurrent = "ai";
    txt += "Computer's ";
  }

  // finish the div text 
  txt += "Turn";
  document.getElementById("lblTurnText").innerHTML = txt;

  // flip around the images 
  if (_turnCurrent == "ai") {
    document.getElementById("imgEndTurn").src = "end_turn_inactive_40x80.png";
  } else {
    document.getElementById("imgEndTurn").src = "end_turn_active_40x80.png";
  }

  // if we flipped to ai, need to jump out
  if (_turnCurrent == "ai") {
    doComputerTurn();
  }


}

// computer turn
function doComputerTurn() {

  var unit = null;
  var row = 0;
  var col = 0;
  var x = 0;
  var y = 0;
  var adjRow = 0;
  var adjCol = 0;
  var agg = 0;
  
  // for computer, deselect any player units and get rid of active square
  deselectUnit(_activeSq);
  _activeSq = null;
  // clear text labels
  clearTerrainText();
  clearUnitText();

  // iterate through enemy units, looking for ones not suppressed and not on black effectiveness
  for (var ctr = 0; ctr < _mapArray.length; ctr++) {
    unit = _mapArray[ctr].unit;

    // get the row and pos
    row = _mapArray[ctr].row;
    col = _mapArray[ctr].col;
    
    if ((unit !== null) && (unit.player == "ai") && (unit.is_suppressed === 0) && (unit.eff !== 0)) {
      // first, is there a unit adjacent to it? if yes, and can attack, attack; if attacked, make unit visible
      for (x = -1; x <= 1; x++) {
        for (y = -1; y <= 1; y++ ) {
          adjRow = (row + x);
          adjCol = (col + y);
          // make sure we didn't go out of bounds
          if (adjRow < 1) {
            adjRow = 1;
          }
          if (adjRow > _rows) {
            adjRow = _rows;
          }
          if (adjCol < 1) {
            adjCol = 1;
          }
          if (adjCol > _cols) {
            adjCol = _cols;
          }
          
          // get the map array pos for row 
          pos = getArrayPosforRowCol(_mapArray, adjRow, adjCol);
          // is there a player unit there? 
          if ((_mapArray[pos].unit !== null) && (_mapArray[pos].unit.player == "human")) {
               // attack!
               doAttack(unit, _mapArray[pos], pos);
              // make the attackimg unit visible and set their attacked flag
              _mapArray[ctr].unit.has_attacked = 1;
              _mapArray[ctr].unit.visible = 1;
              // break out of loop, we're done
              break;
          }
        }
      }
    }
    // if not, determie how aggressive (if aggressive, find nearest friendly unit and move towards them; 
    // if not aggressive, stay still); sniper units will be less aggressive in general; if moved, 
    // make unit visible
    else {
      agg = getRandomNum(10);
      // mod that num based on unit type 
      if (unit.type == "sniper") {
        agg--;
      }
      
      
      
    }
    
      // now, after moving, anything next to it? Again, if yes, attack; if attacked, make unit visible 
      
      // if not, see if anything within range (for MG or sniper); if yes. attack; if attacked, 
      // make unit visible 
      
      // add in artificial delay 
      
      // finally, if not next to another unit, percentage chance it is no longer visible 
      
    
  }
  
  setTimeout(switchTurn, 3000);

}


// setup map array
function setupMapArray() {

  var rnd;
  var terrainColor;
  var terrainType;
  var sq;

  for (var row = 1; row <= _rows; row++) {
    for (var col = 1; col <= _cols; col++) {

      // randomize color of hex (lt green, dark green, brown)
      rnd = getRandomNum(1, 10);
      if (rnd <= 7) {
        terrainType = "Grassy";
        terrainColor = "#009900"; // green (grassy/open)
      } else if (rnd >= 9) {
        terrainType = "Woods";
        terrainColor = "#006600"; // dark green (woods/rough)
      } else {
        terrainType = "Rocky";
        terrainColor = "#996600"; // brown (rocky)
      }

      sq = {
        color: terrainColor,
        type: terrainType,
        row: row,
        col: col,
        unit: null
      };

      // 9/28 - add to array
      _mapArray.push(sq);

    }
  }

}

// use row and col to figure out actual x and y position
function getUnitXY(sq) {

  var x = 0;
  var y = 0;
  var t = null;

  y = ((sq.row - 1) * _squareSize) + 9;
  x = ((sq.col - 1) * _squareSize) + 9;
  t = new Tuple(x, y);
  return t;

}


function selectUnit(sq, pos) {

  var t = getUnitXY(sq);

  _ctx.beginPath();
  _ctx.lineWidth = 3;
  _ctx.strokeStyle = _strokeColorHighlight;
  _ctx.rect(t[0] - 1, t[1] - 1, 35, 29);
  _ctx.stroke();
  // set unit to be active
  sq.unit.active = 1;
  // update the main array
  _mapArray[pos] = sq;
  // set the text
  setUnitText(sq.unit);

}

// loop through all units and make sure none are active
function deselectUnit(sq) {

  var t = null;

  // ignore if no active square
  if (sq.unit !== null) {
    sq.unit.active = 0;
    // draw that unit with regular color
    strokeColor = getUnitStrokeColor(sq.unit);
    img = getUnitImage(sq.unit);
    t = getUnitXY(sq);
    drawUnit(img, strokeColor, t[0], t[1]);
    // update the main array
    _mapArray[pos] = sq;
    // clear out any text
    clearUnitText();
  }
}

// clear out text
function clearTerrainText() {
  document.getElementById("lblTerrain").innerHTML = "";
}

// clear out text
function clearUnitText() {
  document.getElementById("lblUnit").innerHTML = "";
}

// show text
function setTerrainText(txt) {

  var lbl = "";

  lbl += "<font color=\"#ffffff\">Terrain:&nbsp;<b>" + txt + "</b></font><br>"

  if (txt == "Rocky") {
    lbl += "<br><font size=\"3\">Rocky terrain provides an advantage to a defending unit.</font>";
  } else if (txt == "Woods") {
    lbl += "<br><font size=\"3\">Woods provide an advantage to a defending unit.</font>";
  } else {
    lbl += "<br><font size=\"3\">Grassy terrain does not provide any advantages on defense.</font>";
  }
  document.getElementById("lblTerrain").innerHTML = lbl;
}

function setUnitText(unit) {

  var txt = "";
  var effectiveness = "";

  txt += "<font color=\"#ffffff\">";

  if (unit.player == "human") {
    txt += "Unit:&nbsp;<b>" + unit.type + " " + unit.size + "</b></font><br>";

    txt += "<font color=\"#ffffff\" size=\"3\">";

    if (unit.is_suppressed == 1) {
      txt += "<b>*** Unit is supressed and cannot move or attack. ***</b></br>"
    } else {
      if (unit.move_cur > 0) {
        txt += "Still able to move (" + unit.move_cur + ").<br>";
      } else {
        txt += "No movement left.<br>";
      }

      if (unit.has_attacked === 0) {
        txt += "Still able to attack.<br>";
        txt += "Attack range: " + unit.range + "<br>";
      } else {
        txt += "Already attacked.<br>";
      }
    }

    if (unit.eff === 0) {
      effectiveness = "No longer combat effective (black).";
    } else if (unit.eff == 1) {
      effectiveness = "Barely combat effective (red).";
    } else if (unit.eff == 2) {
      effectiveness = "Not at full combat effectiveness (amber).";
    } else {
      effectiveness = "Full combat effectiveness (green).";
    }

  } else {
    txt += "Enemy " + unit.type + " " + unit.size + ".<br></font>";
    txt += "<font color=\"#ffffff\" size=\"3\">";
    if (unit.eff === 3) {
      effectiveness = "This unit appears to be at full strength.";
     } else {
      effectiveness = "This unit has suffered some damage and is not at full strength.";
    }


  }

  txt += effectiveness + "<br>";
  txt += "</font>";
  document.getElementById("lblUnit").innerHTML = txt;
}

// is there a unit in this spot? 
function isEmpty(sq) {
  return (sq.unit === null);

}

// return whether ai or human
function getUnitPlayer(sq) {
  return sq.unit.player;

}

// is the toSq map spot adjaent to the fromSqu?
function isAdjacent(fromSq, toSq) {

  var fromRow = fromSq.row;
  var fromCol = fromSq.col;
  var adjacent = false;
  var t1 = null;
  var t2 = null;

  // create tuple for where user clicked
  t = new Tuple(toSq.row, toSq.col);

  // loop through to find all possible combinations
  for (var r = fromRow - 1; r < fromRow + 2; r++) {
    for (var c = fromCol - 1; c < fromCol + 2; c++) {
      // make sure within grid bounds
      if ((r > 0) && (r <= _rows) && (c > 0) && (c <= _cols)) {
        if ((r == toSq.row) && (c == toSq.col)) {
          adjacent = true;
          break;
        }
      }
    }
  }

  return adjacent;

}


function drawMapSquare(sq) {

  var x = (sq.row - 1) * _squareSize;
  var y = (sq.col - 1) * _squareSize;

  _ctx.beginPath();
  _ctx.lineWidth = 1;
  _ctx.strokeStyle = "black";
  _ctx.fillStyle = sq.color;
  _ctx.rect(y, x, _squareSize, _squareSize);
  _ctx.fill();
  _ctx.stroke();
  _ctx.closePath();

}

// move the unit
function moveUnit(fromSq, toSq) {

  var posFrom = 0;
  var posTo = 0;
  var unit = null;
  var sq = null;
  var x = 0;
  var y = 0;

  // first, update the array so new map 
  posFrom = getArrayPosforRowCol(_mapArray, fromSq.row, fromSq.col);
  posTo = getArrayPosforRowCol(_mapArray, toSq.row, toSq.col);

  // store what was there, then null it out
  sq = _mapArray[posFrom];
  unit = sq.unit;
  sq.unit = null;
  _mapArray[posFrom].sq = sq;

  // redraw the map square to overwrite the unit
  drawMapSquare(sq);

  // take the unit and drop off one move
  unit.move_cur -= 1;

  // now, drop that unit into the new square
  sq = _mapArray[posTo];
  sq.unit = unit;
  _mapArray[posTo].sq = sq;

  // finally, re-draw the unit at the new spot 
  y = ((sq.row - 1) * _squareSize) + 9;
  x = ((sq.col - 1) * _squareSize) + 9;

  // draw the infantry unit (either squad or platoon)
  img = getUnitImage(unit);

  drawUnit(img, _strokeColorHighlight, x, y);

  setUnitText(unit);


}

function doAttack(friendlyUnit, targetSq, pos) {

  var terrainMod = 0;
  var attackNum = 0;
  var damage = 0;
  var roll = 0;
  var enemyUnit = null;
  var arrayPos = 0;
  var effMod = 0;
  var strokeColor = "";
  var img = null;
  var t = null;
  var attackMsg = "";
  
  // store enemy unit
  enemyUnit = targetSq.unit;

  // if enemy wasn't already visible, draw the unit make it visible
  if (enemyUnit.visible === 0) {
    enemyUnit.visible = 1;
    strokeColor = getUnitStrokeColor(sq.unit);
    img = getUnitImage(sq.unit);
    t = getUnitXY(sq);
    drawUnit(img, strokeColor, t[0], t[1]);

  }

  // set the has_attacked property to 1
  friendlyUnit.has_attacked = 1;
  _mapArray[pos].sq = friendlyUnit;

  // quick check, if combat effectivenss is "black" (0), just bail
  if (friendlyUnit.eff === 0) {
    return;
  }

  // need to determine attack number; this is unit attack base - effectiveness modifier - terrain modifier 
  if ((targetSq.terrain == "Woods") || (targetSq.terrain == "Rocky")) {
    terrainMod = -1;
  }

  if (friendlyUnit.eff == 1) {
    effMod = -2;
  } else if (friendlyUnit.eff == 2) {
    effMod = -1;
  }

  attackNum = friendlyUnit.attack - effMod - terrainMod;

  // pick a random number from 1 - 10 and see if attack num is below that 
  roll = getRandomNum(1, 10);

  alertMessage("attackNum: " + attackNum + ", roll: " + roll);

  if (roll <= attackNum) {
    // hit!
    damage = getRandomNum(1, 10);
    alertMessage("damage: " + damage);
    if (damage <= 8) {
      enemyUnit.eff--;
      alertMessage("unit lost effectiveness");
      attackMsg = "The unit was hit and took damage.";
    }

    // certain types of unit cause supression
    if ((friendlyUnit.type == "mg") || (friendlyUnit.type == "sniper") || (friendlyUnit.type == "mortar")) {
      enemyUnit.is_suppressed = 1;
      alertMessage("unit supressed!");
      attackMsg += " It was also suppressed (no movement or attack possible).";
    }

  }

  // if attacked a computer unit, want to do a pop-up
  if ((enemyUnit.player == "ai") && (attackMsg !== "")) {
    alert(attackMsg);
  }
  
  // update text (since we attacked)
  if (friendlyUnit.player == "human") {
    setUnitText(friendlyUnit);
  }

  // if enemy unit has gone to black, just get rid of it. 
  if ((enemyUnit.eff === 0) && (enemyUnit.player == "ai")) {
    alertMessage("Enemy unit elimated!");
    _mapArray[arrayPos].unit = null;
    // redraw that map square since unit gone
    drawMapSquare(targetSq);
  } else {
    // update the unit that was attacked 
    arrayPos = getArrayPosforRowCol(_mapArray, targetSq.row, targetSq.col);
    _mapArray[arrayPos].unit = enemyUnit;
  }

}

// does what it says
function doNothing() {
  return;
}

// capture mouse down  
function doMouseDown(evt) {

  var pos = 0;
  var sq = null;
  var unit = null;
  var t = null;
  var row = 0;
  var col = 0;

  // get the x and y based on canvas rectangle
  var mousePos = getMousePos(document.getElementById("myCanvas"), evt);

  // now, figure out where we are at
  row = Math.floor(mousePos.y / _squareSize + 1);
  col = Math.floor(mousePos.x / _squareSize + 1);
  pos = getArrayPosforRowCol(_mapArray, row, col);
  sq = _mapArray[pos];
  unit = sq.unit;

  // show some terrain info 
  setTerrainText(sq.type);

  // is there already an active square and same as what we just clicked?
  if ((_activeSq !== null) && (_activeSq == sq)) {
    alertMessage("_activeSq and sq are the same");
    // if there is an already selected unit in it, we want to deselect that unit
    if (unit.active == 1) {
      alertMessage("already an active unit here");
      deselectUnit(sq);
      clearUnitText();
      _activeSq = null;
      return;
    }
  }

  // if no active square, and there's a player's unit, make it active 
  if ((_activeSq === null) && (unit !== null) && (unit.player == "human") && (unit.active === 0)) {
    alertMessage("no active square and clicked on player unit");
    // if the unit is not active, make it so
    selectUnit(sq, pos);
    // set display text
    setUnitText(unit);
    // store as well
    _activeSq = sq;
    // can just leave now
    return;

  }

  // can we tell distance?
  //alertMessage(getDistanceBetweenSquares(_activeSq.row, _activeSq.col, sq.row, sq.col));

  // if active square, is the current seelcted square adjacent?
  if ((_activeSq !== null) && (isAdjacent(_activeSq, sq))) {
    alertMessage("active square and selected square is adjacent");
    // if empty and unit has move left, move there
    if ((isEmpty(sq)) && (_activeSq.unit !== null) && (_activeSq.unit.move_cur > 0)) {
      moveUnit(_activeSq, sq);
    }
    // if not empty, and there is friendly there, just bail 
    else if ((!isEmpty(sq)) && (sq.unit.player == "human")) {
      alertMessage("friendly in our way ... switch over to that unit");
      selectUnit(sq, pos);
      setUnitText(sq.unit);
      deselectUnit(_activeSq);
    }
    // if not emoty, there is enemy and haven't attacked yet, attack
    else if ((!isEmpty(sq)) && (sq.unit.player == "ai") && (_activeSq.unit.has_attacked === 0)) {
      doAttack(_activeSq.unit, sq, pos);
      // don't swap out acive square
      return;
    }
    // if not empty, there is enemy but we have attacked, just bail 
    else if ((!isEmpty(sq)) && (sq.unit.player == "ai") && (_activeSq.unit.has_attacked === 1)) {
      alertMessage("enemy there but already attacked ... bail");
      return;
    }

  } else if ((_activeSq !== null) && (!isAdjacent(_activeSq, sq))) {
    alertMessage("active square and selected square is not adjacent");
    // if human player in spot, make that unit active
    if ((sq.unit !== null) && (sq.unit.player == "human")) {
      // deselect any other unit
      deselectUnit(_activeSq);
      selectUnit(sq);
    } else {
      // is there an enemy player there, within range and we haven't attacked yet? 
      if ((sq.unit !== null) && (sq.unit.player == "ai") && (_activeSq.unit !== null) && (_activeSq.unit.has_attacked === 0)) {
        alertMessage("enemy player in square and we haven't attacked yet");
        // what is the range? 
        if (getDistanceBetweenSquares(_activeSq.row, _activeSq.col, sq.row, sq.col) <= _activeSq.unit.range) {
          alertMessage("enemy within range, about to attack!");
          // actually can do an attack
          doAttack(_activeSq.unit, sq, pos);
        }
        // jump out because we want to keep active square the unit that attacked
        return;
        
      } else {
        // nope, just don't set an active square and bail
        _activeSq = null;
        return;

      }
    }

  }
  // clicked on a unit, but it is an enemy that is visible
  else if ((unit !== null) && (unit.player == "ai") && (unit.visible == 1)) {
    alertMessage("clicked on visible enemy unit");
    // it is an enemy unit, so can show some things (but not all)
    setUnitText(unit);

  }

  // if we got this far and the active unit has no movement or attack left, deselect it
  /*
  if ((_activeSq.unit.move_cur === 0) && (_activeSq.unit.has_attacked == 1)) {
    _activeSq = null;
    deselectUnit(_activeSq);
    return;
  }
  */

  // store this on way out
  _activeSq = sq;

}


// draw actual map based on initial array 
function drawMap() {
  // main canvas and context vars we'll keep using  

  _canvas = document.getElementById("myCanvas");
  _ctx = _canvas.getContext("2d");

  // add the mouse down capture 
  _canvas.addEventListener("mousedown", doMouseDown, false);
  
  // wait until all images are actually loaded before drawing on the map
  _imgInfPlatoon.onload = function() {
    drawAllUnits();
  };

  // walk through and draw the actual map squares 
  for (var row = 1; row <= _rows; row++) {
    for (var col = 1; col <= _cols; col++) {

      x = (row - 1) * _squareSize;
      y = (col - 1) * _squareSize;

      _ctx.beginPath();
      _ctx.strokeStyle = "black";
      _ctx.fillStyle = _mapArray[getArrayPosforRowCol(_mapArray, row, col)].color;
      _ctx.rect(y, x, _squareSize, _squareSize);
      _ctx.fill();
      _ctx.stroke();
      _ctx.closePath();
    }

  }

  // set all the image sources 
  _imgSniperTeam.src = "sniper_team_34x28.png";
  _imgMGTeam.src = "mg_team_34x28.png";
  _imgMortarSection.src = "mortar_section_34x28.png";
  _imgHQ.src = "hq_section_34x28.png";
  _imgInfSquad.src = "inf_squad_34x28.png";
  _imgInfPlatoon.src = "inf_platoon_34x28.png";

   // give images two additional seconds to load
  setTimeout(doNothing, 2000);
  
}

// draw unit type at specified location
function drawUnit(img, strokeColor, x, y) {

  // everything else remains the same 
  _ctx.beginPath();
  _ctx.lineWidth = 3;
  _ctx.strokeStyle = strokeColor;
  _ctx.drawImage(img, x, y);
  _ctx.rect(x - 1, y - 1, 35, 29);
  _ctx.stroke();

}

// return the img to use for the unit
function getUnitImage(unit) {

  var img = null;

  if (unit.type == "Infantry") {
    if (unit.size == "Squad") {
      img = _imgInfSquad;
    } else {
      img = _imgInfPlatoon;
    }
  }
  if (unit.type == "MG") {
    img = _imgMGTeam;
  }
  if (unit.type == "Mortar") {
    img = _imgMortarSection;
  }
  if (unit.type == "HQ") {
    img = _imgHQ;
  }
  if (unit.type == "Sniper") {
    img = _imgSniperTeam;
  }

  return img;

}

// return the unit's stroke color
function getUnitStrokeColor(unit) {

  var strokeColor = null;

  if (unit.player == "ai") {
    strokeColor = "#c0c0c0"; // ai always shows grey
  } else {
    if (unit.eff == 3) {
      strokeColor = "#00ff00";
    }
    if (unit.eff == 2) {
      strokeColor = "#ffff00";
    }
    if (unit.eff == 1) {
      strokeColor = "#ff0000";
    }
    if (unit.eff === 0) {
      strokeColor = "#000000";
    }
  }

  return strokeColor;

}

// loop through to draw units 
function drawAllUnits() {

  var x;
  var y;
  var unit;
  var strokeColor;
  var img;

  for (var ctr = 0; ctr < _mapArray.length; ctr++) {

    unit = _mapArray[ctr].unit;

    if ((unit !== null) && (unit.visible == 1)) {

      // base x and y on the row 
      y = ((_mapArray[ctr].row - 1) * _squareSize) + 9;
      x = ((_mapArray[ctr].col - 1) * _squareSize) + 9;

      // figure out the color to put around the image 
      strokeColor = getUnitStrokeColor(unit);

      // draw the infantry unit (either squad or platoon)
      img = getUnitImage(unit);

      // now draw the unit
      drawUnit(img, strokeColor, x, y);

    }
  }
}

// build start position for friendly units 
function setupFriendlies() {

  var col = 0;
  var row = 0;
  var unit;
  var ctr = 0;
  var sq;
  var pos;

  // 3 inf platooms
  unit = {
    type: "Infantry",
    size: "Platoon",
    eff: 3,
    name: "alpha",
    player: "human",
    visible: 1,
    active: 0,
    move_max: 3,
    move_cur: 3,
    range: 1,
    has_attacked: 0,
    is_suppressed: 0,
    attack: 6
  };
  _friendlyArray.push(unit);
  pos = getArrayPosforRowCol(_mapArray, 1, 6);
  sq = _mapArray[pos];
  sq.unit = unit;
  _mapArray[pos] = sq;

  unit = {
    type: "Infantry",
    size: "Platoon",
    eff: 3,
    name: "bravo",
    player: "human",
    visible: 1,
    active: 0,
    move_max: 3,
    move_cur: 3,
    range: 1,
    has_attacked: 0,
    is_suppressed: 0,
    attack: 6
  };
  _friendlyArray.push(unit);
  pos = getArrayPosforRowCol(_mapArray, 5, 4);
  sq = _mapArray[pos];
  sq.unit = unit;
  _mapArray[pos] = sq;

  unit = {
    type: "Infantry",
    size: "Platoon",
    eff: 3,
    name: "charlie",
    player: "human",
    visible: 1,
    active: 0,
    move_max: 3,
    move_cur: 3,
    range: 1,
    has_attacked: 0,
    is_suppressed: 0,
    attack: 6
  };
  _friendlyArray.push(unit);
  pos = getArrayPosforRowCol(_mapArray, 5, 8);
  sq = _mapArray[pos];
  sq.unit = unit;
  _mapArray[pos] = sq;

  // 1 mg section
  unit = {
    type: "MG",
    size: "Team",
    eff: 3,
    name: "delta",
    player: "human",
    visible: 1,
    active: 0,
    move_max: 2,
    move_cur: 2,
    range: 3,
    has_attacked: 0,
    is_suppressed: 0,
    attack: 6
  };
  _friendlyArray.push(unit);
  pos = getArrayPosforRowCol(_mapArray, 4, 6);
  sq = _mapArray[pos];
  sq.unit = unit;
  _mapArray[pos] = sq;

  // 1 mortar section
  unit = {
    type: "Mortar",
    size: "Section",
    eff: 3,
    name: "echo",
    player: "human",
    visible: 1,
    active: 0,
    move_max: 2,
    move_cur: 2,
    range: 5,
    has_attacked: 0,
    is_suppressed: 0,
    attack: 7
  };
  _friendlyArray.push(unit);
  pos = getArrayPosforRowCol(_mapArray, 2, 6);
  sq = _mapArray[pos];
  sq.unit = unit;
  _mapArray[pos] = sq;

  // 1 hq section
  unit = {
    type: "HQ",
    size: "Section",
    eff: 3,
    name: "foxtrot",
    player: "human",
    visible: 1,
    active: 0,
    move_max: 3,
    move_cur: 3,
    range: 1,
    has_attacked: 0,
    is_suppressed: 0,
    attack: 2
  };
  _friendlyArray.push(unit);
  pos = getArrayPosforRowCol(_mapArray, 3, 6);
  sq = _mapArray[pos];
  sq.unit = unit;
  _mapArray[pos] = sq;

}

// set up bad guys 
function setupOpfor() {

  var col = 0;
  var row = 0;
  var startPosArray = [];
  var mapTuple;
  var unit;
  var ctr = 0;
  var sq;

  // how many bad guys (between 5 and 10)
  _rifleSquads = getRandomNum(5, 10);
  // then how many mg sections
  _mgTeams = getRandomNum(0, 3);
  // subtract out mg sections
  _rifleSquads = _rifleSquads - _mgTeams;
  // tack on a possible sniper team 
  _sniperTeams = getRandomNum(0, 1);

  // for each rifle squad, pick a random spot for them to start
  for (var i = 0; i < _rifleSquads; i++) {
    while (true) {
      col = getRandomNum(1, _cols);
      row = getRandomNum(8, _rows);
      mapTuple = new Tuple(row, col);
      if (!isMapSpotTaken(startPosArray, mapTuple)) {
        startPosArray.push(mapTuple);
        break;
      }
    }

    // create unit now that we know map position and add to array
    ctr++;
    unit = {
      type: "Infantry",
      size: "Squad",
      eff: 3,
      name: "rifle" + ctr.toString(),
      player: "ai",
      visible: 1,
      active: 0,
      move_max: 3,
      move_cur: 3,
      has_attacked: 0,
      is_suppressed: 0,
      range: 1,
      attack: 3
    };
    _opforArray.push(unit);

    // 9/28 - also update main hexarray with this unit
    pos = getArrayPosforRowCol(_mapArray, row, col);
    sq = _mapArray[pos];
    sq.unit = unit;
    _mapArray[pos] = sq;

  }

  // repeat for each mg section
  for (var j = 0; j < _mgTeams; j++) {
    while (true) {
      col = getRandomNum(1, _cols);
      row = getRandomNum(8, _rows);
      mapTuple = new Tuple(row, col);
      if (!isMapSpotTaken(startPosArray, mapTuple)) {
        startPosArray.push(mapTuple);
        break;
      }
    }

    // create unit now that we know map position and add to array
    ctr++;
    unit = {
      type: "MG",
      size: "Team",
      eff: 3,
      name: "mg" + ctr.toString(),
      player: "ai",
      visible: 1,
      active: 0,
      move_max: 2,
      move_cur: 2,
      range: 3,
      has_attacked: 0,
      is_suppressed: 0,
      attack: 5
    };
    _opforArray.push(unit);

  }

  // repeat for each sniper team
  for (var k = 0; k < _sniperTeams; k++) {
    while (true) {
      col = getRandomNum(1, _cols);
      row = getRandomNum(8, _rows);
      mapTuple = new Tuple(row, col);
      if (!isMapSpotTaken(startPosArray, mapTuple)) {
        startPosArray.push(mapTuple);
        break;
      }
    }

    // create unit now that we know map position and add to array
    ctr++;
    unit = {
      type: "Sniper",
      size: "Team",
      eff: 3,
      name: "sniper" + ctr.toString(),
      player: "ai",
      visible: 1,
      active: 0,
      move_max: 2,
      move_cur: 2,
      range: 5,
      has_attacked: 0,
      is_suppressed: 0,
      attack: 3
    };
    _opforArray.push(unit);

    // 9/28 - also update main hexarray with this unit
    pos = getArrayPosforRowCol(_mapArray, row, col);
    sq = _mapArray[pos];
    sq.unit = unit;
    _mapArray[pos] = sq;

  }

}
