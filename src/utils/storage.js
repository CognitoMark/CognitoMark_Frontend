export const storage = {
  get(key) {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  },
  set(key, value) {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  },
};
