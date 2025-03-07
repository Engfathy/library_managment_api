"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jwtTokenVerifier_1 = __importDefault(require("../middleware/jwtTokenVerifier"));
const librarianBook_controller_1 = require("../controller/librarianBook.controller");
const userBook_controller_1 = require("../controller/userBook.controller");
const bookRouter = express_1.default.Router();
bookRouter.post("/add", jwtTokenVerifier_1.default, librarianBook_controller_1.addBookByLibrarian);
bookRouter.put("/update/:bookId", jwtTokenVerifier_1.default, librarianBook_controller_1.updateBookByLibrarianAPI);
bookRouter.delete("/delete/:bookId", jwtTokenVerifier_1.default, librarianBook_controller_1.deleteBookByLibrarianAPI);
bookRouter.post("/user/filter", jwtTokenVerifier_1.default, userBook_controller_1.filterBooksForUser);
bookRouter.post("/user/borrowRequest", jwtTokenVerifier_1.default, userBook_controller_1.borrowBookForUser);
bookRouter.post("/user/reserveRequest", jwtTokenVerifier_1.default, userBook_controller_1.reserveBookForUser);
bookRouter.post("/librarian/filter", jwtTokenVerifier_1.default, librarianBook_controller_1.filterBooksForLibrarian);
bookRouter.post("/librarian/requestedBooks", jwtTokenVerifier_1.default, librarianBook_controller_1.getRequestedBorrowBooks);
bookRouter.post("/librarian/reservedBooks", jwtTokenVerifier_1.default, librarianBook_controller_1.getRequestedReservedBooks);
bookRouter.post("/librarian/confirmBorrow", jwtTokenVerifier_1.default, librarianBook_controller_1.confirmBorrowForTheLibrarian);
bookRouter.post("/librarian/confirmReserve", jwtTokenVerifier_1.default, librarianBook_controller_1.confirmReserveForTheLibrarian);
bookRouter.post("/librarian/confirmReturn", jwtTokenVerifier_1.default, librarianBook_controller_1.confirmReturnForTheLibrarian);
bookRouter.delete("/deleteReservation", jwtTokenVerifier_1.default, userBook_controller_1.deleteReservationHandler);
bookRouter.delete("/deleteTransaction", jwtTokenVerifier_1.default, userBook_controller_1.deleteTransactionHandler);
bookRouter.delete("/librarian/deleteReservation", jwtTokenVerifier_1.default, librarianBook_controller_1.deleteReservationHandlerForLibraraian);
bookRouter.delete("/librarian/deleteTransaction", jwtTokenVerifier_1.default, librarianBook_controller_1.deleteTransactionHandlerForLibraraian);
bookRouter.get("/librarian/checkExpired", jwtTokenVerifier_1.default, librarianBook_controller_1.checkExpiredRequested);
bookRouter.get("/getResrevations", jwtTokenVerifier_1.default, userBook_controller_1.getRequestedReservedBooksForUser);
bookRouter.get("/getTransactions", jwtTokenVerifier_1.default, userBook_controller_1.getRequestedTransactionsBooksForUser);
exports.default = bookRouter;
//# sourceMappingURL=bookRouter.js.map