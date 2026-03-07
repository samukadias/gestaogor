export class StatusHistory {
    constructor(data = {}) {
        this.demand_id = data.demand_id;
        this.from_status = data.from_status;
        this.to_status = data.to_status;
        this.changed_at = data.changed_at;
        this.time_in_previous_status_minutes = data.time_in_previous_status_minutes;
        this.changed_by = data.changed_by;
    }

    static fromJSON(json) {
        return new StatusHistory(json);
    }
}

export default StatusHistory;
