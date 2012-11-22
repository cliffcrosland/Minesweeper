// Generated by CoffeeScript 1.4.0
(function() {
  var BOMB_STRING, GameGridModel, GridModels, NUM_BOMBS, NUM_COLS, NUM_ROWS, SolverGridModel, Utils, gameCellClickHandler, gameGridCellRenderer, gameOver, init, initUI, solverGridCellRenderer, syncGridModelToUI, syncUI;

  NUM_ROWS = 10;

  NUM_COLS = 10;

  NUM_BOMBS = 10;

  BOMB_STRING = "B";

  GridModels = {
    game: null,
    solver: null
  };

  init = function() {
    GridModels.game = new GameGridModel(NUM_ROWS, NUM_COLS, NUM_BOMBS);
    GridModels.solver = new SolverGridModel(NUM_ROWS, NUM_COLS, NUM_BOMBS, GridModels.game);
    return initUI();
  };

  $(init);

  GameGridModel = (function() {

    function GameGridModel(numRows, numCols, numBombs) {
      var bomb, bombCoord, col, coords, neighbors, numBombsNearby, row, value, _i, _j, _k, _l, _m, _ref, _ref1, _ref2, _ref3, _ref4;
      this.numRows = numRows;
      this.numCols = numCols;
      this.numBombs = numBombs;
      this.bombData = Utils.newDataGrid(this.numRows, this.numCols, "");
      this.revealData = Utils.newDataGrid(this.numRows, this.numCols, false);
      this.flagData = Utils.newDataGrid(this.numRows, this.numCols, false);
      coords = [];
      for (row = _i = 0, _ref = this.numRows; 0 <= _ref ? _i < _ref : _i > _ref; row = 0 <= _ref ? ++_i : --_i) {
        for (col = _j = 0, _ref1 = this.numCols; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; col = 0 <= _ref1 ? ++_j : --_j) {
          coords.push([row, col]);
        }
      }
      coords = _.shuffle(coords);
      for (bomb = _k = 0, _ref2 = this.numBombs; 0 <= _ref2 ? _k < _ref2 : _k > _ref2; bomb = 0 <= _ref2 ? ++_k : --_k) {
        bombCoord = coords[bomb];
        this.set(bombCoord[0], bombCoord[1], BOMB_STRING);
      }
      for (row = _l = 0, _ref3 = this.numRows; 0 <= _ref3 ? _l < _ref3 : _l > _ref3; row = 0 <= _ref3 ? ++_l : --_l) {
        for (col = _m = 0, _ref4 = this.numCols; 0 <= _ref4 ? _m < _ref4 : _m > _ref4; col = 0 <= _ref4 ? ++_m : --_m) {
          if (this.get(row, col) === BOMB_STRING) {
            continue;
          }
          neighbors = this.getNeighborValues(row, col);
          numBombsNearby = _.filter(neighbors, function(value) {
            return value === BOMB_STRING;
          }).length;
          value = numBombsNearby > 0 ? numBombsNearby : "";
          this.set(row, col, value);
        }
      }
    }

    GameGridModel.prototype.get = function(row, col) {
      return this.bombData[row][col];
    };

    GameGridModel.prototype.set = function(row, col, val) {
      return this.bombData[row][col] = val;
    };

    GameGridModel.prototype.isRevealed = function(row, col) {
      return this.revealData[row][col];
    };

    GameGridModel.prototype.setRevealed = function(row, col, val) {
      if (val && this.bombData[row][col] === "") {
        this.revealAllEmptyCellsTouchingThisCoord(row, col);
      }
      return this.revealData[row][col] = val;
    };

    GameGridModel.prototype.revealAll = function() {
      var col, row, _i, _ref, _results;
      _results = [];
      for (row = _i = 0, _ref = this.numRows; 0 <= _ref ? _i < _ref : _i > _ref; row = 0 <= _ref ? ++_i : --_i) {
        _results.push((function() {
          var _j, _ref1, _results1;
          _results1 = [];
          for (col = _j = 0, _ref1 = this.numCols; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; col = 0 <= _ref1 ? ++_j : --_j) {
            _results1.push(this.revealData[row][col] = true);
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    GameGridModel.prototype.toggleFlag = function(row, col) {
      return this.flagData[row][col] = !this.flagData[row][col];
    };

    GameGridModel.prototype.isFlagged = function(row, col) {
      if (this.revealData[row][col]) {
        return false;
      }
      return this.flagData[row][col];
    };

    GameGridModel.prototype.revealAllEmptyCellsTouchingThisCoord = function(startRow, startCol) {
      var col, coord, coordsQueue, neighborCoords, row, startCoord, _results;
      startCoord = [startRow, startCol];
      coordsQueue = [startCoord];
      _results = [];
      while (coordsQueue.length > 0) {
        coord = coordsQueue.shift();
        row = coord[0];
        col = coord[1];
        if (!this.revealData[row][col]) {
          this.revealData[row][col] = true;
          if (this.bombData[row][col] === "") {
            neighborCoords = Utils.getNeighborCoords(row, col, this.numRows, this.numCols);
            _results.push((function() {
              var _i, _len, _results1;
              _results1 = [];
              for (_i = 0, _len = neighborCoords.length; _i < _len; _i++) {
                coord = neighborCoords[_i];
                _results1.push(coordsQueue.push(coord));
              }
              return _results1;
            })());
          } else {
            _results.push(void 0);
          }
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    GameGridModel.prototype.flagsEqualBombs = function() {
      var col, flagCount, matchCount, row, _i, _j, _ref, _ref1;
      matchCount = 0;
      flagCount = 0;
      for (row = _i = 0, _ref = this.numRows; 0 <= _ref ? _i < _ref : _i > _ref; row = 0 <= _ref ? ++_i : --_i) {
        for (col = _j = 0, _ref1 = this.numCols; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; col = 0 <= _ref1 ? ++_j : --_j) {
          if (this.flagData[row][col]) {
            flagCount += 1;
            if (this.bombData[row][col] === BOMB_STRING) {
              matchCount += 1;
            }
          }
        }
      }
      return matchCount === this.numBombs && flagCount === this.numBombs;
    };

    GameGridModel.prototype.allNonBombsRevealed = function() {
      var col, revealCount, row, _i, _j, _ref, _ref1;
      revealCount = 0;
      for (row = _i = 0, _ref = this.numRows; 0 <= _ref ? _i < _ref : _i > _ref; row = 0 <= _ref ? ++_i : --_i) {
        for (col = _j = 0, _ref1 = this.numCols; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; col = 0 <= _ref1 ? ++_j : --_j) {
          if (this.revealData[row][col]) {
            revealCount += 1;
          }
        }
      }
      return revealCount + this.numBombs === this.numRows * this.numCols;
    };

    GameGridModel.prototype.getNeighborValues = function(r, c) {
      var coord, neighborCoords, neighborValues, _i, _len;
      neighborCoords = Utils.getNeighborCoords(r, c, this.numRows, this.numCols);
      neighborValues = [];
      for (_i = 0, _len = neighborCoords.length; _i < _len; _i++) {
        coord = neighborCoords[_i];
        neighborValues.push(this.get(coord[0], coord[1]));
      }
      return neighborValues;
    };

    return GameGridModel;

  })();

  SolverGridModel = (function() {

    function SolverGridModel(numRows, numCols, numBombs, gameGridModel) {
      var col, row, _i, _j, _ref, _ref1;
      this.numRows = numRows;
      this.numCols = numCols;
      this.numBombs = numBombs;
      this.gameGridModel = gameGridModel;
      this.allIsRevealed = false;
      this.revealed = Utils.newDataGrid(this.numRows, this.numCols, false);
      this.bombDistribution = Utils.newDataGrid(this.numRows, this.numCols, this.numBombs / (this.numRows * this.numCols));
      for (row = _i = 0, _ref = this.numRows; 0 <= _ref ? _i < _ref : _i > _ref; row = 0 <= _ref ? ++_i : --_i) {
        for (col = _j = 0, _ref1 = this.numCols; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; col = 0 <= _ref1 ? ++_j : --_j) {
          this.revealed[row][col] = this.gameGridModel.isRevealed(row, col);
        }
      }
    }

    SolverGridModel.prototype.get = function(row, col) {
      return this.bombDistribution[row][col];
    };

    SolverGridModel.prototype.revealAll = function() {
      var col, row, _i, _j, _ref, _ref1;
      for (row = _i = 0, _ref = this.numRows; 0 <= _ref ? _i < _ref : _i > _ref; row = 0 <= _ref ? ++_i : --_i) {
        for (col = _j = 0, _ref1 = this.numCols; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; col = 0 <= _ref1 ? ++_j : --_j) {
          this.bombDistribution[row][col] = this.gameGridModel.get(row, col) === BOMB_STRING ? 1.0 : 0.0;
        }
      }
      return this.allIsRevealed = true;
    };

    SolverGridModel.prototype.update = function() {
      var col, row, _i, _ref, _results;
      if (this.allIsRevealed) {
        return;
      }
      _results = [];
      for (row = _i = 0, _ref = this.numRows; 0 <= _ref ? _i < _ref : _i > _ref; row = 0 <= _ref ? ++_i : --_i) {
        _results.push((function() {
          var _j, _ref1, _results1;
          _results1 = [];
          for (col = _j = 0, _ref1 = this.numCols; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; col = 0 <= _ref1 ? ++_j : --_j) {
            if (this.revealed[row][col] !== this.gameGridModel.isRevealed(row, col)) {
              this.revealed[row][col] = this.gameGridModel.isRevealed(row, col);
              _results1.push(this.updateBombDistribution(row, col));
            } else {
              _results1.push(void 0);
            }
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    SolverGridModel.prototype.updateBombDistribution = function(measurementRow, measurementCol) {
      var col, measurement, measurementProb, posteriorDistribution, prior, row, sum, value, _i, _j, _k, _l, _m, _n, _o, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _results;
      posteriorDistribution = Utils.newDataGrid(this.numRows, this.numCols, 0);
      value = this.gameGridModel.get(measurementRow, measurementCol);
      measurement = {
        row: measurementRow,
        col: measurementCol,
        value: value === "" ? 0 : parseInt(value, 10)
      };
      for (row = _i = 0, _ref = this.numRows; 0 <= _ref ? _i < _ref : _i > _ref; row = 0 <= _ref ? ++_i : --_i) {
        for (col = _j = 0, _ref1 = this.numCols; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; col = 0 <= _ref1 ? ++_j : --_j) {
          prior = this.bombDistribution[row][col];
          measurementProb = this.getMeasurementProbability(measurement, row, col);
          posteriorDistribution[row][col] = measurementProb * prior;
        }
      }
      sum = 0;
      for (row = _k = 0, _ref2 = this.numRows; 0 <= _ref2 ? _k < _ref2 : _k > _ref2; row = 0 <= _ref2 ? ++_k : --_k) {
        for (col = _l = 0, _ref3 = this.numCols; 0 <= _ref3 ? _l < _ref3 : _l > _ref3; col = 0 <= _ref3 ? ++_l : --_l) {
          sum += posteriorDistribution[row][col];
        }
      }
      sum /= this.numBombs;
      for (row = _m = 0, _ref4 = this.numRows; 0 <= _ref4 ? _m < _ref4 : _m > _ref4; row = 0 <= _ref4 ? ++_m : --_m) {
        for (col = _n = 0, _ref5 = this.numCols; 0 <= _ref5 ? _n < _ref5 : _n > _ref5; col = 0 <= _ref5 ? ++_n : --_n) {
          posteriorDistribution[row][col] /= sum;
          if (posteriorDistribution[row][col] > 1) {
            posteriorDistribution[row][col] = 1;
          }
        }
      }
      _results = [];
      for (row = _o = 0, _ref6 = this.numRows; 0 <= _ref6 ? _o < _ref6 : _o > _ref6; row = 0 <= _ref6 ? ++_o : --_o) {
        _results.push((function() {
          var _p, _ref7, _results1;
          _results1 = [];
          for (col = _p = 0, _ref7 = this.numCols; 0 <= _ref7 ? _p < _ref7 : _p > _ref7; col = 0 <= _ref7 ? ++_p : --_p) {
            _results1.push(this.bombDistribution[row][col] = posteriorDistribution[row][col]);
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    SolverGridModel.prototype.getMeasurementProbability = function(measurement, row, col) {
      var coordIsRowCol, measurementCoord, neighborCoords, prob;
      neighborCoords = Utils.getNeighborCoords(measurement.row, measurement.col, this.numRows, this.numCols);
      measurementCoord = [measurement.row, measurement.col];
      coordIsRowCol = function(coord) {
        return coord[0] === row && coord[1] === col;
      };
      if (measurement.row === row && measurement.col === col) {
        return 0;
      }
      if (!_.find(neighborCoords, coordIsRowCol)) {
        prob = this.getProbabilityOfNumberOfBombsOnCoords(measurement.value, neighborCoords);
        return prob;
      }
      neighborCoords = _.reject(neighborCoords, coordIsRowCol);
      prob = this.getProbabilityOfNumberOfBombsOnCoords(measurement.value - 1, neighborCoords);
      return prob;
    };

    SolverGridModel.prototype.getProbabilityOfNumberOfBombsOnCoords = function(numBombs, coords) {
      var bombDistribution, chosenForBombs, chosenForEmpty, grouping, groupings, makeGroupings, probForBombs, probForEmpty, sum, _i, _len;
      groupings = [];
      makeGroupings = function(numberToChoose, chosen, pool) {
        var i, newChosen, newPool, _i, _ref, _results;
        if (chosen.length === numberToChoose) {
          return groupings.push([chosen.slice(0, chosen.length), pool.slice(0, pool.length)]);
        } else {
          _results = [];
          for (i = _i = 0, _ref = pool.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            newChosen = chosen.slice(0, chosen.length);
            newChosen.push(pool[i]);
            newPool = pool.slice(0, pool.length);
            newPool.splice(i, 1);
            _results.push(makeGroupings(numberToChoose, newChosen, newPool));
          }
          return _results;
        }
      };
      makeGroupings(numBombs, [], coords);
      sum = 0;
      for (_i = 0, _len = groupings.length; _i < _len; _i++) {
        grouping = groupings[_i];
        chosenForBombs = grouping[0];
        chosenForEmpty = grouping[1];
        bombDistribution = this.bombDistribution;
        probForBombs = _.reduce(chosenForBombs, (function(memo, coord) {
          return memo * bombDistribution[coord[0]][coord[1]];
        }), 1);
        probForEmpty = _.reduce(chosenForEmpty, (function(memo, coord) {
          return memo * (1 - bombDistribution[coord[0]][coord[1]]);
        }), 1);
        sum += probForBombs * probForEmpty;
      }
      return sum;
    };

    return SolverGridModel;

  })();

  initUI = function() {
    $("#game").on("click", "td", gameCellClickHandler);
    $("#game").on("contextmenu", "td", gameCellClickHandler);
    return syncUI();
  };

  gameOver = function(result) {
    $("#game").off("click");
    $("#game").off("contextmenu");
    $("#game").on("contextmenu", "td", function() {
      return false;
    });
    $("#game_result").html("You " + result);
    $("#game_result").animate({
      "font-size": "26px"
    }, 500);
    if (result === "lose") {
      GridModels.game.revealAll();
      return GridModels.solver.revealAll();
    }
  };

  gameGridCellRenderer = function(row, col, dataModel) {
    var value;
    if (dataModel.isRevealed(row, col)) {
      value = dataModel.get(row, col);
      return "<td class=\"revealed " + (Utils.getClassForValue(value)) + "\">" + value + "</td>";
    } else if (dataModel.isFlagged(row, col)) {
      return "<td>f</td>";
    } else {
      return "<td></td>";
    }
  };

  solverGridCellRenderer = function(row, col, dataModel) {
    var green, red, value;
    value = Utils.truncate(dataModel.get(row, col), 5);
    red = Utils.truncate(parseInt(255 * value, 10), 4);
    green = Utils.truncate(parseInt(255 * (1 - value), 10), 4);
    return "<td style=\"background-color: rgb(" + red + "," + green + ",0);\">" + value + "</td>";
  };

  syncUI = function() {
    syncGridModelToUI(GridModels.game, $("#game"), gameGridCellRenderer);
    return syncGridModelToUI(GridModels.solver, $("#solver"), solverGridCellRenderer);
  };

  syncGridModelToUI = function(dataModel, $container, cellRenderer) {
    var col, ret, row, _i, _j;
    ret = "<table>";
    for (row = _i = 0; 0 <= NUM_ROWS ? _i < NUM_ROWS : _i > NUM_ROWS; row = 0 <= NUM_ROWS ? ++_i : --_i) {
      ret += "<tr>";
      for (col = _j = 0; 0 <= NUM_COLS ? _j < NUM_COLS : _j > NUM_COLS; col = 0 <= NUM_COLS ? ++_j : --_j) {
        ret += cellRenderer(row, col, dataModel);
      }
      ret += "</tr>";
    }
    ret += "</table>";
    return $container.html(ret);
  };

  gameCellClickHandler = function(evt) {
    var col, row;
    evt.preventDefault();
    row = $(this).parent().parent().children().index(this.parentNode);
    col = $(this).parent().children().index(this);
    if (evt.button === 0) {
      if (!GridModels.game.isRevealed(row, col)) {
        GridModels.game.setRevealed(row, col, true);
      }
      if (GridModels.game.get(row, col) === BOMB_STRING) {
        gameOver("lose");
      }
    } else {
      if (!GridModels.game.isRevealed(row, col)) {
        GridModels.game.toggleFlag(row, col);
      }
    }
    if (GridModels.game.flagsEqualBombs() && GridModels.game.allNonBombsRevealed()) {
      gameOver("win");
    }
    GridModels.solver.update();
    return syncUI();
  };

  Utils = {
    newDataGrid: function(numRows, numCols, initElemValue) {
      var col, ret, row, _i, _j;
      ret = new Array(numRows);
      for (row = _i = 0; 0 <= numRows ? _i < numRows : _i > numRows; row = 0 <= numRows ? ++_i : --_i) {
        ret[row] = new Array(numCols);
        for (col = _j = 0; 0 <= numCols ? _j < numCols : _j > numCols; col = 0 <= numCols ? ++_j : --_j) {
          ret[row][col] = initElemValue;
        }
      }
      return ret;
    },
    getNeighborCoords: function(r, c, totalRows, totalCols) {
      var col, neighborCoords, row, _i, _j, _ref, _ref1, _ref2, _ref3;
      neighborCoords = [];
      for (row = _i = _ref = r - 1, _ref1 = r + 1; _ref <= _ref1 ? _i <= _ref1 : _i >= _ref1; row = _ref <= _ref1 ? ++_i : --_i) {
        for (col = _j = _ref2 = c - 1, _ref3 = c + 1; _ref2 <= _ref3 ? _j <= _ref3 : _j >= _ref3; col = _ref2 <= _ref3 ? ++_j : --_j) {
          if (row === r && col === c) {
            continue;
          }
          if (row < 0 || row >= totalRows || col < 0 || col >= totalCols) {
            continue;
          }
          neighborCoords.push([row, col]);
        }
      }
      return neighborCoords;
    },
    truncate: function(input, length) {
      return input.toString().substring(0, length);
    },
    getClassForValue: function(value) {
      var number, numberClasses;
      if (value === BOMB_STRING) {
        return "bomb";
      }
      number = parseInt(value, 10);
      numberClasses = ["", "one", "two", "three", "four", "five", "six", "seven", "eight"];
      return numberClasses[number];
    }
  };

}).call(this);
