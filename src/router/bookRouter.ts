import express from "express";
import jwtTokenVerifier from "../middleware/jwtTokenVerifier";
import { body, validationResult } from "express-validator";
import verifyEmailVerifier from "../middleware/verifyEmailVerifier";
import resetTokenVerifier from "../middleware/resetTokenVerifier";
import { addBookByLibrarian, checkExpiredRequested, confirmBorrowForTheLibrarian, confirmReserveForTheLibrarian, confirmReturnForTheLibrarian, deleteBookByLibrarianAPI,  deleteReservationHandlerForLibraraian,  deleteTransactionHandlerForLibraraian,  filterBooksForLibrarian, getRequestedBorrowBooks, getRequestedReservedBooks, updateBookByLibrarianAPI } from "../controller/librarianBook.controller";
import {/*deleteReservationHandler, deleteTransactionHandler,*/ borrowBookForUser, filterBooksForUser, reserveBookForUser, getRequestedReservedBooksForUser, getRequestedTransactionsBooksForUser, deleteReservationHandler, deleteTransactionHandler } from "../controller/userBook.controller";

const bookRouter: express.Router = express.Router();

bookRouter.post(
    "/add",
    jwtTokenVerifier,
    addBookByLibrarian,
);
bookRouter.put(
    "/update/:bookId",
    jwtTokenVerifier,
    updateBookByLibrarianAPI,
);
bookRouter.delete(
    "/delete/:bookId",
    jwtTokenVerifier,
    deleteBookByLibrarianAPI,
);
bookRouter.post(
    "/user/filter",
    jwtTokenVerifier,
    filterBooksForUser,
);
bookRouter.post(
    "/user/borrowRequest",
    jwtTokenVerifier,
    borrowBookForUser,
);
bookRouter.post(
    "/user/reserveRequest",
    jwtTokenVerifier,
    reserveBookForUser,
);
bookRouter.post(
    "/librarian/filter",
    jwtTokenVerifier,
    filterBooksForLibrarian,
);
bookRouter.post(
    "/librarian/requestedBooks",
    jwtTokenVerifier,
    getRequestedBorrowBooks,
);
bookRouter.post(
    "/librarian/reservedBooks",
    jwtTokenVerifier,
    getRequestedReservedBooks,
);
bookRouter.post(
    "/librarian/confirmBorrow",
    jwtTokenVerifier,
    confirmBorrowForTheLibrarian,
);
bookRouter.post(
    "/librarian/confirmReserve",
    jwtTokenVerifier,
    confirmReserveForTheLibrarian,
);
bookRouter.post(
    "/librarian/confirmReturn",
    jwtTokenVerifier,
    confirmReturnForTheLibrarian,
);
bookRouter.delete(
    "/deleteReservation",
    jwtTokenVerifier,
    deleteReservationHandler,
);
bookRouter.delete(
    "/deleteTransaction",
    jwtTokenVerifier,
    deleteTransactionHandler,
);
bookRouter.delete(
    "/librarian/deleteReservation",
    jwtTokenVerifier,
    deleteReservationHandlerForLibraraian,
);
bookRouter.delete(
    "/librarian/deleteTransaction",
    jwtTokenVerifier,
    deleteTransactionHandlerForLibraraian,
);
bookRouter.get(
    "/librarian/checkExpired",
    jwtTokenVerifier,
    checkExpiredRequested,
);
bookRouter.get(
    "/getResrevations",
    jwtTokenVerifier,
    getRequestedReservedBooksForUser,
);
bookRouter.get(
    "/getTransactions",
    jwtTokenVerifier,
    getRequestedTransactionsBooksForUser,
);

export default bookRouter;