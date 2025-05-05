import Head from 'next/head';

export default function Layout({ children, title }) {
  return (
    <>
      <Head>
        <title>{title || 'My App'}</title>
      </Head>
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
    </>
  );
}