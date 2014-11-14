module.exports = {
    main: {
        files: [
            {
                expand: true,
                cwd: 'src/',
                src: [
                    'img/*'
                ],
                dest: 'cordova/www'
            },
            {
                expand: true,
                cwd: 'src/',
                src: [
                    'cordova.js',
                    'cordova_plugins.js',
                    'js/index.js',
                    'js/lib/vendor/**/*.js',
                    'js/templates/**/*.html'
                ],
                dest: 'cordova/www'
            },
            {
                expand: true,
                cwd: 'src/',
                src: [
                    'html/**/*.html'
                ],
                dest: 'cordova/www'
            }
        ]
    }
};
