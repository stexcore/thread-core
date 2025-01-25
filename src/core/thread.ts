export default abstract class Thread {

    constructor() {

    }

    public abstract isRunning(): boolean;
    public abstract run(): void;
    public abstract destroy(): void;
    
}