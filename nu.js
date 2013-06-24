/* GAME PROPERTIES */
function Game () {
	this.guess = null;
	this.guessAccuracy = null;
	this.guessesAllowed = null;
	this.guessesMade = 0;
	this.guessesRemaining = null;
}
/* GAME METHODS (normal) */
Game.prototype.getGuess = function () {
	return this.guess;
};
Game.prototype.setGuess = function (guess) {
	this.guess = guess;
};
Game.prototype.getGuessAccuracy = function () {
	return this.guessAccuracy;
};
Game.prototype.setGuessAccuracy = function (guessAccuracy) {
	this.guessAccuracy = guessAccuracy;
};
Game.prototype.getGuessesAllowed = function () {
	return this.guessesAllowed;
};
Game.prototype.setGuessesAllowed = function (guessesAllowed) {
	this.guessesAllowed = guessesAllowed;
};
Game.prototype.getGuessesMade = function () {
	return this.guessesMade;
};
Game.prototype.setGuessesMade = function (guessesMade) {
	this.guessesMade = guessesMade;
};
Game.prototype.getGuessesRemaining = function () {
	return this.guessesAllowed - this.guessesMade;
};
Game.prototype.setGuessesRemaining = function (guessesRemaining) {
	this.guessesRemaining = guessesRemaining;
};
/* GAME METHODS (writing) */
Game.prototype.writeGuess = function (guess) {
	$('#guess > span.value').empty().append(guess);
};
Game.prototype.writeGuessAccuracy = function (guessAccuracy) {
    var target, className;
    target 		= $('#guess-accuracy > span.value');
    className 	= guessAccuracy.toLowerCase();
    target.empty().removeClass().addClass('value ' + className).append(guessAccuracy);
};
Game.prototype.writeGuessesAllowed = function (guessesAllowed) {
	$('#guesses-allowed > span.value').empty().append(guessesAllowed);
};
Game.prototype.writeGuessesMade = function (guessesMade) {
	$('#guesses-made > span.value').empty().append(guessesMade);
},
Game.prototype.writeGuessesRemaining = function (guessesRemaining) {
	$('#guesses-remaining > span.value')
		.empty()
		.append(guessesRemaining);
};
/* APP */
var nu = {
    isRunning: false,
    settings: {
		lowTile: 1,
		highTile: 100,
		getLowTile: function () {
			return this.lowTile;
		},
		setLowTile: function (lowTile) {
			this.lowTile = lowTile;
		},
		getHighTile: function () {
			return this.highTile;
		},
		setHighTile: function (highTile) {
			this.highTile = highTile;
		}
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
	},
    init: function () {
		var nu			= this,
		    settings	= nu.settings,
		    state 		= nu.state,
		    ui 			= nu.ui,
		    overlays	= ui.overlays,
		    guessesAllowed;
		nu.isRunning = true;
		prepareTiles();
		prepareDialogs();
		prepareDialogTriggers();
		preparePlayButton();
		prepareSettings();
		// prepare the game board tiles
		function prepareTiles () {
			var tiles = '',
			    tile,
				lowTile = settings.lowTile,
				highTile = settings.highTile;
			for (var i = lowTile; i < (highTile + 1); i++) {
				tile = '<a class="tile" href="#' + i + '">' + i + '</a>';
				tiles += '<div class="tile">' + tile + '</div>';
			}
			$('#tiles').append(tiles);
		}
		// should the overlay be triggered manually or automatically?
		function prepareDialogs () {
			$('div.dialog').each(function (index) {
				var el = $(this);
				(index === 0) ? el.overlay($.extend({}, overlays.attributes.basic, overlays.attributes.autoload)) : el.overlay(overlays.attributes.basic);
			});
		}
		// prepare the links that trigger the overlays
		function prepareDialogTriggers () {
			$('a.dialog').each(function () {
				var el = $(this),
					href = el.attr('href'),
					id = href.slice(1);
				el.attr('rel', href).overlay(overlays.attributes.basic).bind('click', function (e) {
					openOverlay(id);
					e.preventDefault();
				});
			});
		}
		// special behavior required for the play button:
		// both overlay and mask need to be hidden
		function preparePlayButton () {
			var game;
			$('a[href*=play]').unbind('click').bind('click', function (e) {
				startGame();
				closeOverlay();
				e.preventDefault();
			});
		}
		// the result of pressing "play"!
		function startGame () {
			var game, guessesAllowed, secretNumber, link, result;
			$('.tile').removeClass('visited match');
			game = new Game();
			game.setGuessesAllowed(findGuessesAllowed());
			secretNumber = generateSecretNumber();
			$('a.tile').unbind('click').bind('click', function (e) {
			    var link = $(this);
			    link.addClass('visited').parent('div').addClass('visited');
				result = handleGuess(game, link, secretNumber);
				if (typeof result !== "undefined") {
					showResult(secretNumber, result, link);
					resetGame(game);
				}
				updateGauges(game);
				e.preventDefault();
			});
			prepareGauges(game);
		}
		// get the current number of guesses allowed from the settings form
		function findGuessesAllowed () {
		    var form, currentValue, newValue;
		    form = $('#settings-form');
		    currentValue = form.find('input[type=radio]').eq(0).val();
		    newValue = form.find('input[checked]').val();
			return (typeof newValue !== "undefined") ? newValue : currentValue;
		}
		// generate the random secret number
		// (see StackOverflow question 1527803)
		function generateSecretNumber () {
			var lowTile = settings.lowTile,
			    highTile = settings.highTile;
			return Math.floor(Math.random() * (highTile - lowTile + 1)) + lowTile;
		}
		// ask some pertinent questions about the current guess
		function handleGuess (game, link, secretNumber) {
			// how many guesses does the player have left?
			game.setGuessesMade(game.getGuessesMade() + 1);
			game.setGuessesRemaining(game.getGuessesAllowed() - game.getGuessesMade());
			// what is the current guess?
			game.setGuess(parseInt(link.text()));
			// is the current guess right or wrong?
			if (game.getGuess() !== secretNumber) {
    			// if the current guess is wrong and 
    			// the player has no guesses left, 
    			// they lose
			    if (game.getGuessesRemaining() === 0) return 'lose';
			    // if the current guess is wrong and
			    // the player has some guesses left, 
			    // find out if the guess is low or high
				handleWrongGuess(game, secretNumber);
			} else {
				// if the current guess is right,
				// the player wins
				return handleRightGuess(game, link);
			}
		}
		// did the player guess wrong
		function handleWrongGuess (game, secretNumber) {
		    var guessAccuracy, guess = game.getGuess();
			if (guess < secretNumber) {
				guessAccuracy = ui.strings.lowGuess; // did the player guess low
			} else if (guess > secretNumber) {
				guessAccuracy = ui.strings.highGuess; // did the player guess high

			}
			game.setGuessAccuracy(guessAccuracy);
		}
		// did the player guess right?
		function handleRightGuess (game, link) {
			game.setGuessAccuracy(ui.strings.rightGuess);
			link
				.removeClass('visited')
				.parent('div')
				.removeClass('visited');
			link.addClass('match')
				.parent('div')
				.addClass('match');
			return 'win';
		}
		// open the win/lose dialog if the result of the game is known
		function showResult (secretNumber, result, link) {
			link
			    .unbind('click')
				.attr('rel', '#' + result)
				.overlay(overlays.attributes.autoload);
			$('div.dialog').hide();
			$.mask.getMask().show();
			$('div[id=' + result + ']')
				.show()
				.find('span.secret-number')
				.empty()
				.append(secretNumber);
			
		}
		// nullify the game instance when the game is over
		function resetGame (game) {
			game = null;
		}
		// update the game board gauges each time a guess is made
        function updateGauges (game) {
			game.writeGuess				(game.getGuess());
			game.writeGuessAccuracy		(game.getGuessAccuracy());
			game.writeGuessesMade		(game.getGuessesMade());
			game.writeGuessesRemaining	(game.getGuessesRemaining());
		}
		// prepare the game board gauges
		function prepareGauges (game) {
			game.writeGuess				('-');
			game.writeGuessAccuracy		('-');
			game.writeGuessesAllowed	(game.getGuessesAllowed());
			game.writeGuessesMade		(game.getGuessesMade());
			game.writeGuessesRemaining	(game.getGuessesRemaining());
		}
		// close overlay (does what it says on the tin!)
		function closeOverlay () {
			// use the jQuery Tools API to force-close the dialog
			var overlay = $('div.dialog').hide().data('overlay');
			overlay.close();
			// reveal the playing area
			$('#play').expose();
			// hide the mask
			$.mask.close();
			
		}
		// open overlay (does what it says on the tin!)
		function openOverlay (id) {
			// hide all dialogs except the one that's required
			$('div.dialog').hide();
			// show the mask
			$.mask.getMask().show();
			// show the required dialog
			$('div[id=' + id + ']').show();
		}
		// determine how many guesses the player is allowed
		function prepareSettings () {
			var form,
			    buttons,
			    oldSetting;
			form = $('#settings-form');
			buttons = $('#settings .buttons');
			form.find('input[type=radio]').eq(0).attr('checked', 'checked');
			form.find('input[type=radio]').change(function () {
				oldSetting = handleSettingChange(form, $(this));
			});
			buttons.find('a').eq(0).bind('click', function (e) {
				confirmSettingChange(form);
				e.preventDefault();
			});
			buttons.find('a').eq(1).bind('click', function (e) {
				cancelSettingChange(form, oldSetting);
				e.preventDefault();
			});
		}
		// get the current number of guesses allowed 
		// before unchecking the button
		function handleSettingChange (form, input) {
			var guessesAllowed = parseInt(form.find('input[checked]').removeAttr('checked').val());
			setAttribute(input, 'checked', 'checked');
			return guessesAllowed;
		}
		// a generic function for setting an element's attribute value
		function setAttribute (element, attribute, value) {
			element.attr(attribute, value);
		}
		// get the new number of guesses allowed
		function confirmSettingChange (form) {
			return parseInt(form.find('input[checked]').val());
		}
		// restore previous number of guesses if Cancel button is clicked
		function cancelSettingChange (form, oldSetting) {
			form.find('input[checked]').removeAttr('checked');
			form.find('input[value=' + oldSetting + ']').attr('checked', 'checked');
		}
    }
};
$(function () {
    nu.init();
});
