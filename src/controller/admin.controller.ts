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
    createUser,
    deleteUserByIdOrEmailOrUsername,
    findUserByEmail,
    findUserById,
    findUserByUsername,
    getAllUsers,
    getUsersByFilters,
    getUsersByLibrary,
    isUserActive,
    updateUserById,
} from "../prisma/services/userService";

export const addUser = async (req: express.Request, res: express.Response) => {
    try {
        const userData: User = req.body;
        const userId = req.cookies["userId"] || req.headers["id"];
        const verificationCode = crypto.randomInt(10000, 99999).toString();
        const salt = await bcrypt.genSalt(10);
        const hashPass = await bcrypt.hash(userData.password, salt);
        // Find user by ID
        const user = await findUserById(parseInt(userId));
        if (!user) {
            return res.status(401).json({ success: false, msg: "who are you" });
        }
        if (user.role !== "administrator") {
            return res
                .status(401)
                .json({ success: false, msg: "You have no permission 🤬😡" });
        }
        const avatar = gravatar.url(userData.email, {
            s: "300",
            r: "pg",
            d: "mm",
        });
        const existingUserName = await findUserByUsername(userData.username);
        const existingUseremail: any = await findUserByEmail(userData.email);
        console.log(existingUserName);
        if (existingUseremail) {
            return res
                .status(400)
                .json({ success: false, msg: "Email already exists" });
        }
        if (existingUserName) {
            return res
                .status(400)
                .json({ success: false, msg: "username already exists" });
        }
        if (
            userData.role !== "librarian" ||
            userData.account_type !== "librarian"
        ) {
            userData.library_name == null;
        }
        
        const newUser = await createUser({
            username: userData.username.toLowerCase(),
            password: hashPass,
            email: userData.email,
            library_name: userData.library_name,
            account_type: userData.account_type,
            role: userData.role,
            verificationCode: verificationCode,
            verified: Boolean(userData.verified),
            avatar: avatar,
            is_active: Boolean(userData.is_active),
        });
        if (!newUser) {
            return res
                .status(401)
                .json({ success: false, msg: "Error adding user" });
        } else {
            const users = await getAllUsers(1);
            return res.status(200).json({
                success: true,
                msg: "User added success",
                data:users,
            });
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

export const filterUsers = async (
    req: express.Request,
    res: express.Response,
) => {
    try {
        const { page } = req.query;
        const filters: UserFilters = {};
        const adminId = req.cookies["userId"] || req.headers["id"];

        const user = await findUserById(parseInt(adminId));
        if (!user) {
            return res
                .status(401)
                .json({ success: false, msg: "who are you?🤔" });
        }
        if (user.role !== "administrator") {
            return res
                .status(401)
                .json({ success: false, msg: "You have no permission 🤬😡" });
        }
        // Extract query parameters from the request
        const {
            email,
            username,
            user_id,
            library_name,
            role,
            account_type,
            verified,
            is_active,
        } = req.query;
       
        // Apply filters based on query parameters
        if (role) filters.role = role as UserRole;
        if (library_name && typeof library_name === 'string') filters.library_name = library_name;
        if (account_type) filters.account_type = account_type as AccountType;
        if (verified) {
            let boolValue = verified === "true";
            filters.verified = boolValue;
        }
        if (is_active) {
            let boolValue = is_active === "true";
            filters.is_active = boolValue;
        }

        if (email) filters.email = email.toString();
        if (username) filters.username = username.toString();
        if (user_id) filters.user_id = Number(user_id);
        console.log(filters.is_active);
        console.log(filters);
        const users = await getUsersByFilters(filters,page);
        if (!users || users.length === 0) {
            return res.status(404).json({
                success: true,
                msg: "No more data💔💔(❁´◡`❁)",
                page:parseInt(page as string)
            });
        }
        if (users) {
            res.status(200).json({ success: true, data: users,page:parseInt(page as string) });
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

// get all users
export const getAllUsersByAdmin = async (
    req: express.Request,
    res: express.Response,
) => {
    try {
        const { page } = req.query;
        const adminId = req.cookies["userId"] || req.headers["id"];

        const user = await findUserById(parseInt(adminId));
        if (!user) {
            return res
                .status(401)
                .json({ success: false, msg: "who are you?🤔" });
        }
        if (user.role !== "administrator") {
            return res
                .status(401)
                .json({ success: false, msg: "You have no permission 🤬😡" });
        }
        const users = await getAllUsers(page);
        if (!users || users.length === 0) {
            return res.status(404).json({
                success: true,
                msg: "No more data💔💔(❁´◡`❁)",
                page:parseInt(page as string)
            });
        }
        if (users) {
            res.status(200).json({ success: true, data: users,page:parseInt(page as string) });
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

export const deleteUserByIdentifier = async (
    req: express.Request,
    res: express.Response,
) => {
    const {identifier}  = req.body;
    const adminId = req.cookies["userId"] || req.headers["id"];
    const user = await findUserById(parseInt(adminId));
    if (!user) {
        return res.status(401).json({ success: false, msg: "who are you?🤔" });
    }
    if (user.role !== "administrator") {
        return res.status(401).json({
            success: false,
            msg: "You have no permission 🤬😡",
        });
    }
    if (!identifier) {
        return res
            .status(400)
            .json({ success: false, msg: "Identifier is required" });
    }

    try {
        const message = await deleteUserByIdOrEmailOrUsername(identifier);
        return res
            .status(200)
            .json({ success: true, msg:message });
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

export const editUserByAdmin = async (
    req: express.Request,
    res: express.Response,
) => {
    try {
        const { userId, updatedUserData } = req.body; // Assuming you receive userId and updatedUserData in the request body
        const adminId = req.cookies["userId"] || req.headers["id"];
        console.log(userId,updatedUserData);
        // Find admin user by ID
        const adminUser = await findUserById(parseInt(adminId));
        if (!adminUser || adminUser.role !== "administrator") {
            return res.status(401).json({
                success: false,
                msg: "You don't have permission to perform this action.",
            });
        }

        // Update user data
        const updatedUser = await updateUserById(parseInt(userId), updatedUserData);

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                msg: "User not found or error updating user data.",
            });
        }
        

        return res.status(200).json({
            success: true,
            msg: "User data updated successfully",
            data: {
                user_id: updatedUser.user_id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                account_type: updatedUser.account_type,
                verified: updatedUser.verified,
                avatar: updatedUser.avatar,
                is_active: updatedUser.is_active,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred.",
        });
    }
};

export const checkUserIsActiveByAdmin = async (
    req: express.Request,
    res: express.Response,
) => {
    const { identifier } = req.body;
    const adminId = req.cookies["userId"] || req.headers["id"];
    const user = await findUserById(parseInt(adminId));
    if (!user) {
        return res.status(401).json({ success: false, msg: "who are you?🤔" });
    }
    if (user.role !== "administrator") {
        return res.status(401).json({
            success: false,
            msg: "You have no permission 🤬😡",
        });
    }
    if (!identifier) {
        return res
            .status(400)
            .json({ success: false, msg: "Identifier is required" });
    }

    try {
        const isActive = await isUserActive(identifier);
        return res.status(200).json({ success: true, msg: isActive });
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

// get librarian user by library name

export const getUsersWithLibraryName = async (
    req: express.Request,
    res: express.Response,
) => {
    try {
        const { libraryName } = req.body;
        const adminId = req.cookies["userId"] || req.headers["id"];
        const user = await findUserById(parseInt(adminId));
        if (!user) {
            return res
                .status(401)
                .json({ success: false, msg: "who are you?🤔" });
        }
        if (user.role !== "administrator") {
            return res.status(401).json({
                success: false,
                msg: "You have no permission 🤬😡",
            });
        }
        // Validate if libraryName is provided
        if (!libraryName) {
            return res
                .status(400)
                .json({ success: false, msg: "Library name is required" });
        }

        // Fetch users with the provided library name
        const users = await getUsersByLibrary(libraryName);

        return res.status(200).json({ success: true, data: users });
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
