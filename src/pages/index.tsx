import type { NextPage } from 'next'
import Link from 'next/link';
import Header from '../components/Header'
// import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  return (
    <div>
      <Header/>
      <ul>
        <li>Ethereum</li>
        <Link href="/fantom">Fantom</Link>
        <li>...</li>
      </ul>
    </div>
  )
}

export default Home
