/* CLASSES */
function Game (playerName, guessesAllowed) {
	this.playerName = playerName;
	this.guess = null;
	this.guessAccuracy = null;
	this.guessesAllowed = guessesAllowed;
	this.guessesMade = 0;
	this.guessesRemaining = null;
	this.getPlayerName = function () {
		return this.playerName;
	};
	this.getGuess = function () {
		return this.guess;
	};
	this.setGuess = function (guess) {
		this.guess = guess;
	};
	this.writeGuess = function (guess) {
		$('#guess > span.value').empty().append(guess);
	};
	this.getGuessAccuracy = function () {
		return this.guessAccuracy;
	};
	this.setGuessAccuracy = function (guessAccuracy) {
		this.guessAccuracy = guessAccuracy;
	};
	this.writeGuessAccuracy = function (guessAccuracy) {
	    var target, className;
	    target 		= $('#guess-accuracy > span.value');
	    className 	= guessAccuracy.toLowerCase();
	    target.empty().removeClass().addClass('value ' + className).append(guessAccuracy);
	};
	this.getGuessesAllowed = function () {
		return this.guessesAllowed;
	};
	this.setGuessesAllowed = function (guessesAllowed) {
		this.guessesAllowed = guessesAllowed;
	};
	this.writeGuessesAllowed = function (guessesAllowed) {
		$('#guesses-allowed > span.value').empty().append(guessesAllowed);
	};
	this.getGuessesMade = function () {
		return this.guessesMade;
	};
	this.setGuessesMade = function (guessesMade) {
		this.guessesMade = guessesMade;
	};
	this.writeGuessesMade = function (guessesMade) {
		$('#guesses-made > span.value').empty().append(guessesMade);
	},
	this.getGuessesRemaining = function () {
		return this.guessesAllowed - this.guessesMade;
	};
	this.setGuessesRemaining = function (guessesRemaining) {
		this.guessesRemaining = guessesRemaining;
	};
	this.writeGuessesRemaining = function (guessesRemaining) {
		$('#guesses-remaining > span.value')
			.empty()
			.append(guessesRemaining);
	};
}
/* APP */
var nu = {
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
		    overlays	= ui.overlays;
		prepareTiles();
		prepareDialogs();
		prepareDialogTriggers();
		preparePlayButton();
		prepareSettings();
		prepareProfile();
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
			var game,
				result,
				secretNumber,
				tileLink;
			$('.tile').removeClass('visited match');
			game = new Game(findPlayerName(), findGuessesAllowed());
			secretNumber = generateSecretNumber();
			$('a.tile').unbind('click').bind('click', function (e) {
			    var tileLink = $(this);
			    tileLink.addClass('visited').parent('div').addClass('visited');
				result = handleGuess(game, tileLink, secretNumber);
				if (typeof result !== "undefined") {
					showResult(secretNumber, result, tileLink);
					resetGame(game);
				}
				updateGauges(game);
				e.preventDefault();
			});
			prepareGauges(game);
		}
		// get the player's name from the profile form
		function findPlayerName () {
	    	var profileFormName = $("#profile-form-name");
	    	return (profileFormName.val() !== '') ? profileFormName.val() : profileFormName.attr('placeholder');
		}
		// get the number of guesses the player is allowed from the settings form
		function findGuessesAllowed () {
	    	return $('#settings-form').find('input[checked]').attr('value');
		}
		// generate the random secret number
		// (see StackOverflow question 1527803)
		function generateSecretNumber () {
			var lowTile = settings.lowTile,
			    highTile = settings.highTile;
			return Math.floor(Math.random() * (highTile - lowTile + 1)) + lowTile;
		}
		// ask some pertinent questions about the current guess
		function handleGuess (game, tileLink, secretNumber) {
			// how many guesses does the player have left?
			game.setGuessesMade(game.getGuessesMade() + 1);
			game.setGuessesRemaining(game.getGuessesAllowed() - game.getGuessesMade());
			// what is the current guess?
			game.setGuess(parseInt(tileLink.text()));
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
				return handleRightGuess(game, tileLink);
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
		function handleRightGuess (game, tileLink) {
			game.setGuessAccuracy(ui.strings.rightGuess);
			tileLink
				.removeClass('visited')
				.parent('div')
				.removeClass('visited');
			tileLink.addClass('match')
				.parent('div')
				.addClass('match');
			isGameLeaderboardWorthy(game);
			return 'win';
		}
		// open the win/lose dialog if the result of the game is known
		function showResult (secretNumber, result, tileLink) {
			tileLink
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
		// prepare the game board gauges
		function prepareGauges (game) {
			game.writeGuess				('-');
			game.writeGuessAccuracy		('-');
			game.writeGuessesAllowed	(game.getGuessesAllowed());
			game.writeGuessesMade		(game.getGuessesMade());
			game.writeGuessesRemaining	(game.getGuessesRemaining());
		}
		// update the game board gauges each time a guess is made
        function updateGauges (game) {
			game.writeGuess				(game.getGuess());
			game.writeGuessAccuracy		(game.getGuessAccuracy());
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
		// get the new number of guesses allowed
		function confirmSettingChange (form) {
			return parseInt(form.find('input[checked]').val());
		}
		// restore previous number of guesses if Cancel button is clicked
		function cancelSettingChange (form, oldSetting) {
			form.find('input[checked]').removeAttr('checked');
			form.find('input[value=' + oldSetting + ']').attr('checked', 'checked');
		}
		// determine the player's name
		function prepareProfile () {
			var form,
				textBox,
			    buttons;
			form = $('#profile-form');
			textBox = $('#profile-form-name');
			buttons = $('#profile .buttons');
			buttons.find('a').eq(0).bind('click', function (e) {
				textBox.attr('placeholder', textBox.val());
				e.preventDefault();
			});
			buttons.find('a').eq(1).bind('click', function (e) {
				textBox.val(textBox.attr('placeholder'));
				e.preventDefault();
			});
		}
		// does the current game warrant an entry on the leaderboard?
		function isGameLeaderboardWorthy (game) {
	    	var guessesMade, positionOnLeaderboard;
	    	guessesMade = game.getGuessesMade();
	    	positionOnLeaderboard = checkLeaderboard(guessesMade);
	    	if (positionOnLeaderboard !== "undefined") {
	    		updateLeaderBoard(positionOnLeaderboard, game);
	    	}
		}
	    // check where the current game belongs on the leaderboard
	    function checkLeaderboard (newGuessesMade) {
	    	var position, rows;
	    	rows = $('#leaderboard-table > tbody').find('tr');
	    	$.each(rows, function (index) {
	    		var oldGuessesMade = parseInt($(this).find('td').eq(2).text());
	    		if (newGuessesMade < oldGuessesMade) {
					position = index;
					return false;
	    		}
	    	});
	    	return position;
	    }
	    // update the leaderboard if the current game warrants an entry
	    function updateLeaderBoard (positionOnLeaderboard, game) {
	    	var leaderboardTableBody,
	    		rowToAdd,
	    		rowToTarget;
	    	leaderboardTableBody = $('#leaderboard-table > tbody');
	    	rowToAdd = $('<tr><td>' + game.getPlayerName() + '</td><td>' + game.getGuessesAllowed() + '</td><td>' + game.getGuessesMade() + '</td></tr>');
	    	rowToTarget = leaderboardTableBody.find('tr').eq(positionOnLeaderboard);
			rowToAdd.insertBefore(rowToTarget);
			leaderboardTableBody.find('tr').eq(3).remove();
	    }
		// nullify the game instance when the game is over
		function resetGame (game) {
			game = {};
		}
		// a generic function for setting an element's attribute value
		function setAttribute (element, attribute, value) {
			element.attr(attribute, value);
		}
    }
};
$(function () {
    nu.init();
});
