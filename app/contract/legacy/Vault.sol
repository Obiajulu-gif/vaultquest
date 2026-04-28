// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Vault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    struct VaultInfo {
        string name;
        address token;
        uint256 totalDeposits;
        uint256 creationTime;
        uint256 duration;
        uint256 interestRate; // Interest rate in basis points (e.g., 500 = 5%)
        bool active;
        bool winnerSelected; // Track if winner was picked
        address winner; // Store the winner's address
        address[] depositors;
        mapping(address => uint256) deposits;
    }
    // Track claimable amounts (principal + interest)
    mapping(uint256 => mapping(address => uint256)) public claimableAmounts;

    mapping(uint256 => VaultInfo) vaults;
    uint256 public vaultCount;
    address public adminWallet;

    event VaultCreated(
        uint256 indexed vaultId,
        string name,
        address token,
        uint256 duration,
        uint256 interestRate
    );
    event Deposited(
        uint256 indexed vaultId,
        address indexed depositor,
        uint256 amount
    );
    event Withdrawn(
        uint256 indexed vaultId,
        address indexed depositor,
        uint256 amount
        // uint256 interest
    );
    event WinnerSelected(
        uint256 indexed vaultId,
        address indexed winner,
        uint256 totalInterest
    );
    event VaultDeleted(uint256 indexed vaultId);
    event AdminWalletUpdated(
        address indexed oldAdmin,
        address indexed newAdmin
    );

    modifier onlyAdmin() {
        require(msg.sender == adminWallet, "Caller is not the admin");
        _;
    }

    constructor() Ownable(msg.sender) {
        adminWallet = msg.sender;
    }

    function setAdminWallet(address _adminWallet) external onlyOwner {
        require(_adminWallet != address(0), "Invalid address");
        address oldAdmin = adminWallet;
        adminWallet = _adminWallet;
        emit AdminWalletUpdated(oldAdmin, _adminWallet);
    }

    function createVault(
        string memory _name,
        address _token,
        uint256 _duration,
        uint256 _interestRate
    ) external onlyAdmin {
        require(_interestRate > 0, "Interest rate must be greater than 0");

        uint256 vaultId = vaultCount++;
        VaultInfo storage newVault = vaults[vaultId];
        newVault.name = _name;
        newVault.token = _token;
        newVault.creationTime = block.timestamp;
        newVault.duration = _duration;
        newVault.interestRate = _interestRate;
        newVault.active = true;

        emit VaultCreated(vaultId, _name, _token, _duration, _interestRate);
    }

    function deposit(uint256 _vaultId, uint256 _amount)
        external
        payable
        nonReentrant
    {
        VaultInfo storage vault = vaults[_vaultId];
        require(vault.active, "Vault is not active");

        // Check if vault is still open for deposits
        require(
            block.timestamp < vault.creationTime + vault.duration,
            "Vault deposit period has ended"
        );

        uint256 depositAmount;

        if (vault.token == address(0)) {
            // Native currency (ETH/AVAX)
            require(msg.value > 0, "Cannot deposit 0");
            depositAmount = msg.value;
        } else {
            // ERC20 token
            require(_amount > 0, "Cannot deposit 0");
            require(msg.value == 0, "Don't send ETH for token deposits");
            IERC20(vault.token).transferFrom(
                msg.sender,
                address(this),
                _amount
            );
            depositAmount = _amount;
        }

        if (vault.deposits[msg.sender] == 0) {
            vault.depositors.push(msg.sender);
        }

        vault.deposits[msg.sender] += depositAmount;
        vault.totalDeposits += depositAmount;

        emit Deposited(_vaultId, msg.sender, depositAmount);
    }

    /// @dev Selects a random winner (called automatically in withdraw if needed).
    /// @notice Does NOT transfer funds - users must claim via withdraw().
    function _selectWinner(uint256 _vaultId) internal {
        VaultInfo storage vault = vaults[_vaultId];
        require(!vault.winnerSelected, "Winner already selected");
        require(vault.depositors.length > 0, "No depositors");

        // Pseudo-random winner selection
        uint256 randomSeed = uint256(
            keccak256(
                abi.encodePacked(block.prevrandao, _vaultId, block.timestamp)
            )
        );
        uint256 winnerIndex = randomSeed % vault.depositors.length;
        vault.winner = vault.depositors[winnerIndex];
        vault.winnerSelected = true;

        // Calculate total interest
        uint256 totalInterest = _calculateTotalInterest(_vaultId);

        // Set claimable amounts:
        // - Winner gets principal + totalInterest
        // - Others get only principal
        for (uint256 i = 0; i < vault.depositors.length; i++) {
            address depositor = vault.depositors[i];
            uint256 principal = vault.deposits[depositor];
            if (depositor == vault.winner) {
                claimableAmounts[_vaultId][depositor] =
                    principal +
                    totalInterest;
            } else {
                claimableAmounts[_vaultId][depositor] = principal;
            }
        }

        emit WinnerSelected(_vaultId, vault.winner, totalInterest);
    }

    /// @dev Withdraw/claim funds. Auto-selects winner if duration ended.
    /// @notice Users must call this to receive their funds.
    function withdraw(uint256 _vaultId) external nonReentrant {
        VaultInfo storage vault = vaults[_vaultId];
        require(vault.active, "Vault inactive");
        require(vault.deposits[msg.sender] > 0, "No deposit");

        // Auto-select winner if duration ended and no winner yet
        if (
            block.timestamp >= vault.creationTime + vault.duration &&
            !vault.winnerSelected
        ) {
            _selectWinner(_vaultId);
        }

        // Calculate claimable amount
        uint256 amountToClaim = claimableAmounts[_vaultId][msg.sender];
        if (amountToClaim == 0) {
            // If no claimable amount set (pre-winner-selection), return principal only
            amountToClaim = vault.deposits[msg.sender];
        }

        // Check contract has enough funds
        if (vault.token == address(0)) {
            require(
                address(this).balance >= amountToClaim,
                "Insufficient contract ETH"
            );
        } else {
            require(
                IERC20(vault.token).balanceOf(address(this)) >= amountToClaim,
                "Insufficient contract tokens"
            );
        }

        // Update state
        uint256 principal = vault.deposits[msg.sender];
        vault.deposits[msg.sender] = 0;
        vault.totalDeposits -= principal;
        claimableAmounts[_vaultId][msg.sender] = 0; // Reset claimable amount
        _removeDepositor(_vaultId, msg.sender);

        // Transfer funds
        if (vault.token == address(0)) {
            (bool success, ) = msg.sender.call{value: amountToClaim}("");
            require(success, "Transfer failed");
        } else {
            IERC20(vault.token).safeTransfer(msg.sender, amountToClaim);
        }

        emit Withdrawn(_vaultId, msg.sender, amountToClaim);
    }

    /// @dev Calculates total interest across all depositors.
    function _calculateTotalInterest(uint256 _vaultId)
        internal
        view
        returns (uint256)
    {
        VaultInfo storage vault = vaults[_vaultId];
        uint256 totalInterest;
        for (uint256 i = 0; i < vault.depositors.length; i++) {
            address depositor = vault.depositors[i];
            totalInterest +=
                (vault.deposits[depositor] *
                    vault.interestRate *
                    vault.duration) /
                (10000 * 365 days);
        }
        return totalInterest;
    }

    function deleteVault(uint256 _vaultId) external onlyAdmin {
        VaultInfo storage vault = vaults[_vaultId];
        require(vault.active, "Vault is not active");

        vault.active = false;

        // Return funds to all depositors
        for (uint256 i = 0; i < vault.depositors.length; i++) {
            address depositor = vault.depositors[i];
            uint256 amount = vault.deposits[depositor];

            if (amount > 0) {
                vault.deposits[depositor] = 0;

                uint256 interest = 0;
                // Add interest only if vault duration has passed
                if (block.timestamp >= vault.creationTime + vault.duration) {
                    interest =
                        (amount * vault.interestRate * vault.duration) /
                        (10000 * 365 days);
                }

                uint256 totalAmount = amount + interest;

                // Transfer funds based on vault token type
                if (vault.token == address(0)) {
                    // Native currency (ETH/AVAX)
                    (bool success, ) = depositor.call{value: totalAmount}("");
                    require(success, "Transfer failed");
                } else {
                    // ERC20 token
                    IERC20(vault.token).transfer(depositor, totalAmount);
                }
            }
        }

        emit VaultDeleted(_vaultId);
    }

    function _removeDepositor(uint256 _vaultId, address _depositor) private {
        VaultInfo storage vault = vaults[_vaultId];
        for (uint256 i = 0; i < vault.depositors.length; i++) {
            if (vault.depositors[i] == _depositor) {
                // Replace with the last element and then pop
                vault.depositors[i] = vault.depositors[
                    vault.depositors.length - 1
                ];
                vault.depositors.pop();
                break;
            }
        }
    }

    function getVaultInfo(uint256 _vaultId)
        external
        view
        returns (
            string memory name,
            address token,
            uint256 totalDeposits,
            uint256 creationTime,
            uint256 duration,
            uint256 interestRate,
            bool active,
            uint256 timeLeft,
            uint256 depositorCount
        )
    {
        VaultInfo storage vault = vaults[_vaultId];

        uint256 endTime = vault.creationTime + vault.duration;
        uint256 currentTime = block.timestamp;
        uint256 _timeLeft = currentTime >= endTime ? 0 : endTime - currentTime;

        return (
            vault.name,
            vault.token,
            vault.totalDeposits,
            vault.creationTime,
            vault.duration,
            vault.interestRate,
            vault.active,
            _timeLeft,
            vault.depositors.length
        );
    }

    function getDepositorBalance(uint256 _vaultId, address _depositor)
        external
        view
        returns (uint256 principal, uint256 currentInterest)
    {
        VaultInfo storage vault = vaults[_vaultId];
        principal = vault.deposits[_depositor];

        // Calculate current accrued interest (only if lock period has passed)
        if (
            principal > 0 &&
            block.timestamp >= vault.creationTime + vault.duration
        ) {
            currentInterest =
                (principal * vault.interestRate * vault.duration) /
                (10000 * 365 days);
        } else {
            currentInterest = 0; // No interest before lock period expires
        }

        return (principal, currentInterest);
    }

    function getVaultDepositors(uint256 _vaultId)
        external
        view
        returns (address[] memory)
    {
        return vaults[_vaultId].depositors;
    }

    function isDepositor(uint256 _vaultId, address _depositor)
        external
        view
        returns (bool)
    {
        VaultInfo storage vault = vaults[_vaultId];
        return vault.deposits[_depositor] > 0;
    }

   /// @notice Returns winner info including claimable amount
/// @param _vaultId ID of the vault
/// @return winner Address of the winner
/// @return totalInterest Total interest won
function getWinnerInfo(uint256 _vaultId)
    external
    view
    returns (address winner, uint256 totalInterest)
{
    VaultInfo storage vault = vaults[_vaultId];
    require(vault.active, "Vault is not active");
    require(vault.winnerSelected, "No winner selected yet");

    return (vault.winner, _calculateTotalInterest(_vaultId));
}
    /// @notice Checks if a vault has a winner selected
/// @param _vaultId ID of the vault
/// @return bool True if winner is selected
function hasWinner(uint256 _vaultId) external view returns (bool) {
    return vaults[_vaultId].winnerSelected;
}

    // Function to fund the contract to pay interest (for native currency)
    function fundContract() external payable onlyAdmin {
        // Just receives ETH/AVAX to pay interest
    }

    // Function to fund the contract with ERC20 tokens
    function fundContractToken(address _token, uint256 _amount)
        external
        onlyAdmin
    {
        require(_token != address(0), "Invalid token address");
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
    }

    receive() external payable {
        revert("Direct deposits not allowed, use deposit function");
    }
}
