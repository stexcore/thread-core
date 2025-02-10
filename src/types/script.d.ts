import { ThreadScript } from "../core/script";
import { ThreadService } from "../core/service";

/**
 * Constructor To Register Base
 */
interface IConstructorRegistration<T> {
    new (): T,
}

/**
 * Constructor script
 */
interface IThreadScriptConstructor extends IConstructorRegistration<ThreadScript<any>> {
    schema: ISchema
}

/**
 * Constructor service
 */
interface IThreadServiceConstructor extends IConstructorRegistration<ThreadService> {}