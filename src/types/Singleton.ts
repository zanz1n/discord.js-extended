import { IType } from "./IType.js";

interface SingletonType<T> extends IType<T> {
    getInstance<U extends Singleton>(this: SingletonType<U>): U;
}

export class Singleton {
    public static instance: Singleton;
    public static getInstance<U extends Singleton>(this: SingletonType<U> & { instance: any }): U {
        if (!Singleton.instance) {
            this.instance = new this();
        }
        return this.instance;
    }
}
