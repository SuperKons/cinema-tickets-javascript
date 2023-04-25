import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import TicketTypeRequest from './lib/TicketTypeRequest.js';

export default class TicketService {
  #paymentService;
  #seatReservationService;

  constructor() {
    this.#paymentService = new TicketPaymentService();
    this.#seatReservationService = new SeatReservationService();
  }

  /**
   * Should only have private methods other than the one below.
   */

  purchaseTickets(accountId, ...ticketTypeRequests) {
    // throws InvalidPurchaseException
    if (!Number.isInteger(accountId) || accountId <= 0) {
      throw new InvalidPurchaseException('Account Id is not valid');
    }

    // It is assumed that the ticket type requests coming in are in the form [{ type: 'ADULT', noOfTickets: 2 }, { type: 'CHILD', noOfTickets: 1 }, ...]
    const requests = this.#createTicketTypeRequests(...ticketTypeRequests);

    if (requests.reduce((total, request) => total + request.getNoOfTickets(), 0) > 20) {
      throw new InvalidPurchaseException('Maximum 20 tickets per purchase');
    }

    this.#paymentService.makePayment(accountId, this.#calculateTotalPrice(...requests));
    this.#seatReservationService.reserveSeat(accountId, this.#calculateTotalSeats(...requests));
  }

  #createTicketTypeRequests(...ticketTypeRequests) {
    let requests = [];

    for (const request of ticketTypeRequests) {
      try {
        requests.push(new TicketTypeRequest(request['type'], request['noOfTickets']));
      }
      catch (e) {
        throw new InvalidPurchaseException(e.message);
      }
    }

    return requests;
  }

  #calculateTotalPrice(...ticketTypeRequests) {
    let totalPrice = 0;

    for (const request of ticketTypeRequests) {
      const type = request.getTicketType();
      let ticketPrice = 0;

      switch (type) {
        case 'ADULT':
          ticketPrice = 20;
          break;
        case 'CHILD':
          ticketPrice = 10;
          break;
      }

      totalPrice += ticketPrice * request.getNoOfTickets();
    }

    return totalPrice;
  }

  #calculateTotalSeats(...ticketTypeRequests) {
    let totalSeats = 0;

    for (const request of ticketTypeRequests) {
      if (request.getTicketType() === 'INFANT') {
        // Infants seat on an adult's lap
        continue;
      }

      totalSeats += request.getNoOfTickets();
    }

    return totalSeats;
  }
}
