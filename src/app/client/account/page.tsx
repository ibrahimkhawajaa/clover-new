import { redirect } from "next/navigation";

/** Legacy path — profile lives at /client/profile */
export default function ClientAccountRedirect() {
  redirect("/client/profile");
}
