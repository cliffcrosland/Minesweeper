(function () {
  var NUM_ROWS = 10, NUM_COLS = 10, NUM_BOMBS = 10, BOMB_STRING = "B";

  var gameGridModel = null, solverGridModel = null;

  $(init);

  function init() {
    gameGridModel = new GameGridModel(NUM_ROWS, NUM_COLS, NUM_BOMBS);
    solverGridModel = new SolverGridModel(NUM_ROWS, NUM_COLS, NUM_BOMBS, gameGridModel);

    initUI();
  }

  ////////////////////////////
  // Models
  ////////////////////////////

  /////////////////
  // GameGridModel
  /////////////////

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

  ////////////////////
  // SolverGridModel
  ////////////////////
  function SolverGridModel(numRows, numCols, numBombs, gameGridModel) {
    var self = this;

    self.numRows = numRows;
    self.numCols = numCols;
    self.numBombs = numBombs;
    self.gameGridModel = gameGridModel;

    self.revealed = newDataGrid(numRows, numCols, false);
    self.bombDistribution = newDataGrid(numRows, numCols, numBombs / (numRows * numCols));

    self.get = function(row, col) {
      return self.bombDistribution[row][col];
    };

    self.update = function() {
      for (var row = 0; row < self.numRows; row++) {
        for (var col = 0; col < self.numCols; col++) {
          if (self.revealed[row][col] != self.gameGridModel.isRevealed(row, col)) {
            self.revealed[row][col] = self.gameGridModel.isRevealed(row, col);
            self.updateBombDistribution(row, col);
          }
        }
      }
    };

    self.updateBombDistribution = function(measurementRow, measurementCol) {
      var posteriorDistribution = newDataGrid(self.numRows, self.numCols, 0)
      , measurement = { row : measurementRow, col : measurementCol, value : self.gameGridModel.get(measurementRow, measurementCol) };
      for (var row = 0; row < self.numRows; row++) {
        for (var col = 0; col < self.numCols; col++) {
          var prior = self.bombDistribution[row][col];
          var measurementProb = self.getMeasurementProbability(measurement, row, col);
          // numerator of P(B_i | M) = P(M | B_i)  *  P(B_i)
          //              posterior  = measurement *  prior
          // B_i = bomb at this cell
          // M = prob of measurement
          posteriorDistribution[row][col] = measurementProb * prior;
        }
      }

      // Normalize
      // P(B_i | M) = numerator / P(M)
      var sum = 0;
      for (var row = 0; row < self.numRows; row++) {
        for (var col = 0; col < self.numCols; col++) {
          sum += posteriorDistribution[row][col];
        }
      }
      sum /= self.numBombs; // want a distribution of bombs, not a probability distribution.
      for (var row = 0; row < self.numRows; row++) {
        for (var col = 0; col < self.numCols; col++) {
          posteriorDistribution[row][col] /= sum;
        }
      }

      // Write into bomb distribution
      for (var row = 0; row < self.numRows; row++) {
        for (var col = 0; col < self.numCols; col++) { 
          self.bombDistribution[row][col] = posteriorDistribution[row][col];
        }
      }
    };

    // Get P(M | B_i).  That is, the probability of getting measurement M if there were a bomb at (row, col).
    self.getMeasurementProbability = function(measurement, row, col) {
      var neighborCoords = self.getNeighborCoords(measurement.row, measurement.col);
      var measurementCoord = [measurement.row, measurement.col];
      var coordIsRowCol = function(coord) { return coord[0] == row && coord[1] == col; };
      // If the coord is the measurement, then there's no way there's a bomb here.
      if (measurement.row == row && measurement.col == col) {
        return 0;
      }
      // If the coord is not a neighbor of the measurement, return 1.
      if (!_.find(neighborCoords, coordIsRowCol)) {
        var prob = self.getProbabilityOfNumberOfBombsOnCoords(measurement.value, neighborCoords);
        // ???
        // TODO: Somehow, account for the fact that a bomb on this coord affects the probability of the measurement.
        return prob;
      }
      // Exclude the coord in question from the neighbors of the measurement.
      neighborCoords = _.reject(neighborCoords, coordIsRowCol);
      // P(measurement | bomb at row, col) = P(there are exactly (measurement - 1) bombs on all of the neighbors)
      var prob = self.getProbabilityOfNumberOfBombsOnCoords(measurement.value - 1, neighborCoords);
      return prob;
    };

    self.getProbabilityOfNumberOfBombsOnCoords = function(numBombs, coords) {
      var groupings = [];
      var makeGroupings = function recurse(numberToChoose, chosen, pool) {
        if (chosen.length == numberToChoose) {
          groupings.push([chosen.slice(0, chosen.length), pool.slice(0, pool.length)]);
        } else {
          for (var i = 0; i < pool.length; i++) {
            var newChosen = chosen.slice(0, chosen.length);
            newChosen.push(pool[i]);
            var newPool = pool.slice(0, pool.length);
            newPool.splice(i, 1);
            recurse(numberToChoose, newChosen, newPool);
          }
        }
      };
      makeGroupings(numBombs, [], coords);
      var sum = 0;
      for (var i = 0; i < groupings.length; i++) {
        var chosenForBombs = groupings[i][0];
        var chosenForEmpty = groupings[i][1];
        var probForBombs = _.reduce(chosenForBombs, function(memo, coord) {
          return memo * self.bombDistribution[coord[0]][coord[1]];
        }, 1);
        var probForEmpty = _.reduce(chosenForEmpty, function(memo, coord) {
          return memo * (1 - self.bombDistribution[coord[0]][coord[1]]);
        }, 1);
        sum += probForBombs * probForEmpty;
      }
      return sum;
    };

    self.getNeighborCoords = function(r, c) {
      var neighborCoords = [], numRows = self.numRows, numCols = self.numCols;
      for (var row = r - 1; row <= r + 1; row++) {
        for (var col = c - 1; col <= c + 1; col++) {
          if (row == r && col == c) continue;
          if (row < 0 || row >= numRows || col < 0 || col >= numCols) continue;
          neighborCoords.push([row, col]);
        }
      }
      return neighborCoords;
    }

    self.init = function() {
      // Initialize knowledge of which cells are revealed
      for (var row = 0; row < self.numRows; row++) {
        for (var col = 0; col < self.numCols; col++) {
          self.revealed[row][col] = self.gameGridModel.isRevealed(row, col);
        }
      }
    };

    self.init();
  }

  // Create new data grid with the supplied dimensions, each element having the initial elem value.
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

  //////////////////////////////////////
  // UI
  //////////////////////////////////////
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
    // swallow right-click
    $("#game").on("contextmenu", "td", function() { return false; });

    $("#game_result").html("You " + result);
    $("#game_result").animate({
      "font-size" : "26px"
      }, 500);
  }

  function syncUI() {
    syncGridModelToUI(gameGridModel, $("#game"), gameGridCellRenderer);
    syncGridModelToUI(solverGridModel, $("#solver"), solverGridCellRenderer);
  }

  function syncGridModelToUI(dataModel, $container, cellRenderer) {
    var ret = "<table>";
    for (var row = 0; row < NUM_ROWS; row++) {
      ret += "<tr>";
      for (var col = 0; col < NUM_COLS; col++) {
        ret += cellRenderer(row, col, dataModel);
      }
      ret += "</tr>";
    }
    ret += "</table>";
    $container.html(ret);
  }

  function gameGridCellRenderer(row, col, dataModel) {
    if (dataModel.isRevealed(row, col)) {
      var value = dataModel.get(row, col);
      return "<td class=\"revealed " + getClassForValue(value) + "\">" + value + "</td>";
    } else if (dataModel.isFlagged(row, col)) {
      return "<td>f</td>";
    } else {
      return "<td></td>";
    }
  }

  function solverGridCellRenderer(row, col, dataModel) {
    return "<td>" + truncate(dataModel.get(row, col), 5) + "</td>";
  }

  function truncate(input, length) {
    return input.toString().substring(0, length);
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

    solverGridModel.update();
    syncUI();
  }

})();
