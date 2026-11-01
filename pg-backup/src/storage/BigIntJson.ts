export default class BigIntJson {

    static parse(text: string) {
        return JSON.parse(text, (key, value, context) => {
            // If the property is a number and its raw string source is a long integer, make it a BigInt
            if (context?.source && /^\d{16,}$/.test(context.source)) {
                return BigInt(context.source);
            }
            return value;
        });
    }
}