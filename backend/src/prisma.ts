import { PrismaClient } from "@prisma/client";

// PrismaClient should be a singleton in production to avoid exhausting DB connections.
const prisma = new PrismaClient();

export default prisma;

