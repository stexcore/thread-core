import ThreadCore from "./core";
import Thread from "./thread";

/**
 * Structure base to create a script
 */
export abstract class ThreadScript<T extends IJson> {

    /**
     * Script name
     */
    public readonly name!: string;

    /**
     * Thread parent
     */
    public readonly core!: ThreadCore;

    /**
     * Instruction data
     */
    public readonly instruction!: T;

    /**
     * thread instance
     */
    public readonly thread!: Thread;

    /**
     * Schema structure
     */
    public static get schema(): ISchema {
        throw new Error("The 'schema' property is'nt implemented!");
    }

    /**
     * Set schema value
     */
    public static set schema(value: ISchema) {
        // replace getted/setters to a value literal
        Object.defineProperty(ThreadScript, "schema", {
            value: value,
            writable: true,
            configurable: true,
            enumerable: true,
        });
    }

    /**
     * Execute script instruction
     */
    public abstract onExecute(): Promise<void>;

    /**
     * Method used by parent when is required destroy this script
     */
    public onParentRequireAbort?(): void;
    
}