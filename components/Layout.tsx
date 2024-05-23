import { ReactNode } from 'react'
import Head from 'next/head'
import Nav from './Nav'

const PUBLIC_SITE_TITLE = process.env.NEXT_PUBLIC_SITE_TITLE
const POWERED_BY_URL = 'https://injective.com/'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-100 text-base-content">
      <Head>
        <title>{PUBLIC_SITE_TITLE}</title>
        <link rel="icon" href="/favicon-32x32.png" />
      </Head>

      <Nav />
      <main className="flex flex-col items-center justify-center w-full flex-1 p-2 md:px-20 text-center">
        {children}
      </main>
      <footer className="flex items-center justify-center w-full h-14 cursor-default">
        Powered by{'  '}
        <a className="pl-1 link link-primary link-hover" href={POWERED_BY_URL}>
          <div>Injective</div>
        </a>
      </footer>
    </div>
  )
}
