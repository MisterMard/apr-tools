import { useEffect, useState } from "react";
import { Connection } from "../containers/Connection";
import { Contract as multicallContract } from "ethers-multicall";
import CoinGecko from "coingecko-api";
import { createContainer } from "unstated-next";
import erc20 from "../contracts/ABIs/erc20.json";
import { BigNumber } from "@ethersproject/bignumber";

interface PriceObject {
    name: string;
    id?: string;
    price?: string;
    address?: string;
    ethPair?: string;
    decimals?: number;
}

export interface TokenObject {
  name: string;
  id?: string;
  address: string;
  decimals: number;
  ethPair?: string;
  price?: number;
}

const TOKENS: Record<string, TokenObject[]> = {
  fantom: [
    {
      name: "wftm",
      id: "fantom",
      address: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
      decimals: 18,
    },
    {
      name: "wbtc",
      id: "wrapped-bitcoin",
      address: "0x321162Cd933E2Be498Cd2267a90534A804051b11",
      decimals: 8,
      ethPair: "0x279b2c897737a50405ED2091694F225D83F2D3bA",
    },
    {
      name: "weth",
      id: "ethereum",
      address: "0x74b23882a30290451A17c44f4F05243b6b58C76d",
      decimals: 18,
      ethPair: "0x613BF4E46b4817015c01c6Bb31C7ae9edAadc26e",
    },
    {
      name: "boo",
      id: "spookyswap",
      address: "0x841fad6eae12c286d1fd18d1d525dffa75c7effe",
      decimals: 18,
      ethPair: "0xEc7178F4C41f346b2721907F5cF7628E388A7a58",
    },
    {
      name: "spirit",
      id: "spiritswap",
      address: "0x5Cc61A78F164885776AA610fb0FE1257df78E59B",
      decimals: 18,
      ethPair: "0x30748322B6E34545DBe0788C421886AEB5297789",
    },
    {
      name: "link",
      id: "chainlink",
      address: "0xb3654dc3D10Ea7645f8319668E8F54d2574FBdC8",
      decimals: 18,
      ethPair: "0xd061c6586670792331E14a80f3b3Bb267189C681",
    },
    {
      name: "ice",
      id: "ice-token",
      address: "0xf16e81dce15B08F326220742020379B855B87DF9",
      decimals: 18,
      ethPair: "0x623EE4a7F290d11C11315994dB70FB148b13021d",
    },
    {
      name: "crv",
      id: "curve-dao-token",
      address: "0x1E4F97b9f9F913c46F1632781732927B9019C68b",
      decimals: 18,
    },
    {
      name: "yfi",
      id: "yearn-finance",
      address: "0x29b0Da86e484E1C0029B56e817912d778aC0EC69",
      decimals: 18,
    },
    {
      name: "woofy",
      id: "woofy",
      address: "0xD0660cD418a64a1d44E9214ad8e459324D8157f1",
      decimals: 12,
    },
    {
      name: "aave",
      id: "aave",
      address: "0x6a07A792ab2965C72a5B8088d3a069A7aC3a993B",
      decimals: 18,
    },
    {
      name: "bnb",
      id: "binancecoin",
      address: "0xD67de0e0a0Fd7b15dC8348Bb9BE742F3c5850454",
      decimals: 18,
    },
    {
      name: "snx",
      id: "havven",
      address: "0x56ee926bD8c72B2d5fa1aF4d9E4Cbb515a1E3Adc",
      decimals: 18,
      ethPair: "0x06d173628bE105fE81F1C82c9979bA79eBCAfCB7",
    },
    {
      name: "zoo",
      id: "zoo-coin",
      address: "0x09e145A1D53c0045F41aEEf25D8ff982ae74dD56",
      decimals: 0,
      ethPair: "0xe200510dC1F28b53C1b1f629861ddE4f8B06B373",
    },
    {
      name: "cream",
      id: "cream-2",
      address: "0x657A1861c15A3deD9AF0B6799a195a249ebdCbc6",
      decimals: 18,
      ethPair: "0x040dd0d0f5e2a01fEb0C5457AbB588B23Cf4c43a",
    },
    {
      name: "soul",
      id: "soul-swap",
      address: "0xe2fb177009FF39F52C0134E8007FA0e4BaAcBd07",
      decimals: 18,
      ethPair: "0xa2527Af9DABf3E3B4979d7E0493b5e2C6e63dC57",
    },

    // stables
    {
      name: "usdc",
      id: "usd-coin",
      address: "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75",
      decimals: 6,
      ethPair: "0xe7E90f5a767406efF87Fdad7EB07ef407922EC1D",
    },
    {
      name: "dai",
      id: "dai",
      address: "0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E",
      decimals: 18,
      ethPair: "0xe120ffBDA0d14f3Bb6d6053E90E63c572A66a428",
    },
    {
      name: "fusdt",
      id: "tether",
      address: "0x049d68029688eAbF473097a2fC38ef61633A3C7A",
      decimals: 6,
      ethPair: "0x5965E53aa80a0bcF1CD6dbDd72e6A9b2AA047410",
    },
    {
      name: "busd",
      id: "binance-usd",
      address: "0xc931f61b1534eb21d8c11b24f3f5ab2471d4ab50",
      decimals: 18,
    },
    {
      name: "frax",
      id: "frax",
      address: "0xaf319E5789945197e365E7f7fbFc56B130523B33",
      decimals: 18,
    },
    {
      name: "mim",
      id: "magic-internet-money",
      address: "0x82f0b8b456c1a451378467398982d4834b6829c1",
      decimals: 18,
    },
    {
      name: "morph",
      id: "morpheus-token",
      address: "0x0789fF5bA37f72ABC4D561D00648acaDC897b32d",
      decimals: 18,
    },


    // non coinGecko tokens
    {
      name: "fusd",
      id: undefined,
      address: "0xAd84341756Bf337f5a0164515b1f6F993D194E1f",
      decimals: 18,
      ethPair: "0x34Bf23e2f08BFE00CAE2aDC15D4B47cF8B9ee7BF",
    },
    {
      name: "waka",
      id: undefined,
      address: '0xf61cCdE1D4bB76CeD1dAa9D4c429cCA83022B08B',
      decimals: 18,
      ethPair: '0x696885e9581bd33eE9877Bd8750DdDA65381FF01',
    },
    {
      name: "jump",
      id: undefined,
      address: "0x78DE9326792ce1d6eCA0c978753c6953Cdeedd73",
      decimals: 18,
      ethPair: "0x5448a3B93731e7C1d6e6310Cb614843FbaC21f69",
    },
    {
      name: "wild",
      id: undefined,
      address: "0xAe0C241Ec740309c2cbdc27456eB3C1a2aD74737",
      decimals: 18,
      ethPair: "0x80C70A23AB388c3B8624f8FC9dBfB4ee469A69a1",
    },
    {
      name: "shrap",
      id: undefined,
      address: "0xbf4906762C38F50bC7Be0A11BB452C944f6C72E1",
      decimals: 18,
      ethPair: "0xE69b45BE6260634de4e432F66179ce47EE846800",
    },
    {
      name: "dKnight",
      id: undefined,
      address: "0x6cc0E0AedbbD3C35283e38668D959F6eb3034856",
      decimals: 18,
      ethPair: "0xD519AE779eb7987cdddA63be2CEffE0C35759E04",
    },
    
  ],
};

