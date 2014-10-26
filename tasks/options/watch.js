module.exports = {
    frontend: {
        files: [
            'src/index.html',
            'src/styles/**/*.css',
            'src/scripts/**/*.js'
        ],
        tasks: [
        ],
        options: {
            livereload: true
        }
    },
    backend: {
        files: [
            'server/**/*.js',
            'server/views/**/*.jade'
        ],
        tasks: ['express:web'],
        options: {
            atBegin: true,
            spawn: false
        }
    }
};