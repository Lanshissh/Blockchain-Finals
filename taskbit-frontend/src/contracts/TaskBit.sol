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
        require(
            owner() == msg.sender || admins[msg.sender],
            "Not admin or owner"
        );
        _;
    }

    modifier onlyReviewer() {
        require(
            owner() == msg.sender ||
                admins[msg.sender] ||
                professors[msg.sender],
            "Not authorized reviewer"
        );
        _;
    }

    constructor() ERC721("TaskBit Achievement", "TBA") Ownable(msg.sender) {}

    function setAdmin(address _account, bool _isActive) external onlyOwner {
        require(_account != address(0), "Invalid address");
        admins[_account] = _isActive;
        emit AdminUpdated(_account, _isActive);
    }

    function setProfessor(address _account, bool _isActive)
        external
        onlyAdminOrOwner
    {
        require(_account != address(0), "Invalid address");
        professors[_account] = _isActive;
        emit ProfessorUpdated(_account, _isActive);
    }

    function addContribution(
        string calldata _title,
        ContributionCategory _category,
        string calldata _description,
        uint256 _dueDate
    ) external {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_dueDate > 0, "Due date is required");
        require(_dueDate >= block.timestamp, "Due date cannot be in the past");

        uint256 contributionId = nextContributionId;
        nextContributionId++;

        contributions[contributionId] = Contribution({
            id: contributionId,
            student: msg.sender,
            title: _title,
            category: _category,
            description: _description,
            completed: false,
            createdAt: block.timestamp,
            dueDate: _dueDate,
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
            _title,
            _category,
            _description,
            block.timestamp,
            _dueDate
        );
    }

    function toggleContribution(uint256 _contributionId) external {
        Contribution storage contribution = contributions[_contributionId];

        require(contribution.student != address(0), "Contribution does not exist");
        require(contribution.student == msg.sender, "Not your contribution");
        require(!contribution.deleted, "Contribution is deleted");
        require(
            contribution.status != ContributionStatus.Rejected,
            "Rejected contribution cannot be toggled"
        );

        contribution.completed = !contribution.completed;

        emit ContributionUpdated(
            _contributionId,
            msg.sender,
            contribution.completed
        );
    }

    function approveContribution(uint256 _contributionId, uint256 _points)
        external
        onlyReviewer
    {
        Contribution storage contribution = contributions[_contributionId];

        require(contribution.student != address(0), "Contribution does not exist");
        require(!contribution.deleted, "Contribution is deleted");
        require(
            contribution.status == ContributionStatus.Pending,
            "Contribution already reviewed"
        );

        contribution.status = ContributionStatus.Approved;
        contribution.pointsAwarded = _points;
        contribution.reviewedBy = msg.sender;
        contribution.reviewedAt = block.timestamp;

        reputation[contribution.student] += _points;

        emit ContributionApproved(
            _contributionId,
            contribution.student,
            msg.sender,
            _points
        );
    }

    function rejectContribution(uint256 _contributionId)
        external
        onlyReviewer
    {
        Contribution storage contribution = contributions[_contributionId];

        require(contribution.student != address(0), "Contribution does not exist");
        require(!contribution.deleted, "Contribution is deleted");
        require(
            contribution.status == ContributionStatus.Pending,
            "Contribution already reviewed"
        );

        contribution.status = ContributionStatus.Rejected;
        contribution.reviewedBy = msg.sender;
        contribution.reviewedAt = block.timestamp;

        emit ContributionRejected(
            _contributionId,
            contribution.student,
            msg.sender
        );
    }

    function mintContributionNFT(uint256 _contributionId) external {
        Contribution storage contribution = contributions[_contributionId];

        require(contribution.student != address(0), "Contribution does not exist");
        require(contribution.student == msg.sender, "Not your contribution");
        require(!contribution.deleted, "Contribution is deleted");
        require(contribution.completed, "Contribution must be completed first");
        require(
            contribution.status == ContributionStatus.Approved,
            "Contribution must be approved first"
        );
        require(!contribution.nftMinted, "NFT already minted for this contribution");

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        contribution.nftMinted = true;
        tokenToContributionId[tokenId] = _contributionId;

        _safeMint(msg.sender, tokenId);

        emit ContributionNFTMinted(msg.sender, _contributionId, tokenId);
    }

    function deleteContribution(uint256 _contributionId) external {
        Contribution storage contribution = contributions[_contributionId];

        require(contribution.student != address(0), "Contribution does not exist");
        require(contribution.student == msg.sender, "Not your contribution");
        require(!contribution.deleted, "Contribution already deleted");
        require(
            contribution.status == ContributionStatus.Pending,
            "Only pending contributions can be deleted"
        );

        contribution.deleted = true;

        emit ContributionDeleted(_contributionId, msg.sender);
    }

    function getContribution(uint256 _contributionId)
        external
        view
        returns (Contribution memory)
    {
        Contribution memory contribution = contributions[_contributionId];
        require(contribution.student != address(0), "Contribution does not exist");
        return contribution;
    }

    function getMyContribution(uint256 _contributionId)
        external
        view
        returns (Contribution memory)
    {
        Contribution memory contribution = contributions[_contributionId];
        require(contribution.student != address(0), "Contribution does not exist");
        require(contribution.student == msg.sender, "Not your contribution");
        return contribution;
    }

    function getMyContributions()
        external
        view
        returns (Contribution[] memory)
    {
        uint256[] memory ids = userContributionIds[msg.sender];
        Contribution[] memory result = new Contribution[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = contributions[ids[i]];
        }

        return result;
    }

    function getMyContributionCount() external view returns (uint256) {
        return userContributionIds[msg.sender].length;
    }

    function getContributionIdsByStudent(address _student)
        external
        view
        returns (uint256[] memory)
    {
        return userContributionIds[_student];
    }

    function getMyReputation() external view returns (uint256) {
        return reputation[msg.sender];
    }

    function isReviewer(address _account) external view returns (bool) {
        return owner() == _account || admins[_account] || professors[_account];
    }
}