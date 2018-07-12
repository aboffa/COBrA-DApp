pragma solidity ^0.4.24;

import "./ContentManagerContract.sol";

contract CatalogSmartContract {
    //public for debug
    uint public WeiForPremium = 1000000000000000000;
    uint public BlockForPremium = 10;
    address owner;
    mapping (address => uint) public premiumCustomers;
    address[] public contentManagers;
    //maybe not necessary remember view method dont spend gas
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

    modifier isStillPremium {
        require(
            isPremium(msg.sender),
            "Your premium account is expired."
        );
        _;
    }

    constructor () public {
        owner = msg.sender;
    }

    function BuyPremium() public payable  {
        require (msg.value >= WeiForPremium, "You have to pay the right amount!");
        premiumCustomers[msg.sender] = block.number + BlockForPremium;
    }
    
    function NewContent(address cmc, bytes32 genre_, bytes32 authorName_, bytes32 name_ ) public {
        contentManagers.push(cmc);
        fromNametoContent[name_] = cmc;
        emit NewContentEvent(genre_, authorName_);
    }
    
    function GetContent(bytes32 name_) payable public returns (address cm) {
        cm = fromNametoContent[name_];
        require(cm != address(0), "This content doesn't exist!");
        ContentManagementContract cmccasted = ContentManagementContract(cm);
        uint price = cmccasted.price();
        require(msg.value >= price, "You have to pay the right amount!" );
        cmccasted.setEnabledStandard(msg.sender);
        emit ContenAccessObtained("contenuto ottenuto", cm);
    }
    
    function GetContentPremium(bytes32 name_) public isStillPremium {
        address cm = fromNametoContent[name_];
        require(cm != address(0), "This content doesn't exist!");
        ContentManagementContract cmccasted = ContentManagementContract(cm);
        cmccasted.setEnabledPremium(msg.sender, premiumCustomers[msg.sender]);
        emit ContenAccessObtained("contenuto ottenuto", cm);
    }
    
    function getPriceContent(bytes32 name_) view public returns (uint price) {
        address cm = fromNametoContent[name_];
        require(cm != address(0), "This content doesn't exist!");
        ContentManagementContract cmccasted = ContentManagementContract(cm);
        price = cmccasted.price();
    }
    
    function getAddressContent(bytes32 name_) view public returns (address cm){
        cm = fromNametoContent[name_];
        require(cm != address(0), "This content doesn't exist!");
    
    }
    function GiftPremium(address a)  payable public{
        require(msg.value >= WeiForPremium);
        premiumCustomers[a] = block.number + BlockForPremium;
    }
    
    function GiftContent(bytes32 name_, address a)  payable public {
        address cm = fromNametoContent[name_];
        require(cm != address(0), "This content doesn't exist!");
        ContentManagementContract cmccasted = ContentManagementContract(cm);
        uint price = cmccasted.price();
        require(msg.value >= price,  "You have to pay the right amount!" );
        cmccasted.setEnabledStandard(a);
        emit ContenAccessGifted("contenuto ottenuto", cm);
    }
    
    function isPremium(address a)  public view returns (bool ok) {
        ok = (premiumCustomers[a] > block.number);
    }

    //Statistics
    
    function GetStatistics() public view returns (uint[] viewsarray ){
        viewsarray = new uint[](contentManagers.length);
        for (uint i = 0; i<contentManagers.length; i++){
            ContentManagementContract cmccasted = ContentManagementContract(contentManagers[i]);
            viewsarray[i] = cmccasted.views();
        }
    }
    
    function GetContentList() public view returns (bytes32[] result) {
        result = new bytes32[](contentManagers.length);
        for (uint i = 0; i<contentManagers.length; i++){
            ContentManagementContract cmccasted = ContentManagementContract(contentManagers[i]);
            result[i] = cmccasted.name();
        }
    }
    /*
    function GetNewContentList() public view returns (bytes32[] result){
        
    }
    
    function GetLatestByGenre(bytes32 genre) public view returns (bytes32[] result){
        
    }
    function GetMostPopularByGenre(bytes32 genre) public view returns (bytes32[] result){
        
    }

    function GetLatestByAuthor(bytes32 author) public view returns (bytes32[] result){
        
    }    
    
    function GetMostPopularByAuthor(bytes32 author) public view returns (bytes32[] result ){
        
    }
    */
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
