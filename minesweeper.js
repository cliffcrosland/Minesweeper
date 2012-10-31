(function () {
  var NUM_ROWS = 10, NUM_COLS = 10;

  var gameGrid = null, solverGrid = null;

  $(init);

  function init() {
    gameGrid = emptyGrid(NUM_ROWS, NUM_COLS);
    solverGrid = emptyGrid(NUM_ROWS, NUM_COLS);

    initUI();
  }

  ////////////////
  // Model
  ////////////////

  function emptyGrid(numRows, numCols) {
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
    createTableLayout($("#game"), gameGrid);
    createTableLayout($("#solver"), solverGrid);

    $("#game").on("click", "td", gameCellClickHandler);
  }

  function createTableLayout($container, data) {
    var ret = "<table>";
    for (var row = 0; row < NUM_ROWS; row++) {
      ret += "<tr>";
      for (var col = 0; col < NUM_COLS; col++) {
        ret += "<td>" + data[row][col] + "</td>";
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
