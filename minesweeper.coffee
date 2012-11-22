NUM_ROWS = 10
NUM_COLS = 10
NUM_BOMBS = 10
BOMB_STRING = "B"

GridModels =
  game : null
  solver : null


init = ->
  GridModels.game = new GameGridModel(NUM_ROWS, NUM_COLS, NUM_BOMBS)
  GridModels.solver = new SolverGridModel(NUM_ROWS, NUM_COLS, NUM_BOMBS, GridModels.game)

  initUI()

$(init)

###########################
## Models
###########################

#################
## GameGridModel
#################

class GameGridModel
  constructor: (@numRows, @numCols, @numBombs) ->
    @bombData = Utils.newDataGrid(@numRows, @numCols, "")
    @revealData = Utils.newDataGrid(@numRows, @numCols, false)
    @flagData = Utils.newDataGrid(@numRows, @numCols, false)

    # Place bombs randomly
    coords = []
    for row in [0...@numRows]
      for col in [0...@numCols]
        coords.push([row, col])
    coords = _.shuffle(coords)
    for bomb in [0...@numBombs]
      bombCoord = coords[bomb]
      @set(bombCoord[0], bombCoord[1], BOMB_STRING)

    # Label bomb neighbors with the number of bombs nearby
    for row in [0...@numRows]
      for col in [0...@numCols]
        continue if @get(row, col) == BOMB_STRING
        neighbors = @getNeighborValues(row, col)
        numBombsNearby = _.filter(neighbors, (value) -> value == BOMB_STRING).length
        value = if numBombsNearby > 0 then numBombsNearby else ""
        @set(row, col, value)

  get: (row, col) ->
    @bombData[row][col]

  set: (row, col, val) ->
    @bombData[row][col] = val

  isRevealed: (row, col) ->
    @revealData[row][col]

  setRevealed: (row, col, val) ->
    if val and @bombData[row][col] == ""
      @revealAllEmptyCellsTouchingThisCoord(row, col)
    @revealData[row][col] = val

  revealAll: ->
    for row in [0...@numRows]
      for col in [0...@numCols]
        @revealData[row][col] = true

  toggleFlag: (row, col) ->
    @flagData[row][col] = !@flagData[row][col]

  isFlagged: (row, col) ->
    return false if @revealData[row][col]
    @flagData[row][col]

  revealAllEmptyCellsTouchingThisCoord: (startRow, startCol) ->
    startCoord = [startRow, startCol]
    coordsQueue = [startCoord]
    while coordsQueue.length > 0
      coord = coordsQueue.shift()
      row = coord[0]
      col = coord[1]
      if !@revealData[row][col]
        @revealData[row][col] = true
        if @bombData[row][col] == ""
          neighborCoords = Utils.getNeighborCoords(row, col, @numRows, @numCols)
          for coord in neighborCoords
            coordsQueue.push(coord)

  flagsEqualBombs: ->
    matchCount = 0
    flagCount = 0
    for row in [0...@numRows]
      for col in [0...@numCols]
        if @flagData[row][col]
          flagCount += 1
          if @bombData[row][col] == BOMB_STRING
            matchCount += 1
    matchCount == @numBombs and flagCount == @numBombs

  allNonBombsRevealed: ->
    revealCount = 0
    for row in [0...@numRows]
      for col in [0...@numCols]
        if @revealData[row][col]
          revealCount += 1
    revealCount + @numBombs == @numRows * @numCols

  getNeighborValues: (r, c) ->
    neighborCoords = Utils.getNeighborCoords(r, c, @numRows, @numCols)
    neighborValues = []
    for coord in neighborCoords
      neighborValues.push(@get(coord[0], coord[1]))
    neighborValues

