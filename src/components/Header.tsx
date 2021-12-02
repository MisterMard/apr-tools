import type { NextPage } from 'next'
import { Connection } from '../containers/Connection'

const Header: NextPage = () => {
  const { address, provider, connect, disconnect, chainName } = Connection.useContainer();
  return (
    <div>
      <button onClick={provider? disconnect: connect}> <b>{provider? "Disconnect": "Connect"}</b> </button>
            {provider? <span>Connected to: {address} </span>: <span>Not Connected</span>}
            <p>Network: {chainName} </p>
    </div>
  )
}

export default Header;
