export const getUserGuid = (): string | null => {
    const raw = localStorage.getItem(
        "sb-umabghwiudwsmbcxmdlt-auth-token"
    );

    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        return parsed?.user?.id ?? null;
    } catch (err) {
        console.error("Failed to parse auth token", err);
        return null;
    }
};