
const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const http = require('http')
const { Server } = require('socket.io')
require('dotenv').config()

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 5000;

// Store active multiplayer rooms
const rooms = {}

function getPlayerSet(player) {
  // Set 3: Young / Domestic players
  if (
    player.type === 'Domestic' ||
    player.matches < 30
  ) {
    return 3
  }

  // Set 2: Very high competition
  if (
    (player.role === 'Batsman' && player.runs >= 5000) ||
    (player.role === 'Bowler' && player.wickets >= 150) ||
    (
      player.role === 'All-Rounder' &&
      player.runs >= 2500 &&
      player.wickets >= 80
    )
  ) {
    return 2
  }

  // Set 1: High competition
  if (
    (player.role === 'Batsman' && player.runs >= 2500) ||
    (player.role === 'Bowler' && player.wickets >= 75) ||
    (
      player.role === 'All-Rounder' &&
      player.runs >= 1500
    )
  ) {
    return 1
  }

  // Set 4: Medium competition
  return 4
}


// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'IPL Auction Backend is running!'
  })
})

// Get 250 IPL players
app.get('/api/players', (req, res) => {
  try {
   const filePath = path.join(__dirname, 'data', 'players.json')
const players = JSON.parse(
  fs.readFileSync(filePath, 'utf-8')
)

// Keep the same Set order used by Play with AI
function getPlayerSet(player) {
  if (player.matches >= 100) return 1
  if (player.matches >= 50) return 2
  if (player.matches < 30) return 3
  return 4
}

const orderedPlayers = [
  ...players.filter(player => getPlayerSet(player) === 1),
  ...players.filter(player => getPlayerSet(player) === 2),
  ...players.filter(player => getPlayerSet(player) === 3),
  ...players.filter(player => getPlayerSet(player) === 4)
]

    res.json({
      count: players.length,
      players
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      error: 'Failed to load players'
    })
  }
})


 // Multiplayer connection
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id)
  
