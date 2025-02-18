import { Prisma, PrismaClient } from "@prisma/client";
import { User, UserFilters } from "../../interface/models.interface";
import bcrypt from "bcryptjs";
import * as crypto from "crypto";
const prisma = new PrismaClient();

export async function createUser(userData: User ) {
    try {
        const newUser = await prisma.users.create({ data: userData });
        return newUser;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error creating user: ${error.message}`);
        } else {
            throw new Error(`Error creating user: Unknown error occurred`);
        }
    }
}

export async function findUserByEmail(email: string) {
    try {
        const user = await prisma.users.findUnique({ where: { email } });
        return user;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error finding email passwords: ${error.message}`);
        } else {
            throw new Error(`Error finding email: Unknown error occurred`);
        }
    }
}
export async function findUserByUsername(username: string) {
    try {
        const user = await prisma.users.findUnique({ where: { username :username} });
        return user;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error finding user with username: ${error.message}`);
        } else {
            throw new Error(`Error finding user with username: Unknown error occurred`);
        }
    }
}

// compare password
export async function comparePasswords(
    password: string,
    hashedPassword: string,
) {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error comparing passwords: ${error.message}`);
        } else {
            throw new Error(
                `Error comparing passwords: Unknown error occurred`,
            );
        }
    }
}

export async function findUserById(userId: number) {
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
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error finding user by ID: ${error.message}`);
        } else {
            throw new Error(`Error finding user by ID: Unknown error occurred`);
        }
    }
}

export async function updateUserVerificationCode(
    email: string,
    verificationCode: string,
) {
    try {
        const verifiyCode_ExpirationTime = Date.now() + 300000; // 5 minutes from now

        await prisma.users.update({
            where: { email },
            data: {
                verificationCode: verificationCode,
                verificationCode_expiration:
                    verifiyCode_ExpirationTime.toString(),
            },
        });
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(
                `Error updating user verification code: ${error.message}`,
            );
        } else {
            throw new Error(
                `Error updating user verification code: Unknown error occurred`,
            );
        }
    }
}

// Function to find user by verification code
export async function findUserByVerificationCode(
    user_id: number,
    verificationCode: string,
) {
    return await prisma.users.findFirst({
        where: {
            verificationCode: verificationCode,
            user_id: user_id,
        },
    });
}
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
export async function updateUserVerificationStatus(userId: number) {
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
export async function updateUserResetToken(
    email: string,
    resetToken: string,
    expirationTime: string,
) {
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

// Function to update user's password
export async function updateUserPassword(userId: number, newPassword: string) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

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

// get first 10 users each request
export async function getAllUsers(options?: any) {
    try {
        
        let  page  = options;
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
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error fetching all users: ${error.message}`);
        } else {
            throw new Error(`Error fetching all users: Unknown error occurred`);
        }
    }
}

export async function getAllUsersForLibrarian(librarianName: string,options?: any) {
    try {
        let  page  = options || 1;
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
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error fetching all users: ${error.message}`);
        } else {
            throw new Error(`Error fetching all users: Unknown error occurred`);
        }
    }
}

export async function getUsersByFilters(filters: UserFilters,options?: any) {
    try {
        let  page  = options || 1;
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
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error filtering users: ${error.message}`);
        } else {
            throw new Error(`Error filtering users: Unknown error occurred`);
        }
    }
}

export const deleteUserByIdOrEmailOrUsername = async (
    identifier: string | number,
) => {
    try {
        let user;
        if (typeof identifier === "number") {
            user = await prisma.users.findUnique({
                where: {
                    user_id: identifier,
                },
            });
        } else {
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
        } else {
            return `Failed to delete user with ID ${identifier} it has a related data`;
        }
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error?.code === 'P2003') {
            // Specific error code for foreign key constraint violation
            return `Failed to delete user with ID ${identifier}. It has related data.`;
        } else if (error instanceof Error) {
            throw new Error(`Error deleting user: ${error.message}`);
        } else {
            throw new Error(`Error deleting user: Unknown error occurred`);
        }
    }
};

export const updateUserById = async (
    userId: number,
    updatedUserData: Partial<User>,
) => {
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
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error editing user: ${error.message}`);
        } else {
            throw new Error(`Error editing user: Unknown error occurred`);
        }
    }
};

export async function isUserActive(
    identifier: string | number,
): Promise<boolean> {
    try {
        let user;
        if (typeof identifier === "number") {
            user = await prisma.users.findUnique({
                where: {
                    user_id: identifier,
                },
            });
        } else {
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
    } catch (error) {
        throw new Error(
            `Error checking user activity: ${
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred"
            }`,
        );
    }
}
export const updateUserActive = async (userId: number, isActive: boolean) => {
    try {
        await prisma.users.update({
            where: { user_id: userId },
            data: { is_active: isActive },
        });
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error updating user active: ${error.message}`);
        } else {
            throw new Error(
                `Error updating user active: Unknown error occurred`,
            );
        }
    }
};

export const findUserByIdentifier = async (identifier: string | number) => {
    try {
        let user;
        if (typeof identifier === "number") {
            user = await prisma.users.findUnique({
                where: { user_id: identifier },
            });
        } else {
            user = await prisma.users.findFirst({
                where: {
                    OR: [{ email: identifier }, { username: identifier }],
                },
            });
        }
        return user;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(
                `Error finding user by identifier: ${error.message}`,
            );
        } else {
            throw new Error(
                `Error finding user by identifier: Unknown error occurred`,
            );
        }
    }
};

export async function getAllLibrariesWithLibrarians() {
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
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(
                `Error fetching libraries with librarians: ${error.message}`,
            );
        } else {
            throw new Error(
                `Error fetching libraries with librarians: Unknown error occurred`,
            );
        }
    }
}
export async function getUsersByLibrary(libraryName: string) {
    try {
        const users = await prisma.users.findMany({
            where: {
                library_name: libraryName,
            },
        });
        return users;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(
                `Error fetching users with library name ${libraryName}: ${error.message}`,
            );
        } else {
            throw new Error(
                `Error fetching users with library name ${libraryName}: Unknown error occurred`,
            );
        }
    }
}
