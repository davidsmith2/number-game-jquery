module.exports = {
    frontend: {
        files: [
            'src/jade/**/*.jade',
            'src/less/**/*.less',
            'src/js/**/*.js'
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