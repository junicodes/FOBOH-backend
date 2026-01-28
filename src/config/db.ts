import { config } from "../config/env";
import * as devDb from "./db.dev";
import * as prodDb from "./db.prod";

// Choose implementation based on environment
const impl = config.nodeEnv === "production" ? prodDb : devDb;

export const initDb = impl.initDb;
export const getDb = impl.getDb;
export const closeDb = impl.closeDb;
