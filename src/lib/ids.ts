import { customAlphabet } from "nanoid";

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 21);

export function newId(prefix?: string): string {
  return prefix ? `${prefix}_${nanoid()}` : nanoid();
}

const ticketSeq = customAlphabet("0123456789", 6);

export function newTicketNumber(): string {
  const year = new Date().getUTCFullYear();
  return `CLV-${year}-${ticketSeq()}`;
}
