import { BigNumber } from "@ethersproject/bignumber";
import { ethers } from "ethers";



export const bnToUnit = (bn: BigNumber, decimals: number): number => {
    return parseFloat(ethers.utils.formatUnits(bn, decimals));
};

export const bnToEther = (bn: BigNumber): number => {
    return parseFloat(ethers.utils.formatEther(bn));
};