import Filter from 'bad-words'
import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import { generateLocationMessage, generateMessage } from './utils/messages'
import { addUser, getUser, getUsersInRoom, removeUser } from './utils/users'

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: "*" } })

const port = 3000

server.listen(port, () => {
    console.log(`Server Running On Port ${port}`);
})

app.use(express.static('public'))
io.on('connection', (socket) => {
    console.log("New Web Socket Connection");

    socket.on('join', ({ username, room }: { username: string, room: string }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })
        if (error) {
            return callback(error)
        }
        socket.join(user?.room!)

        socket.emit("message", generateMessage("ADMIN", 'Welcome!'))
        socket.broadcast.to(user?.room!).emit("message", generateMessage('ADMIN', `${user?.username} Has Joined`))
        io.to(user?.room!).emit('roomData', {
            room: user?.room,
            users: getUsersInRoom(user?.room!)
        })

        callback()
    })

    socket.on('sendMessage', (msg, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if (filter.isProfane(msg)) {
            return callback("Bad Word!!")
        }
        io.to(user?.room!).emit('message', generateMessage(user?.username!, msg))
        callback()
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user?.room!).emit('locationMessage', generateLocationMessage(user?.username!, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback("Coordinates Recieved On Other End")
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage('ADMIN', `${user.username} Has Left`))
            io.to(user?.room!).emit('roomData', {
                room: user?.room,
                users: getUsersInRoom(user?.room!)
            })
        }
    })
}) 