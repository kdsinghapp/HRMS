// Loads environment variables from .env as early as possible.
// This file must have no other imports and must be the first thing
// server.js imports — see the comment there for why.
import dotenv from "dotenv";

dotenv.config();
