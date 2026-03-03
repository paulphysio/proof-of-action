// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProofOfActionReputation
 * @dev Soulbound Token (SBT) for human reputation on World Chain
 * 
 * Challenge: World Build 3 - Proof of Contribution (Human Capital)
 * 
 * Features:
 * - Non-transferable reputation tokens
 * - Proof Points tracking
 * - Human verification status
 * - Skill badges for verified actions
 */
contract ProofOfActionReputation is ERC721, Ownable {
    
    // Token counter
    uint256 private _tokenIds;
    
    // Mapping from wallet to token ID (1 per human)
    mapping(address => uint256) public humanTokenId;
    
    // Mapping from token ID to reputation data
    mapping(uint256 => ReputationData) public reputationData;
    
    // Mapping from token ID to verification status
    mapping(uint256 => bool) public isWorldIDVerified;
    
    // Authorized verifiers (AI agents, human verifiers)
    mapping(address => bool) public authorizedVerifiers;
    
    struct ReputationData {
        uint256 proofPoints;
        uint256 verifiedActions;
        uint256 lastUpdated;
        string[] skillBadges;
        string metadataURI;
    }
    
    struct SkillBadge {
        string name;
        string description;
        uint256 earnedAt;
    }
    
    // Events
    event HumanRegistered(address indexed human, uint256 tokenId, bool worldIDVerified);
    event ProofPointsAwarded(address indexed human, uint256 amount, string reason);
    event SkillBadgeEarned(address indexed human, string badgeName);
    event ActionVerified(address indexed human, uint256 actionId, uint256 confidenceScore);
    
    modifier onlyVerifier() {
        require(authorizedVerifiers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    constructor() ERC721("Proof of Action Reputation", "POAR") {}
    
    /**
     * @dev Register a new human with optional World ID verification
     * @param human Address of the human to register
     * @param worldIDVerified Whether they passed World ID proof of personhood
     */
    function registerHuman(address human, bool worldIDVerified) external onlyVerifier returns (uint256) {
        require(humanTokenId[human] == 0, "Human already registered");
        
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        
        _safeMint(human, newTokenId);
        humanTokenId[human] = newTokenId;
        isWorldIDVerified[newTokenId] = worldIDVerified;
        
        reputationData[newTokenId] = ReputationData({
            proofPoints: worldIDVerified ? 100 : 0, // Starting bonus for verified humans
            verifiedActions: 0,
            lastUpdated: block.timestamp,
            skillBadges: new string[](0),
            metadataURI: ""
        });
        
        emit HumanRegistered(human, newTokenId, worldIDVerified);
        
        return newTokenId;
    }
    
    /**
     * @dev Award proof points for verified helpful actions
     * @param human Address of the human receiving points
     * @param points Amount of points to award
     * @param reason Description of why points were awarded
     * @param actionId ID of the verified action
     * @param confidenceScore AI confidence score (0-100)
     */
    function awardProofPoints(
        address human, 
        uint256 points, 
        string calldata reason,
        uint256 actionId,
        uint256 confidenceScore
    ) external onlyVerifier {
        uint256 tokenId = humanTokenId[human];
        require(tokenId != 0, "Human not registered");
        
        ReputationData storage data = reputationData[tokenId];
        data.proofPoints += points;
        data.verifiedActions += 1;
        data.lastUpdated = block.timestamp;
        
        // Auto-award skill badges based on milestones
        _checkAndAwardBadges(human, data);
        
        emit ProofPointsAwarded(human, points, reason);
        emit ActionVerified(human, actionId, confidenceScore);
    }
    
    /**
     * @dev Add a skill badge to a human
     */
    function awardSkillBadge(address human, string calldata badgeName) external onlyVerifier {
        uint256 tokenId = humanTokenId[human];
        require(tokenId != 0, "Human not registered");
        
        reputationData[tokenId].skillBadges.push(badgeName);
        
        emit SkillBadgeEarned(human, badgeName);
    }
    
    /**
     * @dev Internal function to check and award automatic badges
     */
    function _checkAndAwardBadges(address human, ReputationData storage data) internal {
        uint256 tokenId = humanTokenId[human];
        
        // First Responder Badge
        if (data.verifiedActions == 1) {
            data.skillBadges.push("First Responder");
            emit SkillBadgeEarned(human, "First Responder");
        }
        
        // Trusted Helper Badge (10 actions)
        if (data.verifiedActions == 10) {
            data.skillBadges.push("Trusted Helper");
            emit SkillBadgeEarned(human, "Trusted Helper");
        }
        
        // Community Guardian Badge (50 actions)
        if (data.verifiedActions == 50) {
            data.skillBadges.push("Community Guardian");
            emit SkillBadgeEarned(human, "Community Guardian");
        }
        
        // Platinum Responder Badge (100 actions)
        if (data.verifiedActions == 100) {
            data.skillBadges.push("Platinum Responder");
            emit SkillBadgeEarned(human, "Platinum Responder");
        }
    }
    
    /**
     * @dev Update World ID verification status
     */
    function updateWorldIDVerification(address human, bool verified) external onlyVerifier {
        uint256 tokenId = humanTokenId[human];
        require(tokenId != 0, "Human not registered");
        
        isWorldIDVerified[tokenId] = verified;
        
        // Award starting bonus if newly verified
        if (verified && reputationData[tokenId].proofPoints == 0) {
            reputationData[tokenId].proofPoints = 100;
        }
    }
    
    /**
     * @dev Add or remove an authorized verifier
     */
    function setVerifier(address verifier, bool authorized) external onlyOwner {
        authorizedVerifiers[verifier] = authorized;
    }
    
    /**
     * @dev Get full reputation data for a human
     */
    function getReputation(address human) external view returns (
        uint256 tokenId,
        uint256 proofPoints,
        uint256 verifiedActions,
        bool worldIDVerified,
        string[] memory skillBadges,
        uint256 lastUpdated
    ) {
        tokenId = humanTokenId[human];
        require(tokenId != 0, "Human not registered");
        
        ReputationData memory data = reputationData[tokenId];
        
        return (
            tokenId,
            data.proofPoints,
            data.verifiedActions,
            isWorldIDVerified[tokenId],
            data.skillBadges,
            data.lastUpdated
        );
    }
    
    /**
     * @dev Override transfer functions to make tokens soulbound (non-transferable)
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        // Allow minting (from == address(0)) and burning (to == address(0))
        // But prevent transfers between addresses
        require(
            from == address(0) || to == address(0),
            "Soulbound: token transfers are disabled"
        );
    }
    
    /**
     * @dev Override approve to prevent approvals
     */
    function approve(address to, uint256 tokenId) public virtual override {
        revert("Soulbound: approvals are disabled");
    }
    
    /**
     * @dev Override setApprovalForAll to prevent operator approvals
     */
    function setApprovalForAll(address operator, bool approved) public virtual override {
        revert("Soulbound: operator approvals are disabled");
    }
    
    /**
     * @dev Get token URI with metadata
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        ReputationData memory data = reputationData[tokenId];
        
        // Generate on-chain JSON metadata
        return string(abi.encodePacked(
            'data:application/json;base64,',
            _base64Encode(bytes(abi.encodePacked(
                '{',
                '"name": "Proof of Action Reputation #', _toString(tokenId), '",',
                '"description": "Soulbound reputation token for verified human contributors",',
                '"image": "', _generateSVG(tokenId, data), '",',
                '"attributes": [',
                '{"trait_type": "Proof Points", "value": ', _toString(data.proofPoints), '},',
                '{"trait_type": "Verified Actions", "value": ', _toString(data.verifiedActions), '},',
                '{"trait_type": "World ID Verified", "value": ', isWorldIDVerified[tokenId] ? '"Yes"' : '"No"', '},',
                '{"trait_type": "Skill Badges", "value": ', _toString(data.skillBadges.length), '}',
                ']',
                '}'
            )))
        ));
    }
    
    /**
     * @dev Generate SVG for token image
     */
    function _generateSVG(uint256 tokenId, ReputationData memory data) internal pure returns (string memory) {
        // Simple SVG representing the reputation level
        string memory color = data.proofPoints >= 1000 ? "#FFD700" : // Gold
                               data.proofPoints >= 500 ? "#C0C0C0" :  // Silver
                               data.proofPoints >= 100 ? "#CD7F32" :  // Bronze
                               "#6B7280"; // Gray
        
        return string(abi.encodePacked(
            'data:image/svg+xml;base64,',
            _base64Encode(bytes(abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
                '<rect fill="#0F172A" width="400" height="400"/>',
                '<circle cx="200" cy="200" r="150" fill="', color, '" opacity="0.2"/>',
                '<circle cx="200" cy="200" r="120" fill="', color, '" opacity="0.4"/>',
                '<text x="200" y="180" text-anchor="middle" fill="white" font-size="24" font-family="sans-serif">POAR</text>',
                '<text x="200" y="220" text-anchor="middle" fill="', color, '" font-size="48" font-weight="bold" font-family="sans-serif">', _toString(data.proofPoints), '</text>',
                '<text x="200" y="260" text-anchor="middle" fill="#9CA3AF" font-size="16" font-family="sans-serif">Points</text>',
                '</svg>'
            )))
        ));
    }
    
    /**
     * @dev Utility: Convert uint to string
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    /**
     * @dev Utility: Base64 encode
     */
    function _base64Encode(bytes memory data) internal pure returns (string memory) {
        string memory TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 len = data.length;
        if (len == 0) return "";
        
        uint256 encodedLen = 4 * ((len + 2) / 3);
        bytes memory result = new bytes(encodedLen + 32);
        
        bytes memory table = bytes(TABLE);
        
        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)
            
            for {
                let i := 0
            } lt(i, len) {
                i := add(i, 3)
            } {
                let input := and(mload(add(data, i)), 0xffffff)
                
                let out := mload(add(tablePtr, and(shr(18, input), 0x3F)))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(12, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(6, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(input, 0x3F))), 0xFF))
                out := shl(224, out)
                
                mstore(resultPtr, out)
                
                resultPtr := add(resultPtr, 4)
            }
            
            switch mod(len, 3)
            case 1 {
                mstore(sub(resultPtr, 2), shl(240, 0x3d3d))
            }
            case 2 {
                mstore(sub(resultPtr, 1), shl(248, 0x3d))
            }
            
            mstore(result, encodedLen)
        }
        
        return string(result);
    }
}
