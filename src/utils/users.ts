interface IUser {
    id: string,
    username: string,
    room: string
}

const users: IUser[] = []

const addUser = ({ id, username, room }: { id: string, username: string, room: string }) => {
    // Clean The Data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()
    // Validate Data
    if (!username || !room) {
        return {
            error: "Username And Room Are Required"
        }
    }
    // Check For Existing User
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })
    // Validate Username
    if (existingUser) {
        return {
            error: "Username Is Already Taken"
        }
    }
    // Store User
    const user = { id, username, room }
    users.push(user)
    return { user }
}

const removeUser = (id: string) => {
    const index = users.findIndex((user) => user.id === id)
    if (index !== -1) {
        return users.splice(index, 1)[0]
    }
}

const getUser = (id: string) => {
    return users.find((user) => user.id === id)
}

const getUsersInRoom = (room: string) => {
    return users.filter((user) => user.room === room)
}

export { addUser, removeUser, getUser, getUsersInRoom }