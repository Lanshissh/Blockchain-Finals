// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TaskBit is ERC721, Ownable {
    enum ContributionCategory {
        Paper,
        Seminar,
        Research,
        Competition,
        Extension,
        Other
    }

    enum ContributionStatus {
        Pending,
        Approved,
        Rejected
    }

    struct Contribution {
        uint256 id;
        address student;
        string title;
        ContributionCategory category;
        string description;
        bool completed;
        uint256 createdAt;
        uint256 dueDate;
        bool deleted;
        bool nftMinted;
        ContributionStatus status;
        uint256 pointsAwarded;
        address reviewedBy;
        uint256 reviewedAt;
    }

    mapping(uint256 => Contribution) private contributions;
    mapping(address => uint256[]) private userContributionIds;
    mapping(address => bool) public admins;
    mapping(address => bool) public professors;
    mapping(address => uint256) public reputation;
    mapping(uint256 => uint256) public tokenToContributionId;

    uint256 public nextContributionId;
    uint256 public nextTokenId;

    event AdminUpdated(address indexed account, bool isActive);
    event ProfessorUpdated(address indexed account, bool isActive);

    event ContributionCreated(
        uint256 indexed contributionId,
        address indexed student,
        string title,
        ContributionCategory category,
        string description,
        uint256 createdAt,
        uint256 dueDate
    );

    event ContributionUpdated(
        uint256 indexed contributionId,
        address indexed student,
        bool completed
    );

    event ContributionDeleted(
        uint256 indexed contributionId,
        address indexed student
    );

    event ContributionApproved(
        uint256 indexed contributionId,
        address indexed student,
        address indexed reviewer,
        uint256 pointsAwarded
    );

    event ContributionRejected(
        uint256 indexed contributionId,
        address indexed student,
        address indexed reviewer
    );

    event ContributionNFTMinted(
        address indexed student,
        uint256 indexed contributionId,
        uint256 indexed tokenId
    );

    modifier onlyAdminOrOwner() {
        require(owner() == msg.sender || admins[msg.sender], "NO_ADMIN");
        _;
    }

    modifier onlyReviewer() {
        require(_isReviewer(msg.sender), "NO_REVIEWER");
        _;
    }

    modifier contributionExists(uint256 contributionId) {
        require(contributions[contributionId].student != address(0), "NO_CONTRIB");
        _;
    }

    constructor() ERC721("TaskBit Achievement", "TBA") Ownable(msg.sender) {}

    function setAdmin(address account, bool isActive) external onlyOwner {
        require(account != address(0), "BAD_ADDR");
        admins[account] = isActive;
        emit AdminUpdated(account, isActive);
    }

    function setProfessor(address account, bool isActive) external onlyAdminOrOwner {
        require(account != address(0), "BAD_ADDR");
        professors[account] = isActive;
        emit ProfessorUpdated(account, isActive);
    }

    function addContribution(
        string calldata title,
        ContributionCategory category,
        string calldata description,
        uint256 dueDate
    ) external {
        require(bytes(title).length > 0, "NO_TITLE");
        require(bytes(description).length > 0, "NO_DESC");
        require(dueDate >= block.timestamp, "BAD_DUE");

        uint256 contributionId = nextContributionId;
        nextContributionId++;

        contributions[contributionId] = Contribution({
            id: contributionId,
            student: msg.sender,
            title: title,
            category: category,
            description: description,
            completed: false,
            createdAt: block.timestamp,
            dueDate: dueDate,
            deleted: false,
            nftMinted: false,
            status: ContributionStatus.Pending,
            pointsAwarded: 0,
            reviewedBy: address(0),
            reviewedAt: 0
        });

        userContributionIds[msg.sender].push(contributionId);

        emit ContributionCreated(
            contributionId,
            msg.sender,
            title,
            category,
            description,
            block.timestamp,
            dueDate
        );
    }

    function toggleContribution(uint256 contributionId)
        external
        contributionExists(contributionId)
    {
        Contribution storage contribution = contributions[contributionId];

        require(contribution.student == msg.sender, "NOT_OWNER");
        require(!contribution.deleted, "DELETED");
        require(contribution.status == ContributionStatus.Pending, "NOT_PENDING");

        contribution.completed = !contribution.completed;

        emit ContributionUpdated(contributionId, msg.sender, contribution.completed);
    }

    function approveContribution(uint256 contributionId, uint256 points)
        external
        onlyReviewer
        contributionExists(contributionId)
    {
        Contribution storage contribution = contributions[contributionId];

        require(!contribution.deleted, "DELETED");
        require(contribution.status == ContributionStatus.Pending, "REVIEWED");

        contribution.status = ContributionStatus.Approved;
        contribution.pointsAwarded = points;
        contribution.reviewedBy = msg.sender;
        contribution.reviewedAt = block.timestamp;

        reputation[contribution.student] += points;

        emit ContributionApproved(
            contributionId,
            contribution.student,
            msg.sender,
            points
        );
    }

    function rejectContribution(uint256 contributionId)
        external
        onlyReviewer
        contributionExists(contributionId)
    {
        Contribution storage contribution = contributions[contributionId];

        require(!contribution.deleted, "DELETED");
        require(contribution.status == ContributionStatus.Pending, "REVIEWED");

        contribution.status = ContributionStatus.Rejected;
        contribution.reviewedBy = msg.sender;
        contribution.reviewedAt = block.timestamp;

        emit ContributionRejected(
            contributionId,
            contribution.student,
            msg.sender
        );
    }

    function mintContributionNFT(uint256 contributionId)
        external
        contributionExists(contributionId)
    {
        Contribution storage contribution = contributions[contributionId];

        require(contribution.student == msg.sender, "NOT_OWNER");
        require(!contribution.deleted, "DELETED");
        require(contribution.completed, "NOT_DONE");
        require(contribution.status == ContributionStatus.Approved, "NOT_APPROVED");
        require(!contribution.nftMinted, "MINTED");

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        contribution.nftMinted = true;
        tokenToContributionId[tokenId] = contributionId;

        _safeMint(msg.sender, tokenId);

        emit ContributionNFTMinted(msg.sender, contributionId, tokenId);
    }

    function deleteContribution(uint256 contributionId)
        external
        contributionExists(contributionId)
    {
        Contribution storage contribution = contributions[contributionId];

        require(contribution.student == msg.sender, "NOT_OWNER");
        require(!contribution.deleted, "DELETED");
        require(contribution.status == ContributionStatus.Pending, "NOT_PENDING");

        contribution.deleted = true;

        emit ContributionDeleted(contributionId, msg.sender);
    }

    function getContribution(uint256 contributionId)
        external
        view
        contributionExists(contributionId)
        returns (Contribution memory)
    {
        return contributions[contributionId];
    }

    function getMyContributions() external view returns (Contribution[] memory) {
        uint256[] memory ids = userContributionIds[msg.sender];
        Contribution[] memory result = new Contribution[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = contributions[ids[i]];
        }

        return result;
    }

    function getAllContributions()
        external
        view
        onlyReviewer
        returns (Contribution[] memory)
    {
        Contribution[] memory result = new Contribution[](nextContributionId);

        for (uint256 i = 0; i < nextContributionId; i++) {
            result[i] = contributions[i];
        }

        return result;
    }

    function getMyReputation() external view returns (uint256) {
        return reputation[msg.sender];
    }

    function isReviewer(address account) external view returns (bool) {
        return _isReviewer(account);
    }

    function _isReviewer(address account) internal view returns (bool) {
        return owner() == account || admins[account] || professors[account];
    }
}