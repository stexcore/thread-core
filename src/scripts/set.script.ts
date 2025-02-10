import { ThreadScript } from "../core/script";

/**
 * Script Set variables
 */
export class SetScript extends ThreadScript<{ variables: IJson }> {

    /**
     * Schema to use to allow the execution script
     */
    public static schema: ISchema = {
        /**
         * Variables to set
         */
        variables: { type: "object", allow_dynamic_keys: true }
    }

    /**
     * Execute instruction
     */
    public async onExecute(): Promise<void> {
        // Earch all variables to set
        for(const key in this.instruction.variables) {
            this.thread.setVar(key, this.instruction.variables[key]);
            this.thread.getAllVars();
        }
    }
    
}