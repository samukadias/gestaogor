export class Demand {
    constructor(data = {}) {
        this.demand_number = data.demand_number;
        this.product = data.product;
        this.artifact = data.artifact;
        this.weight = data.weight ?? 1;
        this.complexity = data.complexity ?? "Média";
        this.qualification_date = data.qualification_date;
        this.expected_delivery_date = data.expected_delivery_date;
        this.delivery_date = data.delivery_date;
        this.status = data.status ?? "PENDENTE TRIAGEM";
        this.observation = data.observation;
        this.client_id = data.client_id;
        this.cycle_id = data.cycle_id;
        this.analyst_id = data.analyst_id;
        this.requester_id = data.requester_id;
        this.frozen_time_minutes = data.frozen_time_minutes ?? 0;
        this.last_frozen_at = data.last_frozen_at;
        this.architect_support_analyst_id = data.architect_support_analyst_id;
        this.stage = data.stage;
        this.value = data.value;
    }
}
