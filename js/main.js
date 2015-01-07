window.onload = function() {
	game = new Tetris("game-screen");
	window.onkeydown = function(e) {game.handle_key_down(e)};
	window.onkeyup = function(e) {game.handle_key_up(e)};
	console.log("Game created");
	var frame = function(timestamp) { 
		game.process_game(timestamp);
		game.frame = window.requestAnimationFrame(frame)
	};
	window.requestAnimationFrame(frame);
};