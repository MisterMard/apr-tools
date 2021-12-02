import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { Web3ReactProvider } from '@web3-react/core';
import { ethers } from 'ethers';
import { Connection } from '../containers/Connection';
import { FC } from 'react';
import { Prices } from '../components/Prices';

function getLibrary(provider: ethers.providers.ExternalProvider) {
  return new ethers.providers.Web3Provider(provider);
}

const WithContainers: FC = ({children}) => (
  <Web3ReactProvider getLibrary={getLibrary}>
    <Connection.Provider>
      <Prices.Provider>
      {children}
      </Prices.Provider>
    </Connection.Provider>
  </Web3ReactProvider>

) 
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WithContainers>
      <Component {...pageProps} />
    </WithContainers>
  )
}

export default MyApp
