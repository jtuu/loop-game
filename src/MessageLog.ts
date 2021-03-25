export enum LogStyle {
    Neutral,
    Good,
    VeryGood,
    Bad,
    VeryBad
}

const log_style_classnames = {
    [LogStyle.Neutral]: "neutral",
    [LogStyle.Good]: "good",
    [LogStyle.VeryGood]: "very-good",
    [LogStyle.Bad]: "bad",
    [LogStyle.VeryBad]: "very-bad",
};

export class MessageLog {
    public message_log_element: HTMLElement | null = null;

    constructor(public scrollback = 100) {}

    public attach(parent_element: HTMLElement) {
        this.message_log_element = parent_element.appendChild(document.createElement("div"));
        this.message_log_element.className = "message-log";
    }

    public log_message(message: string, style = LogStyle.Neutral) {
        const message_log_element = this.message_log_element;

        if (!message_log_element) {
            return;
        }

        const style_classname = log_style_classnames[style] ?? log_style_classnames[LogStyle.Neutral];
        const msg_el = document.createElement("div");
        msg_el.className = "log-message " + style_classname;
        msg_el.textContent = message.toUpperCase();
        message_log_element.appendChild(msg_el);

        message_log_element.scrollTo(0, message_log_element.scrollHeight);

        if (message_log_element.childElementCount > this.scrollback) {
            message_log_element.removeChild(message_log_element.firstChild!);
        }
    }
}