####################
## SolverGridModel
####################
class SolverGridModel
  constructor: (@numRows, @numCols, @numBombs, @gameGridModel) ->
    @allIsRevealed = false
    @revealed = Utils.newDataGrid(@numRows, @numCols, false)
    @bombDistribution = Utils.newDataGrid(@numRows, @numCols, @numBombs / (@numRows * @numCols))
    for row in [0...@numRows]
      for col in [0...@numCols]
        @revealed[row][col] = @gameGridModel.isRevealed(row, col)

  get: (row, col) ->
    @bombDistribution[row][col]

  revealAll: ->
    for row in [0...@numRows]
      for col in [0...@numCols]
        @bombDistribution[row][col] = if @gameGridModel.get(row, col) == BOMB_STRING then 1.0 else 0.0
    @allIsRevealed = true

  update: ->
    return if @allIsRevealed
    for row in [0...@numRows]
      for col in [0...@numCols]
        if @revealed[row][col] != @gameGridModel.isRevealed(row, col)
          @revealed[row][col] = @gameGridModel.isRevealed(row, col)
          @updateBombDistribution(row, col) # big computational cost

  updateBombDistribution: (measurementRow, measurementCol) ->
    posteriorDistribution = Utils.newDataGrid(@numRows, @numCols, 0)
    value = @gameGridModel.get(measurementRow, measurementCol)
    measurement = 
      row : measurementRow
      col : measurementCol
      value : if value == "" then 0 else parseInt(value, 10)
    for row in [0...@numRows]
      for col in [0...@numCols]
        prior = @bombDistribution[row][col]
        measurementProb = @getMeasurementProbability(measurement, row, col)
        # numerator of P(B_i | M) = P(M | B_i)  *  P(B_i)
        #              posterior  = measurement *  prior
        # B_i = bomb at this cell
        # M = prob of measurement
        posteriorDistribution[row][col] = measurementProb * prior

    # Normalize
    # P(B_i | M) = numerator / P(M)
    sum = 0
    for row in [0...@numRows]
      for col in [0...@numCols]
        sum += posteriorDistribution[row][col]
    sum /= @numBombs # want a distribution of bombs, not a probability distribution
    for row in [0...@numRows]
      for col in [0...@numCols]
        posteriorDistribution[row][col] /= sum
        if posteriorDistribution[row][col] > 1
          posteriorDistribution[row][col] = 1 # the algorithm doesn't understand that a cell may only have one bomb

    # Write into bomb distribution
    for row in [0...@numRows]
      for col in [0...@numCols]
        @bombDistribution[row][col] = posteriorDistribution[row][col]

  # Get P(M | B_i).  That is, the probability of getting measurement M if there were a bomb at (row, col).
  getMeasurementProbability: (measurement, row, col) ->
    neighborCoords = Utils.getNeighborCoords(measurement.row, measurement.col, @numRows, @numCols)
    measurementCoord = [measurement.row, measurement.col]
    coordIsRowCol = (coord) -> coord[0] == row and coord[1] == col
    # If the coord is the measurement, then there's no way there's a bomb here.
    if measurement.row == row and measurement.col == col
      return 0
    # If the coord is not a neighbor of the measurement, return 1.
    if !_.find(neighborCoords, coordIsRowCol)
      prob = @getProbabilityOfNumberOfBombsOnCoords(measurement.value, neighborCoords)
      # ???
      # TODO: Somehow, account for the fact that a bomb on this coord affects the probability of the measurement.
      return prob
    # Exclude the coord in question from the neighbors of the measurement
    neighborCoords = _.reject(neighborCoords, coordIsRowCol)
    # P(measurement | bomb at row, col) = P(there are exactly (measurement - 1) bombs on all of the neighbors)
    prob = @getProbabilityOfNumberOfBombsOnCoords(measurement.value - 1, neighborCoords)
    return prob

  getProbabilityOfNumberOfBombsOnCoords: (numBombs, coords) ->
    groupings = []
    makeGroupings = (numberToChoose, chosen, pool) ->
      if chosen.length == numberToChoose
        groupings.push([chosen.slice(0, chosen.length), pool.slice(0, pool.length)])
      else
        for i in [0...pool.length]
          newChosen = chosen.slice(0, chosen.length)
          newChosen.push(pool[i])
          newPool = pool.slice(0, pool.length)
          newPool.splice(i, 1)
          makeGroupings(numberToChoose, newChosen, newPool)
    makeGroupings(numBombs, [], coords)
    sum = 0
    for grouping in groupings
      chosenForBombs = grouping[0]
      chosenForEmpty = grouping[1]
      bombDistribution = @bombDistribution
      probForBombs = _.reduce(chosenForBombs, ((memo, coord) ->
        return memo * bombDistribution[coord[0]][coord[1]]
      ), 1)
      probForEmpty = _.reduce(chosenForEmpty, ((memo, coord) ->
        return memo * (1 - bombDistribution[coord[0]][coord[1]])
      ), 1)
      sum += probForBombs * probForEmpty
    return sum

