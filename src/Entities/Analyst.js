export class Analyst {
    constructor(data = {}) {
        this.name = data.name;
        this.email = data.email;
        this.active = data.active ?? true;
    }
}
