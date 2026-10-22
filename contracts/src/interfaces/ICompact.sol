// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @notice The subset of Uniswap's The Compact (v1) that crows uses.
/// Deployed at 0x00000000000000171ede64904551eeDF3C6C9788 on Ethereum, Base and Unichain.
/// Source: github.com/Uniswap/the-compact @ ac25e50. Struct layouts must match it exactly.

struct Component {
    uint256 claimant; // (lockTag << 160) | recipient. lockTag 0 means "withdraw the underlying token".
    uint256 amount;
}

struct Claim {
    bytes allocatorData;
    bytes sponsorSignature;
    address sponsor;
    uint256 nonce;
    uint256 expires;
    bytes32 witness;
    string witnessTypestring;
    uint256 id;
    uint256 allocatedAmount;
    Component[] claimants;
}

enum ForcedWithdrawalStatus {
    Disabled,
    Pending,
    Enabled
}

interface ICompact {
    function depositERC20AndRegisterFor(
        address recipient,
        address token,
        bytes12 lockTag,
        uint256 amount,
        address arbiter,
        uint256 nonce,
        uint256 expires,
        bytes32 typehash,
        bytes32 witness
    ) external returns (uint256 id, bytes32 claimHash, uint256 registeredAmount);

    function claim(Claim calldata claimPayload) external returns (bytes32 claimHash);

    function __registerAllocator(address allocator, bytes calldata proof) external returns (uint96 allocatorId);

    function getForcedWithdrawalStatus(address account, uint256 id)
        external
        view
        returns (ForcedWithdrawalStatus status, uint256 forcedWithdrawalAvailableAt);

    function isRegistered(address sponsor, bytes32 claimHash, bytes32 typehash) external view returns (bool);

    function balanceOf(address owner, uint256 id) external view returns (uint256);

    function enableForcedWithdrawal(uint256 id) external returns (uint256 withdrawableAt);

    function forcedWithdrawal(uint256 id, address recipient, uint256 amount) external returns (bool);
}

interface IAllocator {
    function attest(address operator, address from, address to, uint256 id, uint256 amount) external returns (bytes4);

    function authorizeClaim(
        bytes32 claimHash,
        address arbiter,
        address sponsor,
        uint256 nonce,
        uint256 expires,
        uint256[2][] calldata idsAndAmounts,
        bytes calldata allocatorData
    ) external returns (bytes4);

    function isClaimAuthorized(
        bytes32 claimHash,
        address arbiter,
        address sponsor,
        uint256 nonce,
        uint256 expires,
        uint256[2][] calldata idsAndAmounts,
        bytes calldata allocatorData
    ) external view returns (bool);
}
