let io;

module.exports = {
    init: (httpServer) => {
        io = require('socket.io')(httpServer, { cors: { origin: '*' } });
        console.log('Socket initialised');
        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('IO not initialised');
        }
        return io;
    }
};