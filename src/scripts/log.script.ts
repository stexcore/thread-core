import { ThreadScript } from "../core/script";

/**
 * Script Logs
 */
export class LogScript extends ThreadScript<{ message: string }> {

    /**
     * Schema to use to allow the execution script
     */
    public static schema: ISchema = {
        /**
         * Log message
         */
        message: { type: "string" }
    }

    /**
     * Execute instruction
     */
    public async onExecute(): Promise<void> {
        console.log(this.instruction.message);
    }
    
}