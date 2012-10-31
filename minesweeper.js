(function () {
  var NUM_ROWS = 10, NUM_COLS = 10, NUM_BOMBS = 25, BOMB_STRING = "B";

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
    self.data = emptyDataGrid(numRows, numCols);

    self.get = function(row, col) {
      return self.data[row][col];
    };

    self.set = function(row, col, val) {
      self.data[row][col] = val;
    };

    self.init = function() {
      // Place bombs randomly
      var coords = [], numRows = self.data.length, numCols = self.data[0].length;
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

  function emptyDataGrid(numRows, numCols) {
    var ret = new Array(numRows);
    for (var row = 0; row < numRows; row++) {
      ret[row] = new Array(numCols);
      for (var col = 0; col < numCols; col++) {
        ret[row][col] = "";
      }
    }
    return ret;
  }

  ////////////////
  // UI
  ////////////////
  function initUI() {
    createTableLayout($("#game"), gameGridModel);
    createTableLayout($("#solver"), solverGridModel);

    $("#game").on("click", "td", gameCellClickHandler);
  }

  function createTableLayout($container, dataModel) {
    var ret = "<table>";
    for (var row = 0; row < NUM_ROWS; row++) {
      ret += "<tr>";
      for (var col = 0; col < NUM_COLS; col++) {
        ret += "<td>" + dataModel.get(row, col) + "</td>";
      }
      ret += "</tr>";
    }
    ret += "</table>";
    $container.html(ret);
  }

  function gameCellClickHandler() {
    var row = $(this).parent().parent().children().index(this.parentNode);
    var col = $(this).parent().children().index(this);
  }

})();
