// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TaskBit {
    enum ContributionCategory {
        Paper,
        Seminar,
        Research,
        Competition,
        Extension,
        Other
    }

    struct Contribution {
        uint256 id;
        string title;
        ContributionCategory category;
        string description;
        bool completed;
        uint256 createdAt;
        uint256 dueDate;
        bool deleted;
    }

    mapping(address => Contribution[]) private userContributions;

    event ContributionCreated(
        address indexed owner,
        uint256 indexed contributionId,
        string title,
        ContributionCategory category,
        string description,
        uint256 createdAt,
        uint256 dueDate
    );

    event ContributionUpdated(
        address indexed owner,
        uint256 indexed contributionId,
        bool completed
    );

    event ContributionDeleted(
        address indexed owner,
        uint256 indexed contributionId
    );

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

        uint256 contributionId = userContributions[msg.sender].length;

        userContributions[msg.sender].push(
            Contribution({
                id: contributionId,
                title: _title,
                category: _category,
                description: _description,
                completed: false,
                createdAt: block.timestamp,
                dueDate: _dueDate,
                deleted: false
            })
        );

        emit ContributionCreated(
            msg.sender,
            contributionId,
            _title,
            _category,
            _description,
            block.timestamp,
            _dueDate
        );
    }

    function toggleContribution(uint256 _contributionId) external {
        require(
            _contributionId < userContributions[msg.sender].length,
            "Contribution does not exist"
        );

        Contribution storage contribution = userContributions[msg.sender][_contributionId];
        require(!contribution.deleted, "Contribution is deleted");

        contribution.completed = !contribution.completed;

        emit ContributionUpdated(
            msg.sender,
            _contributionId,
            contribution.completed
        );
    }

    function deleteContribution(uint256 _contributionId) external {
        require(
            _contributionId < userContributions[msg.sender].length,
            "Contribution does not exist"
        );

        Contribution storage contribution = userContributions[msg.sender][_contributionId];
        require(!contribution.deleted, "Contribution already deleted");

        contribution.deleted = true;

        emit ContributionDeleted(msg.sender, _contributionId);
    }

    function getMyContribution(uint256 _contributionId)
        external
        view
        returns (Contribution memory)
    {
        require(
            _contributionId < userContributions[msg.sender].length,
            "Contribution does not exist"
        );

        return userContributions[msg.sender][_contributionId];
    }

    function getMyContributions()
        external
        view
        returns (Contribution[] memory)
    {
        return userContributions[msg.sender];
    }

    function getMyContributionCount() external view returns (uint256) {
        return userContributions[msg.sender].length;
    }
}