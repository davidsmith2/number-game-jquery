module.exports = {
    frontend: {
        files: [
            'src/index.html',
            'src/less/**/*.less',
            'src/scripts/**/*.js'
        ],
        tasks: [
            'less:dev'
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