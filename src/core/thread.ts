
/**
 * Instance thread
 */
export default abstract class Thread {

    /**
     * Constructor thread
     */
    constructor() { }

    /**
     * Get running status
     */
    public abstract readonly isRunning: boolean;

    /**
     * Destroy run instance
     */
    public abstract destroy(): void;

    /**
     * Get a variable by name
     * @param name Variable name
     */
    public abstract getVar(name: string): IJsonValue;

    /**
     * Set value to a variable
     * @param name Variable name
     * @param value Value to set
     */
    public abstract setVar(name: string, value: IJsonValue): void;

    /**
     * Get all variables
     */
    public abstract getAllVars(): IJson;
    
}