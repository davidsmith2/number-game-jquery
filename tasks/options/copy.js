module.exports = {
    main: {
        files: [
            {
                expand: true,
                cwd: 'src/',
                src: ['img/*'],
                dest: 'build'
            },
            {
                expand: true,
                cwd: 'src/',
                src: ['js/main.js', 'js/lib/**/*.js', 'js/templates/**/*.html'],
                dest: 'build'
            },
            {
                expand: true,
                cwd: 'src/',
                src: ['html/**/*.html'],
                dest: 'build'
            }
        ]
    }
};
