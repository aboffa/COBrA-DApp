pragma solidity ^0.4.24;

import "./ContentManagerContract.sol";

contract CatalogSmartContract {
    //public for debug
    uint public WeiForPremium = 1000000000000000000;
    uint public BlockForPremium = 10;
    address owner;
    mapping (address => uint) public premiumCustomers;
    address[] public contentManagers;
    
    //degub 
    uint public mybalance=0;
    uint public gasUsedForTranfer=0;
    uint public lastPayment = 0;
    bool public toArtist = false;
    bool public toSender = false;
    
    event ContentAccessObtainedStandard(bytes32 name, address addr);
    event ContentAccessObtainedPremium(bytes32 name, address addr);
    event ContentAccessGifted(address from, bytes32 name, address to);
    event PremiumGifted(address from, address to);
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
    
    function NewContent(address cmc, bytes32 genre_, bytes32 authorName_) public {
        contentManagers.push(cmc);
        emit NewContentEvent(genre_, authorName_);
    }
    
    function GetContent(bytes32 name_) payable public returns (address cm) {
        cm = fromNametoContent(name_);
        ContentManagementContract cmccasted = ContentManagementContract(cm);
        uint price = cmccasted.price();
        require(msg.value >= price, "You have to pay the right amount!" );
        cmccasted.setEnabledStandard(msg.sender);
        emit ContentAccessObtainedStandard(name_, cm);
    }
    
    function GetContentPremium(bytes32 name_) public isStillPremium {
        address cm = fromNametoContent(name_);
        ContentManagementContract cmccasted = ContentManagementContract(cm);
        cmccasted.setEnabledPremium(msg.sender, premiumCustomers[msg.sender]);
        emit ContentAccessObtainedPremium(name_, cm);
    }
    
    function getPriceContent(bytes32 name_) view public returns (uint price) {
        address cm = fromNametoContent(name_);
        ContentManagementContract cmccasted = ContentManagementContract(cm);
        price = cmccasted.price();
    }
    
    function getAddressContent(bytes32 name_) view public returns (address cm){
        cm = fromNametoContent(name_);
    
    }
    function GiftPremium(address a)  payable public {
        require(msg.value >= WeiForPremium);
        premiumCustomers[a] = block.number + BlockForPremium;
        emit PremiumGifted(msg.sender, a);
    }
    
    function GiftContent(bytes32 name_, address a)  payable public {
        address cm = fromNametoContent(name_);
        ContentManagementContract cmccasted = ContentManagementContract(cm);
        uint price = cmccasted.price();
        require(msg.value >= price,  "You have to pay the right amount!");
        cmccasted.setEnabledStandard(a);
        emit ContentAccessGifted(msg.sender, name_, a);
    }
    
    function isPremium(address a)  public view returns (bool ok) {
        ok = (premiumCustomers[a] > block.number);
    }

    function fromNametoContent(bytes32 name_) view private returns (address a){
        a=address(0);
        for (uint i = 0; i< contentManagers.length; i++){
            ContentManagementContract cmccasted = ContentManagementContract(contentManagers[i]);
            if(cmccasted.name() == name_){
                a=contentManagers[i];
                break;
            }
        }
        require(a!=address(0));
    }

    function PayArtist(uint startgas, address authorAddress, address contentAddress, uint price, uint viewsToPayments) public {
            //check if content really has right views?
            toArtist=false;
            toSender=false;
            ContentManagementContract cmccastedmostpopular = ContentManagementContract(getAddressContent(GetMostRathed(0)));
            uint feedbackmostpapular = cmccastedmostpopular.getMean();
            if(feedbackmostpapular != 0 ){
                ContentManagementContract cmccasted = ContentManagementContract(contentAddress);
                uint feedbackcontenttopay = cmccasted.getMean();
                if(feedbackcontenttopay != 0){
                    uint ratio = (feedbackcontenttopay * 1000)/feedbackmostpapular;
                    uint totranfer = ((price*viewsToPayments)/1000)*ratio;
                    mybalance = address(this).balance;
                    //PROBLEM 21,000 gas needed for the refound test 1 ether calculated 7524 but I need more precisely
                    //how much ether do a TRANFER need precisly? looking the compiled code!!!!
                    toArtist = authorAddress.send((totranfer));//-7600);
                    lastPayment = totranfer;
                }
            }
            uint gasUsed = startgas - gasleft();
            if(address(this).balance > (gasUsed+8000)){
                toSender = tx.origin.send(gasUsed+8000);
                gasUsedForTranfer = gasUsed;
            }
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
    function GetMostRathed(uint8 feedbackCategory) public view returns (bytes32 result ){
        if(feedbackCategory == 1){
            uint maxtmpi = 0;
            for (uint i = 0; i<contentManagers.length; i++){
                ContentManagementContract cmccastedi = ContentManagementContract(contentManagers[i]);
                if(cmccastedi.getMeanFeedBack1() >= maxtmpi){
                    maxtmpi = cmccastedi.getMeanFeedBack1();
                    result = cmccastedi.name();
                }
            }
        }
        else{
            if(feedbackCategory == 2){
                uint maxtmpj = 0;
                for (uint j = 0; j<contentManagers.length; j++){
                    ContentManagementContract cmccastedj = ContentManagementContract(contentManagers[j]);
                    if(cmccastedj.getMeanFeedBack2() >= maxtmpj){
                        maxtmpj = cmccastedj.getMeanFeedBack2();
                        result = cmccastedj.name();
                    }
                }   
            }
            else{
                if(feedbackCategory == 3){
                    uint maxtmph = 0;
                    for (uint h = 0; h<contentManagers.length; h++){
                        ContentManagementContract cmccastedh = ContentManagementContract(contentManagers[h]);
                        if(cmccastedh.getMeanFeedBack3() >= maxtmph){
                            maxtmph = cmccastedh.getMeanFeedBack3();
                            result = cmccastedh.name();
                        }
                    }   
                }
                else{
                    uint maxmeantmp = 0;
                    for (uint k = 0; k<contentManagers.length; k++){
                        ContentManagementContract cmccastedk = ContentManagementContract(contentManagers[k]);
                        if(cmccastedk.getMean() >= maxmeantmp){
                            maxmeantmp = cmccastedk.getMean();
                            result = cmccastedk.name();
                        }
                    } 
                }
            }
        }
    }
    
    /*
    function GetMostRathedByGenre(bytes32 genre, uint8 feedbackCategory) public view returns (bytes32[] result ){
        
    }
    
    function GetMostRathedByAuthor(bytes32 author, uint8 feedbackCategory) public view returns (bytes32[] result ){
        
    }
    */
    
    function GetFeedBacks() public view returns (uint[] result) {
        result = new uint[](contentManagers.length);
        for (uint i = 0; i<contentManagers.length; i++){
            ContentManagementContract cmccasted = ContentManagementContract(contentManagers[i]);
            result[i] = cmccasted.getMean();
        }
    }
    
    function GetFeedBack1() public view returns (uint[] result) {
        result = new uint[](contentManagers.length);
        for (uint i = 0; i<contentManagers.length; i++){
            ContentManagementContract cmccasted = ContentManagementContract(contentManagers[i]);
            result[i] = cmccasted.getMeanFeedBack1();
        }
    }
    function GetFeedBack2() public view returns (uint[] result) {
        result = new uint[](contentManagers.length);
        for (uint i = 0; i<contentManagers.length; i++){
            ContentManagementContract cmccasted = ContentManagementContract(contentManagers[i]);
            result[i] = cmccasted.getMeanFeedBack2();
        }
    }
    function GetFeedBack3() public view returns (uint[] result) {
        result = new uint[](contentManagers.length);
        for (uint i = 0; i<contentManagers.length; i++){
            ContentManagementContract cmccasted = ContentManagementContract(contentManagers[i]);
            result[i] = cmccasted.getMeanFeedBack3();
        }
    }
    function close() public onlyOwner {
        //redistribute all balance 
        selfdestruct(owner);
    }
    
    function() public payable { }
}
