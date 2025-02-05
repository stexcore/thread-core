import ThreadCore from "./core";

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
     * Schema structure
     */
    public static get schema(): ISchema {
        throw new Error("The 'schema' property is'nt implemented!");
    }

    /**
     * Execute script instruction
     */
    public abstract onExecute(): Promise<void>;

    /**
     * Method used by parent when is required destroy this script
     */
    public parentRequireAbort?(): void;
    
}