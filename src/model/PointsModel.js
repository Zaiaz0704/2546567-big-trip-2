import Observable from '../framework/observable.js';
import {UpdateType} from '../const.js';
import { destinationsModel, offersModel } from '../main.js';

export default class PointsModel extends Observable {
  #pointsApiService = null;
  #destinations = [];
  #offers = [];
  #points = [];

  constructor({pointsApiService}) {
    super();
    this.#pointsApiService = pointsApiService;
  }

  get points() {
    return this.#points;
  }

  get destinations() {
    return this.#destinations;
  }

  set points(points) {
    this.#points = points;
    this._notify(UpdateType.MAJOR, this.#points);
  }

  async init() {

    try {
      this.#destinations = await this.#pointsApiService.destinations;
      destinationsModel.destinations = this.#destinations;

      const points = await this.#pointsApiService.points;
      this.#points = points.map(this.#adaptToClient);
      if(this.#destinations.length) {
        const updatedPoints = this.#points.map((point) => {
          const currentDestination = this.#destinations.find((destination) => destination.id === point.destination);
          const updatePoint = {...point, destination: currentDestination};
          return updatePoint;
        });

        this.#points = updatedPoints;
      }

      this.#offers = await this.#pointsApiService.offers;
      offersModel.offers = this.#offers;
      this._notify(UpdateType.INIT);
    } catch(err) {

      this.#points = [];
      this.#destinations = [];
      this.#offers = [];

      this._notify(UpdateType.ERROR);
    }

  }

  async updatePoint(updateType, update) {
    const index = this.#points.findIndex((point) => point.id === update.id);

    if (index === -1) {
      throw new Error('Can\'t update unexisting point');
    }

    try {
      const response = await this.#pointsApiService.updatePoint(update);
      const adaptedPoint = this.#adaptToClient(response);

      const currentDestination = this.#destinations.find((destination) => destination.id === adaptedPoint.destination);

      const currentOffersData = this.#offers.find((item) => item.type === adaptedPoint.type);
      const updatedOffers = adaptedPoint.offers.map((offerId) => {
        const offerObj = currentOffersData.offers.find((item) => item.id === offerId);
        return offerObj;
      });

      const updatedPoint = {...adaptedPoint, destination:currentDestination, offers: updatedOffers };

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
    const adaptedPoint = {...point,
      isFavorite: point['is_favorite'],
      basePrice: point['base_price'],
      dateFrom: point['date_from'],
      dateTo: point['date_to'],
    };

    delete adaptedPoint['is_favorite'];
    delete adaptedPoint['base_price'];
    delete adaptedPoint['date_from'];
    delete adaptedPoint['date_to'];
    return {...adaptedPoint};
  }
}
