import { Game } from "./Game";

export let game: Game;

function main() {
    game = new Game(document.body);
    game.start();
}

document.body.onload = main;
