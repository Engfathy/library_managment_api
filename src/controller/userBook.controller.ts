import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import gravatar from "gravatar";
// import { User } from "../interface/models.interface";
import express from "express";
import { validationResult } from "express-validator";
import config from "../config/config";
import { generateRandomString } from "../utils/randomString";
import sendMail from "../utils/nodemailer";
import * as crypto from "crypto";

import { findUserById } from "../prisma/services/userService";
import { BookFilters, BookType } from "../interface/models.interface";
import { borrowBook, deleteReservation, deleteTransaction, findBooksByCriteria, reserveBook } from "../prisma/services/bookService";


export const filterBooksForUser = async (
    req: express.Request,
    res: express.Response,
) => {
    try {
        const filters: BookFilters = {};
        const userID = req.cookies["userId"] || req.headers["id"];

        // Find the librarian user
        const patronUser = await findUserById(parseInt(userID));
        if (!patronUser) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }

        // Check if the user is a librarian or administrator
        if (
            patronUser.role == "librarian"
        ) {
            return res.status(401).json({
                success: false,
                msg: "this account have no permission for that make a patron one",
            });
        }
        const {
            title,
            author,
            isbn,
            type,
            library_name,
            book_id,
            genreName
        } = req.query;
        if (title) filters.title = String(title);
    if (author) filters.author = String(author);
    if (isbn) filters.isbn = String(isbn);
    if (type) filters.type = String(type) as BookType;
    if (library_name) filters.library_name = String(library_name);
    if (book_id) filters.book_id = Number(book_id);
    if (genreName) filters.genreName = String(genreName);
        // Check if the identifier is provided
        if (!filters) {
            return res
                .status(400)
                .json({ success: false, msg: "filter data is required" });
        }

        // Find the user by identifier
        const books = await findBooksByCriteria(filters);
        if (!books) {
            return res
                .status(400)
                .json({ success: false, msg: "no books found" });
        }

        return res.status(200).json({ success: true,msg: "done",data: books });
    } catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({ success: false, msg: error.message });
        } else {
            return res
                .status(500)
                .json({ success: false, msg: "Unknown error in filter books" });
        }
    }
};

export const borrowBookForUser = async (
    req: express.Request,
    res: express.Response,
) => {
    try {
        const userID = req.cookies["userId"] || req.headers["id"];
        const { bookId ,borrowDays} = req.body;
        const patronUser = await findUserById(parseInt(userID));
        if (!patronUser) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }
        if (
            patronUser.role == "librarian"
        ) {
            return res.status(401).json({
                success: false,
                msg: "this account have no permission for that make a patron one",
            });
        }
        if (!bookId) {
            return res.status(400).json({ success: false, msg: ' book id are required' });
        }
        if(borrowDays > 10 ){
            res.status(200).json({ success: true, msg: "Too long period of borrowing" });
        }
        const message = await borrowBook(parseInt(userID), parseInt(bookId),borrowDays);

        res.status(200).json({ success: true, msg: message });
    } catch (error) {
        console.error('Error borrowing book:', error);
        res.status(500).json({ success: false, msg: 'Failed to borrow book' });
    }

};

export const reserveBookForUser = async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const userID = parseInt(req.cookies["userId"] || req.headers["id"]);
        const { bookId, reservationDays } = req.body;

        if (!userID || !bookId) {
            res.status(400).json({ success: false, message: 'User ID and Book ID are required.' });
            return;
        }

        const user = await findUserById(userID);
        if (!user) {
            res.status(401).json({ success: false, message: 'User not found.' });
            return;
        }

        // Assuming librarians cannot reserve books
        if (user.role === "librarian") {
            res.status(401).json({ success: false, message: 'Librarians cannot reserve books.' });
            return;
        }

        const message= await reserveBook(userID,parseInt(bookId),parseInt(reservationDays))

        res.status(200).json({ success: true, message: message });
    } catch (error) {
        console.error('Error reserving book:', error);
        res.status(500).json({ success: false, message: 'Failed to reserve book.' });
    }
};

export const deleteTransactionHandler = async (
    req: express.Request,
    res: express.Response,
) => {
    try {
        const { transactionId } = req.query;
        const userId = req.cookies["userId"] || req.headers["id"];

        // Find the librarian user
        const user = await findUserById(parseInt(userId));
        if (!user) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }
        // Delete the transaction
        const message = await deleteTransaction(parseInt(transactionId as string),parseInt(userId));

        res.status(200).json({ success: true, msg: message });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ success: false, msg: 'Failed to delete transaction' });
    }
};
export const deleteReservationHandler = async (
    req: express.Request,
    res: express.Response,
) => {
    try {
        const { reservationId } = req.query;
        const userId = req.cookies["userId"] || req.headers["id"];

        // Find the librarian user
        const user = await findUserById(parseInt(userId));
        if (!user) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }
        // Delete the transaction
        const message = await deleteReservation(parseInt(reservationId as string),parseInt(userId));

        res.status(200).json({ success: true, msg: message });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ success: false, msg: 'Failed to delete transaction' });
    }
};