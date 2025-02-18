import {
    AccountType,
    User,
    UserFilters,
    UserRole,
} from "../interface/models.interface";

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
import {
    findUserById,
    findUserByIdentifier,
    getAllUsersForLibrarian,
    isUserActive,
    updateUserActive,
} from "../prisma/services/userService";
import {
    findUserLibrary,
    updateUserLibraryActiveStatus,
} from "../prisma/services/userًWithLibrarianService";

export const toggleUserActiveByLibrarian = async (
    req: express.Request,
    res: express.Response,
) => {
    try {
        const { identifier } = req.body;
        const librarianId = req.cookies["userId"] || req.headers["id"];

        // Find the librarian user
        const librarianUser = await findUserById(parseInt(librarianId));
        if (!librarianUser) {
            return res
                .status(401)
                .json({ success: false, msg: "Who are you? 🤔" });
        }

        // Check if the user is a librarian or administrator
        if (
            librarianUser.role !== "librarian" &&
            librarianUser.role !== "administrator"
        ) {
            return res.status(401).json({
                success: false,
                msg: "You do not have permission to perform this action. 😡",
            });
        }

        // Check if the identifier is provided
        if (!identifier) {
            return res
                .status(400)
                .json({ success: false, msg: "Identifier is required" });
        }

        // Find the user by identifier
        const user = await findUserByIdentifier(identifier);
        if (!user) {
            return res
                .status(400)
                .json({ success: false, msg: "no user found" });
        }
        if (user.role === "administrator" || user.role === "librarian") {
            return res.status(400).json({
                success: false,
                msg: "you have no permission for this user know your place",
            });
        }
        // Find the librarian's library name
        const librarianLibraryName = librarianUser.library_name;
        if (!librarianLibraryName) {
            return res.status(400).json({
                success: false,
                msg: "you are not associated with any library",
            });
        }
        // Check if the user is associated with the librarian's library
        const userLibrary = await findUserLibrary(
            user.user_id,
            librarianLibraryName,
        );
        if (!userLibrary) {
            return res.status(400).json({
                success: false,
                msg: "User is not associated with this library",
            });
        }

        // Toggle the user's active status in the User_Libraries table
        const isActive = !userLibrary.is_active;
        await updateUserLibraryActiveStatus(
            user.user_id,
            librarianLibraryName,
            isActive,
        );

        return res.status(200).json({ success: true, isActive,id:user.user_id });
    } catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({ success: false, msg: error.message });
        } else {
            return res
                .status(500)
                .json({ success: false, msg: "Unknown error" });
        }
    }
};

export const getAllUsersByLibrarian = async (
    req: express.Request,
    res: express.Response,
) => {
    try {
        const { page } = req.query;
        const librarianID = req.cookies["userId"] || req.headers["id"];

        const user = await findUserById(parseInt(librarianID));
        if (!user) {
            return res
                .status(401)
                .json({ success: false, msg: "who are you?🤔" });
        }
        if (user.role !== "librarian") {
            return res
                .status(401)
                .json({ success: false, msg: "You have no permission 🤬😡" });
        }

        const users = await getAllUsersForLibrarian(String(user.library_name),page);
        if (!users || users.length === 0) {
            return res.status(404).json({
                success: true,
                msg: "No more data💔💔(❁´◡`❁)",
                page:parseInt(page as string)
            });
        }
        if (users) {
            res.status(200).json({ success: true, data: users ,page:parseInt(page as string) });
        } else {
            res.status(401).json({ success: false, msg: "No user found" });
        }
    } catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({ success: false, msg: error.message });
        } else {
            return res
                .status(500)
                .json({ success: false, msg: "unkown error" });
        }
    }
};