function startRoomTimer(roomCode) {
  const room = rooms[roomCode]
  if (!room || !room.auction) return

  const auction = room.auction

  if (auction.timer) {
    clearInterval(auction.timer)
  }

  auction.timer = setInterval(() => {
    if (room.status !== 'auction') {
      clearInterval(auction.timer)
      return
    }
    
const player = auction.players[auction.playerIndex]

if (
  auction.aiTeams &&
  auction.aiTeams.length > 0 &&
  Math.random() < 0.45 &&
  auction.timeLeft > 5 &&
  player
) {
  let minimumBid
  let maximumBid

  const playerSet = getPlayerSet(player)

  if (playerSet === 1) {
    minimumBid = 5
    maximumBid = 14
  } else if (playerSet === 2) {
    minimumBid = 5
    maximumBid = 22
  } else if (playerSet === 3) {
    minimumBid = player.basePrice
    maximumBid = 7
  } else {
    minimumBid = 4
    maximumBid = 10
  }

  const nextBid = auction.currentBidder
    ? auction.bid + 0.25
    : Math.max(player.basePrice, minimumBid)

  const availableAITeams = auction.aiTeams.filter((team) => {
    const teamState = auction.teamStates.find(
      (item) => item.name === team.name
    )

    return (
      team.name !== auction.currentBidder &&
      teamState &&
      teamState.purse >= nextBid &&
      nextBid <= maximumBid
    )
  })

  if (availableAITeams.length > 0) {
    const aiTeam =
      availableAITeams[
        Math.floor(Math.random() * availableAITeams.length)
      ]

    auction.bid = nextBid
    auction.currentBidder = aiTeam.name
    auction.auctionStatus = 'Bidding'

    io.to(roomCode).emit('auctionState', {
      playerIndex: auction.playerIndex,
      currentPlayer: player,
      bid: auction.bid,
      currentBidder: auction.currentBidder,
      timeLeft: auction.timeLeft,
      auctionStatus: auction.auctionStatus,
      teamStates: auction.teamStates
    })
  }
}


    if (auction.timeLeft > 0) {
      auction.timeLeft -= 1

      io.to(roomCode).emit('auctionState', {
        playerIndex: auction.playerIndex,
        currentPlayer: auction.players[auction.playerIndex],
        bid: auction.bid,
        currentBidder: auction.currentBidder,
        timeLeft: auction.timeLeft,
        auctionStatus: auction.auctionStatus
      })
    } else {
  clearInterval(auction.timer)

  const soldPlayer = auction.players[auction.playerIndex]

  if (auction.currentBidder) {
    const winningTeam = auction.teamStates.find(
  team => team.name === auction.currentBidder
)
console.log("Winner:", auction.currentBidder)
console.log("Team state found:", winningTeam)


if (winningTeam && winningTeam.purse >= auction.bid) {
  winningTeam.purse -= auction.bid

  if (winningTeam.isAI) {
    const aiTeam = auction.aiTeams.find(
      team => team.name === winningTeam.name
    )

    if (aiTeam) {
      aiTeam.purse = winningTeam.purse
    }
  }

  winningTeam.squad.push({
    name: soldPlayer.name,
    role: soldPlayer.role,
    country: soldPlayer.country,
    matches: soldPlayer.matches,
    runs: soldPlayer.runs,
    wickets: soldPlayer.wickets,
    price: auction.bid
  })
}

if (!winningTeam || winningTeam.purse < 0) {
  console.error('Sale failed: invalid winning team or purse')
  return
}
    auction.results = auction.results || []
    auction.results.push({
      name: soldPlayer.name,
      team: auction.currentBidder,
      price: auction.bid
    })

    io.to(roomCode).emit('auctionState', {
      playerIndex: auction.playerIndex,
      currentPlayer: soldPlayer,
      bid: auction.bid,
      currentBidder: auction.currentBidder,
      timeLeft: 0,
      auctionStatus: 'SOLD!',
      results: auction.results,
      teamStates: auction.teamStates,
    })
  } else {
    io.to(roomCode).emit('auctionState', {
      playerIndex: auction.playerIndex,
      currentPlayer: soldPlayer,
      bid: auction.bid,
      currentBidder: '',
      timeLeft: 0,
      auctionStatus: 'UNSOLD',
      results: auction.results || []
    })
  }

  auction.playerIndex += 1

  if (auction.playerIndex >= auction.players.length) {
    room.status = 'completed'
    io.to(roomCode).emit('auctionState', {
      completed: true,
      auctionStatus: 'Auction Completed',
      results: auction.results || []
    })
    return
  }

  const nextPlayer = auction.players[auction.playerIndex]
  auction.bid = nextPlayer.basePrice ?? 0
  auction.currentBidder = ''
  auction.timeLeft = 20
  auction.auctionStatus = 'Bidding'

  io.to(roomCode).emit('auctionState', {
    playerIndex: auction.playerIndex,
    currentPlayer: nextPlayer,
    bid: auction.bid,
    currentBidder: '',
    timeLeft: 20,
    auctionStatus: 'Bidding',
    results: auction.results || [],
    teamStates: auction.teamStates
  })

  startRoomTimer(roomCode)
}
  }, 1000)
}
  // Create a room
 socket.on('createRoom', (teamName, modeOrCallback, callback) => {
  const mode = typeof modeOrCallback === 'string'
    ? modeOrCallback
    : 'friends'

  if (typeof modeOrCallback === 'function') {
    callback = modeOrCallback
  }
    let roomCode

    do {
      roomCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()
    } while (rooms[roomCode])

   rooms[roomCode] = {
  hostId: socket.id,
  players: [{
    id: socket.id,
    name: 'Player 1',
    team: teamName
  }],
  status: 'waiting',
  mode
}
    socket.join(roomCode)

    if (typeof callback === 'function') {
      callback({
        success: true,
        roomCode,
        players: rooms[roomCode].players
      })
    }

    console.log('Room created:', roomCode)
  })

  // Join an existing room
  socket.on('joinRoom', ({ roomCode, playerName }, callback) => {
    roomCode = String(roomCode || '').trim().toUpperCase()
    const room = rooms[roomCode]

    if (!room) {
      if (typeof callback === 'function') {
        callback({ success: false, message: 'Room not found' })
      }
      return
    }

    
const maxPlayers = room.mode === 'faceoff' ? 2 : 8

if (room.players.length >= maxPlayers) {
  callback({
    success: false,
    message: room.mode === 'faceoff'
      ? 'Auction Face-Off room is full. Only 2 players allowed.'
      : 'Room is full'
  })
  return
}


    if (room.players.length >=8) {
      if (typeof callback === 'function') {
        callback({ success: false, message: 'Room is full' })
      }
      return
    }

    if (room.players.some((p) => p.id === socket.id)) {
      if (typeof callback === 'function') {
        callback({ success: true, roomCode, players: room.players })
      }
      return
    }
room.players.push({
  id: socket.id,
  name:`Player ${room.players.length + 1}`,
  team: null
})
    socket.join(roomCode)
    io.to(roomCode).emit('roomUpdated', room.players)

    if (typeof callback === 'function') {
      callback({
        success: true,
        roomCode,
        players: room.players
      })
    }

    console.log('Player joined room:', roomCode)
  })

  // Select a team
  socket.on('selectTeam', ({ roomCode, teamName }, callback) => {
    roomCode = String(roomCode || '').trim().toUpperCase()
    const room = rooms[roomCode]

    if (!room || room.status !== 'waiting') {
      if (typeof callback === 'function') {
        callback({ success: false, message: 'Room unavailable' })
      }
      return
    }

    const currentPlayer = room.players.find(
      (p) => p.id === socket.id
    )

    if (!currentPlayer) {
      if (typeof callback === 'function') {
        callback({ success: false, message: 'Join the room first' })
      }
      return
    }

    const teamTaken = room.players.some(
      (p) => p.id !== socket.id && p.team === teamName
    )

    if (teamTaken) {
      if (typeof callback === 'function') {
        callback({ success: false, message: 'Team already selected' })
      }
      return
    }

    currentPlayer.team = teamName
    io.to(roomCode).emit('roomUpdated', room.players)

    if (typeof callback === 'function') {
      callback({ success: true, players: room.players })
    }
  })

