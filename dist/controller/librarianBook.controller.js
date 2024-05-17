"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkExpiredRequested = exports.confirmReturnForTheLibrarian = exports.deleteReservationHandlerForLibraraian = exports.deleteTransactionHandlerForLibraraian = exports.confirmReserveForTheLibrarian = exports.confirmBorrowForTheLibrarian = exports.getRequestedReservedBooks = exports.getRequestedBorrowBooks = exports.filterBooksForLibrarian = exports.deleteBookByLibrarianAPI = exports.updateBookByLibrarianAPI = exports.addBookByLibrarian = void 0;
const bookService_1 = require("../prisma/services/bookService");
const userService_1 = require("../prisma/services/userService");
const addBookByLibrarian = async (req, res) => {
    try {
        const { title, author, isbn, type, total_copies, available_copies, genreNames, } = req.body;
        const librarianId = req.cookies["userId"] || req.headers["id"];
        // Find the librarian user
        const librarianUser = await (0, userService_1.findUserById)(parseInt(librarianId));
        if (!librarianUser) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }
        // Check if the user is a librarian
        if (librarianUser.role !== "librarian" &&
            librarianUser.role !== "administrator") {
            return res.status(401).json({
                success: false,
                msg: "You do not have permission to perform this action. 😡",
            });
        }
        // Add the book
        const newBook = await (0, bookService_1.createBookWithGenres)({
            title,
            author,
            isbn,
            type,
            total_copies,
            available_copies,
            library_name: librarianUser.library_name,
        }, String(librarianUser.library_name), genreNames);
        const books = await (0, bookService_1.findBooksByCriteriaForLibrarian)({}, String(librarianUser.library_name));
        return res.status(200).json({
            success: true,
            msg: "Book added successfully",
            data: books,
        });
    }
    catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ success: false, msg: "Internal server error" });
    }
};
exports.addBookByLibrarian = addBookByLibrarian;
// update book data by libraraian
const updateBookByLibrarianAPI = async (req, res) => {
    try {
        const { bookId } = req.params;
        const { title, author, isbn, type, total_copies, available_copies, genreNames, } = req.body; // Assuming updatedBookData is sent in the request body
        const librarianId = req.cookies["userId"] || req.headers["id"];
        // Find the librarian user
        const librarianUser = await (0, userService_1.findUserById)(parseInt(librarianId));
        if (!librarianUser) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }
        // Check if the user is a librarian
        if (librarianUser.role !== "librarian" &&
            librarianUser.role !== "administrator") {
            return res.status(401).json({
                success: false,
                msg: "You do not have permission to perform this action. 😡",
            });
        }
        if (librarianUser.library_name === null) {
            return res
                .status(400)
                .json({ success: false, msg: "Library name is not available" });
        }
        const books = await (0, bookService_1.updateBook)(librarianUser.library_name, parseInt(bookId), { title, author, isbn, type, total_copies, available_copies }, genreNames);
        if (!books) {
            return res.status(404).json({
                success: false,
                msg: `Book with ID ${bookId} not found in the librarian's library`,
            });
        }
        return res.status(200).json({
            success: true,
            msg: "Book updated successfully",
            data: books,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({ success: false, msg: error.message });
        }
        else {
            return res
                .status(500)
                .json({ success: false, msg: "unkown error" });
        }
    }
};
exports.updateBookByLibrarianAPI = updateBookByLibrarianAPI;
// delete book for libraraian
const deleteBookByLibrarianAPI = async (req, res) => {
    try {
        const { bookId } = req.params;
        const librarianId = req.cookies["userId"] || req.headers["id"];
        // Find the librarian user
        const librarianUser = await (0, userService_1.findUserById)(parseInt(librarianId));
        if (!librarianUser) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }
        // Check if the user is a librarian
        if (librarianUser.role !== "librarian" &&
            librarianUser.role !== "administrator") {
            return res.status(401).json({
                success: false,
                msg: "You do not have permission to perform this action. 😡",
            });
        }
        if (librarianUser.library_name === null) {
            return res
                .status(400)
                .json({ success: false, msg: "Library name is not available" });
        }
        const books = await (0, bookService_1.deleteBookById)(librarianUser.library_name, parseInt(bookId));
        if (!books) {
            return res.status(404).json({
                success: false,
                msg: `Book with ID ${bookId} not found in the librarian's library`,
            });
        }
        return res.status(200).json({
            success: true,
            msg: "Book deleted successfully",
            id: bookId,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({ success: false, msg: error.message });
        }
        else {
            return res
                .status(500)
                .json({ success: false, msg: "unkown error" });
        }
    }
};
exports.deleteBookByLibrarianAPI = deleteBookByLibrarianAPI;
const filterBooksForLibrarian = async (req, res) => {
    try {
        const { page } = req.query;
        const filters = {};
        const librarianID = req.cookies["userId"] || req.headers["id"];
        const librarianUser = await (0, userService_1.findUserById)(parseInt(librarianID));
        if (!librarianUser) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }
        if (librarianUser.role !== "librarian") {
            return res.status(401).json({
                success: false,
                msg: "You are not authorized to access this resource.",
            });
        }
        // Extract filters from the request query
        const { title, author, isbn, type, library_name, book_id } = req.query;
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
        // // Check if any filter is provided
        // if (Object.keys(filters).length === 0) {
        //     return res
        //         .status(400)
        //         .json({ success: false, msg: "Filter data is required." });
        // }
        if (librarianUser.library_name) {
            const books = await (0, bookService_1.findBooksByCriteriaForLibrarian)(filters, librarianUser.library_name, page);
            if (!books || books.length === 0) {
                return res.status(404).json({
                    success: false,
                    msg: "No more data💔💔(❁´◡`❁)",
                    page: parseInt(page)
                });
            }
            return res.status(200).json({
                success: true,
                msg: "Books filtered successfully.",
                data: books,
                page: parseInt(page)
            });
        }
        else {
            return res
                .status(200)
                .json({ success: false, msg: "you have no library in" });
        }
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({ success: false, msg: error.message });
        }
        else {
            return res.status(500).json({
                success: false,
                msg: "Unknown error in filtering books.",
            });
        }
    }
};
exports.filterBooksForLibrarian = filterBooksForLibrarian;
const getRequestedBorrowBooks = async (req, res) => {
    try {
        const { state } = req.query;
        const { page } = req.query;
        console.log(state);
        const librarianId = req.cookies["userId"] || req.headers["id"];
        // Find the librarian user
        const librarianUser = await (0, userService_1.findUserById)(parseInt(librarianId));
        if (!librarianUser) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }
        // Check if the user is a librarian
        if (librarianUser.role !== "librarian" &&
            librarianUser.role !== "administrator") {
            return res.status(401).json({
                success: false,
                msg: "You do not have permission to perform this action. 😡",
            });
        }
        if (librarianUser.library_name === null) {
            return res
                .status(400)
                .json({ success: false, msg: "Library name is not available" });
        }
        const data = await (0, bookService_1.getBorrowedBooksForLibrarian)(librarianUser.library_name, state, page);
        if (!data || data.length === 0) {
            return res.status(404).json({
                success: false,
                msg: "No more data💔💔(❁´◡`❁)",
                page: parseInt(page)
            });
        }
        if (!data) {
            return res.status(200).json({
                success: true,
                msg: "no transaction found",
            });
        }
        else {
            return res.status(200).json({
                success: true,
                msg: "success",
                data: data,
                page: parseInt(page)
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
                .json({ success: false, msg: "unkown error" });
        }
    }
};
exports.getRequestedBorrowBooks = getRequestedBorrowBooks;
const getRequestedReservedBooks = async (req, res) => {
    try {
        const { status } = req.query;
        const { page } = req.query;
        const librarianId = req.cookies["userId"] || req.headers["id"];
        // Find the librarian user
        const librarianUser = await (0, userService_1.findUserById)(parseInt(librarianId));
        if (!librarianUser) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }
        // Check if the user is a librarian or administrator
        if (librarianUser.role !== "librarian" &&
            librarianUser.role !== "administrator") {
            return res.status(401).json({
                success: false,
                msg: "You do not have permission to perform this action. 😡",
            });
        }
        if (librarianUser.library_name === null) {
            return res
                .status(400)
                .json({ success: false, msg: "Library name is not available" });
        }
        // Assuming getPendingReservationsForLibrarian function exists and takes librarian's library name and reservation state as parameters
        const data = await (0, bookService_1.getReservationsForLibrarian)(librarianUser.library_name, status, page);
        if (!data || data.length === 0) {
            return res.status(200).json({
                success: true,
                msg: "No reservations found",
                page: parseInt(page)
            });
        }
        else {
            return res.status(200).json({
                success: true,
                msg: "Success",
                data: data,
                page: parseInt(page)
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
exports.getRequestedReservedBooks = getRequestedReservedBooks;
const confirmBorrowForTheLibrarian = async (req, res) => {
    try {
        const { transactionId } = req.query;
        const librarianId = req.cookies["userId"] || req.headers["id"];
        // Find the librarian user
        const librarianUser = await (0, userService_1.findUserById)(parseInt(librarianId));
        if (!librarianUser) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }
        // Check if the user is a librarian or administrator
        if (librarianUser.role !== "librarian" &&
            librarianUser.role !== "administrator") {
            return res.status(401).json({
                success: false,
                msg: "You do not have permission to perform this action. 😡",
            });
        }
        if (librarianUser.library_name === null) {
            return res
                .status(400)
                .json({ success: false, msg: "Library name is not available" });
        }
        // Confirm borrow request
        const message = await (0, bookService_1.confirmBorrowForLibrarian)(librarianUser.library_name, parseInt(transactionId));
        const data = await (0, bookService_1.getBorrowedBooksForLibrarian)(librarianUser.library_name, "Borrow_request");
        // Send response
        res.status(200).json({ success: true, msg: message, data: data });
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
exports.confirmBorrowForTheLibrarian = confirmBorrowForTheLibrarian;
const confirmReserveForTheLibrarian = async (req, res) => {
    try {
        const { reservationId } = req.query;
        const librarianId = req.cookies["userId"] || req.headers["id"];
        // Find the librarian user
        const librarianUser = await (0, userService_1.findUserById)(parseInt(librarianId));
        if (!librarianUser) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }
        // Check if the user is a librarian or administrator
        if (librarianUser.role !== "librarian" &&
            librarianUser.role !== "administrator") {
            return res.status(401).json({
                success: false,
                msg: "You do not have permission to perform this action. 😡",
            });
        }
        if (librarianUser.library_name === null) {
            return res
                .status(400)
                .json({ success: false, msg: "Library name is not available" });
        }
        // Confirm reservation
        const message = await (0, bookService_1.confirmReserveForLibrarian)(librarianUser.library_name, parseInt(reservationId));
        const data = await (0, bookService_1.getReservationsForLibrarian)(librarianUser.library_name, "Pending");
        // Send response
        res.status(200).json({ success: true, msg: message, data: data });
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
exports.confirmReserveForTheLibrarian = confirmReserveForTheLibrarian;
const deleteTransactionHandlerForLibraraian = async (req, res) => {
    try {
        let { transactionId } = req.query;
        const userId = req.cookies["userId"] || req.headers["id"];
        console.log(transactionId);
        // Find the librarian user
        const user = await (0, userService_1.findUserById)(parseInt(userId));
        if (!user) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }
        // Delete the transaction
        const message = await (0, bookService_1.deleteTransaction)(parseInt(transactionId), parseInt(userId));
        console.log(transactionId);
        res.status(200).json({ success: true, msg: message, id: transactionId });
    }
    catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ success: false, msg: 'Failed to delete transaction' });
    }
};
exports.deleteTransactionHandlerForLibraraian = deleteTransactionHandlerForLibraraian;
const deleteReservationHandlerForLibraraian = async (req, res) => {
    try {
        let { reservationId } = req.query;
        const userId = req.cookies["userId"] || req.headers["id"];
        // Find the librarian user
        const user = await (0, userService_1.findUserById)(parseInt(userId));
        if (!user) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }
        // Delete the transaction
        const message = await (0, bookService_1.deleteReservation)(parseInt(reservationId), parseInt(userId));
        res.status(200).json({ success: true, msg: message, id: reservationId });
    }
    catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ success: false, msg: 'Failed to delete transaction' });
    }
};
exports.deleteReservationHandlerForLibraraian = deleteReservationHandlerForLibraraian;
const confirmReturnForTheLibrarian = async (req, res) => {
    try {
        const { transactionId } = req.query;
        const librarianId = req.cookies["userId"] || req.headers["id"];
        // Find the librarian user
        const librarianUser = await (0, userService_1.findUserById)(parseInt(librarianId));
        if (!librarianUser) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }
        // Check if the user is a librarian or administrator
        if (librarianUser.role !== "librarian" &&
            librarianUser.role !== "administrator") {
            return res.status(401).json({
                success: false,
                msg: "You do not have permission to perform this action. 😡",
            });
        }
        if (librarianUser.library_name === null) {
            return res
                .status(400)
                .json({ success: false, msg: "Library name is not available" });
        }
        // Assuming confirmReturnForLibrarian function exists
        const message = await (0, bookService_1.confirmReturnForLibrarian)(librarianUser.library_name, parseInt(transactionId));
        const data = await (0, bookService_1.getBorrowedBooksForLibrarianToConfirm)(librarianUser.library_name, "Borrowed");
        res.status(200).json({ success: true, msg: message, data: data });
    }
    catch (error) {
        console.error("Error confirming return request for librarian", error);
        res.status(500).json({
            success: false,
            msg: "Failed to confirm return request",
        });
    }
};
exports.confirmReturnForTheLibrarian = confirmReturnForTheLibrarian;
const checkExpiredRequested = async (req, res) => {
    try {
        // const { state } = req.params;
        const librarianId = req.cookies["userId"] || req.headers["id"];
        // Find the librarian user
        const librarianUser = await (0, userService_1.findUserById)(parseInt(librarianId));
        if (!librarianUser) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }
        // Check if the user is a librarian
        if (librarianUser.role !== "librarian" &&
            librarianUser.role !== "administrator") {
            return res.status(401).json({
                success: false,
                msg: "You do not have permission to perform this action. 😡",
            });
        }
        if (librarianUser.library_name === null) {
            return res
                .status(400)
                .json({ success: false, msg: "Library name is not available" });
        }
        // Get the requested borrow books data
        // const data = await getBorrowedBooksForLibrarian(
        //     librarianUser.library_name,
        //     state,
        // );
        // Check for expired books
        const expiredRecords = await (0, bookService_1.checkExpiredBooksForLibrarian)(librarianUser.library_name);
        return res.status(200).json({
            success: true,
            msg: "Success",
            data: expiredRecords
        });
    }
    catch (error) {
        console.error('Error retrieving requested borrow books for librarian:', error);
        return res.status(500).json({ success: false, msg: "Unknown error" });
    }
};
exports.checkExpiredRequested = checkExpiredRequested;
//# sourceMappingURL=librarianBook.controller.js.map