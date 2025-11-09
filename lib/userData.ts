import { getIntentionsCollection, getStepsCollection } from "./dbHelpers";

export async function getUserIntentions(email: string) {
  const col = await getIntentionsCollection();
  return col.findOne({ user: email });
}

export async function saveUserIntentions(email: string, data: any) {
  const col = await getIntentionsCollection();
  await col.updateOne(
    { user: email },
    { $set: { intentions: data.intentions, updatedAt: new Date() } },
    { upsert: true }
  );
}

export async function getUserSteps(email: string) {
  const col = await getStepsCollection();
  return col.find({ user: email }).toArray();
}

export async function saveUserStep(email: string, step: any) {
  const col = await getStepsCollection();
  await col.updateOne(
    { _id: step._id, user: email },
    { $set: { ...step, updatedAt: new Date() } },
    { upsert: true }
  );
}
