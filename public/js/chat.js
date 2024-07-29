document.addEventListener('DOMContentLoaded', () => {
    console.log('chat.js script loaded');
    if (typeof io !== undefined) {
        const sockety = io("ws://localhost:3000")
        sockety.on('connect', () => {
            console.log("Connected To Server");
        })

        const $messageForm = document.querySelector('#message-form')
        const $messageFormInput = $messageForm.querySelector('input')
        const $messageFormButton = $messageForm.querySelector('button')
        const $sendLoactionButton = document.querySelector('#send-location')
        const $messages = document.querySelector('#messages')

        const messageTemplate = document.querySelector('#message-template').innerHTML
        const locationTemplate = document.querySelector('#location-template').innerHTML
        const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

        const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

        const autoScroll = () => {
            // New Message
            const $newMessage = $messages.lastElementChild
            // Height Of New Message
            const newMessageStyles = getComputedStyle($newMessage)
            const newMessageMargin = parseInt(newMessageStyles.marginBottom)
            const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
            // Visible Height
            const visibleHeight = $messages.offsetHeight
            // Height Of Messages Container
            const containerHeight = $messages.scrollHeight
            // How Far Scrolled
            const scrollOffset = $messages.scrollTop + visibleHeight

            if (containerHeight - newMessageHeight <= scrollOffset) {
                $messages.scrollTop = $messages.scrollHeight
            }
        }

        sockety.on('message', (message) => {
            const html = Mustache.render(messageTemplate, {
                username: message.username,
                message: message.text,
                createdAt: moment(message.createdAt).format('h:mm a')
            })
            $messages.insertAdjacentHTML('beforeend', html)
            autoScroll()
        })

        sockety.on('locationMessage', (url) => {
            console.log(url);
            const location = Mustache.render(locationTemplate, {
                username: url.username,
                currentlocation: url.text,
                createdAt: moment(url.createdAt).format('h:mm a')
            })
            $messages.insertAdjacentHTML('beforeend', location)
            autoScroll()
        })

        sockety.on('roomData', ({ room, users }) => {
            const html = Mustache.render(sidebarTemplate, {
                room,
                users
            })
            document.querySelector('#sidebar').innerHTML = html
        })

        $messageForm.addEventListener('submit', (e) => {
            e.preventDefault()
            $messageFormButton.setAttribute('disabled', 'disabled')
            const message = e.target.elements.message.value

            sockety.emit('sendMessage', message, (error) => {
                $messageFormButton.removeAttribute('disabled')
                $messageFormInput.value = ''
                $messageFormInput.focus()
                if (error) {
                    return console.log(error);
                }
                console.log("Message Delivered");
            })
        })

        $sendLoactionButton.addEventListener('click', () => {
            $sendLoactionButton.setAttribute('disabled', 'disabled')
            if (!navigator.geolocation) {
                return alert("Geolocation Is Not Supported In Your Browser")
            }
            navigator.geolocation.getCurrentPosition((position) => {
                sockety.emit('sendLocation', {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }, (isSent) => {
                    console.log(isSent)
                    $sendLoactionButton.removeAttribute('disabled')
                })
            })
        })

        sockety.emit('join', { username, room }, (error) => {
            if (error) {
                alert(error)
                location.href = '/'
            }
        })
    }
})