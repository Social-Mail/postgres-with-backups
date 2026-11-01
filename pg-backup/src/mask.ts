export default class Mask {
    constructor(public readonly value: string, public maskCharIndexFrom = 0) {
        
    }

    toJSON() {
        return this.toString();
    }

    toString() {
        return this.value.substring(0,this.maskCharIndexFrom) + "".padStart(this.value.length + 5, "*");
    }
}