(function () {
  var NUM_ROWS = 10, NUM_COLS = 10, NUM_BOMBS = 10, BOMB_STRING = "B";

  var gameGridModel = null, solverGridModel = null;

  $(init);

  function init() {
    gameGridModel = new GameGridModel(NUM_ROWS, NUM_COLS, NUM_BOMBS);
    solverGridModel = new SolverGridModel(NUM_ROWS, NUM_COLS, gameGridModel);

    initUI();
  }

  ////////////////
  // Model
  ////////////////

  function GameGridModel(numRows, numCols, numBombs) {
    var self = this;

    self.numBombs = numBombs;
    self.bombData = newDataGrid(numRows, numCols, "");
    self.revealData = newDataGrid(numRows, numCols, false);
    self.flagData = newDataGrid(numRows, numCols, false);

    self.get = function(row, col) {
      return self.bombData[row][col];
    };

    self.set = function(row, col, val) {
      self.bombData[row][col] = val;
    };

    self.isRevealed = function(row, col) {
      return self.revealData[row][col];
    };

    self.setRevealed = function(row, col, val) {
      if (val == true && self.bombData[row][col] == "") {
        // Reveal all neighboring empty cells
        self.revealAllEmptyCells(row, col);
      }
      self.revealData[row][col] = val;
    }

    self.toggleFlag = function(row, col) {
      self.flagData[row][col] = !self.flagData[row][col];
    }

    self.isFlagged = function(row, col) {
      if (self.revealData[row][col]) return false;
      return self.flagData[row][col];
    }

    self.revealAllEmptyCells = function(startRow, startCol) {
      var startCoord = [startRow, startCol];
      var coordsQueue = [startCoord];
      while (coordsQueue.length > 0) {
        var coord = coordsQueue.shift();
        var row = coord[0], col = coord[1];
        if (!self.revealData[row][col]) {
          self.revealData[row][col] = true;
          if (self.get(row, col) == "") {
            var neighborCoords = self.getNeighborCoords(row, col);
            for (var i = 0; i < neighborCoords.length; i++) {
              coordsQueue.push(neighborCoords[i]);
            }
          }
        }
      }
    }

    self.flagsEqualBombs = function () {
      var matchCount = 0, flagCount = 0, numRows = self.bombData.length, numCols = self.bombData[0].length;
      for (var row = 0; row < numRows; row++) {
        for (var col = 0; col < numCols; col++) {
          if (self.flagData[row][col]) {
            flagCount++;
            if (self.bombData[row][col] == BOMB_STRING) {
              matchCount++;
            }
          }
        }
      }
      return matchCount == self.numBombs && flagCount == self.numBombs;
    }

    self.allNonBombsRevealed = function () {
      var revealCount = 0, numRows = self.bombData.length, numCols = self.bombData[0].length;
      for (var row = 0; row < numRows; row++) {
        for (var col = 0; col < numCols; col++) {
          if (self.revealData[row][col]) {
            revealCount++;
          }
        }
      }
      return revealCount + self.numBombs == numRows * numCols;
    }

    self.getNeighborCoords = function(r, c) {
      var neighborCoords = [], numRows = self.bombData.length, numCols = self.bombData[0].length;
      for (var row = r - 1; row <= r + 1; row++) {
        for (var col = c - 1; col <= c + 1; col++) {
          if (row == r && col == c) continue;
          if (row < 0 || row >= numRows || col < 0 || col >= numCols) continue;
          neighborCoords.push([row, col]);
        }
      }
      return neighborCoords;
    }

    self.getNeighborValues = function(r, c) {
      var neighborCoords = self.getNeighborCoords(r, c), neighborValues = [];
      for (var i = 0; i < neighborCoords.length; i++) {
        var coord = neighborCoords[i];
        neighborValues.push(self.get(coord[0], coord[1]));
      }
      return neighborValues;
    };

    self.init = function() {
      // Place bombs randomly
      var coords = [], numRows = self.bombData.length, numCols = self.bombData[0].length;
      for (var row = 0; row < numRows; row++) {
        for (var col = 0; col < numCols; col++) {
          coords.push([row, col]);
        }
      }
      coords = _.shuffle(coords);
      for (var bomb = 0; bomb < self.numBombs; bomb++) {
        var bombCoord = coords[bomb];
        self.set(bombCoord[0], bombCoord[1], BOMB_STRING);
      }

      // Label bomb neighbors with the number of bombs nearby.
      for (var row = 0; row < numRows; row++) {
        for (var col = 0; col < numCols; col++) {
          if (self.get(row, col) == BOMB_STRING) continue;
          var neighbors = self.getNeighborValues(row, col);
          var numBombsNearby = _.filter(neighbors, function(value) { return value == BOMB_STRING; }).length;
          var value = (numBombsNearby > 0 ? numBombsNearby : "");
          self.set(row, col, value);
        }
      }
    };

    self.init();
  }

  function SolverGridModel(numRows, numCols, gameGridModel) {
    var self = this;
    // TODO: implement
    self.get = function(row, col) {
      return "hi";
    }
  }

  function newDataGrid(numRows, numCols, initElemValue) {
    var ret = new Array(numRows);
    for (var row = 0; row < numRows; row++) {
      ret[row] = new Array(numCols);
      for (var col = 0; col < numCols; col++) {
        ret[row][col] = initElemValue;
      }
    }
    return ret;
  }

  ////////////////
  // UI
  ////////////////
  function initUI() {
    // left-click
    $("#game").on("click", "td", gameCellClickHandler);
    // right-click
    $("#game").on("contextmenu", "td", gameCellClickHandler);

    syncUI();
  }

  function gameOver(result) {
    $("#game").off("click");
    $("#game").off("contextmenu");
    $("#game").on("contextmenu", "td", function() { return false; });
    $("#game_result").html("You " + result);
    $("#game_result").animate({
      "font-size" : "26px"
      }, 500);
  }

  function syncUI() {
    createTableLayout($("#game"), gameGridModel);
    // createTableLayout($("#solver"), solverGridModel);
  }

  function createTableLayout($container, dataModel) {
    var ret = "<table>";
    for (var row = 0; row < NUM_ROWS; row++) {
      ret += "<tr>";
      for (var col = 0; col < NUM_COLS; col++) {
        if (dataModel.isRevealed(row, col)) {
          var value = dataModel.get(row, col);
          ret += "<td class=\"revealed " + getClassForValue(value) + "\">" + value + "</td>";
        } else if (dataModel.isFlagged(row, col)) {
          ret += "<td>f</td>";
        } else {
          ret += "<td></td>";
        }
      }
      ret += "</tr>";
    }
    ret += "</table>";
    $container.html(ret);
  }

  function getClassForValue(value) {
    if (value == BOMB_STRING) {
      return "bomb";
    }
    var number = parseInt(value, 10);
    var numberClasses = ["", "one", "two", "three", "four", "five", "six", "seven", "eight"];
    return numberClasses[number];
  }

  function gameCellClickHandler(evt) {
    evt.preventDefault();
    console.log(evt);

    var row = $(this).parent().parent().children().index(this.parentNode);
    var col = $(this).parent().children().index(this);

    if (evt.button == 0) {
      // left click
      if (gameGridModel.get(row, col) == BOMB_STRING) {
        gameOver("lose");
      }
      if (!gameGridModel.isRevealed(row, col)) {
        gameGridModel.setRevealed(row, col, true);
      }
    } else {
      // right click
      if (!gameGridModel.isRevealed(row, col)) {
        gameGridModel.toggleFlag(row, col);
      }
    }

    if (gameGridModel.flagsEqualBombs() && gameGridModel.allNonBombsRevealed()) {
      gameOver("win");
    }

    syncUI();
  }

})();
