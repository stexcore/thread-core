import ThreadCore from "./core/core";

const core = new ThreadCore();
const thread = core.createThread();

core.initialize();
thread.run();
