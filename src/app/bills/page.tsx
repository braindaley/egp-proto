import { redirect } from 'next/navigation';

export default function BillsRedirect() {
  // Redirect old /bills route to /federal/bills
  redirect('/federal/bills');
}