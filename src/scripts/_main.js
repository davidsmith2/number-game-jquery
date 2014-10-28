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
            guessesAllowed: config.settings.guessesAllowed,
            guessesMade: 0,
            guessesRemaining: null
        },
        initialize: function () {
            this.secretNumber = this.getSecretNumber();





            console.log(this.secretNumber);





            this.on('change:guessesAllowed', this.onChangeGuessesAllowed, this);
            this.listenTo(app.vent, 'game:guess', this.handleGuess);
            this.set('guessesRemaining', this.get('guessesAllowed'));
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
        handleGuess: function (guess) {
            var secretNumber = this.secretNumber;
            this.set('guess', guess);
            this.set('guessesMade', this.get('guessesMade') + 1);
            this.set('guessesRemaining', this.get('guessesAllowed') - this.get('guessesMade'));
            if (guess !== secretNumber) {
                this.handleWrongGuess(guess, secretNumber);
            } else {
                this.handleRightGuess(guess, secretNumber);
            }
        },
        handleWrongGuess: function (guess, secretNumber) {
            var guessAccuracy;
            if (this.get('guessesRemaining') === 0) {
                this.set({
                    result: 'lose',
                    secretNumber: secretNumber
                });
                app.result();
            }
            if (guess < secretNumber) {
                guessAccuracy = config.strings.lowGuess;
            } else if (guess > secretNumber) {
                guessAccuracy = config.strings.highGuess;
            }
            this.set('guessAccuracy', guessAccuracy);
        },
        handleRightGuess: function (guess, secretNumber) {
            this.set({
                guessAccuracy: config.strings.guessAccuracy,
                result: 'win',
                secretNumber: secretNumber
            });
            app.result();
        }
    });

    // views

    var PlayingAreaView = Backbone.View.extend({
        events: {
            'click a[href=#splash]': 'quitGame'
        },
        initialize: function () {
            this.initTiles();
            this.listenTo(app.vent, 'game:start', this.onStartGame);
            this.listenTo(app.vent, 'game:play', this.onPlayGame);
        },
        onStartGame: function () {
            this.initGauges();
        },
        onPlayGame: function () {
            this.$el.expose();
        },
        quitGame: function (e) {
            e.preventDefault();
            app.quit();
        },
        initTiles: function () {
            return new TilesView({
                el: this.$('#tiles')
            });
        },
        initGauges: function () {
            return new GaugesView({
                el: this.$('#gauges')
            });
        }
    });

    var GaugesView = Backbone.View.extend({
        ids: {
            'guess'                : 'guess',
            'guess-accuracy'       : 'guessAccuracy',
            'guesses-allowed'      : 'guessesAllowed',
            'guesses-made'         : 'guessesMade',
            'guesses-remaining'    : 'guessesRemaining'
        },
        initialize: function () {
            var self = this;
            this.updateAll();
            this.listenTo(app.vent, 'game:play', this.updateAll);
            this.listenTo(app.vent, 'game:guess', this.updateAll);
            app.models.game.on('change:guessesAllowed', function (game) {
                self.update('guesses-allowed');
                self.update('guesses-remaining');
            });
        },
        updateAll: function () {
            for (var id in this.ids) {
                this.update(id);
            }
        },
        update: function (id) {
            var $el = this.$('#' + id + ' > .value'),
                guessAccuracy = app.models.game.get('guessAccuracy');
            $el.html(app.models.game.get(this.ids[id]));
            if (guessAccuracy && id === 'guess-accuracy') {
                $el.removeClass().addClass('value ' + guessAccuracy.toLowerCase());
            }
        }
    });

    var TileLinkView = Backbone.View.extend({
        tagName: 'a',
        className: 'tile',
        initialize: function (options) {
            this.$el.attr('href', '#' + options.number).html(options.number);
            this.render();
        }
    });

    var TileView = Backbone.View.extend({
        className: 'tile',
        initialize: function (options) {
            this.$el.append(new TileLinkView(options).el);
            this.render();
        }
    });

    var TilesView = Backbone.View.extend({
        events: {
            'click a': 'onClick'
        },
        states: ['visited', 'match'],
        initialize: function () {
            var lowTile = config.settings.lowTile,
                highTile = config.settings.highTile;
            for (var i = lowTile; i < (highTile + 1); i++) {
                tileView = new TileView({
                    number: i
                });
                this.$el.append(tileView.el);
            }
            this.listenTo(app.vent, 'game:play', this.onStartGame);
            this.listenTo(app.vent, 'game:result', this.onFinishGame);
        },
        onClick: function (e) {
            e.preventDefault();
            this.onGuess($(e.target));
        },
        onGuess: function ($eventTarget) {
            var state = this.states[0],
                guess = parseInt($eventTarget.text(), 10);
            $eventTarget.addClass(state).parent('.tile').addClass(state);
            app.guess(guess);
        },
        onStartGame: function () {
            var states = this.states.join(' ');
            this.$('.tile').removeClass(states);
        },
        onFinishGame: function () {
            var stateToRemove = this.states[0],
                stateToAdd = this.states[1],
                $eventTarget = this.$('a[href=#' + app.models.game.get('guess') + ']');
            $eventTarget
                .unbind('click')
                .attr('rel', '#' + app.models.game.get('result'))
                .overlay(
                    $.extend(
                        {},
                        config.overlays.manual,
                        config.overlays.auto
                    )
                );
            if (app.models.game.get('result') === 'win') {
                $eventTarget
                    .removeClass(stateToRemove)
                    .addClass(stateToAdd)
                    .parent('.tile')
                    .removeClass(stateToRemove)
                    .addClass(stateToAdd);
            }
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
            this.listenTo(app.vent, 'game:showDialog', this.show);
            this.listenTo(app.vent, 'game:play', this.closeOverlay);
        },
        show: function (id) {
            this.openOverlay();
            if (this.$el.attr('id') === id) {
                this.$el.show();
            } else {
                this.$el.hide();
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

    var SplashView = DialogView.extend({
        events: {
            'click [href=#settings]': 'start'
        },
        start: function (e) {
            e.preventDefault();
            app.start(new Game());
        }
    });

    var SettingsView = DialogView.extend({
        events: {
            'change input[type=radio]': 'configure',
            'click [href=#play]': 'play',
            'click [href=#splash]': 'quit'
        },
        initialize: function () {
            this._super();
            this.listenTo(app.vent, 'game:start', this.initForm);
        },
        initForm: function () {
            var guessesAllowed = app.models.game.get('guessesAllowed');
            this.$('input[value=' + guessesAllowed + ']').prop('checked', true);
        },
        configure: function (e) {
            var guessesAllowed = parseInt($(e.target).attr('value'), 10);
            app.models.game.set('guessesAllowed', guessesAllowed);
        },
        play: function (e) {
            e.preventDefault();
            app.play();
        },
        quit: function (e) {
            var guessesAllowed = app.models.game.previousAttributes().guessesAllowed;
            e.preventDefault();
            app.models.game.set('guessesAllowed', guessesAllowed);
        }
    });

    var ResultView = DialogView.extend({
        events: {
            'click [href=#play]': 'replay'
        },
        initialize: function (options) {
            this._super(options);
            this.listenTo(app.vent, 'game:result', this.showResult);
        },
        showResult: function () {
            this.show(app.models.game.get('result'));
            this.$('span.secret-number').html(app.models.game.get('secretNumber'));
        },
        replay: function (e) {
            var guessesAllowed, game;
            e.preventDefault();
            guessesAllowed = app.models.game.get('guessesAllowed');
            game = new Game({guessesAllowed: guessesAllowed});
            app.replay(game);
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
            this.showDialog();
        },
        showDialog: function (e) {
            app.showDialog(this.$el.attr('href').slice(1));
        }
    });

    // app

    var App = function () {};

    App.prototype = {
        models: {},
        views: {},
        vent: _.extend({}, Backbone.Events),
        init: function () {
            this.views.playingArea =  new PlayingAreaView({
                el: $('#play')
            });
            this.views.splash = new SplashView({
                el: $('#splash')
            });
            this.views.settings = new SettingsView({
                el: $('#settings')
            });
            this.views.win = new ResultView({
                el: $('#win')
            });
            this.views.lose = new ResultView({
                el: $('#lose')
            });
            $('a.dialog').each(function () {
                return new DialogTriggerView({
                    el: $(this)
                });
            });
        },
        start: function (game) {
            this.models.game = game;
            this.vent.trigger('game:start');
        },
        play: function () {
            this.vent.trigger('game:play');
        },
        guess: function (guess) {
            this.vent.trigger('game:guess', guess);
        },
        result: function () {
            this.vent.trigger('game:result');
        },
        replay: function (game) {
            this.models.game = game;
            this.play();
            this.vent.trigger('game:replay');
        },
        quit: function () {
            this.vent.trigger('game:quit');
        },
        showDialog: function (id) {
            this.vent.trigger('game:showDialog', id);
        }
    };

    // init code

    var app = new App();
    app.init();


}(jQuery, _, Backbone));
