// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/utils/cryptography/ECDSA.sol";
import "@openzeppelin/utils/cryptography/EIP712.sol";

// Helper contract to test signature recovery
contract SignatureRecoveryTest is EIP712 {
    using ECDSA for bytes32;
    
    struct CrossChainBalanceSnapshot {
        uint256 balance;
        uint256 nonce;
        uint256 deadline;
        uint256 assets;
        address receiver;
    }
    
    bytes32 public constant SNAPSHOT_TYPEHASH = keccak256(
        "CrossChainBalanceSnapshot(uint256 balance,uint256 nonce,uint256 deadline,uint256 assets,address receiver)"
    );
    
    constructor() EIP712("AaveVault", "1") {}
    
    function recoverSigner(
        CrossChainBalanceSnapshot calldata snapshot,
        bytes calldata signature
    ) public view returns (address) {
        bytes32 structHash = keccak256(
            abi.encode(
                SNAPSHOT_TYPEHASH,
                snapshot.balance,
                snapshot.nonce,
                snapshot.deadline,
                snapshot.assets,
                snapshot.receiver
            )
        );
        
        bytes32 hash = _hashTypedDataV4(structHash);
        
        return hash.recover(signature);
    }
    
    function getHash(
        CrossChainBalanceSnapshot calldata snapshot
    ) public view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                SNAPSHOT_TYPEHASH,
                snapshot.balance,
                snapshot.nonce,
                snapshot.deadline,
                snapshot.assets,
                snapshot.receiver
            )
        );
        
        return _hashTypedDataV4(structHash);
    }
}

