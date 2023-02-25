import { PrismaClient } from "@prisma/client";

export class DependencySingleton {
    private static _instance: DependencySingleton;

    public static getInstance() {
        if (this._instance) return this._instance;
        this._instance = new DependencySingleton();
        return this._instance;
    }

    private constructor() {
        this.mongo.$on("beforeExit", () => {
            this.mongo.$disconnect();
        });
    }

    mongo = new PrismaClient();
}
