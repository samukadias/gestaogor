export class Client {
  constructor(data = {}) {
    this.name = data.name;
    this.sigla = data.sigla || '';
    this.active = data.active ?? true;
  }
}
