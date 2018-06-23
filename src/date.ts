
export function getDate(date: Date = new Date()): string {
    const f = new Intl.NumberFormat('en-us', { minimumIntegerDigits: 2 });
    const yyyy = date.getFullYear();
    const MM = f.format(date.getMonth() + 1);
    const dd = f.format(date.getDate());
    const hh = f.format(date.getHours());
    const mm = f.format(date.getMinutes());
    const ss = f.format(date.getSeconds());

    return `${yyyy}${MM}${dd}.${hh}${mm}${ss}`;
}
