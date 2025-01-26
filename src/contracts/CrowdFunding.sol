// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
// campaign ko structure 
contract CrowdFunding {
    struct Campaign {
        address owner;
        string title;
        string description;
        uint256 target;
        uint256 deadline;
        uint256 amountCollected;
        string image;
        address[] donors;
        uint256[] donations;
        bool claimed;
    }
// this block of code defines the campaign id and that campaign can be accessed by that unique id
    mapping(uint256 => Campaign) public campaigns;
    uint256 public numberOfCampaigns = 0;

    event CampaignCreated(uint256 indexed id, address indexed owner, string title, uint256 target);
    event DonationMade(uint256 indexed id, address indexed donor, uint256 amount);
    event FundsClaimed(uint256 indexed id, address indexed owner, uint256 amount);
    event CampaignCompleted(uint256 indexed id, uint256 totalAmount);

    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        string memory _image
    ) public returns (uint256) {
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(_target > 0, "Target amount must be greater than 0");

        Campaign storage campaign = campaigns[numberOfCampaigns];   // campaign id seclct
        campaign.owner = msg.sender;//sender add
        campaign.title = _title;
        campaign.description = _description;
        campaign.target = _target;
        campaign.deadline = _deadline;
        campaign.amountCollected = 0;
        campaign.image = _image;
        campaign.claimed = false;

        emit CampaignCreated(numberOfCampaigns, msg.sender, _title, _target);// notification ,after store
        numberOfCampaigns++;

        return numberOfCampaigns - 1;
    }
// we select camp id 
    function donateToCampaign(uint256 _id) public payable {
        require(_id < numberOfCampaigns, "Campaign does not exist");//
        require(msg.value > 0, "Donation must be greater than 0");
        require(block.timestamp < campaigns[_id].deadline, "Campaign has ended");
        require(!campaigns[_id].claimed, "Campaign funds have been claimed");

        Campaign storage campaign = campaigns[_id];

        uint256 remainingToTarget = campaign.target - campaign.amountCollected;
        require(remainingToTarget > 0, "Campaign target already reached");

        uint256 acceptedAmount;
        if (msg.value > remainingToTarget) {
            acceptedAmount = remainingToTarget;// jati target cha teti chai accept hunu pareo
            payable(msg.sender).transfer(msg.value - acceptedAmount);
        } else {
            acceptedAmount = msg.value;
        }

        campaign.donors.push(msg.sender);
        campaign.donations.push(acceptedAmount);
        campaign.amountCollected += acceptedAmount;

        emit DonationMade(_id, msg.sender, acceptedAmount);

        if (campaign.amountCollected >= campaign.target) {
            _claimFunds(_id);
        }
    }

    function _claimFunds(uint256 _id) internal {   //internal jo owner ho tesle accept
        Campaign storage campaign = campaigns[_id];
        require(!campaign.claimed, "Funds have already been claimed");

        campaign.claimed = true;
        payable(campaign.owner).transfer(campaign.amountCollected);

        emit FundsClaimed(_id, campaign.owner, campaign.amountCollected);
        emit CampaignCompleted(_id, campaign.amountCollected);
    }

    function claimFunds(uint256 _id) public {
        Campaign storage campaign = campaigns[_id];
        require(msg.sender == campaign.owner, "Only campaign owner can claim funds");
        require(!campaign.claimed, "Funds have already been claimed");
        require(
            block.timestamp > campaign.deadline || 
            campaign.amountCollected >= campaign.target,
            "Campaign has not ended or reached target"
        );

        _claimFunds(_id);
    }

    function getCampaign(uint256 _id) public view returns (
        address owner,
        string memory title,
        string memory description,
        uint256 target,
        uint256 deadline,
        uint256 amountCollected,
        string memory image,
        bool claimed
    ) {
        Campaign storage campaign = campaigns[_id];
        return (
            campaign.owner,
            campaign.title,
            campaign.description,
            campaign.target,
            campaign.deadline,
            campaign.amountCollected,
            campaign.image,
            campaign.claimed
        );
    }

    function getDonors(uint256 _id) public view returns (address[] memory, uint256[] memory) {
        return (campaigns[_id].donors, campaigns[_id].donations);
    }
}
