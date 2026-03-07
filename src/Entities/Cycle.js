export class Cycle {
    constructor(data = {}) {
        this.name = data.name;
        this.start_date = data.start_date;
        this.end_date = data.end_date;
        this.active = data.active ?? true;
    }
}
