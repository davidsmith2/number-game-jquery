module.exports = {
    frontend: {
        files: [
            'src/less/**/*.less',
            'src/js/**/*.js',
            'src/js/**/*.html'
        ],
        tasks: [
            'build'
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