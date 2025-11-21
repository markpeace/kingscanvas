export const serverDebug = {
  push(entry: any) {
    try {
      console.log("[server-debug]", JSON.stringify(entry));
    } catch {
      console.log("[server-debug]", entry);
    }
  }
};
