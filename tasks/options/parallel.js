module.exports = {
    web: {
        options: {
            stream: true
        },
        tasks: [
            {
                grunt: true,
                args: ['watch:frontend']
            },
            {
                grunt: true,
                args: ['watch:backend']
            }
        ]
    }
};