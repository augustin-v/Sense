// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {DreamNFT} from "../src/DreamNFT.sol";

contract DreamNFTTest is Test {
    DreamNFT public nft;
    
    uint256 ownerPrivateKey = 0x1; 
    uint256 userPrivateKey = 0x2; 
    
    // Derive addresses from these keys
    address owner;
    address user;
    
    function setUp() public {
        // Set up addresses from private keys
        owner = vm.addr(ownerPrivateKey);
        user = vm.addr(userPrivateKey);
        
        // Deploy contract with owner
        vm.startPrank(owner);
        nft = new DreamNFT("https://test-uri.com/");
        vm.stopPrank();
    }
    
    function testMintDream() public {
        // Only owner can mint directly
        vm.startPrank(owner);
        
        string memory tokenURI = "ipfs://Qm123456789";
        uint256 tokenId = nft.mintDream(user, tokenURI);
        
        // Verify token ownership and metadata
        assertEq(nft.ownerOf(tokenId), user);
        assertEq(nft.tokenURI(tokenId), tokenURI);
        
        vm.stopPrank();
    }
    
    function testMintWithSignature() public {
        string memory tokenURI = "ipfs://Qm987654321";
        
        // Create message hash from user address and tokenURI
        bytes32 messageHash = keccak256(abi.encodePacked(user, tokenURI));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        
        // Owner signs the message with the ACTUAL owner private key
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // User mints with signature
        vm.startPrank(user);
        uint256 tokenId = nft.mintWithSignature(tokenURI, signature);
        
        // Verify token ownership and metadata
        assertEq(nft.ownerOf(tokenId), user);
        assertEq(nft.tokenURI(tokenId), tokenURI);
        
        vm.stopPrank();
    }
}
