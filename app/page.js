// app/page.js
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../lib/auth';

export default async function Home() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  const redirectUrl = user.role === 'ADMIN' ? '/admin' : 
                     user.role === 'PETUGAS' ? '/petugas' : '/user';
  
  redirect(redirectUrl);
}