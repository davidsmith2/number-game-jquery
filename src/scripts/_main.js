(function ($, _, Backbone) {



    // config

    var config = {
        settings: {
            lowTile: 1,
            highTile: 100,
            guessesAllowed: 13
        },
        ui: {
            strings: {
                highGuess: 'High',
                lowGuess: 'Low',
                rightGuess: 'Match'
            },
            overlays: {
                attributes: {
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
            }
        }
    };



    // vent

    var vent = _.extend({}, Backbone.Events);



    // models

    var Player = Backbone.Model.extend({
        defaults: {
            name: ''
        }
    });

    var Game = Backbone.Model.extend({
        defaults: {
            guess: null,
            guessAccuracy: null,
            guessesAllowed: config.settings.guessesAllowed,
            guessesMade: 0,
            guessesRemaining: null
        },
        initialize: function () {
            var secretNumber = this.generateSecretNumber(),
                self = this;

            console.log(secretNumber)

            this.listenTo(vent, 'makeGuess', function (guess) {
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
                vent.trigger('result', 'lose', secretNumber);
            }
            if (guess < secretNumber) {
                guessAccuracy = config.ui.strings.lowGuess;
            } else if (guess > secretNumber) {
                guessAccuracy = config.ui.strings.highGuess;
            }
            this.set('guessAccuracy', guessAccuracy);
        },
        handleRightGuess: function (secretNumber) {
            this.set('guessAccuracy', config.ui.strings.rightGuess);
            //isGameLeaderboardWorthy(game);
            vent.trigger('result', 'win', secretNumber);
        }
    });



    // views

    var PlayingAreaView = Backbone.View.extend({
        initialize: function () {
            this.listenTo(vent, 'startGame', this.show);
        },
        show: function () {
            this.$el.expose();
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
            this.listenTo(vent, 'startGame', this.onStartGame);
            this.listenTo(vent, 'result', this.onGameResult);
            this.render();
        },
        onStartGame: function () {
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
            vent.trigger('makeGuess', guess);
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
                .overlay(config.ui.overlays.attributes.autoload);
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
                            config.ui.overlays.attributes.basic,
                            config.ui.overlays.attributes.autoload
                        )
                    );
            } else {
                this.$el.overlay(config.ui.overlays.attributes.basic);
            }
            this.listenTo(vent, 'showDialog', this.show);
            this.listenTo(vent, 'startGame', this.closeOverlay);
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
            'change input[type=radio]': 'onChange'
        },
        onChange: function (e) {
            this.model.set('guessesAllowed', $(e.target).attr('value'));
        }
    });

    var ProfileView = DialogView.extend({
        events: {
            'blur input[type=text]': 'onBlur'
        },
        onBlur: function (e) {
            this.model.set('name', $(e.target).val());
        }
    });

    var ResultView = DialogView.extend({
        initialize: function () {
            var self = this;
            this.listenTo(vent, 'result', function (result, secretNumber) {
                self.show(result);
                self.showSecretNumber(secretNumber);
            });
        },
        showSecretNumber: function (secretNumber) {
            this.$('span.secret-number').empty().append(secretNumber);
        }
    });

    var DialogTriggerView = Backbone.View.extend({
        events: {
            'click': 'onClick'
        },
        initialize: function () {
            var self = this;
            this.$el.attr('rel', this.$el.attr('href')).overlay(config.ui.overlays.attributes.basic);
        },
        onClick: function (e) {
            e.preventDefault();
            this.showDialog();
        },
        showDialog: function (e) {
            vent.trigger('showDialog', this.$el.attr('href').slice(1));
        }
    });

    var PlayButtonView = Backbone.View.extend({
        events: {
            'click': 'onClick'
        },
        onClick: function (e) {
            e.preventDefault();
            vent.trigger('startGame');
        }
    });





    // init code

    var player = new Player();

    var game = new Game();

    var playingAreaView = new PlayingAreaView({
        el: '#play'
    });

    var tilesView =  new TilesView({
        el: '#tiles'
    });

    var playButtonView = new PlayButtonView({
        el: $('a[href="#play"]')
    });

    $('div.dialog').each(function () {
        var $el = $(this),
            id = $el.attr('id'),
            view;
        switch (id) {
            case 'settings':
                view = new SettingsView({
                    el: $el,
                    model: game
                });
                break;
            case 'profile':
                view = new ProfileView({
                    el: $el,
                    model: player
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
    });

    $('a.dialog').each(function () {
        return new DialogTriggerView({
            el: $(this)
        });
    });





}(jQuery, _, Backbone));
