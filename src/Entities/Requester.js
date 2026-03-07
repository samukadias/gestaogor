export class Requester {
    constructor(data = {}) {
        this.name = data.name;
        this.email = data.email;
        this.client_id = data.client_id;
        this.active = data.active ?? true;
    }
}
