import { ethers } from "ethers";
import {
  Contract as MulticallContract,
  Provider as MulticallProvider,
} from "ethers-multicall";
import { TokenObject } from "../components/Prices";
import erc20Abi from "../contracts/ABIs/erc20.json";
import uniV2PairAbi from "../contracts/ABIs/univ2pair.json";
import { bnToUnit } from "../util/numbers";

enum TokenType {
  uni = "uni",
  erc20 = "erc20",
}

interface Pool {
  lp: Token;
  underlyingTokens?: Token[];
  lpType?: TokenType;
  allocPoint: number;
  stakedAmount?: number;
}

interface Token {
  address: string;
  decimals?: number;
  totalSupply?: number;
  reserve?: number;
  type?: TokenType;
}

export interface MasterChefArgs {
  name: string;
  chefAddress: string;
  rewardTokenAddress: string;
  chefAbi: any,
  rewardRateFunctionString: string;
}

const SECONDS_PER_YEAR = 60 * 60 * 24 * 365;

const setNewType = (tokenAddress: string, type: TokenType) => {
  window.localStorage.setItem(tokenAddress, type.toString());
};

const getTokenTypeFromLocalStorage = (tokenAddress: string) => {
  const storedType = window.localStorage.getItem(tokenAddress);
  if (storedType === null) return storedType;
  return storedType as TokenType;
};

async function getFantomTokenType(
  contract: StakingContract,
  tokenAddress: string
) {
  if (tokenAddress == "0x0000000000000000000000000000000000000000") {
    return TokenType.erc20;
  }
  const type = getTokenTypeFromLocalStorage(tokenAddress);

  if (type != null) return type;

  try {
    const pool = new MulticallContract(tokenAddress, uniV2PairAbi);
    const _token0 = await contract.multicallProvider.all([pool.token0()]);
    setNewType(tokenAddress, TokenType.uni);
    return TokenType.uni;
  } catch (err) {}
  try {
    const erc20 = new MulticallContract(tokenAddress, erc20Abi);
    const _name = await contract.multicallProvider.all([erc20.name()]);
    setNewType(tokenAddress, TokenType.erc20);
    return TokenType.erc20;
  } catch (err) {
    console.log(err);
    console.log(`Couldn't match ${tokenAddress} to any known token type.`);
  }
}

export class StakingContract {
  name: string;
  contractAddr: string;
  contract: ethers.Contract;
  multicallContract: MulticallContract;
  rewardToken!: TokenObject;
  poolLength!: number;
  totalAllocPoints: any;
  rewardTokenPerSecond: any;
  provider: ethers.providers.Provider;
  multicallProvider: MulticallProvider;
  pools?: Pool[];
  rewardRateFunction: string;

  constructor(
    args: MasterChefArgs,
    rewardToken: TokenObject,
    provider: ethers.providers.Provider,
    multicallProvider: MulticallProvider
  ) {
    this.name = args.name;
    this.contractAddr = args.chefAddress;
    this.provider = provider;
    this.multicallProvider = multicallProvider;
    this.contract = new ethers.Contract(args.chefAddress, args.chefAbi, this.provider);
    this.multicallContract = new MulticallContract(args.chefAddress, args.chefAbi);
    this.rewardToken = rewardToken;
    this.rewardRateFunction = args.rewardRateFunctionString;
    // this.fillPropsAsync();
  }

  fillPropsAsync = async () => {
    const rewardTokenPerSecondBN = await this.contract.callStatic[
      this.rewardRateFunction
    ]();
    this.rewardTokenPerSecond = bnToUnit(
      rewardTokenPerSecondBN,
      this.rewardToken.decimals
    );

    [this.poolLength, this.totalAllocPoints] = (
      await this.multicallProvider.all([
        this.multicallContract.poolLength(),
        this.multicallContract.totalAllocPoint(),
      ])
    ).map((x) => bnToUnit(x, 0));

    await this.getPools();
  };

