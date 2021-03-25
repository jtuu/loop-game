import { Game } from "./Game";
import { LogStyle, MessageLog } from "./MessageLog";

export let game: Game;
export let message_log: MessageLog;

function init_global_event_handlers() {
    const save_delete_duration = 3000;
    let delete_down_time: number = Infinity;

    window.addEventListener("keydown", e => {
        if (e.code == "Delete") {
            delete_down_time = Date.now();
        }
    });

    window.addEventListener("keyup", e => {
        if (e.code == "Delete") {
            const delta = Date.now() - delete_down_time;

            if (isFinite(delta) && delta >= save_delete_duration) {
                game.stop();
                game.should_save = false;
                Game.delete_save();

                message_log.log_message("SAVE FILE DELETED.", LogStyle.VeryBad);
            }

            delete_down_time = Infinity;
        }
    });
}

function main() {
    const game_container = document.body.appendChild(document.createElement("div"));

    message_log = new MessageLog();
    message_log.attach(document.body);

    init_global_event_handlers();

    if (Game.save_exists()) {
        try {
            game = Game.load_from_disk();
        } catch (err) {
            console.error(err);
            message_log.log_message("FAILED TO LOAD SAVE FILE.", LogStyle.VeryBad);
            Game.delete_save();
        }
    }
    
    if (!game) {
        game = new Game();
    }

    (window as any).game = game;
    game.attach(game_container);

    game.start();
}

document.body.onload = main;
