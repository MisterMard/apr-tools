import { NextPage } from "next";
import {
  MasterChefArgs,
  StakingContract,
} from "../../containers/StakingContract";
import Header from "../../components/Header";
import { useEffect, useState } from "react";
import { Connection } from "../../containers/Connection";
import spookyMCAbi from "../../contracts/ABIs/spookyMasterChef.json";
import spiritMCAbi from "../../contracts/ABIs/spiritMasterChef.json";
import wakaMCAbi from "../../contracts/ABIs/wakaMasterChef.json";
import hyperMCAbi from "../../contracts/ABIs/hyperjumpMasterChef.json";
import zooMCAbi from "../../contracts/ABIs/zooMasterChef.json";
import fBombMCAbi from "../../contracts/ABIs/fBombMasterChef.json";
import soulMCAbi from "../../contracts/ABIs/soulMasterChef.json";
import { Prices } from "../../components/Prices";
import React from "react";
import Table from "../../components/Table";
import { CssBaseline } from "@material-ui/core";

const MASTERCHEFS_INFO: MasterChefArgs[] = [
  {
    name: "spooky",
    chefAddress: "0x2b2929E785374c651a81A63878Ab22742656DcDd",
    rewardTokenAddress: "0x841fad6eae12c286d1fd18d1d525dffa75c7effe",
    chefAbi: spookyMCAbi,
    rewardRateFunctionString: "booPerSecond",
  },
  {
    name: "spirit",
    chefAddress: "0x9083EA3756BDE6Ee6f27a6e996806FBD37F6F093",
    rewardTokenAddress: "0x5Cc61A78F164885776AA610fb0FE1257df78E59B",
    chefAbi: spiritMCAbi,
    rewardRateFunctionString: "spiritPerBlock",
  },
  {
    name: "waka",
    chefAddress: "0xaEF349E1736b8A4B1B243A369106293c3a0b9D09",
    rewardTokenAddress: "0xf61cCdE1D4bB76CeD1dAa9D4c429cCA83022B08B",
    chefAbi: wakaMCAbi,
    rewardRateFunctionString: "wakaStartTime",
  },
  {
    name: "hyperjump",
    chefAddress: "0x2E03284727Ff6E50BB00577381059a11e5Bb01dE",
    rewardTokenAddress: "0x78DE9326792ce1d6eCA0c978753c6953Cdeedd73",
    chefAbi: hyperMCAbi,
    rewardRateFunctionString: "emission_per_second",
  },
  {
    name: "zoofarm",
    chefAddress: "0x4135b37B159186455cd691a0421F882F2bD418b9",
    rewardTokenAddress: "0xAe0C241Ec740309c2cbdc27456eB3C1a2aD74737",
    chefAbi: zooMCAbi,
    rewardRateFunctionString: "wildPerBlock",
  },
  {
    name: "fBomb",
    chefAddress: "0x650D853FA19b1A8a3908B85c9b7f9c10F732dFdE",
    rewardTokenAddress: "0xbf4906762C38F50bC7Be0A11BB452C944f6C72E1",
    chefAbi: fBombMCAbi,
    rewardRateFunctionString: "shrapnelPerSecond",
  },
  {
    name: "soulswap",
    chefAddress: "0xce6ccbB1EdAD497B4d53d829DF491aF70065AB5B",
    rewardTokenAddress: "0xe2fb177009FF39F52C0134E8007FA0e4BaAcBd07",
    chefAbi: soulMCAbi,
    rewardRateFunctionString: "soulPerSecond",
  },
];

