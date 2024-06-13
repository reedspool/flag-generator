// See https://prettier.io/blog/2020/08/24/2.1.0.html
export const html: typeof String.raw = (templates, ...args) =>
    String.raw(templates, ...args);

// Use HTML entities for double quotes to fit in double quoted attributes, e.g.
// <input value="${htmlifyJson(obj)}">
export const htmlifyJson = (obj: unknown): string =>
    JSON.stringify(obj).replaceAll('"', "&quot;");

// Copying React's "WithChildren" concept, except you have to build
// the string yourself
export type WithContents = { contents: string };

export const randInt = (max: number) => Math.floor(Math.random() * max);
export const randIntBetween = (min: number, max: number) =>
    randInt(max - min) + min;
export const randFrom = (array: unknown[]) => array[randInt(array.length)];
export const clamp = (n: number, min: number, max: number) =>
    Math.min(max, Math.max(n, min));

export const wait = (millis: number) =>
    new Promise((resolve) => setTimeout(resolve, millis));

export const complexStringify = (object: unknown) =>
    JSON.stringify(
        object,
        function replacer(_key, value) {
            if (value instanceof Map) {
                return {
                    dataType: "Map",
                    value: Array.from(value.entries()),
                };
            } else if (value instanceof Set) {
                return {
                    dataType: "Set",
                    value: Array.from(value.entries()),
                };
            } else {
                return value;
            }
        },
        2,
    );

// From https://stackoverflow.com/a/12646864
export function shuffle<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
export function shuffleCopy<T>(array: T[]) {
    const copy = [...array];
    shuffle(copy);
    return copy;
}
