import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import { Provider as MulticallProvider, setMulticallAddress } from "ethers-multicall";
import { useEffect, useState } from "react";
import { createContainer } from "unstated-next";
import { InjectedConnector } from "@web3-react/injected-connector";



type Network = ethers.providers.Network;

const injected = new InjectedConnector({
    supportedChainIds: [1, 250],
  });

export const Chains: Record<number, string> = {
    1: "ethereum",
    250: "fantom",
}

const useConnection = () => {
    const { account, library, chainId, activate, deactivate } = useWeb3React();

    const [ multicallProvider, setMulticallProvider ] = useState<MulticallProvider|null>(null);
    const [ network, setNetwork ] = useState<Network|null>(null);

    const connect = async() => {
        try {
            await activate(injected);
        } catch (error) {
            console.log(error);
        }
    }

    const disconnect = () => {
        try {
            deactivate();
        } catch (error) {
            console.log(error);
        }
    }
    
    useEffect(() => {
        if (library) {
            library.getNetwork().then((network: any) => setNetwork(network));

            setMulticallAddress(250, "0x0118EF741097D0d3cc88e46233Da1e407d9ac139"); // Fantom

            const _multicallProvider = new MulticallProvider(library);
            _multicallProvider
            .init()
            .then(() => setMulticallProvider(_multicallProvider));
        } else {
            setMulticallProvider(null);
        }
    }, [library])

    const chainName = (chainId && Chains[chainId]) || null;
    return {
        multicallProvider,
        provider: library,
        address: account,
        network,
        signer: library?.getSigner(),
        chainId,
        chainName,
        connect,
        disconnect,
      };
}

export const Connection = createContainer(useConnection);