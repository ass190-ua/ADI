import { pb } from "../pb.js";

export async function sendContactMessage({ name, email, subject, message }) {
  return pb.collection("contact_messages").create({ name, email, subject, message });
}
