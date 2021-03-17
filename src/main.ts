import { Game } from "./Game";

export let game: Game;

function main() {
    game = new Game(document.body);
    (window as any).game = game;
    game.start();
}

document.body.onload = main;
