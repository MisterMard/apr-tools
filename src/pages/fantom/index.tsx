import { NextPage } from "next";
import { useRouter } from "next/dist/client/router";
import Header from "../../components/Header";
import Link from 'next/link';

const ChainNames = new Map<string, string>([
  ["ethereum", "Ethereum"],
  ["fantom", "Fantom"],
]);
const ChainPage: NextPage = () => {
  const router = useRouter();
  const chain = router.query.chain as string;
  

  return (
    <div>
      <Header />
      <h1>{ChainNames.get(chain)}</h1>
      <ul>
        <li><Link href="/fantom/apr-table">APR Comparison Table</Link></li>
        <li>...</li>
      </ul>
    </div>
  );
};

export default ChainPage;
