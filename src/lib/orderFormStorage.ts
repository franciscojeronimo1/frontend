const LAST_CATEGORY_KEY = "pizzaria_lastCategoryId";
const LAST_PAYMENT_KEY = "pizzaria_lastPaymentMethod";
const SETUP_DISMISSED_KEY = "pizzaria_setup_dismissed";

export function getLastCategoryId(): string {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(LAST_CATEGORY_KEY) || "";
}

export function setLastCategoryId(categoryId: string) {
    if (typeof window === "undefined" || !categoryId) return;
    localStorage.setItem(LAST_CATEGORY_KEY, categoryId);
}

export function getLastPaymentMethod(): string {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(LAST_PAYMENT_KEY) || "";
}

export function setLastPaymentMethod(method: string) {
    if (typeof window === "undefined" || !method) return;
    localStorage.setItem(LAST_PAYMENT_KEY, method);
}

export function isSetupDismissed(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SETUP_DISMISSED_KEY) === "true";
}

export function dismissSetupChecklist() {
    if (typeof window === "undefined") return;
    localStorage.setItem(SETUP_DISMISSED_KEY, "true");
}
