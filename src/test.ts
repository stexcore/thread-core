import ThreadCore from "./core/core";
import { LogScript } from "./scripts/log.script";
import sentences from "./assets/sentences.example.json";
import { IfScript } from "./scripts/if.script";
import { SetScript } from "./scripts/set.script";

// create instance thread
const core = new ThreadCore({
    thread: {
        sentences: sentences as ISentence,
    },
    scripts: [
        { constructor: LogScript, name: "log" },
        { constructor: IfScript, name: "if" },
        { constructor: SetScript, name: "set" }
    ]
});

// initialize process
core.initialize();

// Run process
core.createThread();