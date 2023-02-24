export function objectIncludesKey(obj: object, key: string) {
    for (const k in obj) {
        if (k == key) {
            return true;
        }
    }
    return false;
}