const pairs = [
  ["wftm", "wbtc"],
  ["wftm", "weth"],
  ["wftm", "link"],
  ["wftm", "crv"],
  ["wftm", "ice"],
  ["wftm", "yfi"],
  // ['wftm', 'woofi'],
  ["wftm", "cream"],
  ["wftm", "aave"],
  ["wftm", "snx"],
  ["wftm", "zoo"],
  ["usdc", "ice"],
  ["weth", "wbtc"],

  ["wftm", "fusd"],
  ["wftm", "usdc"],
  ["wftm", "dai"],
  ["wftm", "fusdt"],
  ["wftm", "mim"],

  ["usdc", "fusd"],
  ["usdc", "dai"],
  ["usdc", "fusdt"],
  ["dai", "fusdt"],
];

interface Aprs {
  pairStrings: string[];
  pairAprs: { protocol: string; aprs: number[] }[];
}

const AprTablePage: NextPage = () => {
  const { provider, multicallProvider, chainId } = Connection.useContainer();
  const { getTokenByAddress, getTokenByName } = Prices.useContainer();
  const [stakingContracts, setStakingContract] = useState<StakingContract[]>(
    []
  );
  const [aprs, setAprs] = useState<Aprs>();

  const setStakingContracts = async () => {
    const newContracts = await Promise.all(
      MASTERCHEFS_INFO.map(async (info) => {
        const stakingContract = new StakingContract(
          info,
          getTokenByAddress(info.rewardTokenAddress)!,
          provider,
          multicallProvider!
        );
        await stakingContract.fillPropsAsync();
        return stakingContract;
      })
    );
    setStakingContract(newContracts);
  };

  const getAprs = () => {
    const addresses = pairs.map((pair) => {
      return [
        getTokenByName(pair[0], "fantom")?.address!,
        getTokenByName(pair[1], "fantom")?.address!,
      ];
    });
    const prices = pairs.map((pair) => {
      return [
        getTokenByName(pair[0], "fantom")?.price!,
        getTokenByName(pair[1], "fantom")?.price!,
      ];
    });
    const pairsList = addresses.map((pairAddresses, idx) => {
      return {
        addresses: pairAddresses,
        prices: prices[idx],
      };
    });
    const pairsString = pairs.map((pair) => `${pair[0]}-${pair[1]}`);
    const pairsAprs = stakingContracts.map((contract) => {
      const aprs = contract.getPoolsAprs(pairsList);
      return {
        protocol: contract.name,
        aprs: aprs,
      };
    });
    setAprs({ pairStrings: pairsString, pairAprs: pairsAprs });
  };

  const getTableData = (aprs: Aprs | undefined) => {
    if (aprs) {
      let headers = [{ Header: "PAIR", accessor: "pair" }];
      aprs.pairAprs.forEach((x) =>
        headers.push({ Header: x.protocol.toUpperCase(), accessor: x.protocol })
      );
      let rows: Record<string, any>[] = [];
      aprs?.pairStrings.forEach((pairString) => {
        rows.push({ pair: pairString });
      });
      aprs.pairAprs.forEach((pairApr, i) => {
        pairApr.aprs.forEach(
          (apr, j) => (rows[j][pairApr.protocol] = `${apr.toFixed(2)}%`)
        );
      });
      return { columns: headers, data: rows };
    } else {
      const loading = "LOADING...";
      const headers = [
        { Header: "Pair", accessor: "pair" },
        { Header: loading, accessor: loading },
      ];
      const rows = [{ pair: loading, [loading]: loading }];
      return { columns: headers, data: rows };
    }
  };

  useEffect(() => {
    if (
      provider &&
      chainId === 250 &&
      multicallProvider &&
      stakingContracts.length === 0
    ) {
      setStakingContracts();
    }
  }, [provider, multicallProvider]);

  useEffect(() => {
    if (stakingContracts.length === MASTERCHEFS_INFO.length) getAprs();
  }, [stakingContracts]);

  const tableData = React.useMemo(() => getTableData(aprs), [aprs]);

  return (
    <div>
      <Header />
      <h1>APR Comparison Table</h1>
      <CssBaseline />
      <Table columns={tableData.columns} data={tableData.data} />
    </div>
  );
};

export default AprTablePage;
