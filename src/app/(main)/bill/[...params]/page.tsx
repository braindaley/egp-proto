import { redirect } from 'next/navigation';

export default async function BillRedirect({
  params,
}: {
  params: Promise<{ params: string[] }>;
}) {
  const { params: pathParams } = await params;
  // Redirect old /bill/* routes to /federal/bill/*
  const newPath = `/federal/bill/${pathParams.join('/')}`;
  redirect(newPath);
}