const usePrices = () => {
  const [tokens, setTokens] = useState<TokenObject[] | null>(null);
  const { chainName, multicallProvider } = Connection.useContainer();

  const getCoinGeckoPrices = async(coinGeckoTokens: PriceObject[]) => {
    const ids = coinGeckoTokens.map( token => token.id! );

    const coinGeckoClient = new CoinGecko();
    
    const { data: response } = await coinGeckoClient.simple.price({
      ids: ids,
      vs_currencies: ["usd"],
    });
    const prices: PriceObject[] = coinGeckoTokens;

    for (let i = 0; i < prices.length; i++) {
        prices[i].price = response[prices[i].id!].usd;        
    }

    return prices;
  };

  const getPricesFromPair = async(pairTokens: PriceObject[]) => {
    const ethContract = new multicallContract(TOKENS[chainName!][0].address, erc20);
    const ethBalancesCalls = pairTokens.map( token => ethContract.balanceOf(token.ethPair) );
    const tokenBalancesCalls = pairTokens.map( token => {
      const contract = new multicallContract(token.address!, erc20);
      return contract.balanceOf(token.ethPair);
    });
    const balances: BigNumber[] = await multicallProvider!.all(
      ethBalancesCalls.concat(tokenBalancesCalls)
    );
    const ethBalances = balances.slice(0, (balances.length/2));
    const tokenBalances = balances.slice(-balances.length/2);
    const ethPriceObject = TOKENS[chainName!][0]
    const prices: PriceObject[] = ethBalances.map( (ethBalance, i) => {
      const eth = parseFloat(ethBalance.toString()) / (10**ethPriceObject.decimals);
      const ethValue = eth * ethPriceObject.price!;
      const token = parseFloat(tokenBalances[i].toString()) / (10**pairTokens[i].decimals!);
      return {
        name: pairTokens[i].name,
        price: (ethValue/token).toString(),
      }
    });
    return prices;
  };

  

  const fillCGPrices = (coinGeckoPrices: PriceObject[]) => {
    for (let i = 0; i < Object.keys(TOKENS).length; i++) {
        const chainName = Object.keys(TOKENS)[i]
        for (let j = 0; j < TOKENS[chainName].length; j++) {
            if (TOKENS[chainName][j].id) {
                TOKENS[chainName][j].price = +coinGeckoPrices.filter( token => token.id === TOKENS[chainName][j].id)[0].price!;
            }
        }
    }
  };

  const fillDexPrices = (dexPrices: PriceObject[]) => {
    for (let i = 0; i < Object.keys(TOKENS).length; i++) {
        const chainName = Object.keys(TOKENS)[i]
        for (let j = 0; j < TOKENS[chainName].length; j++) {
            dexPrices.forEach( token => {
              if (token.name === TOKENS[chainName][j].name) {
                TOKENS[chainName][j].price = +token.price!
              }
            })
        }
    }
  };

  const getPrices = async (chain: string) => {
    if (chainName) {
      let cgTokens = new Array<PriceObject>();
      let pairTokens = new Array<PriceObject>();
      TOKENS[chain].forEach((token) => {
        if (token.id) {
          cgTokens.push({name: token.name, id: token.id});
        } else { pairTokens.push({name: token.name, address: token.address, ethPair: token.ethPair, decimals: token.decimals})}
      });
      const coinGeckoPrices = await getCoinGeckoPrices(cgTokens);
      fillCGPrices(coinGeckoPrices);
      const dexPrices = await getPricesFromPair(pairTokens);
      fillDexPrices(dexPrices);
      setTokens(TOKENS[chain]);
    }
  };

  // TODO: Make-shift solution, should be improved
  const getPriceByAddress = (addr: string) => {
      var price;
      for (let i = 0; i < Object.keys(TOKENS).length; i++) {
          const chainName = Object.keys(TOKENS)[i]
          const { [chainName]: chainTokens } = TOKENS;
          for (let j = 0; j < chainTokens.length; j++) {
              if (chainTokens[j].address.toLowerCase() === addr.toLowerCase()) {
                  price = chainTokens[j].price; // TODO: return?
                  break
              }
          }
      }
      return price;
  }

  const getTokenByAddress = (tokenAddr: string) => {
      for (let i = 0; i < Object.keys(TOKENS).length; i++) {
        const chainName = Object.keys(TOKENS)[i]
        const { [chainName]: chainTokens } = TOKENS;
        for (let j = 0; j < chainTokens.length; j++) {
            if (chainTokens[j].address.toLowerCase() === tokenAddr.toLowerCase()) {
                return chainTokens[j];
            }
        }
    }
    return undefined;
  }

  const getTokenByName = (tokenName: string, chain: string) => {
    let token;
    if (TOKENS[chain]) {
      const found = TOKENS[chain].filter( token => token.name.toLowerCase() === tokenName.toLowerCase() );
      if (found) token = found[0];
    }
    return token;
  }

  useEffect(() => {
    if (chainName && multicallProvider){
      getPrices(chainName);
    // setInterval(() => getPrices(), 120000);
    }
  }, [chainName, multicallProvider]);

  return { tokens, getPriceByAddress, getTokenByAddress, getTokenByName };
}

export const Prices = createContainer(usePrices);
