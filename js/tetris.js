"use strict";

var debug = true;
var out = function() {
	if (debug) console.log.apply(console, arguments);
}

var choose = function (list) {
	return list[Math.floor(Math.random() * list.length)];
}


var BACKGROUND = "#555";
var FOREGROUND = "#fff"
var BORDER = "#111";


var rotate_block = function(cell, center) {
	var rotatedC = (cell.row - center.row) + center.column;
	var rotatedR = -(cell.column - center.column) + center.row;
 	
 	cell.row = rotatedR;
 	cell.column = rotatedC;
}

var Block = function(row, column, color) {
	this.row = row;
	this.column = column;
	this.color = color;
}

Block.prototype.collides = function(other) {
	return this.row == other.row && this.column == other.column;
};

var Piece = function(row, column, type) {
	switch (type) {
	case 'I':
		this.make_I(row, column);
		break;
	case 'L':
		this.make_L(row, column);
		break;
	case 'J':
		this.make_J(row, column);
		break;
	case 'O':
		this.make_O(row, column);
		break;
	case 'Z':
		this.make_Z(row, column);
		break;
	case 'S':
		this.make_S(row, column);
		break;
	case 'T':
		this.make_T(row, column);
		break;
	default:
		throw "Piece type, " + type + ", is not recognized";
	}
	this.type = type;
}

Piece.prototype.make_I = function(row, column) {
	this.color = '#00FFFF';
	var relative_positions = [[0,0],[1,0],[2,0],[3,0]];
	this.make_blocks(row, column, relative_positions, this.color);
	this.center = new Block(row + 1.5, column + 0.5, null);
};

Piece.prototype.make_L = function(row, column) {
	this.color = '#FF9900';
	var relative_positions = [[0,0],[1,0],[0,1],[0,2]];
	this.make_blocks(row, column, relative_positions, this.color);
	this.center = new Block(row, column + 1, null);
};

Piece.prototype.make_J = function(row, column) {
	this.color = '#0000FF';
	var relative_positions = [[0,0],[1,0],[0,-1],[0,-2]];
	this.make_blocks(row, column, relative_positions, this.color);
	this.center = new Block(row, column - 1, null);
};

Piece.prototype.make_O = function(row, column) {
	this.color = '#FFFF00';
	var relative_positions = [[0,0],[1,0],[0,1],[1,1]];
	this.make_blocks(row, column, relative_positions, this.color);
	this.center = new Block(row + 0.5, column + 0.5, null);
};

Piece.prototype.make_Z = function(row, column) {
	this.color = '#FF0000';
	var relative_positions = [[0,0],[1,0],[0,-1],[1,1]];
	this.make_blocks(row, column, relative_positions, this.color);
	this.center = new Block(row + 1, column, null);
};

Piece.prototype.make_S = function(row, column) {
	this.color = '#66FF66';
	var relative_positions = [[0,0],[1,0],[0,1],[1,-1]];
	this.make_blocks(row, column, relative_positions, this.color);
	this.center = new Block(row + 1, column, null);
};

Piece.prototype.make_T = function(row, column) {
	this.color = '#6600CC';
	var relative_positions = [[0,0],[1,0],[0,1],[0,-1]];
	this.make_blocks(row, column, relative_positions, this.color);
	this.center = new Block(row, column, null);
};

Piece.prototype.make_blocks = function(row, column, relative_positions, color) {
	this.blocks = relative_positions.map(function(pos){
		return new Block(pos[0] + row, pos[1] + column, color);
	});
};

Piece.prototype.left = function() {
	for (var i = this.blocks.length - 1; i >= 0; i--)
		this.blocks[i].column--;
	this.center.column--;
};

Piece.prototype.right = function() {
	for (var i = this.blocks.length - 1; i >= 0; i--)
		this.blocks[i].column++;
	this.center.column++;
};

Piece.prototype.up = function() {
	for (var i = this.blocks.length - 1; i >= 0; i--)
		this.blocks[i].row--;
	this.center.row--;
};

Piece.prototype.down = function() {
	for (var i = this.blocks.length - 1; i >= 0; i--)
		this.blocks[i].row++;
	this.center.row++;
};

Piece.prototype.rotateCCW = function() {
	for (var i = this.blocks.length - 1; i >= 0; i--) {
		rotate_block(this.blocks[i], this.center)
	};
};

Piece.prototype.rotateCW = function() {
	for (var i = 3; i > 0; i--)
		this.rotateCCW();
};

var Board = function(painter, dx, dy, width, height, cell_size) {
	this.cell_size = cell_size;
	this.border_percent = 0.07;

	this.x = dx;
	this.y = dy;
	this.height = height;
	this.width = width;

	this.rows = Math.floor(this.height / this.cell_size);
	this.columns = Math.floor(this.width / this.cell_size);
	this.dx = this.x + Math.floor((this.width - this.columns * this.cell_size) / 2);
	this.dy = this.y + Math.floor((this.height - this.rows * this.cell_size) / 2);

	this.down_blocks = [];
	this.painter = painter;

	this.add_piece();
}

Board.prototype.left = function() {
	this.piece.left();
	if (this.check_piece_collision(this.piece))
		this.piece.right();
};

Board.prototype.right = function() {
	this.piece.right();
	if (this.check_piece_collision(this.piece))
		this.piece.left();
};

Board.prototype.hard_down = function() {
	while (!this.step());
};

Board.prototype.rotate = function() {
	this.piece.rotateCCW();
	if (this.check_piece_collision(this.piece))
		this.piece.rotateCW();
};

