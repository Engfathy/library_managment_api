"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsersByLibrary = exports.getAllLibrariesWithLibrarians = exports.findUserByIdentifier = exports.updateUserActive = exports.isUserActive = exports.updateUserById = exports.deleteUserByIdOrEmailOrUsername = exports.getUsersByFilters = exports.getAllUsersForLibrarian = exports.getAllUsers = exports.updateUserPassword = exports.updateUserResetToken = exports.updateUserVerificationStatus = exports.findUserByVerificationCode = exports.updateUserVerificationCode = exports.findUserById = exports.comparePasswords = exports.findUserByUsername = exports.findUserByEmail = exports.createUser = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function createUser(userData) {
    try {
        const newUser = await prisma.users.create({ data: userData });
        return newUser;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error creating user: ${error.message}`);
        }
        else {
            throw new Error(`Error creating user: Unknown error occurred`);
        }
    }
}
exports.createUser = createUser;
async function findUserByEmail(email) {
    try {
        const user = await prisma.users.findUnique({ where: { email } });
        return user;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error finding email passwords: ${error.message}`);
        }
        else {
            throw new Error(`Error finding email: Unknown error occurred`);
        }
    }
}
exports.findUserByEmail = findUserByEmail;
async function findUserByUsername(username) {
    try {
        const user = await prisma.users.findUnique({ where: { username: username } });
        return user;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error finding user with username: ${error.message}`);
        }
        else {
            throw new Error(`Error finding user with username: Unknown error occurred`);
        }
    }
}
exports.findUserByUsername = findUserByUsername;
// compare password
async function comparePasswords(password, hashedPassword) {
    try {
        return await bcryptjs_1.default.compare(password, hashedPassword);
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error comparing passwords: ${error.message}`);
        }
        else {
            throw new Error(`Error comparing passwords: Unknown error occurred`);
        }
    }
}
exports.comparePasswords = comparePasswords;
async function findUserById(userId) {
    try {
        const user = await prisma.users.findUnique({
            where: { user_id: userId },
            select: {
                user_id: true,
                username: true,
                email: true,
                role: true,
                account_type: true,
                verificationCode: false,
                verificationCode_expiration: false,
                verified: true,
                avatar: true,
                reset_token: false,
                reset_token_expiration: false,
                library_name: true,
                is_active: true,
            },
        });
        return user;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error finding user by ID: ${error.message}`);
        }
        else {
            throw new Error(`Error finding user by ID: Unknown error occurred`);
        }
    }
}
exports.findUserById = findUserById;
async function updateUserVerificationCode(email, verificationCode) {
    try {
        const verifiyCode_ExpirationTime = Date.now() + 300000; // 5 minutes from now
        await prisma.users.update({
            where: { email },
            data: {
                verificationCode: verificationCode,
                verificationCode_expiration: verifiyCode_ExpirationTime.toString(),
            },
        });
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error updating user verification code: ${error.message}`);
        }
        else {
            throw new Error(`Error updating user verification code: Unknown error occurred`);
        }
    }
}
exports.updateUserVerificationCode = updateUserVerificationCode;
// Function to find user by verification code
async function findUserByVerificationCode(user_id, verificationCode) {
    return await prisma.users.findFirst({
        where: {
            verificationCode: verificationCode,
            user_id: user_id,
        },
    });
}
exports.findUserByVerificationCode = findUserByVerificationCode;
// Function to find user by verification code
// export async function findUserByResetToken(
//     user_id: number,
//     reset_token: string,
// ) {
//     return await prisma.users.findFirst({
//         where: {
//             reset_token: reset_token,
//             user_id: user_id,
//         },
//     });
// }
// Function to update user's verification status
async function updateUserVerificationStatus(userId) {
    await prisma.users.update({
        where: {
            user_id: userId,
        },
        data: {
            verificationCode: "",
            verified: true,
            verificationCode_expiration: null,
        },
    });
}
exports.updateUserVerificationStatus = updateUserVerificationStatus;
async function updateUserResetToken(email, resetToken, expirationTime) {
    await prisma.users.update({
        where: {
            email: email,
        },
        data: {
            reset_token: resetToken,
            reset_token_expiration: expirationTime,
        },
    });
}
exports.updateUserResetToken = updateUserResetToken;
// Function to update user's password
async function updateUserPassword(userId, newPassword) {
    const saltRounds = 10;
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, saltRounds);
    await prisma.users.update({
        where: {
            user_id: userId,
        },
        data: {
            reset_token: "",
            reset_token_expiration: null,
            password: hashedPassword,
        },
    });
}
exports.updateUserPassword = updateUserPassword;
// get first 10 users each request
async function getAllUsers(options) {
    try {
        let page = options;
        const take = 10;
        let skip = (page - 1) * take;
        const users = await prisma.users.findMany({
            skip: skip,
            take: take,
        });
        if (users.length === 0) {
            return [];
        }
        return users;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error fetching all users: ${error.message}`);
        }
        else {
            throw new Error(`Error fetching all users: Unknown error occurred`);
        }
    }
}
exports.getAllUsers = getAllUsers;
async function getAllUsersForLibrarian(librarianName, options) {
    try {
        let page = options || 1;
        const take = 10;
        let skip = (page - 1) * take;
        const users = await prisma.users.findMany({
            where: {
                role: 'patron' // Filter users by role "patron"
            },
            skip,
            take,
            select: {
                user_id: true,
                username: true,
                email: true,
                user_libraries: {
                    where: {
                        library_name: librarianName
                    },
                    select: {
                        is_active: true
                    }
                }
            },
        });
        if (users.length === 0) {
            return [];
        }
        return users;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error fetching all users: ${error.message}`);
        }
        else {
            throw new Error(`Error fetching all users: Unknown error occurred`);
        }
    }
}
exports.getAllUsersForLibrarian = getAllUsersForLibrarian;
async function getUsersByFilters(filters, options) {
    try {
        let page = options || 1;
        const take = 10;
        let skip = (page - 1) * take;
        const users = await prisma.users.findMany({
            where: filters,
            skip: skip,
            take: take,
        });
        if (users.length === 0) {
            return [];
        }
        return users;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error filtering users: ${error.message}`);
        }
        else {
            throw new Error(`Error filtering users: Unknown error occurred`);
        }
    }
}
exports.getUsersByFilters = getUsersByFilters;
const deleteUserByIdOrEmailOrUsername = async (identifier) => {
    try {
        let user;
        if (typeof identifier === "number") {
            user = await prisma.users.findUnique({
                where: {
                    user_id: identifier,
                },
            });
        }
        else {
            user = await prisma.users.findFirst({
                where: {
                    OR: [{ email: identifier }, { username: identifier }],
                },
            });
        }
        if (!user) {
            throw new Error("User not found");
        }
        const deleteResult = await prisma.users.delete({
            where: {
                user_id: user.user_id,
            },
        });
        if (deleteResult) {
            return `User with ID ${identifier} deleted successfully`;
        }
        else {
            return `Failed to delete user with ID ${identifier} it has a related data`;
        }
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && (error === null || error === void 0 ? void 0 : error.code) === 'P2003') {
            // Specific error code for foreign key constraint violation
            return `Failed to delete user with ID ${identifier}. It has related data.`;
        }
        else if (error instanceof Error) {
            throw new Error(`Error deleting user: ${error.message}`);
        }
        else {
            throw new Error(`Error deleting user: Unknown error occurred`);
        }
    }
};
exports.deleteUserByIdOrEmailOrUsername = deleteUserByIdOrEmailOrUsername;
const updateUserById = async (userId, updatedUserData) => {
    try {
        // Check if user with given ID exists
        const existingUser = await prisma.users.findUnique({
            where: { user_id: userId },
        });
        if (!existingUser) {
            return null;
        }
        // Update user data
        const updatedUser = await prisma.users.update({
            where: { user_id: userId },
            data: updatedUserData,
        });
        return updatedUser;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error editing user: ${error.message}`);
        }
        else {
            throw new Error(`Error editing user: Unknown error occurred`);
        }
    }
};
exports.updateUserById = updateUserById;
async function isUserActive(identifier) {
    try {
        let user;
        if (typeof identifier === "number") {
            user = await prisma.users.findUnique({
                where: {
                    user_id: identifier,
                },
            });
        }
        else {
            user = await prisma.users.findFirst({
                where: {
                    OR: [{ email: identifier }, { username: identifier }],
                },
            });
        }
        if (user == null) {
            throw new Error("User not found");
        }
        return user.is_active || false;
    }
    catch (error) {
        throw new Error(`Error checking user activity: ${error instanceof Error
            ? error.message
            : "Unknown error occurred"}`);
    }
}
exports.isUserActive = isUserActive;
const updateUserActive = async (userId, isActive) => {
    try {
        await prisma.users.update({
            where: { user_id: userId },
            data: { is_active: isActive },
        });
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error updating user active: ${error.message}`);
        }
        else {
            throw new Error(`Error updating user active: Unknown error occurred`);
        }
    }
};
exports.updateUserActive = updateUserActive;
const findUserByIdentifier = async (identifier) => {
    try {
        let user;
        if (typeof identifier === "number") {
            user = await prisma.users.findUnique({
                where: { user_id: identifier },
            });
        }
        else {
            user = await prisma.users.findFirst({
                where: {
                    OR: [{ email: identifier }, { username: identifier }],
                },
            });
        }
        return user;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error finding user by identifier: ${error.message}`);
        }
        else {
            throw new Error(`Error finding user by identifier: Unknown error occurred`);
        }
    }
};
exports.findUserByIdentifier = findUserByIdentifier;
async function getAllLibrariesWithLibrarians() {
    try {
        const libraries = await prisma.users.findMany({
            where: {
                role: "librarian",
                library_name: {
                    not: null,
                },
            },
            select: {
                library_name: true,
            },
            distinct: ["library_name"],
        });
        return libraries.map((user) => user.library_name);
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error fetching libraries with librarians: ${error.message}`);
        }
        else {
            throw new Error(`Error fetching libraries with librarians: Unknown error occurred`);
        }
    }
}
exports.getAllLibrariesWithLibrarians = getAllLibrariesWithLibrarians;
async function getUsersByLibrary(libraryName) {
    try {
        const users = await prisma.users.findMany({
            where: {
                library_name: libraryName,
            },
        });
        return users;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error fetching users with library name ${libraryName}: ${error.message}`);
        }
        else {
            throw new Error(`Error fetching users with library name ${libraryName}: Unknown error occurred`);
        }
    }
}
exports.getUsersByLibrary = getUsersByLibrary;
//# sourceMappingURL=userService.js.map