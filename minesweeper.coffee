NUM_ROWS = 10
NUM_COLS = 10
NUM_BOMBS = 10
BOMB_STRING = "B"

GridModels =
  game : null
  solver : null



$(init)

init = ->
  GridModels.game = new GameGridModel(NUM_ROWS, NUM_COLS, NUM_BOMBS)
  GridModels.solver = new SolverGridModel(NUM_ROWS, NUM_COLS, NUM_BOMBS, GridModels.game)

  initUI()

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
    allCoords = []
    for row in [0..@numRows]
      for col in [0..@numCols]
        allCoords.push([row, col]) 
    coords = _.shuffle(coords)
    for bomb in [0..@numBombs]



  get: (row, col) ->
    @bombData[row][col]

  set: (row, col, val) ->
    @bombData[row][col] = val

  isRevealed: (row, col) ->
    @revealData[row][col]

  setRevealed: (row, col, val) ->
    if val and @bombData[row][col] == ""
      @revealAllEmptyCellsTouching(row, col)
    @revealData[row][col] = val

  revealAll: ->
    for row in [0..@numRows]
      for col in [0..@numCols]
        @revealData[row][col] = true

  toggleFlag: (row, col) ->
    @flagData[row][col] = !@flagData[row][col]

  isFlagged: (row, col) ->
    return false if @revealData[row][col]
    @flagData[row][col]

  revealAllEmptyCellsTouching: (startRow, startCol) ->
    startCoord = [startRow, startCol]
    coordsQueue = [startCoord]
    while coordsQueue.length > 0
      coord = coordsQueue.shift()
      row = coord[0]
      col = coord[1]
      if !@revealData[row][col]
        @revealData[row][col] = true
        if @bombData[row][col] == ""
          neighborCoords = @getNeighborCoords(row, col)
          for coord in neighborCoords
            coordsQueue.push(coord)

  flagsEqualBombs: ->
    matchCount = 0
    flagCount = 0
    for row in [0..@numRows]
      for col in [0..@numCols]
        if @flagData[row][col]
          flagCount += 1
          if @bombData[row][col] == BOMB_STRING
            matchCount += 1

  allNonBombsRevealed: ->
    revealCount = 0
    for row in [0..@numRows]
      for col in [0..@numCols]
        if @revealData[row][col]
          revealCount += 1
    revealCount + @numBombs == @numRows * @numCols

  getNeighborCoords: (r, c) ->
    neighborCoords = []
    for row in [0..@numRows]
      for col in [0..@numCols]
        continue if row == r and col == c
        continue if row < 0 || row >= @numRows || col < 0 || col >= @numCols
        neighborCoords.push([row, col])
    neighborCoords

  getNeighborValues: (r, c) ->
    neighborCoords = getNeighborCoords(r, c)
    neighborValues = []
    for coord in neighborCoords
      neighborValues.push(@get(coord[0], coord[1]))
    neighborValues











###################
## Utils
###################

Utils =
  newDataGrid: (numRows, numCols, initElemValue) ->