Board.prototype.step = function() {
	this.piece.down();
	if (this.check_piece_collision(this.piece)) {
		this.piece.up();
		this.down_blocks = this.down_blocks.concat(this.piece.blocks);
		this.handle_clear();
		this.add_piece();
		return true;
	};
	return false
};



Board.prototype.handle_clear = function() {
	this.down_blocks.sort(function(a, b) {
		return a.row - b.row;
	}).reverse();

	//Number of rows to drop each block by (# of rows removed)
	var down_step = 0;

	// Go through each block
	for (var i =  0; i < this.down_blocks.length; i++) {
		// Get that block's row
		var row_i = this.down_blocks[i].row;
		// If the next [this.columns - 1] blocks have the same row
		if (this.down_blocks[i + this.columns - 1] &&
		    this.down_blocks[i + this.columns - 1].row == row_i) {
			out("CLEAR NEEDED!");
			// Remove them all
			this.down_blocks.splice(i, this.columns);
			// Increase the number of rows removed
			down_step++;
			i--;
		} else {
			// drop down each block
			this.down_blocks[i].row += down_step;
		}
	}
};

Board.prototype.add_piece = function() {
	this.piece = new Piece(-3, 5, choose(['I','J','L','S','Z','T','O']));
	if (this.check_piece_collision(this.piece))
		throw "Game Over";
};

Board.prototype.check_piece_collision = function(piece) {
	for (var i = piece.blocks.length - 1; i >= 0; i--)
		if (this.check_block_collision(piece.blocks[i]))
			return true;
	return false
};

Board.prototype.check_block_collision = function(block) {
	var off_bottom = block.row >= this.rows;
	var off_right = block.column >= this.columns;
	var off_left = block.column < 0;
	var off_top = block.row < -3;
	var on_down_block = false;
	for (var i = this.down_blocks.length - 1; i >= 0; i--) {
		if (block.collides(this.down_blocks[i])) {
			var on_down_block = true
			break;
		};
	};
	return off_top || off_left || off_right || off_bottom || on_down_block;
};

Board.prototype.paint = function() {
	this.draw_board();
	this.draw_down_blocks();
	this.draw_piece(this.piece);
};

Board.prototype.draw_board = function() {
	this.painter.fillStyle = BACKGROUND;
	this.painter.fillRect(this.x, this.y, this.width, this.height);
	this.painter.fillStyle = FOREGROUND;
	this.painter.fillRect(this.dx,
						   this.dy,
						   this.columns * this.cell_size,
						   this.rows * this.cell_size);
};

Board.prototype.draw_piece = function(piece) {
	for (var i = piece.blocks.length - 1; i >= 0; i--)
		this.draw_cell(piece.blocks[i]);
};

Board.prototype.draw_down_blocks = function() {
	for (var i = this.down_blocks.length - 1; i >= 0; i--)
		this.draw_cell(this.down_blocks[i]);
};

Board.prototype.draw_cell = function(block) {
	var color = block.color,
		row_num = block.row,
		col_num = block.column,
		border = Math.floor( this.border_percent * this.cell_size);
	if (row_num >= 0) {
		var x = this.dx + this.cell_size * col_num,
			y = this.dy + this.cell_size * row_num,
			w = this.cell_size,
			h = this.cell_size;
		this.painter.fillStyle = BORDER;
		this.painter.fillRect(x, y, w, h);
		this.painter.fillStyle = color;
		this.painter.fillRect(x + border, y + border,
							  w - 2 * border, h - 2 * border);
	};
};

var Tetris = function(canvas_element_id) {
	this.cell_size = 30;

	this.tick_period = 400; // milliseconds, e = 0.001
	this.fast_mode = false

	this.element_id = canvas_element_id;
	this.canvas = document.getElementById(this.element_id);
	this.painter = this.canvas.getContext("2d");
	this.height = this.canvas.height;
	this.width = this.canvas.width;

	out("Making board");
	this.board = new Board(this.painter,
						   5, 5,
						   this.width - 10, this.height - 10,
						   this.cell_size);
	out("Board:", this.board);

	this.times = { start:null, last:null };
	this.paint();
};

Tetris.prototype.paint = function() {
	this.painter.fillStyle = BACKGROUND;
	this.painter.fillRect(0,0,this.width, this.height);
	this.board.paint();
};

Tetris.prototype.process_game = function(timestamp) {
	if (!this.times.start) this.times.last = this.times.start = timestamp;
	if (this.past_step(timestamp))
		this.board.step();
	this.paint();
	this.times.last = timestamp;
};

Tetris.prototype.past_step = function(timestamp) {
	var tick_period = this.tick_period / (this.fast_mode ? 4 : 1);
	var number_of_ticks = Math.floor((timestamp - this.times.start) / tick_period);
	var last_tick_time = number_of_ticks * tick_period;
	var last_time = this.times.last - this.times.start;
	return last_tick_time > last_time;
};

/*
 * Key Press Handling
 */

Tetris.prototype.handle_key_down = function(e) {
	var code = e.keyCode ? e.keyCode : e.which;
	switch(code) {
	case 32:
		this.board.hard_down();
		break;
	case 37:
		this.board.left();
		break;
	case 38:
		this.board.rotate();
		break;
	case 39:
		this.board.right();
		break;
	case 40:
		this.faster();
	}
};

Tetris.prototype.handle_key_up = function(e) {
	var code = e.keyCode ? e.keyCode : e.which;
	switch (code) {
	case 40:
		this.slower();
	}
};

Tetris.prototype.faster = function() { this.fast_mode = true; };
Tetris.prototype.slower = function() { this.fast_mode = false; };