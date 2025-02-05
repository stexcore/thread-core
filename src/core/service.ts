import ThreadCore from "./core";
import { ThreadScript } from "./script";
import Thread from "./thread";

/**
 * Structure base to create a service
 */
export abstract class ThreadService {

    /**
     * Thread parent
     */
    public readonly core!: ThreadCore;

    /**
     * Event emited when the ThreadCore is initialized
     */
    public onCoreInitialize?(): void;

    /**
     * Event emited when the ThreadCore is destroyed
     */
    public onCoreDestroy?(): void;

    /**
     * Event emited when the script is already executed 
     * @param thread Thread to execute
     * @param instruction 
     */
    public onCoreAfterScript?(script: ThreadScript<IJson>, thread: Thread, instruction: IJson): void;

    /**
     * Event emited when the script is ready to execute
     * @param script Script instance
     * @param thread Thread instance
     * @param instruction Instruction data
     */
    public onCoreBeforeScript?(script: ThreadScript<IJson>, thread: Thread, instruction: IJson): void;

    /**
     * Event emited when some thread is created
     * @param thread Thread instance
     */
    public onCoreCreatedThread?(thread: Thread): void;

    /**
     * Event emited when some thead will be destroy
     * @param thread Thread instance
     */
    public onCoreWillDestroyThread?(thread: Thread): void;
}