######
## UI
######
initUI = ->
  # left-click
  $("#game").on("click", "td", gameCellClickHandler)
  # right-click
  $("#game").on("contextmenu", "td", gameCellClickHandler)

  syncUI()

gameOver = (result) ->
  $("#game").off("click")
  $("#game").off("contextmenu")
  # swallow right-click
  $("#game").on("contextmenu", "td", -> return false)

  $("#game_result").html("You " + result)
  $("#game_result").animate({
    "font-size" : "26px"
  }, 500)
  if result == "lose"
    GridModels.game.revealAll()
    GridModels.solver.revealAll()

gameGridCellRenderer = (row, col, dataModel) ->
  if dataModel.isRevealed(row, col)
    value = dataModel.get(row, col)
    return "<td class=\"revealed #{Utils.getClassForValue(value)}\">#{value}</td>"
  else if dataModel.isFlagged(row, col)
    return "<td>f</td>"
  else
    return "<td></td>"

solverGridCellRenderer = (row, col, dataModel) ->
  value = Utils.truncate(dataModel.get(row, col), 5)
  red = Utils.truncate(parseInt(255 * value, 10), 4)
  green = Utils.truncate(parseInt(255 * (1 - value), 10), 4)
  return "<td style=\"background-color: rgb(#{red},#{green},0);\">#{value}</td>"

syncUI = ->
  syncGridModelToUI(GridModels.game, $("#game"), gameGridCellRenderer)
  syncGridModelToUI(GridModels.solver, $("#solver"), solverGridCellRenderer)

syncGridModelToUI = (dataModel, $container, cellRenderer) ->
  ret = "<table>"
  for row in [0...NUM_ROWS]
    ret += "<tr>"
    for col in [0...NUM_COLS]
      ret += cellRenderer(row, col, dataModel)
    ret += "</tr>"
  ret += "</table>"
  $container.html(ret)

gameCellClickHandler = (evt) ->
    evt.preventDefault()

    row = $(this).parent().parent().children().index(this.parentNode)
    col = $(this).parent().children().index(this)

    if evt.button == 0
      # left click
      if !GridModels.game.isRevealed(row, col)
        GridModels.game.setRevealed(row, col, true)
      if GridModels.game.get(row, col) == BOMB_STRING
        gameOver("lose")
    else
      # right click
      if !GridModels.game.isRevealed(row, col)
        GridModels.game.toggleFlag(row, col)

    if GridModels.game.flagsEqualBombs() && GridModels.game.allNonBombsRevealed()
      gameOver("win")

    GridModels.solver.update()
    syncUI()

###################
## Utils
###################

Utils =
  newDataGrid: (numRows, numCols, initElemValue) ->
    ret = new Array(numRows)
    for row in [0...numRows]
      ret[row] = new Array(numCols)
      for col in [0...numCols]
        ret[row][col] = initElemValue
    ret

  getNeighborCoords: (r, c, totalRows, totalCols) ->
    neighborCoords = []
    for row in [r - 1 .. r + 1]
      for col in [c - 1 .. c + 1]
        continue if row == r and col == c
        continue if row < 0 || row >= totalRows || col < 0 || col >= totalCols
        neighborCoords.push([row, col])
    neighborCoords

  truncate: (input, length) ->
    return input.toString().substring(0, length)

  getClassForValue: (value) ->
    if value == BOMB_STRING
      return "bomb"
    number = parseInt(value, 10)
    numberClasses = ["", "one", "two", "three", "four", "five", "six", "seven", "eight"]
    return numberClasses[number]
