pragma solidity ^0.4.0;

import "./ContentManagerContract.sol";

contract CatalogSmartContract {
    //public for debug
    uint public WeiForPremium = 1000000000000000000;
    //check if usefull
    bytes32 zeros = 0x0000000000000000000000000000000000000000000000000000000000000000;
    address owner;
    mapping (address => bool) public premiumCustomers;
    address[] public contentManagers;
    mapping (bytes32 => address) public fromNametoContent;
    
    event ContenAccessObtained(string s, address addr);
    event ContenAccessGifted(string s, address addr);
    event NewContentEvent( bytes32 genre, bytes32 autor);
    
    modifier onlyOwner {
        require(
            msg.sender == owner,
            "Only owner can call this function."
        );
        _;
    }
    constructor () public {
        owner = msg.sender;
    }

    function BuyPremium() public payable  {
        require (msg.value >= WeiForPremium );
        premiumCustomers[msg.sender] = true;
    }
    
    function NewContent(address cmc, bytes32 genre_, bytes32 authorName_, bytes32 name_ ) public {
        contentManagers.push(cmc);
        fromNametoContent[name_] = cmc;
        emit NewContentEvent(genre_, authorName_);
    }
    
    //bytes32
    function GetContent(bytes32 name_) payable public returns (address cm) {
        cm = fromNametoContent[name_];
        require(cm != address(0));
        ContentManagementContract cmccasted = ContentManagementContract(cm);
        uint price = cmccasted.price();
        require(msg.value >= price );
        cmccasted.setEnabled(msg.sender);
        emit ContenAccessObtained("contenuto ottenuto", cm );
    }
    
    function GetContentPremium(bytes32 name_) view public returns (address cm) {
        cm = fromNametoContent[name_];
        require(cm != address(0));
        cm.call("setEnabled",msg.sender);
        emit ContenAccessObtained("contenuto ottenuto", cm);
    }
    
    function getPriceContent(bytes32 name_) view public returns (uint price) {
        address cm = fromNametoContent[name_];
        require(cm != address(0));
        ContentManagementContract cmccasted = ContentManagementContract(cm);
        price =  cmccasted.price();
    }
    function GiftPremium(address a)  payable public{
        require(msg.value >= WeiForPremium);
        premiumCustomers[a] = true;
    }
    
    function GiftContent(bytes32 name_, address a)  payable public {
        address cm = fromNametoContent[name_];
        require(cm != address(0));
        ContentManagementContract cmccasted = ContentManagementContract(cm);
        uint price = cmccasted.price();
        require(msg.value >= price );
        cm.call("setEnabled",a);
        emit ContenAccessGifted("contenuto ottenuto", cm );
    }
    function isPremium(address a)  public view returns (bool ok) {
        ok = premiumCustomers[a];
    }
    
    function stringToBytes32(string memory source) public pure  returns (bytes32 result) {
        //this in javasript
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
        assembly {
            result := mload(add(source, 32))
        }
    }

    function close() public onlyOwner {
        selfdestruct(owner);
    }
    
        /*
    function() public payable{
        
        if (msg.value == WeiForPremium ){
            premiumCustomer.push(msg.sender);
        }
        else{
            standardCustomer.push(msg.sender);
        }
    }*/
    
}
