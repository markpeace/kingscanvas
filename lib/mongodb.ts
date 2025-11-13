import { getClient } from "./db/mongo";
import { ensureOpportunityIndexes, ensureStepIndexes } from "./dbHelpers";

const clientPromise = getClient();

Promise.all([ensureStepIndexes(), ensureOpportunityIndexes()]).catch(console.error);

export default clientPromise;
