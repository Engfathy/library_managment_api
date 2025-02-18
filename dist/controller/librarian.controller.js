"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsersByLibrarian = exports.toggleUserActiveByLibrarian = void 0;
const userService_1 = require("../prisma/services/userService");
const user_WithLibrarianService_1 = require("../prisma/services/user\u064BWithLibrarianService");
const toggleUserActiveByLibrarian = async (req, res) => {
    try {
        const { identifier } = req.body;
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
        // Check if the identifier is provided
        if (!identifier) {
            return res
                .status(400)
                .json({ success: false, msg: "Identifier is required" });
        }
        // Find the user by identifier
        const user = await (0, userService_1.findUserByIdentifier)(identifier);
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
        const userLibrary = await (0, user_WithLibrarianService_1.findUserLibrary)(user.user_id, librarianLibraryName);
        if (!userLibrary) {
            return res.status(400).json({
                success: false,
                msg: "User is not associated with this library",
            });
        }
        // Toggle the user's active status in the User_Libraries table
        const isActive = !userLibrary.is_active;
        await (0, user_WithLibrarianService_1.updateUserLibraryActiveStatus)(user.user_id, librarianLibraryName, isActive);
        return res.status(200).json({ success: true, isActive, id: user.user_id });
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
exports.toggleUserActiveByLibrarian = toggleUserActiveByLibrarian;
const getAllUsersByLibrarian = async (req, res) => {
    try {
        const { page } = req.query;
        const librarianID = req.cookies["userId"] || req.headers["id"];
        const user = await (0, userService_1.findUserById)(parseInt(librarianID));
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
        const users = await (0, userService_1.getAllUsersForLibrarian)(String(user.library_name), page);
        if (!users || users.length === 0) {
            return res.status(404).json({
                success: true,
                msg: "No more data💔💔(❁´◡`❁)",
                page: parseInt(page)
            });
        }
        if (users) {
            res.status(200).json({ success: true, data: users, page: parseInt(page) });
        }
        else {
            res.status(401).json({ success: false, msg: "No user found" });
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
exports.getAllUsersByLibrarian = getAllUsersByLibrarian;
//# sourceMappingURL=librarian.controller.js.map