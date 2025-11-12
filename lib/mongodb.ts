import { getClient } from "./db/mongo";
import { ensureStepIndexes } from "./dbHelpers";

const clientPromise = getClient();

ensureStepIndexes().catch(console.error);

export default clientPromise;
