import { redirect } from 'next/navigation';

export default function BillRedirect({
  params,
}: {
  params: { params: string[] };
}) {
  // Redirect old /bill/* routes to /federal/bill/*
  const newPath = `/federal/bill/${params.params.join('/')}`;
  redirect(newPath);
}