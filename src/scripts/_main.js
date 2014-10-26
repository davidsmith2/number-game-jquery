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
            basic: {
                closeOnClick:false,
                mask: {
                    color:'#333',
                    loadSpeed:100,
                    maskId: 'mask',
                    opacity:0.75,
                    zIndex:9998
                },
                oneInstance:false
            },
            autoload: {
                load:true
            }
        }
    };

    // vent

    var vent = _.extend({}, Backbone.Events);

    // models

    var Game = Backbone.Model.extend({
        defaults: {
            guess: null,
            guessAccuracy: null,
            guessesAllowed: config.settings.guessesAllowed,
            guessesMade: 0,
            guessesRemaining: config.settings.guessesAllowed
        },
        initialize: function () {
            var secretNumber = this.generateSecretNumber(),
                self = this;
            this.listenTo(vent, 'game:guess', function (guess) {
                self.handleGuess(guess);
                if (self.get('guess') !== secretNumber) {
                    self.handleWrongGuess(guess, secretNumber);
                } else {
                    self.handleRightGuess(secretNumber);
                }
            });
        },
        generateSecretNumber: function () {
            var lowTile = config.settings.lowTile,
                highTile = config.settings.highTile;
            return Math.floor(Math.random() * (highTile - lowTile + 1)) + lowTile;
        },
        handleGuess: function (guess) {
            this.set('guess', guess);
            this.set('guessesMade', this.get('guessesMade') + 1);
            this.set('guessesRemaining', this.get('guessesAllowed') - this.get('guessesMade'));
        },
        handleWrongGuess: function (guess, secretNumber) {
            var guessAccuracy;
            if (this.get('guessesRemaining') === 0) {
                vent.trigger('game:result', 'lose', secretNumber);
            }
            if (guess < secretNumber) {
                guessAccuracy = config.strings.lowGuess;
            } else if (guess > secretNumber) {
                guessAccuracy = config.strings.highGuess;
            }
            this.set('guessAccuracy', guessAccuracy);
        },
        handleRightGuess: function (secretNumber) {
            this.set('guessAccuracy', config.strings.rightGuess);
            vent.trigger('game:result', 'win', secretNumber);
            //isGameLeaderboardWorthy(game);
        }
    });

    // views

    var PlayingAreaView = Backbone.View.extend({
        initialize: function () {
            this.listenTo(vent, 'game:start', this.show);
        },
        show: function () {
            this.$el.expose();
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
            this.listenTo(vent, 'game:guess', this.updateAll);
            this.model.on('change:guessesAllowed', function (model) {
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
            this.$('#' + id + ' > .value').html(this.model.get(this.ids[id]));
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
        states: ['visited', 'match'],
        events: {
            'click a': 'onClick'
        },
        initialize: function (options) {
            this.tileLinkView = new TileLinkView(options);
            this.$el.append(this.tileLinkView.el);
            this.listenTo(vent, 'game:start', this.onGameStart);
            this.listenTo(vent, 'game:result', this.onGameResult);
            this.render();
        },
        onGameStart: function () {
            var states = this.states.join(' ');
            this.$el.removeClass(states);
            this.tileLinkView.$el.removeClass(states);
        },
        onClick: function (e) {
            var state = this.states[0],
                guess = parseInt(this.tileLinkView.$el.text(), 10);
            e.preventDefault();
            this.$el.addClass(state);
            this.tileLinkView.$el.addClass(state);
            vent.trigger('game:guess', guess);
        },
        onGameResult: function (result, secretNumber) {
            this.handleResult(result);
            if (result === 'win') {
                this.handleWin();
            } else {
                this.handleLose();
            }
        },
        handleResult: function (result) {
            this.tileLinkView.$el
                .unbind('click')
                .attr('rel', '#' + result)
                .overlay(config.overlays.autoload);
        },
        handleWin: function () {
            var stateToRemove = this.states[0],
                stateToAdd = this.states[1];
            this.$el.removeClass(stateToRemove).addClass(stateToAdd);
            this.tileLinkView.$el.removeClass(stateToRemove).addClass(stateToAdd);
        },
        handleLose: function () {}
    });

    var TilesView = Backbone.View.extend({
        initialize: function () {
            var lowTile = config.settings.lowTile,
                highTile = config.settings.highTile;
            for (var i = lowTile; i < (highTile + 1); i++) {
                tileView = new TileView({
                    number: i
                });
                this.$el.append(tileView.el);
            }
        }
    });

    var DialogView = Backbone.View.extend({
        initialize: function () {
            if (this.$el.attr('id') === 'splash') {
                this.$el
                    .overlay(
                        $.extend(
                            {},
                            config.overlays.basic,
                            config.overlays.autoload
                        )
                    );
            } else {
                this.$el.overlay(config.overlays.basic);
            }
            this.listenTo(vent, 'dialog:show', this.show);
            this.listenTo(vent, 'game:start', this.closeOverlay);
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

    var SettingsView = DialogView.extend({
        events: {
            'change input[type=radio]': 'onChange',
            'click .button-red': 'onCancel'
        },
        onChange: function (e) {
            var guesses = $(e.target).attr('value');
            this.model.set({
                'guessesAllowed': guesses,
                'guessesRemaining': guesses
            });
        },
        onCancel: function (e) {
            var guesses = this.model.previousAttributes().guessesAllowed;
            e.preventDefault();
            this.model.set({
                'guessesAllowed': guesses,
                'guessesRemaining': guesses
            });
        }
    });

    var ResultView = DialogView.extend({
        initialize: function () {
            this._super();
            this.listenTo(vent, 'game:result', this.show);
        },
        show: function (result, secretNumber) {
            this._super(result);
            this.$('span.secret-number').html(secretNumber);
        }
    });

    var DialogTriggerView = Backbone.View.extend({
        events: {
            'click': 'onClick'
        },
        initialize: function () {
            var self = this;
            this.$el.attr('rel', this.$el.attr('href')).overlay(config.overlays.basic);
        },
        onClick: function (e) {
            e.preventDefault();
            this.showDialog();
        },
        showDialog: function (e) {
            vent.trigger('dialog:show', this.$el.attr('href').slice(1));
        }
    });

    var PlayButtonView = Backbone.View.extend({
        events: {
            'click': 'onClick'
        },
        onClick: function (e) {
            e.preventDefault();
            vent.trigger('game:start');
        }
    });

    // init code

    var app = {};
    app.models = {};

    app.init = function () {
        var playingAreaView,
            gaugesView,
            tilesView,
            playButtonView;

        // init models
        app.models.game = new Game();

        // init views
        playingAreaView = new PlayingAreaView({
            el: '#play'
        });
        gaugesView = new GaugesView({
            el: '#gauges',
            model: app.models.game
        });
        tilesView =  new TilesView({
            el: '#tiles'
        });
        playButtonView = new PlayButtonView({
            el: $('a[href="#play"]')
        });
        $('div.dialog').each(app.initDialogs);
        $('a.dialog').each(app.initDialogTriggers);
    };

    app.initDialogs = function () {
        var $el = $(this),
            id = $el.attr('id'),
            view;
        switch (id) {
            case 'settings':
                view = new SettingsView({
                    el: $el,
                    model: app.models.game
                });
                break;
            case 'win':
            case 'lose':
                view = new ResultView({
                    el: $el
                });
                break;
            default:
                view = new DialogView({
                    el: $el
                });
        }
        return view;

    };

    app.initDialogTriggers = function () {
        return new DialogTriggerView({
            el: $(this)
        });

    };

    app.init();

}(jQuery, _, Backbone));
