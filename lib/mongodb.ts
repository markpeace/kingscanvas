import { getClient } from "./db/mongo";

const clientPromise = getClient();

export default clientPromise;
