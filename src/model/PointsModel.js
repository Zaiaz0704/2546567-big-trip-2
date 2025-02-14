import Observable from '../framework/observable.js';
import {UpdateType} from '../const.js';
import { offersData } from '../mocks/offer-model.js';
import { destinationsData } from '../mocks/destinations-model.js';

export default class PointsModel extends Observable {
  #pointsApiService = null;
  #points = [];

  constructor({pointsApiService}) {
    super();
    this.#pointsApiService = pointsApiService;
  }

  get points() {
    return this.#points;
  }

  set points(points) {
    this.#points = points;
    this._notify(UpdateType.MAJOR, this.#points);
  }

  async init() {
    try {
      const points = await this.#pointsApiService.points;
      this.#points = points.map(this.#adaptToClient);
    } catch(err) {
      // this.#points = [];
    }

    this._notify(UpdateType.INIT);
  }

  async updatePoint(updateType, update) {
    const index = this.#points.findIndex((point) => point.id === update.id);

    if (index === -1) {
      throw new Error('Can\'t update unexisting point');
    }

    try {
      // const response = await this.#pointsApiService.updatePoint(update);
      // const updatedPoint = this.#adaptToClient(response);
      // пока без сервера...
      const updatedPoint = update;

      this.#points = [
        ...this.#points.slice(0, index),
        updatedPoint,
        ...this.#points.slice(index + 1),
      ];
      this._notify(updateType, updatedPoint);
    } catch(err) {
      throw new Error('Can\'t update point');
    }
  }

  async addPoint(updateType, update) {
    try {
      // const response = await this.#pointsApiService.addPoint(update);
      const response = {...update};
      const newPoint = this.#adaptToClient(response);

      this.#points = [newPoint, ...this.#points];
      this._notify(updateType, newPoint);
    } catch(err) {
      throw new Error('Can\'t add point');
    }
  }

  async deletePoint(updateType, update) {
    const index = this.#points.findIndex((point) => point.id === update.id);

    if (index === -1) {
      throw new Error('Can\'t delete unexisting point');
    }

    try {
      //  метод удаления задачи на сервере
      await this.#pointsApiService.deletePoint(update);
      this.#points = [
        ...this.#points.slice(0, index),
        ...this.#points.slice(index + 1),
      ];
      this._notify(updateType);
    } catch(err) {
      throw new Error('Can\'t delete point');
    }
  }

  #adaptToClient(point) {
    const currentOffers = offersData.find((item) => item.type === point.type).offers;
    const currentDestination = destinationsData.find((item) => item.name === point.destination.name);

    const adaptedPoint = {...point,
      offers: currentOffers,
      destination: currentDestination,
      isFavorite: point['is_favorite'],
      basePrice: point['base_price'],
      dateFrom: point['date_from'],
      dateTo: point['date_to'],
      // dueDate: point['due_date'] !== null ? new Date(point['due_date']) : point['due_date'], // На клиенте дата хранится как экземпляр Date
    };

    // Ненужные ключи мы удаляем
    delete adaptedPoint['is_favorite'];
    delete adaptedPoint['base_price'];
    delete adaptedPoint['date_from'];
    delete adaptedPoint['date_to'];
    return {...adaptedPoint};
  }
}
