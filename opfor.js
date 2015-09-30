// manage the opposing force 
var rifleSquads = 0;
var mgSections = 0;
var opforArray = [];
var row = 0;
var col = 0;
var mapTuple; 
var unit;
var ctr = 0;
var startPosArray = [];

// 9/28 - return hex object at the row and col position
function getArrayPosforRowCol(arr, row, col) {
    for (var pos=0; pos < arr.length; pos++) {
        if ((arr[pos].row === row) && (arr[pos].col === col))  {
            return pos;
        }
    }
}

// function to decide if map tuple already has a unit on it
function isMapSpotTaken(a, t) {
  
    var retVal = false;  

    // if no items in array, then ok to add
    if (a.length === 0) {
      return retVal;
    }
    else {  
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

// master function
function setupOpfor() {

    // how many bad guys (between 5 and 10)
    rifleSquads =  Math.floor(Math.random() * (10 - 5 + 1)) + 5;
    // then how many mg sections
    mgSections =  Math.floor((Math.random() * 3) + 0);
    // subtract out mg sections
    rifleSquads = rifleSquads - mgSections;

    // for each rifle squad, pick a random spot for them to start
    for (var i = 0; i < rifleSquads; i++) { 
        while (true) {
            col = Math.floor((Math.random() * 19) + 0);
            row  = Math.floor((Math.random() * 10) + 0);
            mapTuple = new Tuple(row, col);
            if (!isMapSpotTaken(startPosArray, mapTuple)) {
                startPosArray.push(mapTuple);     
                break;
            }
        }

        // create unit now that we know map position and add to array
        ctr++;
        unit = {
            type: "inf_squad",
            eff: "green",
            name: "rifle" + ctr.toString(),
            visible: 0  
        };
        opforArray.push(unit);
    
        // 9/28 - also update main hexarray with this unit
        pos = getArrayPosforRowCol(hexArray, row, col);
        hex = hexArray[pos];
        hex.unit = unit;
        hexArray[pos] = hex;
    
    }

    // repeat for each mg section
    for (var j = 0; j < mgSections; j++) { 
        while (true) {
            col = Math.floor((Math.random() * 19) + 0);
            row  = Math.floor((Math.random() * 10) + 0);
            mapTuple = new Tuple(row, col);
            if (!isMapSpotTaken(startPosArray, mapTuple)) {
                startPosArray.push(mapTuple);     
                break;
            }
        }
    
        // create unit now that we know map position and add to array
        ctr++;
        unit = {
            type: "mg_section",
            eff: "green",
            name: "mg" + ctr.toString(),
            visible: 0 
        };
        opforArray.push(unit);
    
        // 9/28 - also update main hexarray with this unit
        pos = getArrayPosforRowCol(hexArray, row, col);
        hex = hexArray[pos];
        hex.unit = unit;
        hexArray[pos] = hex;
    
    }
        
}

