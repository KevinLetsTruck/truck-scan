export function money(n: number) {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export function cents(n: number) {
  return `${(n * 100).toFixed(1)}¢`;
}

export function mpg(n: number) {
  return n.toFixed(1);
}

export function whole(n: number) {
  return Math.round(n).toLocaleString("en-US");
}
