"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestedTransactionsBooksForUser = exports.getRequestedReservedBooksForUser = exports.deleteReservationHandler = exports.deleteTransactionHandler = exports.reserveBookForUser = exports.borrowBookForUser = exports.filterBooksForUser = void 0;
const userService_1 = require("../prisma/services/userService");
const bookService_1 = require("../prisma/services/bookService");
const filterBooksForUser = async (req, res) => {
    try {
        const filters = {};
        const userID = req.cookies["userId"] || req.headers["id"];
        // Find the librarian user
        const patronUser = await (0, userService_1.findUserById)(parseInt(userID));
        if (!patronUser) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }
        // Check if the user is a librarian or administrator
        if (patronUser.role == "librarian") {
            return res.status(401).json({
                success: false,
                msg: "this account have no permission for that make a patron one",
            });
        }
        const { title, author, isbn, type, library_name, book_id, genreName } = req.query;
        if (title)
            filters.title = String(title);
        if (author)
            filters.author = String(author);
        if (isbn)
            filters.isbn = String(isbn);
        if (type)
            filters.type = String(type);
        if (library_name)
            filters.library_name = String(library_name);
        if (book_id)
            filters.book_id = Number(book_id);
        if (genreName)
            filters.genreName = String(genreName);
        // Check if the identifier is provided
        if (!filters) {
            return res
                .status(400)
                .json({ success: false, msg: "filter data is required" });
        }
        // Find the user by identifier
        const books = await (0, bookService_1.findBooksByCriteria)(filters);
        if (!books) {
            return res
                .status(400)
                .json({ success: false, msg: "no books found" });
        }
        return res.status(200).json({ success: true, msg: "done", data: books });
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({ success: false, msg: error.message });
        }
        else {
            return res
                .status(500)
                .json({ success: false, msg: "Unknown error in filter books" });
        }
    }
};
exports.filterBooksForUser = filterBooksForUser;
const borrowBookForUser = async (req, res) => {
    try {
        const userID = req.cookies["userId"] || req.headers["id"];
        const { bookId, borrowDays } = req.body;
        const patronUser = await (0, userService_1.findUserById)(parseInt(userID));
        if (!patronUser) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }
        if (patronUser.role == "librarian") {
            return res.status(401).json({
                success: false,
                msg: "this account have no permission for that make a patron one",
            });
        }
        if (!bookId) {
            return res.status(400).json({ success: false, msg: ' book id are required' });
        }
        if (borrowDays > 10) {
            res.status(200).json({ success: true, msg: "Too long period of borrowing" });
        }
        const message = await (0, bookService_1.borrowBook)(parseInt(userID), parseInt(bookId), borrowDays);
        res.status(200).json({ success: true, msg: message });
    }
    catch (error) {
        console.error('Error borrowing book:', error);
        res.status(500).json({ success: false, msg: 'Failed to borrow book' });
    }
};
exports.borrowBookForUser = borrowBookForUser;
const reserveBookForUser = async (req, res) => {
    try {
        const userID = parseInt(req.cookies["userId"] || req.headers["id"]);
        const { bookId, reservationDays } = req.body;
        if (!userID || !bookId) {
            res.status(400).json({ success: false, message: 'User ID and Book ID are required.' });
            return;
        }
        const user = await (0, userService_1.findUserById)(userID);
        if (!user) {
            res.status(401).json({ success: false, message: 'User not found.' });
            return;
        }
        // Assuming librarians cannot reserve books
        if (user.role === "librarian") {
            res.status(401).json({ success: false, message: 'Librarians cannot reserve books.' });
            return;
        }
        const message = await (0, bookService_1.reserveBook)(userID, parseInt(bookId), parseInt(reservationDays));
        res.status(200).json({ success: true, message: message });
    }
    catch (error) {
        console.error('Error reserving book:', error);
        res.status(500).json({ success: false, message: 'Failed to reserve book.' });
    }
};
exports.reserveBookForUser = reserveBookForUser;
const deleteTransactionHandler = async (req, res) => {
    try {
        const { transactionId } = req.query;
        const userId = req.cookies["userId"] || req.headers["id"];
        // Find the librarian user
        const user = await (0, userService_1.findUserById)(parseInt(userId));
        if (!user) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }
        // Delete the transaction
        const message = await (0, bookService_1.deleteTransactionForUser)(parseInt(transactionId), parseInt(userId));
        res.status(200).json({ success: true, msg: message });
    }
    catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ success: false, msg: 'Failed to delete transaction' });
    }
};
exports.deleteTransactionHandler = deleteTransactionHandler;
const deleteReservationHandler = async (req, res) => {
    try {
        const { reservationId } = req.query;
        const userId = req.cookies["userId"] || req.headers["id"];
        // Find the librarian user
        const user = await (0, userService_1.findUserById)(parseInt(userId));
        if (!user) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }
        // Delete the transaction
        const message = await (0, bookService_1.deleteReservationForUser)(parseInt(reservationId), parseInt(userId));
        res.status(200).json({ success: true, msg: message });
    }
    catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ success: false, msg: 'Failed to delete transaction' });
    }
};
exports.deleteReservationHandler = deleteReservationHandler;
const getRequestedReservedBooksForUser = async (req, res) => {
    try {
        const user_id = req.cookies["userId"] || req.headers["id"];
        // Find the librarian user
        const user = await (0, userService_1.findUserById)(parseInt(user_id));
        if (!user) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }
        // Check if the user is a librarian or administrator
        if (user.role !== "patron") {
            return res.status(401).json({
                success: false,
                msg: "You do not have permission to perform this action. 😡",
            });
        }
        const data = await (0, bookService_1.getReservationsForUser)(parseInt(user_id));
        if (!data || data.length === 0) {
            return res.status(200).json({
                success: true,
                msg: "No reservations found",
            });
        }
        else {
            return res.status(200).json({
                success: true,
                msg: "Success",
                data: data,
            });
        }
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({ success: false, msg: error.message });
        }
        else {
            return res
                .status(500)
                .json({ success: false, msg: "Unknown error" });
        }
    }
};
exports.getRequestedReservedBooksForUser = getRequestedReservedBooksForUser;
const getRequestedTransactionsBooksForUser = async (req, res) => {
    try {
        const user_id = req.cookies["userId"] || req.headers["id"];
        // Find the librarian user
        const user = await (0, userService_1.findUserById)(parseInt(user_id));
        if (!user) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }
        // Check if the user is a librarian or administrator
        if (user.role !== "patron") {
            return res.status(401).json({
                success: false,
                msg: "You do not have permission to perform this action. 😡",
            });
        }
        const data = await (0, bookService_1.getTransactionsForUser)(parseInt(user_id));
        if (!data || data.length === 0) {
            return res.status(200).json({
                success: true,
                msg: "No reservations found",
            });
        }
        else {
            return res.status(200).json({
                success: true,
                msg: "Success",
                data: data,
            });
        }
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({ success: false, msg: error.message });
        }
        else {
            return res
                .status(500)
                .json({ success: false, msg: "Unknown error" });
        }
    }
};
exports.getRequestedTransactionsBooksForUser = getRequestedTransactionsBooksForUser;
//# sourceMappingURL=userBook.controller.js.map