"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactionsForUser = exports.getReservationsForUser = exports.checkExpiredBooksForLibrarian = exports.confirmReturnForLibrarian = exports.confirmReserveForLibrarian = exports.deleteReservationForUser = exports.deleteTransactionForUser = exports.deleteReservation = exports.deleteTransaction = exports.confirmBorrowForLibrarian = exports.getBorrowedBooksForLibrarianToConfirm = exports.getBorrowedBooksForLibrarian = exports.getReservationsForLibrarian = exports.reserveBook = exports.borrowBook = exports.findBooksByCriteria = exports.findBooksByCriteriaForLibrarian = exports.deleteBookById = exports.updateBook = exports.findBookById = exports.createBookWithGenres = void 0;
const client_1 = require("@prisma/client");
const genereService_1 = require("./genereService");
const userService_1 = require("./userService");
const dateHandeling_1 = require("../../utils/dateHandeling");
const prisma = new client_1.PrismaClient();
// Function to create a new book
async function createBookWithGenres(bookData, librarianName, genreNames) {
    try {
        const newBook = await prisma.books.create({ data: bookData });
        const genreIds = await (0, genereService_1.getGenreIds)(genreNames);
        const bookGenresData = genreIds.map((genreId) => ({
            book_id: newBook.book_id,
            genre_id: genreId,
        }));
        await prisma.books_genres.createMany({ data: bookGenresData });
        const allBooks = await prisma.books.findMany({
            where: { library_name: librarianName },
        });
        const allGenres = await prisma.genres.findMany();
        const bookGenresMap = {};
        for (const book of allBooks) {
            const bookGenres = await prisma.books_genres.findMany({
                where: { book_id: book.book_id },
                include: { genres: true },
            });
            const genresForBook = bookGenres.map((bg) => bg.genres.name);
            bookGenresMap[book.book_id] = genresForBook;
        }
        return allBooks.map((book) => ({
            book_id: book.book_id,
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            type: book.type,
            total_copies: book.total_copies,
            available_copies: book.available_copies,
            library_name: book.library_name,
            genres: bookGenresMap[book.book_id] || [],
        }));
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error creating book with genres and returning all books: ${error.message}`);
        }
        else {
            throw new Error(`Error creating book with genres and returning all books: Unknown error occurred`);
        }
    }
}
exports.createBookWithGenres = createBookWithGenres;
// Function to find a book by its ID
async function findBookById(bookId) {
    try {
        const book = await prisma.books.findUnique({
            where: { book_id: bookId },
        });
        return book;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error finding book by id: ${error.message}`);
        }
        else {
            throw new Error(`Error finding book by id: Unknown error occurred`);
        }
    }
}
exports.findBookById = findBookById;
// Function to update a book's information
async function updateBook(librarianLibraryName, bookId, updatedBookData, genreNames) {
    try {
        // Find existing book
        const existingBook = await prisma.books.findUnique({
            where: { book_id: bookId, library_name: librarianLibraryName },
            include: { books_genres: true }, // Include genres associated with the book
        });
        if (!existingBook) {
            return null;
        }
        // Update book data
        const updatedBook = await prisma.books.update({
            where: { book_id: bookId },
            data: updatedBookData,
        });
        // Update genres associated with the book
        const genreIds = await (0, genereService_1.getGenreIds)(genreNames);
        await prisma.books_genres.deleteMany({ where: { book_id: bookId } }); // Remove existing book-genre associations
        const bookGenresData = genreIds.map((genreId) => ({
            book_id: bookId,
            genre_id: genreId,
        }));
        await prisma.books_genres.createMany({ data: bookGenresData });
        // Fetch all books associated with the specified library name
        const allBooks = await prisma.books.findMany({
            where: { library_name: librarianLibraryName },
        });
        // Fetch all genres
        const allGenres = await prisma.genres.findMany();
        // Fetch genres for each book in parallel
        const bookGenresPromises = allBooks.map((book) => prisma.books_genres.findMany({
            where: { book_id: book.book_id },
            include: { genres: true },
        }));
        // Wait for all genre fetching promises to resolve
        const bookGenresResults = await Promise.all(bookGenresPromises);
        // Map book IDs to their genres
        const bookGenresMap = {};
        bookGenresResults.forEach((bookGenres, index) => {
            const genresForBook = bookGenres.map((bg) => bg.genres.name);
            bookGenresMap[allBooks[index].book_id] = genresForBook;
        });
        // Return all books with their genres
        return allBooks.map((book) => ({
            book_id: book.book_id,
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            type: book.type,
            total_copies: book.total_copies,
            available_copies: book.available_copies,
            library_name: book.library_name,
            genres: bookGenresMap[book.book_id] || [],
        }));
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error updating book: ${error.message}`);
        }
        else {
            throw new Error(`Error updating book: Unknown error occurred`);
        }
    }
}
exports.updateBook = updateBook;
// Function to delete a book by its ID
async function deleteBookById(librarianLibraryName, bookId) {
    try {
        // Delete book-genre associations first
        await prisma.books_genres.deleteMany({
            where: { book_id: bookId },
        });
        // Then delete the book
        const deletedBook = await prisma.books.delete({
            where: { book_id: bookId, library_name: librarianLibraryName },
        });
        // const allBooks = await prisma.books.findMany({ where: { library_name: librarianLibraryName } });
        // Fetch all genres
        const allGenres = await prisma.genres.findMany();
        // // Fetch genres for each book in parallel
        // const bookGenresPromises = allBooks.map(book =>
        //     prisma.books_genres.findMany({
        //         where: { book_id: book.book_id },
        //         include: { genres: true },
        //     })
        // );
        // // Wait for all genre fetching promises to resolve
        // const bookGenresResults = await Promise.all(bookGenresPromises);
        // // Map book IDs to their genres
        // const bookGenresMap: Record<number, string[]> = {};
        // bookGenresResults.forEach((bookGenres, index) => {
        //     const genresForBook = bookGenres.map(bg => bg.genres.name);
        //     bookGenresMap[allBooks[index].book_id] = genresForBook;
        // });
        // // Return all books with their genres
        // return allBooks.map((book) => ({
        //     book_id: book.book_id,
        //     title: book.title,
        //     author: book.author,
        //     isbn: book.isbn,
        //     type: book.type,
        //     total_copies: book.total_copies,
        //     available_copies: book.available_copies,
        //     library_name: book.library_name,
        //     genres: bookGenresMap[book.book_id] || [],
        // }));
        return deletedBook;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error deleting book by id: ${error.message}`);
        }
        else {
            throw new Error(`Error deleting book by id: Unknown error occurred`);
        }
    }
}
exports.deleteBookById = deleteBookById;
async function findBooksByCriteriaForLibrarian(criteria, libraryName, options) {
    try {
        let page = options || 1;
        let take = 10;
        let skip = (page - 1) * take;
        // Construct dynamic filters based on criteria
        const filters = [];
        for (const key in criteria) {
            if (Object.prototype.hasOwnProperty.call(criteria, key)) {
                const value = criteria[key];
                if (key === "title") {
                    filters.push({
                        title: {
                            contains: value,
                        },
                    });
                }
                else if (key === "author") {
                    filters.push({
                        author: {
                            contains: value,
                        },
                    });
                }
                else if (key === "isbn") {
                    filters.push({
                        isbn: {
                            contains: value,
                        },
                    });
                }
                else if (key === "type") {
                    filters.push({
                        type: value,
                    });
                }
                else if (key === "book_id") {
                    filters.push({
                        book_id: Number(value),
                    });
                }
                else if (key === "library_name") {
                    filters.push({
                        library_name: {
                            contains: value,
                        },
                    });
                }
            }
        }
        // Fetch all books based on the criteria
        const books = await prisma.books.findMany({
            take: take,
            skip: skip,
            where: {
                library_name: libraryName,
                AND: filters,
            },
        });
        console.log(books.length);
        if (books.length == 0) {
            return [];
        }
        // Map book IDs to their associated genre names
        const bookGenresMap = {};
        for (const book of books) {
            // Find genres associated with the current book
            const bookGenres = await prisma.books_genres.findMany({
                where: { book_id: book.book_id },
                include: { genres: true },
            });
            // Extract genre names for the current book
            const genresForBook = bookGenres.map((bg) => bg.genres.name);
            // Map book ID to its associated genre names
            bookGenresMap[book.book_id] = genresForBook;
        }
        // Return books along with their associated genre names
        return books.map((book) => ({
            book_id: book.book_id,
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            type: book.type,
            total_copies: book.total_copies,
            available_copies: book.available_copies,
            library_name: book.library_name,
            genres: bookGenresMap[book.book_id] || [],
        }));
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error finding books by criteria: ${error.message}`);
        }
        else {
            throw new Error(`Error finding books by criteria: Unknown error occurred`);
        }
    }
}
exports.findBooksByCriteriaForLibrarian = findBooksByCriteriaForLibrarian;
async function findBooksByCriteria(criteria) {
    try {
        const where = {}; // Use Prisma's type for better type checking
        for (const key in criteria) {
            if (Object.prototype.hasOwnProperty.call(criteria, key)) {
                const value = criteria[key];
                if (key === "title") {
                    where.title = {
                        contains: value,
                    };
                }
                else if (key === "author") {
                    where.author = {
                        contains: value,
                    };
                }
                else if (key === "isbn") {
                    where.isbn = {
                        contains: value,
                    };
                }
                else if (key === "type") {
                    where.type = value;
                }
                else if (key === "book_id") {
                    where.book_id = value;
                }
                else if (key === "library_name") {
                    where.library_name = {
                        contains: value,
                    };
                }
                else if (key === "genreName") {
                    // Assuming there's a relation named books_genres that connects books to genres
                    where.books_genres = {
                        some: {
                            genres: {
                                name: {
                                    contains: value,
                                },
                            },
                        },
                    };
                }
            }
        }
        const books = await prisma.books.findMany({
            where,
            include: {
                books_genres: {
                    include: {
                        genres: true,
                    },
                },
            },
        });
        // Map book IDs to their associated genre names
        const bookGenresMap = {};
        for (const book of books) {
            // Find genres associated with the current book
            const bookGenres = await prisma.books_genres.findMany({
                where: { book_id: book.book_id },
                include: { genres: true },
            });
            // Extract genre names for the current book
            const genresForBook = bookGenres.map((bg) => bg.genres.name);
            // Map book ID to its associated genre names
            bookGenresMap[book.book_id] = genresForBook;
        }
        // Return books along with their associated genre names
        return books.map((book) => ({
            book_id: book.book_id,
            title: book.title,
            author: book.author,
            type: book.type,
            total_copies: book.total_copies,
            available_copies: book.available_copies,
            library_name: book.library_name,
            genres: bookGenresMap[book.book_id] || [],
        }));
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error finding books by criteria: ${error.message}`);
        }
        else {
            throw new Error("Error finding books by criteria: Unknown error occurred");
        }
    }
}
exports.findBooksByCriteria = findBooksByCriteria;
async function borrowBook(userId, bookId, borrwedDays) {
    try {
        // Check if the book is available for borrowing
        const book = await prisma.books.findUnique({
            where: { book_id: bookId },
        });
        if (!book) {
            return "Book not found";
        }
        if (book.available_copies <= 0) {
            return "Book is not available for borrowing";
        }
        const existingTransaction = await prisma.transactions.findFirst({
            where: {
                user_id: userId,
                book_id: bookId,
                transaction_type: {
                    in: ["Borrowed", "Borrow_request"],
                },
            },
        });
        if (existingTransaction) {
            console.log("Reservation already exists for this user and book.");
            return "Reservation already exists for this user and book.";
        }
        let limit = 3;
        const user = (0, userService_1.findUserById)(userId);
        if (user.account_type == "student") {
            limit = 3;
        }
        else if (user.account_type == "faculty") {
            limit = 8;
        }
        // Check if the user has any active transactions
        const activeTransactions = await prisma.transactions.findMany({
            where: {
                user_id: userId,
                transaction_type: "Borrowed",
            },
        });
        if (activeTransactions.length > limit) {
            return "User already has the maximum number of borrowed books";
        }
        // Calculate the expiry date
        const currentDate = (0, dateHandeling_1.getCurrentDate)();
        const calculatedExpiryDate = (0, dateHandeling_1.addDaysToDate)(currentDate, borrwedDays);
        // Create a transaction record
        console.log(calculatedExpiryDate);
        const transaction = await prisma.transactions.create({
            data: {
                user_id: userId,
                book_id: bookId,
                transaction_type: "Borrow_request",
                expiry_date: calculatedExpiryDate,
            },
        });
        // // Update the book's availability
        // await prisma.books.update({
        //     where: { book_id: bookId },
        //     data: {
        //         available_copies: book.available_copies - 1,
        //     },
        // });
        return "Book borrowed successfully";
    }
    catch (error) {
        console.error("Error borrowing book:", error);
        throw new Error("Failed to borrow book");
    }
}
exports.borrowBook = borrowBook;
async function reserveBook(userId, bookId, reservationDays) {
    try {
        const book = await prisma.books.findUnique({
            where: { book_id: bookId },
        });
        if (!book) {
            return "Book not found";
        }
        if (book.available_copies <= 0) {
            return "Book is not available for reservation";
        }
        let limit = 3;
        const user = (0, userService_1.findUserById)(userId);
        if (user.account_type == "student") {
            limit = 3;
        }
        else if (user.account_type == "faculty") {
            limit = 8;
        }
        if (reservationDays > 20) {
            return "you canot reserve for that long limit is 20 days";
        }
        const existingReservation = await prisma.reservations.findFirst({
            where: {
                user_id: userId,
                book_id: bookId,
                status: {
                    in: ["Pending", "Confirmed"],
                },
            },
        });
        if (existingReservation) {
            console.log("Reservation already exists for this user and book.");
            return "Reservation already exists for this user and book.";
        }
        const activeReservations = await prisma.reservations.findMany({
            where: {
                user_id: userId,
                status: "Confirmed",
            },
        });
        if (activeReservations.length > limit) {
            return "User already has the maximum number of reserved books";
        }
        let currentDate = (0, dateHandeling_1.getCurrentDate)();
        let calculatedExpiryDate = (0, dateHandeling_1.addDaysToDate)(currentDate, reservationDays);
        // Create a transaction record
        console.log(calculatedExpiryDate);
        // Update the book's availability
        // await prisma.books.update({
        //     where: { book_id: bookId },
        //     data: {
        //         available_copies: book.available_copies - 1,
        //     },
        // });
        await prisma.reservations.create({
            data: {
                user_id: userId,
                book_id: bookId,
                reservation_date: currentDate,
                expiry_date: calculatedExpiryDate,
                status: "Pending",
            },
        });
        return "Book reserved successfully";
    }
    catch (error) {
        console.error("Error reserved  book", error);
        throw new Error("Failed to reserve book");
    }
}
exports.reserveBook = reserveBook;
async function getReservationsForLibrarian(librarianName, status, options) {
    try {
        let page = options || 1;
        let take = 10;
        let skip = (page - 1) * take;
        console.log(status);
        const pendingReservations = await prisma.reservations.findMany({
            take: take,
            skip: skip,
            where: {
                status: status,
                books: {
                    library_name: librarianName,
                },
            },
            include: {
                books: {
                    select: {
                        title: true,
                        author: true,
                        isbn: true,
                        type: true,
                        total_copies: true,
                        available_copies: true,
                    },
                },
                users: {
                    select: {
                        username: true,
                        email: true,
                        role: true,
                        account_type: true,
                        is_active: true,
                    },
                },
            },
        });
        return pendingReservations;
    }
    catch (error) {
        console.error("Error retrieving pending reservations for librarian", error);
        throw new Error("Failed to retrieve pending reservations");
    }
}
exports.getReservationsForLibrarian = getReservationsForLibrarian;
async function getBorrowedBooksForLibrarian(librarianName, state, options) {
    try {
        let page = options || 1;
        let take = 10;
        let skip = (page - 1) * take;
        const borrowedBooks = await prisma.transactions.findMany({
            take: take,
            skip: skip,
            where: {
                transaction_type: state,
                books: {
                    library_name: librarianName,
                },
            },
            include: {
                books: {
                    select: {
                        title: true,
                        author: true,
                        isbn: true,
                        type: true,
                        total_copies: true,
                        available_copies: true,
                        // Add other fields you want to include from the `book` entity
                    },
                },
                users: {
                    select: {
                        username: true,
                        email: true,
                        role: true,
                        account_type: true,
                        is_active: true,
                    },
                },
            },
        });
        return borrowedBooks;
    }
    catch (error) {
        console.error("Error retrieving borrowed books for librarian", error);
        throw new Error("Failed to borrow book");
    }
}
exports.getBorrowedBooksForLibrarian = getBorrowedBooksForLibrarian;
async function getBorrowedBooksForLibrarianToConfirm(librarianName, state) {
    try {
        const borrowedBooks = await prisma.transactions.findMany({
            where: {
                transaction_type: state,
                books: {
                    library_name: librarianName,
                },
            },
            include: {
                books: {
                    select: {
                        title: true,
                        author: true,
                        isbn: true,
                        type: true,
                        total_copies: true,
                        available_copies: true,
                        // Add other fields you want to include from the `book` entity
                    },
                },
                users: {
                    select: {
                        username: true,
                        email: true,
                        role: true,
                        account_type: true,
                        is_active: true,
                    },
                },
            },
        });
        return borrowedBooks;
    }
    catch (error) {
        console.error("Error retrieving borrowed books for librarian", error);
        throw new Error("Failed to borrow book");
    }
}
exports.getBorrowedBooksForLibrarianToConfirm = getBorrowedBooksForLibrarianToConfirm;
async function confirmBorrowForLibrarian(librarianName, transactionId) {
    try {
        // Check if the transaction exists and is pending
        const transaction = await prisma.transactions.findUnique({
            where: {
                transaction_id: transactionId,
                books: {
                    library_name: librarianName,
                },
            },
        });
        if (!transaction || transaction.transaction_type !== "Borrow_request") {
            throw new Error("Invalid transaction or transaction is not pending");
        }
        const book_id = transaction.book_id;
        if (!book_id) {
            throw new Error("Book ID is not available in the transaction");
        }
        const book = await prisma.books.findUnique({
            where: { book_id: book_id },
        });
        if (book) {
            await prisma.books.update({
                where: { book_id: book_id },
                data: {
                    available_copies: book.available_copies - 1,
                },
            });
        }
        // Update the transaction type to 'Borrowed'
        await prisma.transactions.update({
            where: {
                transaction_id: transactionId,
            },
            data: {
                transaction_type: "Borrowed",
            },
        });
        // Return success message
        return `Borrow request ${transactionId} confirmed`;
    }
    catch (error) {
        console.error("Error confirming borrow request for librarian", error);
        throw new Error("Failed to confirm borrow request");
    }
}
exports.confirmBorrowForLibrarian = confirmBorrowForLibrarian;
async function deleteTransaction(transactionId, userId) {
    try {
        const user = await (0, userService_1.findUserById)(userId);
        const libraryName = user === null || user === void 0 ? void 0 : user.library_name;
        if (libraryName) {
            const transaction = await prisma.transactions.findUnique({
                where: {
                    transaction_id: transactionId,
                    books: {
                        library_name: libraryName,
                    },
                },
            });
            if (!transaction) {
                throw new Error("there is no transaction belong to you with this id");
            }
            const book_id = transaction.book_id;
            if (!book_id) {
                throw new Error("Book ID is not available in the transaction");
            }
            const book = await prisma.books.findUnique({
                where: { book_id: book_id },
            });
            // if (book) {
            //     await prisma.books.update({
            //         where: { book_id: book_id },
            //         data: {
            //             available_copies: book.available_copies + 1,
            //         },
            //     });
            // }
            // Delete the transaction
            await prisma.transactions.delete({
                where: {
                    transaction_id: transactionId,
                },
            });
            return "Transaction deleted successfully";
        }
        else {
            const transaction = await prisma.transactions.findUnique({
                where: {
                    transaction_id: transactionId,
                    user_id: user === null || user === void 0 ? void 0 : user.user_id,
                },
            });
            if (!transaction) {
                throw new Error("Transaction not found for this user");
            }
            // Delete the transaction
            const book_id = transaction.book_id;
            if (!book_id) {
                throw new Error("Book ID is not available in the transaction");
            }
            const book = await prisma.books.findUnique({
                where: { book_id: book_id },
            });
            if (book) {
                await prisma.books.update({
                    where: { book_id: book_id },
                    data: {
                        available_copies: book.available_copies + 1,
                    },
                });
            }
            await prisma.transactions.delete({
                where: {
                    transaction_id: transactionId,
                    user_id: user === null || user === void 0 ? void 0 : user.user_id,
                },
            });
            return "Transaction deleted successfully";
        }
    }
    catch (error) {
        console.error("Error deleting transaction:", error);
        throw new Error("Failed to delete transaction");
    }
}
exports.deleteTransaction = deleteTransaction;
async function deleteReservation(reservationId, userId) {
    try {
        const user = await (0, userService_1.findUserById)(userId);
        const libraryName = user === null || user === void 0 ? void 0 : user.library_name;
        if (libraryName) {
            const reservation = await prisma.reservations.findUnique({
                where: {
                    reservation_id: reservationId,
                    books: {
                        library_name: libraryName,
                    },
                },
            });
            if (!reservation) {
                throw new Error("there is no reservation belong to you with this id");
            }
            const book_id = reservation.book_id;
            if (!book_id) {
                throw new Error("Book ID is not available in the transaction");
            }
            const book = await prisma.books.findUnique({
                where: { book_id: book_id },
            });
            // if (book) {
            //     await prisma.books.update({
            //         where: { book_id: book_id },
            //         data: {
            //             available_copies: book.available_copies + 1,
            //         },
            //     });
            // }
            // Delete the reservation
            await prisma.reservations.delete({
                where: {
                    reservation_id: reservationId,
                },
            });
            return "Reservation deleted successfully";
        }
        else {
            const reservation = await prisma.reservations.findUnique({
                where: {
                    reservation_id: reservationId,
                    user_id: user === null || user === void 0 ? void 0 : user.user_id,
                },
            });
            if (!reservation) {
                throw new Error("Reservation not found for this user");
            }
            const book_id = reservation.book_id;
            if (!book_id) {
                throw new Error("Book ID is not available in the transaction");
            }
            const book = await prisma.books.findUnique({
                where: { book_id: book_id },
            });
            if (book) {
                await prisma.books.update({
                    where: { book_id: book_id },
                    data: {
                        available_copies: book.available_copies + 1,
                    },
                });
            }
            // Delete the transaction
            await prisma.reservations.delete({
                where: {
                    reservation_id: reservationId,
                    user_id: user === null || user === void 0 ? void 0 : user.user_id,
                },
            });
            return "Reservation deleted successfully";
        }
    }
    catch (error) {
        console.error("Error deleting reservation:", error);
        throw new Error("Failed to delete reservation");
    }
}
exports.deleteReservation = deleteReservation;
async function deleteTransactionForUser(transactionId, userId) {
    try {
        console.log(transactionId, userId);
        const user = await (0, userService_1.findUserById)(userId);
        const transaction = await prisma.transactions.findUnique({
            where: {
                transaction_id: transactionId,
                user_id: user === null || user === void 0 ? void 0 : user.user_id,
                transaction_type: "Borrow_request",
            },
        });
        console.log(transaction);
        if (!transaction) {
            throw new Error("there is no transaction belong to you with this id");
        }
        await prisma.transactions.delete({
            where: {
                transaction_id: transactionId,
            },
        });
        return "Transaction deleted successfully";
    }
    catch (error) {
        console.error("Error deleting transaction:", error);
        throw new Error("Failed to delete transaction");
    }
}
exports.deleteTransactionForUser = deleteTransactionForUser;
async function deleteReservationForUser(reservationId, userId) {
    try {
        const user = await (0, userService_1.findUserById)(userId);
        const reservations = await prisma.reservations.findMany({
            where: {
                reservation_id: reservationId,
                user_id: user === null || user === void 0 ? void 0 : user.user_id,
                status: "Pending" || "Confirmed",
            },
        });
        if (!reservations) {
            throw new Error("there is no reservation belong to you with this id");
        }
        // Assuming reservation is an array of objects
        for (const reservation of reservations) {
            if (reservation.status === "Confirmed") {
                const book_id = reservation.book_id;
                if (!book_id) {
                    throw new Error("Book ID is not available in the transaction");
                }
                const book = await prisma.books.findUnique({
                    where: { book_id: book_id },
                });
                if (book) {
                    await prisma.books.update({
                        where: { book_id: book_id },
                        data: {
                            available_copies: book.available_copies + 1,
                        },
                    });
                }
            }
        }
        await prisma.reservations.delete({
            where: {
                reservation_id: reservationId,
            },
        });
        return "Reservation deleted successfully";
    }
    catch (error) {
        console.error("Error deleting reservation:", error);
        throw new Error("Failed to delete reservation");
    }
}
exports.deleteReservationForUser = deleteReservationForUser;
async function confirmReserveForLibrarian(librarianName, reservationId) {
    try {
        // Check if the reservation exists and is pending
        const reservation = await prisma.reservations.findUnique({
            where: {
                reservation_id: reservationId,
                books: {
                    library_name: librarianName,
                },
            },
        });
        if (!reservation || reservation.status !== "Pending") {
            throw new Error("Invalid reservation or reservation is not pending");
        }
        const book_id = reservation.book_id;
        if (!book_id) {
            throw new Error("Book ID is not available in the transaction");
        }
        const book = await prisma.books.findUnique({
            where: { book_id: book_id },
        });
        if (book) {
            await prisma.books.update({
                where: { book_id: book_id },
                data: {
                    available_copies: book.available_copies - 1,
                },
            });
        }
        // Update the reservation status to 'Confirmed'
        await prisma.reservations.update({
            where: {
                reservation_id: reservationId,
            },
            data: {
                status: "Confirmed",
            },
        });
        // Return success message
        return `Reservation ${reservationId} confirmed`;
    }
    catch (error) {
        console.error("Error confirming reservation for librarian", error);
        throw new Error("Failed to confirm reservation");
    }
}
exports.confirmReserveForLibrarian = confirmReserveForLibrarian;
async function confirmReturnForLibrarian(librarianName, transactionId) {
    try {
        // Check if the transaction exists and is borrowed
        const transaction = await prisma.transactions.findUnique({
            where: {
                transaction_id: transactionId,
                books: {
                    library_name: librarianName,
                },
            },
        });
        if (!transaction || transaction.transaction_type !== "Borrowed") {
            throw new Error("Invalid transaction or transaction is not borrowed");
        }
        else {
            const currentDate = new Date((0, dateHandeling_1.getCurrentDate)());
            const expiryDate = transaction.expiry_date
                ? new Date(transaction.expiry_date)
                : null;
            if (!expiryDate) {
                return "Expiry date is not available";
            }
            if (currentDate <= expiryDate) {
                // Update the transaction type to 'Returned'
                const book_id = transaction.book_id;
                if (!book_id) {
                    throw new Error("Book ID is not available in the transaction");
                }
                const book = await prisma.books.findUnique({
                    where: { book_id: book_id },
                });
                if (book) {
                    await prisma.books.update({
                        where: { book_id: book_id },
                        data: {
                            available_copies: book.available_copies + 1,
                        },
                    });
                }
                await prisma.transactions.update({
                    where: {
                        transaction_id: transactionId,
                    },
                    data: {
                        transaction_type: "Returned",
                    },
                });
                // Return success message
                return `Return request  confirmed`;
            }
            else {
                return "Book returned after the expiry date";
            }
        }
    }
    catch (error) {
        console.error("Error confirming return request for librarian", error);
        throw new Error("Failed to confirm return request");
    }
}
exports.confirmReturnForLibrarian = confirmReturnForLibrarian;
// export async function returnBookForLibrarian(userId: number, bookId: number) {
//     try {
//         // Find the transaction record for the user and book
//         const transaction = await prisma.transactions.findFirst({
//             where: {
//                 user_id: userId,
//                 book_id: bookId,
//                 transaction_type: "Borrowed",
//             },
//         });
//         // If transaction record exists, update it to mark as returned
//         if (transaction) {
//             const currentDate = new Date(getCurrentDate());
//             const expiryDate = transaction.expiry_date
//                 ? new Date(transaction.expiry_date)
//                 : null;
//             if (!expiryDate) {
//                 return "Expiry date is not available";
//             }
//             // Check if the book is returned before the expiry date
//             if (currentDate <= expiryDate) {
//                 await prisma.transactions.update({
//                     where: { transaction_id: transaction.transaction_id },
//                     data: { transaction_type: "Returned" },
//                 });
//                 return "Book returned successfully";
//             } else {
//                 return "Book returned after the expiry date";
//             }
//         } else {
//             return "No transaction found for the user and book";
//         }
//     } catch (error) {
//         console.error("Error returning book:", error);
//         throw new Error("Failed to return book");
//     }
// }
async function checkExpiredBooksForLibrarian(librarianName) {
    try {
        // Get all transactions with status "Borrowed" or "Borrow_request" for the librarian's library
        const transactions = await prisma.transactions.findMany({
            where: {
                transaction_type: {
                    in: ["Borrowed", "Borrow_request"],
                },
                books: {
                    library_name: librarianName,
                },
            },
            include: {
                books: true,
                users: {
                    select: {
                        email: true,
                        username: true,
                        user_libraries: {
                            where: {
                                library_name: librarianName,
                            },
                            select: {
                                is_active: true,
                            },
                        },
                    },
                },
            },
        });
        // Get all reservations with status "Confirmed" for the librarian's library
        const reservations = await prisma.reservations.findMany({
            where: {
                status: "Confirmed",
                books: {
                    library_name: librarianName,
                },
            },
            include: {
                books: true,
                users: {
                    select: {
                        email: true,
                        username: true,
                        user_libraries: {
                            where: {
                                library_name: librarianName,
                            },
                            select: {
                                is_active: true,
                            },
                        },
                    },
                },
            },
        });
        // Combine transactions and reservations into a single array
        const allRecords = [...transactions, ...reservations];
        // Get the current date
        const currentDate = new Date((0, dateHandeling_1.getCurrentDate)());
        // Filter records to include only expired ones
        const expiredRecords = allRecords.filter((record) => {
            if (record.expiry_date && record.books) {
                const expiryDate = new Date(record.expiry_date);
                return currentDate > expiryDate;
            }
            return false;
        });
        return expiredRecords;
    }
    catch (error) {
        console.error("Error checking expired books for librarian:", error);
        throw new Error("Failed to check expired books");
    }
}
exports.checkExpiredBooksForLibrarian = checkExpiredBooksForLibrarian;
async function getReservationsForUser(userId) {
    try {
        const userReservations = await prisma.reservations.findMany({
            where: {
                user_id: userId,
            },
            include: {
                books: {
                    select: {
                        title: true,
                        author: true,
                        type: true,
                    },
                },
            },
        });
        return userReservations;
    }
    catch (error) {
        console.error("Error retrieving reservations for user:", error);
        throw new Error("Failed to retrieve reservations for user");
    }
}
exports.getReservationsForUser = getReservationsForUser;
async function getTransactionsForUser(userId) {
    try {
        const userTransactions = await prisma.transactions.findMany({
            where: {
                user_id: userId,
            },
            include: {
                books: {
                    select: {
                        title: true,
                        author: true,
                        isbn: true,
                        type: true,
                        total_copies: true,
                        available_copies: true,
                    },
                },
            },
        });
        return userTransactions;
    }
    catch (error) {
        console.error("Error retrieving transactions for user:", error);
        throw new Error("Failed to retrieve transactions for user");
    }
}
exports.getTransactionsForUser = getTransactionsForUser;
//# sourceMappingURL=bookService.js.map