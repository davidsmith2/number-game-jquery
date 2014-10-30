(function ($, _, Backbone) {

    // config

    var config = {
        settings: {
            lowTile: 1,
            highTile: 100,
            guessesAllowed: 13
        },
        strings: {
            highGuess: 'High',
            lowGuess: 'Low',
            rightGuess: 'Match'
        },
        overlays: {
            manual: {
                closeOnClick: false,
                mask: {
                    color: '#333',
                    loadSpeed: 100,
                    maskId: 'mask',
                    opacity: 0.75,
                    zIndex: 9998
                },
                oneInstance: false
            },
            auto: {
                load: true
            }
        }
    };

    // models

    var Game = Backbone.Model.extend({
        defaults: {
            guess: '-',
            guessAccuracy: '-',
            guessesAllowed: null,
            guessesMade: 0,
            guessesRemaining: null
        },
        initialize: function () {
            var secretNumber = this.getSecretNumber(),
                self = this;
            console.log('The secret number is: ' + secretNumber);
            this.set('guessesRemaining', this.get('guessesAllowed'));
            this.on('change:guessesAllowed', this.onChangeGuessesAllowed, this);
            this.listenTo(app.vent, 'guess', function (guess) {
                self.onGuess(guess, secretNumber);
            });
            this.listenTo(app.vent, 'result', this.onResult);
        },
        onChangeGuessesAllowed: function (game) {
            var guessesAllowed = game.get('guessesAllowed');
            this.set('guessesRemaining', guessesAllowed);
        },
        getSecretNumber: function () {
            var lowTile = config.settings.lowTile,
                highTile = config.settings.highTile;
            return Math.floor(Math.random() * (highTile - lowTile + 1)) + lowTile;
        },
        onGuess: function (guess, secretNumber) {
            this.set('guess', guess);
            this.set('guessesMade', this.get('guessesMade') + 1);
            this.set('guessesRemaining', this.get('guessesAllowed') - this.get('guessesMade'));
            if (guess !== secretNumber) {
                this.onWrongGuess(guess, secretNumber);
            } else {
                this.onRightGuess(guess, secretNumber);
            }
            app.vent.trigger('guessed');
        },
        onWrongGuess: function (guess, secretNumber) {
            var guessAccuracy;
            if (this.get('guessesRemaining') === 0) {
                app.vent.trigger('result', {
                    secretNumber: secretNumber,
                    type: 'lose'
                });
            }
            if (guess < secretNumber) {
                guessAccuracy = config.strings.lowGuess;
            } else if (guess > secretNumber) {
                guessAccuracy = config.strings.highGuess;
            }
            this.set('guessAccuracy', guessAccuracy);
        },
        onRightGuess: function (guess, secretNumber) {
            this.set('guessAccuracy', config.strings.rightGuess);
            app.vent.trigger('result', {
                secretNumber: secretNumber,
                type: 'win'
            });
        },
        onResult: function () {
            this.stopListening();
        }
    });

    // views

    var BoardView = Backbone.View.extend({
        events: {
            'click a[href=#splash]': 'quit'
        },
        initialize: function () {
            this.initTiles();
            this.listenTo(app.vent, 'started', this.onStarted);
            this.listenTo(app.vent, 'play', this.onPlay);
        },
        initTiles: function () {
            return new BoardTilesView({
                el: this.$('#tiles')
            });
        },
        initGauges: function () {
            return new BoardGaugesView({
                el: this.$('#gauges')
            });
        },
        onStarted: function () {
            this.initGauges();
        },
        onPlay: function () {
            this.$el.expose();
        },
        quit: function (e) {
            var guessesAllowed = app.models.game.get('guessesAllowed');
            e.preventDefault();
            app.vent.trigger('quitting', guessesAllowed);
        }
    });

    var BoardGaugesView = Backbone.View.extend({
        initialize: function () {
            var self = this;
            $.get('/js/templates/boardGauges.html', function (html) {
                self.template = _.template(html);
                self.render();
            });
            this.listenTo(app.vent, 'play guessed result', this.render);
            this.listenTo(app.vent, 'guessed', this.onGuessed);
        },
        render: function () {
            this.$el.html(this.template(app.models.game.toJSON()));
            return this;
        },
        onGuessed: function () {
            var guessAccuracy = app.models.game.get('guessAccuracy');
            this.$('#guess-accuracy > .value').removeClass().addClass('value ' + guessAccuracy.toLowerCase());
        }
    });

    var BoardTileLinkView = Backbone.View.extend({
        tagName: 'a',
        className: 'tile',
        initialize: function (options) {
            this.$el.attr('href', '#' + options.number).html(options.number);
            this.render();
        }
    });

    var BoardTileView = Backbone.View.extend({
        className: 'tile',
        initialize: function (options) {
            this.$el.append(new BoardTileLinkView(options).el);
            this.render();
        }
    });

    var BoardTilesView = Backbone.View.extend({
        events: {
            'click a': 'onClick'
        },
        states: ['visited', 'match'],
        initialize: function () {
            var lowTile = config.settings.lowTile,
                highTile = config.settings.highTile;
            for (var i = lowTile; i < (highTile + 1); i++) {
                tileView = new BoardTileView({
                    number: i
                });
                this.$el.append(tileView.el);
            }
            this.listenTo(app.vent, 'play', this.onPlay);
            this.listenTo(app.vent, 'result', this.onResult);
        },
        onClick: function (e) {
            e.preventDefault();
            this.onGuess($(e.target));
        },
        onGuess: function ($eventTarget) {
            var state = this.states[0],
                guess = parseInt($eventTarget.text(), 10);
            $eventTarget.addClass(state).parent('.tile').addClass(state);
            app.vent.trigger('guess', guess);
        },
        onPlay: function () {
            var states = this.states.join(' ');
            this.$('.tile').removeClass(states);
            this.$('a.tile').removeAttr('rel');
        },
        onResult: function (result) {
            var $eventTarget = this.$('a[href=#' + result.secretNumber + ']');
            $eventTarget
                .attr('rel', '#' + result.type)
                .overlay(
                    $.extend(
                        {},
                        config.overlays.manual,
                        config.overlays.auto
                    )
                );
            if (result.type === 'win') {
                this.onWin($eventTarget);
            }
        },
        onWin: function ($eventTarget) {
            var stateToRemove = this.states[0],
                stateToAdd = this.states[1];
            $eventTarget
                .removeClass(stateToRemove)
                .addClass(stateToAdd)
                .parent('.tile')
                .removeClass(stateToRemove)
                .addClass(stateToAdd);
        }
    });

    var DialogTriggerView = Backbone.View.extend({
        events: {
            'click': 'onClick'
        },
        initialize: function () {
            this.$el.attr('rel', this.$el.attr('href')).overlay(config.overlays.manual);
        },
        onClick: function (e) {
            e.preventDefault();
            app.vent.trigger('dialog:show', this.$el.attr('href').slice(1));
        }
    });

    var DialogView = Backbone.View.extend({
        initialize: function (options) {
            var id = this.$el.attr('id');
            if (id === 'splash') {
                this.$el
                    .overlay(
                        $.extend(
                            {},
                            config.overlays.manual,
                            config.overlays.auto
                        )
                    );
            } else {
                this.$el.overlay(config.overlays.manual);
            }
            this.listenTo(app.vent, 'dialog:show', this.onDialog);
            this.listenTo(app.vent, 'play', this.onPlay);
        },
        onDialog: function (id) {
            this.openOverlay();
            this.openDialog(id);
        },
        onPlay: function () {
            this.closeOverlay();
        },
        openDialog: function (id) {
            if (this.$el.attr('id') !== id) {
                this.$el.hide();
            } else {
                this.$el.show();
            }
        },
        openOverlay: function () {
            $.mask.getMask().show();
        },
        closeOverlay: function () {
            var overlay = this.$el.hide().data('overlay');
            overlay.close();
            $.mask.close();
        }
    });

    var SplashDialogView = DialogView.extend({
        guessesAllowed: config.settings.guessesAllowed,
        events: {
            'click [href=#settings]': 'start'
        },
        initialize: function () {
            this._super();
            app.vent.on('quit', this.onQuit, this);
        },
        onQuit: function (guessesAllowed) {
            this.guessesAllowed = guessesAllowed;
        },
        start: function (e) {
            e.preventDefault();
            app.vent.trigger('starting', this.guessesAllowed);
        }
    });

    var SettingsDialogView = DialogView.extend({
        events: {
            'change input[type=radio]': 'configure',
            'click [href=#play]': 'play',
            'click [href=#splash]': 'cancel'
        },
        initialize: function () {
            this._super();
            this.listenTo(app.vent, 'started', this.onStarted);
        },
        onStarted: function () {
            var guessesAllowed = app.models.game.get('guessesAllowed');
            this.$('input[value=' + guessesAllowed + ']').prop('checked', true);
        },
        configure: function (e) {
            var guessesAllowed = parseInt($(e.target).attr('value'), 10);
            app.models.game.set('guessesAllowed', guessesAllowed);
        },
        play: function (e) {
            e.preventDefault();
            app.vent.trigger('play');
        },
        cancel: function (e) {
            var guessesAllowed = app.models.game.previousAttributes().guessesAllowed;
            e.preventDefault();
            app.models.game.set('guessesAllowed', guessesAllowed);
        }
    });

    var ResultDialogView = DialogView.extend({
        events: {
            'click [href=#play]': 'replay',
            'click [href=#splash]': 'quit'
        },
        initialize: function (options) {
            this._super(options);
            this.listenTo(app.vent, 'result', this.onResult);
        },
        onResult: function (result) {
            app.vent.trigger('dialog:show', result.type);
            this.$('span.secret-number').html(result.secretNumber);
        },
        replay: function (e) {
            e.preventDefault();
            this.trigger('replaying');
        },
        quit: function (e) {
            e.preventDefault();
            this.trigger('quitting');
        },
        trigger: function (eventName) {
            var guessesAllowed = app.models.game.get('guessesAllowed');
            app.vent.trigger(eventName, guessesAllowed);
        }
    });

    // app

    var App = function () {};

    App.prototype = {
        models: {},
        views: {},
        vent: _.extend({}, Backbone.Events),
        init: function () {
            console.log('initializing');
            this.views.gameBoard =  new BoardView({
                el: $('#play')
            });
            this.views.splashDialog = new SplashDialogView({
                el: $('#splash')
            });
            this.views.settingsDialog = new SettingsDialogView({
                el: $('#settings')
            });
            this.views.winDialog = new ResultDialogView({
                el: $('#win')
            });
            this.views.loseDialog = new ResultDialogView({
                el: $('#lose')
            });
            $('a.dialog').each(function () {
                return new DialogTriggerView({
                    el: $(this)
                });
            });
            this.vent.on('starting', this.onStarting, this);
            this.vent.on('replaying', this.onReplaying, this);
            this.vent.on('quitting', this.onQuitting, this);
        },
        onStarting: function (guessesAllowed) {
            console.log('starting');
            this.create(guessesAllowed);
            this.vent.trigger('started');
        },
        onReplaying: function (guessesAllowed) {
            console.log('replaying');
            this.reset();
            this.create(guessesAllowed);
            this.vent.trigger('play');
        },
        onQuitting: function (guessesAllowed) {
            console.log('quitting');
            this.reset();
            this.vent.trigger('quit', guessesAllowed);
        },
        create: function (guessesAllowed) {
            console.log('creating');
            this.models.game = new Game({
                guessesAllowed: guessesAllowed
            });
        },
        reset: function () {
            console.log('resetting');
            var game = this.models.game;
            game.clear().set(game.defaults);
        }
    };

    // init

    var app = new App();
    app.init();

}(jQuery, _, Backbone));