socket.on('startAuction', ({ roomCode }, callback) => {
  roomCode = String(roomCode || '').trim().toUpperCase()
  const room = rooms[roomCode]

  if (!room) {
    if (typeof callback === 'function') {
      callback({ success: false, message: 'Room not found' })
    }
    return
  }

  if (room.hostId !== socket.id) {
    if (typeof callback === 'function') {
      callback({ success: false, message: 'Only the host can start the auction' })
    }
    return
  }

 if (room.players.length < 2) {
  if (typeof callback === 'function') {
    callback({
      success: false,
      message: 'At least 2 human players must join.'
    })
  }
  return
}
if (
  room.mode === 'faceoff' &&
  room.players.some(player => !player.team)
) {
  callback({
    success: false,
    message: 'Both players must select their teams first.'
  })
  return
}
 room.status = 'auction'


const isFaceOff = room.mode === 'faceoff'

const filePath = path.join(
  __dirname,
  'data',
  isFaceOff ? 'faceoffPlayers_ordered_v2.json' : 'players.json'
)

const players = JSON.parse(
  fs.readFileSync(filePath, 'utf-8')
)

const orderedPlayers = isFaceOff
  ? players
  : [
      ...players.filter(player => getPlayerSet(player) === 1),
      ...players.filter(player => getPlayerSet(player) === 2),
      ...players.filter(player => getPlayerSet(player) === 3),
      ...players.filter(player => getPlayerSet(player) === 4)
    ]

room.auction = {
  players: orderedPlayers,
  playerIndex: 0,
  bid: orderedPlayers[0]?.basePrice ?? 0,
  currentBidder: "",
  timeLeft: 20,
  auctionStatus: "Bidding"
}

const allTeams = [
  'Chennai Super Kings',
  'Mumbai Indians',
  'Royal Challengers Bengaluru',
  'Kolkata Knight Riders',
  'Sunrisers Hyderabad',
  'Rajasthan Royals',
  'Punjab Kings',
  'Gujarat Titans'
]

const humanTeams = room.players
  .map(player => player.team)
  .filter(Boolean)


room.auction.aiTeams = isFaceOff
  ? []
  : allTeams
      .filter(team => !humanTeams.includes(team))
      .map(team => ({
        name: team,
        purse: 125,
        squad: [],
        isAI: true
      }))

room.auction.teamStates = isFaceOff
  ? room.players.map(player => ({
      name: player.team,
      purse: 125,
      squad: [],
      isAI: false
    }))
  : allTeams.map(team => ({
      name: team,
      purse: 125,
      squad: [],
      isAI: !humanTeams.includes(team)
    }))


console.log('Human teams:', humanTeams)
console.log('AI teams:', room.auction.aiTeams.map(team => team.name))


io.to(roomCode).emit("auctionStarted", {
  players: orderedPlayers
})

io.to(roomCode).emit("auctionState", {
  playerIndex: 0,
  currentPlayer: orderedPlayers[0],
  bid: room.auction.bid,
  currentBidder: "",
  timeLeft: 20,
  auctionStatus: "Bidding"
})
startRoomTimer(roomCode)

  if (typeof callback === 'function') {
    callback({ success: true })
  }
})

