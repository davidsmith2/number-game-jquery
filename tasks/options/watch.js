module.exports = {
    frontend: {
        files: [
            'src/index.jade',
            'src/jade/**/*.jade',
            'src/html/**/*.html',
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
            'server/**/*.js'
        ],
        tasks: ['express:web'],
        options: {
            atBegin: true,
            spawn: false
        }
    }
};