  getPools = async () => {
    const poolIds = Array.from(Array(this.poolLength).keys());
    const poolInfos = await this.multicallProvider.all(
      poolIds.map((id) => this.multicallContract.poolInfo(id))
    );

    // Fetch all pools info
    const pools: Pool[] = poolInfos.map((poolInfo) => {
      return {
        lp: { address: poolInfo.lpToken || poolInfo.token },
        allocPoint: bnToUnit(poolInfo.allocPoint, 0),
      };
    });

    // Get lp tokens types
    await Promise.all(pools.map(async (pool, idx) => {
      const poolType = getFantomTokenType(this, pool.lp.address);
      pools[idx]["lpType"] = await poolType;
    }))

    // Aggregate all pools calls into a single list
    const calls = pools.map((pool, i) => {
        const poolCalls: any[] = [];
        var poolContract: MulticallContract;

        switch (pool.lpType) {
          case TokenType.erc20:
            poolContract = new MulticallContract(pool.lp.address, erc20Abi);
            [
              poolContract.totalSupply(),
              poolContract.decimals(),
              poolContract.balanceOf(this.contractAddr),
            ].forEach((x) => poolCalls.push(x));
            break;

          case 'uni':
            poolContract = new MulticallContract(pool.lp.address, uniV2PairAbi);
            [
              poolContract.token0(),
              poolContract.token1(),
              poolContract.totalSupply(),
              poolContract.decimals(),
              poolContract.balanceOf(this.contractAddr),
            ].forEach((x) => poolCalls.push(x));
            break;

          default:
            break;
        }
        return poolCalls;
      })
      .reduce((a, b) => [...a, ...b], []);

    const callsRes = await this.multicallProvider.all(calls);

    // Extract data from callsRes
    let idx = 0;
    pools.forEach((pool, i) => {
      switch (pool.lpType) {
        case TokenType.erc20:
          pools[i].lp.totalSupply = bnToUnit(callsRes[idx], callsRes[idx + 1]);
          pools[i].lp.decimals = callsRes[idx + 1];
          pools[i].lp.reserve = bnToUnit(callsRes[idx + 2], callsRes[idx + 1]);
          pools[i].stakedAmount = pools[i].lp.reserve;
          pools[i].underlyingTokens = [pools[i].lp];
          idx += 3;
          break;

        case TokenType.uni:
          const token0: Token = { address: callsRes[idx] };
          const token1: Token = { address: callsRes[idx + 1] };
          const totalSupply = bnToUnit(callsRes[idx + 2], callsRes[idx + 3]);
          const stakedAmount = bnToUnit(callsRes[idx + 4], callsRes[idx + 3]);
          pools[i].lp.decimals = callsRes[idx + 3];
          pools[i].lp.totalSupply = totalSupply;
          pools[i].stakedAmount = stakedAmount;
          pools[i].underlyingTokens = [token0, token1];
          idx += 5;
          break;
      }
    });

    // Aggregate uni calls
    const uniCalls = pools
      .map((pool) => {
        const poolCalls: any[] = [];
        switch (pool.lpType) {
          case TokenType.erc20:
            break;

          case TokenType.uni:
            const token0Contract = new MulticallContract(
              pool.underlyingTokens![0].address,
              erc20Abi
            );
            const token1Contract = new MulticallContract(
              pool.underlyingTokens![1].address,
              erc20Abi
            );
            const poolContract = new MulticallContract(
              pool.lp.address,
              uniV2PairAbi
            );
            [
              token0Contract.decimals(),
              token1Contract.decimals(),
              poolContract.getReserves(),
            ].forEach((x) => poolCalls.push(x));
            break;
        }
        return poolCalls;
      })
      .reduce((a, b) => [...a, ...b], []);

    const uniCallsRes = await this.multicallProvider.all(uniCalls);

    // Extract data from uniCallsRes
    idx = 0;
    pools.forEach((pool, i) => {
      switch (pool.lpType) {
        case TokenType.erc20:
          break;

        case TokenType.uni:
          pools[i].underlyingTokens![0].decimals = uniCallsRes[idx];
          pools[i].underlyingTokens![1].decimals = uniCallsRes[idx + 1];
          pools[i].underlyingTokens![0].reserve = bnToUnit(
            uniCallsRes[idx + 2][0],
            uniCallsRes[idx]
          );
          pools[i].underlyingTokens![1].reserve = bnToUnit(
            uniCallsRes[idx + 2][1],
            uniCallsRes[idx + 1]
          );
          idx += 3;
          break;
      }
    });

    this.pools = pools;
  };

  getPoolsAprs = (pairs: { addresses: string[]; prices: number[] }[]) => {
    const aprs: number[] = [];
    pairs.forEach((pair) => {
      let apr = 0;
      this.pools?.forEach((pool) => {
        if (pool.lpType === TokenType.uni) {
          let token0Price: number | null = null;
          let token1Price: number | null = null;
          if (
            pool.underlyingTokens![0].address.toLowerCase() ===
              pair.addresses[0].toLowerCase() &&
            pool.underlyingTokens![1].address.toLowerCase() ===
              pair.addresses[1].toLowerCase()
          ) {
            token0Price = pair.prices[0];
            token1Price = pair.prices[1];
          }
          if (
            pool.underlyingTokens![1].address.toLowerCase() ===
              pair.addresses[0].toLowerCase() &&
            pool.underlyingTokens![0].address.toLowerCase() ===
              pair.addresses[1].toLowerCase()
          ) {
            token0Price = pair.prices[1];
            token1Price = pair.prices[0];
          }
          if (token0Price) {
            const rewardPerYearValue =
              this.rewardTokenPerSecond *
              SECONDS_PER_YEAR *
              this.rewardToken.price! *
              (pool.allocPoint / this.totalAllocPoints);
            const token0ReserveValue =
              pool.underlyingTokens![0].reserve! * token0Price!;
            const token1ReserveValue =
              pool.underlyingTokens![1].reserve! * token1Price!;
            apr =
              (rewardPerYearValue / (token0ReserveValue + token1ReserveValue)) *
              100;
          }
        }
      });
      aprs.push(apr);
    });
    return aprs;
  };
}
