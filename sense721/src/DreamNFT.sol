// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DreamNFT is ERC721URIStorage, Ownable {
    // Event emitted when a new NFT is minted
    event DreamNFTMinted(uint256 indexed tokenId, address indexed owner, string tokenURI);
    
    // Token counter
    uint256 private _nextTokenId;
    
    // Base URI for metadata
    string private _baseTokenURI;
    
    constructor(string memory baseTokenURI) ERC721("AI Dreamcatcher", "DREAM") Ownable(msg.sender) {
        _baseTokenURI = baseTokenURI;
    }
    
    /**
     * @dev Mints a new NFT representing an AI dream
     * @param recipient The address that will own the minted NFT
     * @param tokenURI The token URI for the new NFT
     * @return tokenId The ID of the newly minted NFT
     */
    function mintDream(address recipient, string memory tokenURI) 
        public onlyOwner
        returns (uint256) 
    {
        uint256 tokenId = _nextTokenId++;
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        emit DreamNFTMinted(tokenId, recipient, tokenURI);
        
        return tokenId;
    }
    
    /**
     * @dev Allows users to mint their own dreams when they provide a valid signature from the owner
     * @param tokenURI The token URI for the NFT
     * @param signature The signature from the contract owner authorizing this mint
     */
    function mintWithSignature(string memory tokenURI, bytes memory signature) 
        public
        returns (uint256) 
    {
        // Message to sign: keccak256(abi.encodePacked(msg.sender, tokenURI))
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, tokenURI));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        
        // Verify signature
        address signer = recoverSigner(ethSignedMessageHash, signature);
        require(signer == owner(), "Invalid signature");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        emit DreamNFTMinted(tokenId, msg.sender, tokenURI);
        
        return tokenId;
    }
    
    /**
     * @dev Utility function to recover the signer from a signature
     */
    function recoverSigner(bytes32 messageHash, bytes memory signature) 
        internal pure 
        returns (address) 
    {
        require(signature.length == 65, "Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        // v needs to be adjusted
        if (v < 27) {
            v += 27;
        }
        
        require(v == 27 || v == 28, "Invalid signature 'v' value");
        
        // Recover the signer
        return ecrecover(messageHash, v, r, s);
    }
    
    /**
     * @dev Update the base URI
     */
    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }
}