socket.on('placeBid', ({ roomCode, teamName, bid }, callback) => {
  roomCode = String(roomCode || '').trim().toUpperCase()
  const room = rooms[roomCode]

  if (!room || room.status !== 'auction' || !room.auction) {
    if (typeof callback === 'function') {
      callback({ success: false, message: 'Auction unavailable' })
    }
    return
  }

  const auction = room.auction
  const humanPlayer = room.players.find(
    (p) => p.id === socket.id && p.team === teamName
  )

  if (!humanPlayer) {
    if (typeof callback === 'function') {
      callback({ success: false, message: 'Your team is not in this room' })
    }
    return
  }

  if (auction.timeLeft <= 0) return

  const minimumBid = auction.currentBidder
    ? auction.bid + 0.25
    : auction.players[auction.playerIndex].basePrice

  if (bid !== minimumBid) {
    if (typeof callback === 'function') {
      callback({ success: false, message: 'Bid has changed. Try again.' })
    }
    return
  }

  auction.bid = bid
  auction.currentBidder = teamName
  auction.timeLeft = 20
  auction.auctionStatus = 'Bidding'

  io.to(roomCode).emit('auctionState', {
    playerIndex: auction.playerIndex,
    currentPlayer: auction.players[auction.playerIndex],
    bid: auction.bid,
    currentBidder: auction.currentBidder,
    timeLeft: auction.timeLeft,
    auctionStatus: auction.auctionStatus
  })

  if (typeof callback === 'function') {
    callback({ success: true })
  }
})


socket.on('playerUnsold', ({ roomCode }) => {
  roomCode = String(roomCode || '').trim().toUpperCase()
  const room = rooms[roomCode]

  if (!room || room.status !== 'auction' || !room.auction) {
    return
  }

  const auction = room.auction

  if (auction.currentBidder) {
    return
  }
  if (auction.timeLeft > 0) {
  return
}

  auction.playerIndex += 1

 
if (auction.playerIndex >= auction.players.length) {
  room.status = 'completed'

  io.to(roomCode).emit('auctionState', {
    completed: true,
    auctionStatus: 'Auction Completed',
    results: auction.results || [],
    teamStates: auction.teamStates
  })

  return
}


  const nextPlayer = auction.players[auction.playerIndex]

  auction.bid = nextPlayer.basePrice ?? 0
  auction.currentBidder = ''
  auction.timeLeft = 20
  auction.auctionStatus = 'Bidding'

  io.to(roomCode).emit('auctionState', {
    playerIndex: auction.playerIndex,
    currentPlayer: nextPlayer,
    bid: auction.bid,
    currentBidder: '',
    timeLeft: auction.timeLeft,
    auctionStatus: auction.auctionStatus
  })
})


  // Disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id)

    for (const [roomCode, room] of Object.entries(rooms)) {
      const index = room.players.findIndex(
        (p) => p.id === socket.id
      )

      if (index !== -1) {
        room.players.splice(index, 1)
        io.to(roomCode).emit('roomUpdated', room.players)

        if (room.players.length === 0) {
          delete rooms[roomCode]
        }
      }
    }
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
