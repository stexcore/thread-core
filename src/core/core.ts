import Thread from "./thread";

/**
 * Thread core
 */
export default class ThreadCore {
    
    /**
     * Associated threads 
     */
    private threads: Thread[] = [];
    
    /**
     * Initialize structure data of core
     */
    constructor() { }

    /**
     * Initialize core
     */
    public initialize() {

    }

    /**
     * Destroy core and destroy all threads running
     */
    public destroy() {

    }
    
    /**
     * Create a new instance of thread
     */
    public createThread() {

        // state of thread
        let running = false;

        // create structure thread
        const thread = new class extends Thread {

            // Run thread
            public run(): void {
                if(!running) {
                    running = true;
                }
                else throw new Error("The thread is already running!");
            }

            // Destroy thread
            public destroy(): void {
                if(running) {
                    running = false;
                }
                else throw new Error("Thread is not running!");
            }

            // Is running thread
            public isRunning(): boolean {
                return running;
            }

        };

        // append thread instance
        this.threads.push(thread);

        // return instance
        return thread;
    }
    
}