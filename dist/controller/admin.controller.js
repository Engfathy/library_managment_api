"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsersWithLibraryName = exports.checkUserIsActiveByAdmin = exports.editUserByAdmin = exports.deleteUserByIdentifier = exports.getAllUsersByAdmin = exports.filterUsers = exports.addUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const gravatar_1 = __importDefault(require("gravatar"));
const crypto = __importStar(require("crypto"));
const userService_1 = require("../prisma/services/userService");
const addUser = async (req, res) => {
    try {
        const userData = req.body;
        const userId = req.cookies["userId"] || req.headers["id"];
        const verificationCode = crypto.randomInt(10000, 99999).toString();
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashPass = await bcryptjs_1.default.hash(userData.password, salt);
        // Find user by ID
        const user = await (0, userService_1.findUserById)(parseInt(userId));
        if (!user) {
            return res.status(401).json({ success: false, msg: "who are you" });
        }
        if (user.role !== "administrator") {
            return res
                .status(401)
                .json({ success: false, msg: "You have no permission 🤬😡" });
        }
        const avatar = gravatar_1.default.url(userData.email, {
            s: "300",
            r: "pg",
            d: "mm",
        });
        const existingUserName = await (0, userService_1.findUserByUsername)(userData.username);
        const existingUseremail = await (0, userService_1.findUserByEmail)(userData.email);
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
        if (userData.role !== "librarian" ||
            userData.account_type !== "librarian") {
            userData.library_name == null;
        }
        const newUser = await (0, userService_1.createUser)({
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
        }
        else {
            const users = await (0, userService_1.getAllUsers)(1);
            return res.status(200).json({
                success: true,
                msg: "User added success",
                data: users,
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
exports.addUser = addUser;
const filterUsers = async (req, res) => {
    try {
        const { page } = req.query;
        const filters = {};
        const adminId = req.cookies["userId"] || req.headers["id"];
        const user = await (0, userService_1.findUserById)(parseInt(adminId));
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
        const { email, username, user_id, library_name, role, account_type, verified, is_active, } = req.query;
        // Apply filters based on query parameters
        if (role)
            filters.role = role;
        if (library_name && typeof library_name === 'string')
            filters.library_name = library_name;
        if (account_type)
            filters.account_type = account_type;
        if (verified) {
            let boolValue = verified === "true";
            filters.verified = boolValue;
        }
        if (is_active) {
            let boolValue = is_active === "true";
            filters.is_active = boolValue;
        }
        if (email)
            filters.email = email.toString();
        if (username)
            filters.username = username.toString();
        if (user_id)
            filters.user_id = Number(user_id);
        console.log(filters.is_active);
        console.log(filters);
        const users = await (0, userService_1.getUsersByFilters)(filters, page);
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
exports.filterUsers = filterUsers;
// get all users
const getAllUsersByAdmin = async (req, res) => {
    try {
        const { page } = req.query;
        const adminId = req.cookies["userId"] || req.headers["id"];
        const user = await (0, userService_1.findUserById)(parseInt(adminId));
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
        const users = await (0, userService_1.getAllUsers)(page);
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
exports.getAllUsersByAdmin = getAllUsersByAdmin;
const deleteUserByIdentifier = async (req, res) => {
    const { identifier } = req.body;
    const adminId = req.cookies["userId"] || req.headers["id"];
    const user = await (0, userService_1.findUserById)(parseInt(adminId));
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
        const message = await (0, userService_1.deleteUserByIdOrEmailOrUsername)(identifier);
        return res
            .status(200)
            .json({ success: true, msg: message });
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
exports.deleteUserByIdentifier = deleteUserByIdentifier;
const editUserByAdmin = async (req, res) => {
    try {
        const { userId, updatedUserData } = req.body; // Assuming you receive userId and updatedUserData in the request body
        const adminId = req.cookies["userId"] || req.headers["id"];
        console.log(userId, updatedUserData);
        // Find admin user by ID
        const adminUser = await (0, userService_1.findUserById)(parseInt(adminId));
        if (!adminUser || adminUser.role !== "administrator") {
            return res.status(401).json({
                success: false,
                msg: "You don't have permission to perform this action.",
            });
        }
        // Update user data
        const updatedUser = await (0, userService_1.updateUserById)(parseInt(userId), updatedUserData);
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            msg: error instanceof Error
                ? error.message
                : "Unknown error occurred.",
        });
    }
};
exports.editUserByAdmin = editUserByAdmin;
const checkUserIsActiveByAdmin = async (req, res) => {
    const { identifier } = req.body;
    const adminId = req.cookies["userId"] || req.headers["id"];
    const user = await (0, userService_1.findUserById)(parseInt(adminId));
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
        const isActive = await (0, userService_1.isUserActive)(identifier);
        return res.status(200).json({ success: true, msg: isActive });
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
exports.checkUserIsActiveByAdmin = checkUserIsActiveByAdmin;
// get librarian user by library name
const getUsersWithLibraryName = async (req, res) => {
    try {
        const { libraryName } = req.body;
        const adminId = req.cookies["userId"] || req.headers["id"];
        const user = await (0, userService_1.findUserById)(parseInt(adminId));
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
        const users = await (0, userService_1.getUsersByLibrary)(libraryName);
        return res.status(200).json({ success: true, data: users });
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
exports.getUsersWithLibraryName = getUsersWithLibraryName;
//# sourceMappingURL=admin.controller.js.map