// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {DreamNFT} from "../src/DreamNFT.sol";

contract DeployDreamcatcher is Script {
    function run() public returns (DreamNFT) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        string memory baseURI = vm.envString("BASE_URI");
        
        vm.startBroadcast(deployerPrivateKey);
        
        DreamNFT nft = new DreamNFT(baseURI);
        
        vm.stopBroadcast();
        
        return nft;
    }
}
