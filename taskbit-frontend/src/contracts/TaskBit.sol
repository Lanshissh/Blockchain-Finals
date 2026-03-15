// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract TaskBit is ERC721, Ownable {
    using Strings for uint256;

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
    mapping(address => uint256[]) private ownerCertificates;

    uint256 public nextContributionId;
    uint256 public nextTokenId;

    event ContributionCreated(uint256 id, address student);
    event ContributionApproved(uint256 id, address reviewer);
    event ContributionRejected(uint256 id, address reviewer);
    event ContributionNFTMinted(address student, uint256 contributionId, uint256 tokenId);

    modifier onlyAdminOrOwner() {
        require(owner() == msg.sender || admins[msg.sender], "NO_ADMIN");
        _;
    }

    modifier onlyReviewer() {
        require(
            owner() == msg.sender ||
            admins[msg.sender] ||
            professors[msg.sender],
            "NO_REVIEWER"
        );
        _;
    }

    constructor() ERC721("TaskBit Achievement", "TBA") Ownable(msg.sender) {}

    function setAdmin(address account, bool active) external onlyOwner {
        admins[account] = active;
    }

    function setProfessor(address account, bool active) external onlyAdminOrOwner {
        professors[account] = active;
    }

    function addContribution(
        string calldata title,
        ContributionCategory category,
        string calldata description,
        uint256 dueDate
    ) external {

        uint256 id = nextContributionId++;

        contributions[id] = Contribution({
            id: id,
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

        userContributionIds[msg.sender].push(id);

        emit ContributionCreated(id, msg.sender);
    }

    function toggleContribution(uint256 id) external {

        Contribution storage c = contributions[id];

        require(c.student == msg.sender, "NOT_OWNER");
        require(!c.deleted, "DELETED");

        c.completed = !c.completed;

        if (c.completed) {
            _mintIfEligible(id);
        }
    }

    function approveContribution(uint256 id, uint256 points)
        external
        onlyReviewer
    {

        Contribution storage c = contributions[id];

        require(!c.deleted, "DELETED");
        require(c.status == ContributionStatus.Pending, "REVIEWED");

        c.status = ContributionStatus.Approved;
        c.pointsAwarded = points;
        c.reviewedBy = msg.sender;
        c.reviewedAt = block.timestamp;

        reputation[c.student] += points;

        emit ContributionApproved(id, msg.sender);

        _mintIfEligible(id);
    }

    function rejectContribution(uint256 id)
        external
        onlyReviewer
    {

        Contribution storage c = contributions[id];

        require(c.status == ContributionStatus.Pending, "REVIEWED");

        c.status = ContributionStatus.Rejected;
        c.reviewedBy = msg.sender;
        c.reviewedAt = block.timestamp;

        emit ContributionRejected(id, msg.sender);
    }

    function _mintIfEligible(uint256 id) internal {

        Contribution storage c = contributions[id];

        if (
            c.completed &&
            c.status == ContributionStatus.Approved &&
            !c.nftMinted
        ) {

            uint256 tokenId = nextTokenId++;

            c.nftMinted = true;

            tokenToContributionId[tokenId] = id;

            ownerCertificates[c.student].push(tokenId);

            _safeMint(c.student, tokenId);

            emit ContributionNFTMinted(c.student, id, tokenId);
        }
    }

    function getContribution(uint256 id)
        external
        view
        returns (Contribution memory)
    {
        return contributions[id];
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

    function getMyCertificates()
        external
        view
        returns (uint256[] memory)
    {
        return ownerCertificates[msg.sender];
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireOwned(tokenId);

        uint256 cid = tokenToContributionId[tokenId];

        Contribution memory c = contributions[cid];

        return string(
            abi.encodePacked(
                "data:application/json;utf8,{",
                '"name":"', c.title, ' Certificate",',
                '"description":"TaskBit blockchain academic certificate",',
                '"attributes":[',
                '{"trait_type":"Contribution ID","value":"', c.id.toString(), '"},',
                '{"trait_type":"Points","value":"', c.pointsAwarded.toString(), '"}',
                "]}"
            )
        );
    }
}