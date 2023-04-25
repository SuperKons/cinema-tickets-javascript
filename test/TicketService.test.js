import TicketPaymentService from '../src/thirdparty/paymentgateway/TicketPaymentService';
import SeatReservationService from '../src/thirdparty/seatbooking/SeatReservationService';
import TicketService from '../src/pairtest/TicketService';
import InvalidPurchaseException from '../src/pairtest/lib/InvalidPurchaseException';

jest.mock('../src/thirdparty/paymentgateway/TicketPaymentService');
jest.mock('../src/thirdparty/seatbooking/SeatReservationService');

describe('TicketService', () => {
    beforeEach(() => {
        TicketPaymentService.mockClear();
        SeatReservationService.mockClear();
    });

    it('throws an exception if accountId is not a positive integer', () => {
        // Arrange
        const accountId = 0;
        const ticketTypeRequests = [
            { type: 'ADULT', noOfTickets: 1 },
        ];
        const ticketService = new TicketService();

        try {
            // Act
            ticketService.purchaseTickets(accountId, ...ticketTypeRequests);
        }
        catch (e) {
            // Assert
            expect(e).toBeInstanceOf(InvalidPurchaseException);
            expect(e).toHaveProperty('message', 'Account Id is not valid');
        }
    });

    it('throws an exception if more than 20 tickets are being purchased', () => {
        // Arrange
        const accountId = 1;
        const ticketTypeRequests = [
            { type: 'ADULT', noOfTickets: 10 },
            { type: 'CHILD', noOfTickets: 10 },
            { type: 'INFANT', noOfTickets: 1 },
        ];
        const ticketService = new TicketService();

        try {
            // Act
            ticketService.purchaseTickets(accountId, ...ticketTypeRequests);
        }
        catch (e) {
            // Assert
            expect(e).toBeInstanceOf(InvalidPurchaseException);
            expect(e).toHaveProperty('message', 'Maximum 20 tickets per purchase');
        }
    });

    it('throws an exception if an invalid ticket type is being purchased', () => {
        // Arrange
        const accountId = 1;
        const ticketTypeRequests = [
            { type: 'ADULT', noOfTickets: 2 },
            { type: 'CHILDREN', noOfTickets: 2 },
            { type: 'INFANT', noOfTickets: 1 },
        ];
        const ticketService = new TicketService();

        try {
            // Act
            ticketService.purchaseTickets(accountId, ...ticketTypeRequests);
        }
        catch (e) {
            // Assert
            expect(e).toBeInstanceOf(InvalidPurchaseException);
            expect(e).toHaveProperty('message', 'type must be ADULT, CHILD, or INFANT');
        }
    });

    it('throws an exception if the specified number of tickets is not an integer', () => {
        // Arrange
        const accountId = 1;
        const ticketTypeRequests = [
            { type: 'ADULT', noOfTickets: '2' },
        ];
        const ticketService = new TicketService();

        try {
            // Act
            ticketService.purchaseTickets(accountId, ...ticketTypeRequests);
        }
        catch (e) {
            // Assert
            expect(e).toBeInstanceOf(InvalidPurchaseException);
            expect(e).toHaveProperty('message', 'noOfTickets must be an integer');
        }
    });

    it('calculates the correct amount, makes a payment request and reserves the correct number of seats', () => {
        // Arrange
        const accountId = 1;
        const ticketTypeRequests = [
            { type: 'ADULT', noOfTickets: 2 },
            { type: 'CHILD', noOfTickets: 2 },
            { type: 'INFANT', noOfTickets: 1 },
        ];
        const ticketService = new TicketService();

        // Act
        ticketService.purchaseTickets(accountId, ...ticketTypeRequests);

        // Assert
        const ticketPaymentServiceMock = TicketPaymentService.mock.instances[0];
        const seatReservationServiceMock = SeatReservationService.mock.instances[0];
        const makePaymentMock = ticketPaymentServiceMock.makePayment;
        const reserveSeatMock = seatReservationServiceMock.reserveSeat;

        expect(makePaymentMock).toHaveBeenCalledWith(1, 60);
        expect(reserveSeatMock).toHaveBeenCalledWith(1, 4);
    });
});