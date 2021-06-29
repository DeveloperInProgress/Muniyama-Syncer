const fs = require('fs');
const https = require('https');
const Web3 = require('web3');
const url = "https://mainnet.sovryn.app/rpc";
const web3 = new Web3(new Web3.providers.HttpProvider(url));

const {pool, Client} = require("pg");
const client = new Client({
    user: "postgres",
    host: "localhost",
    password: "Naveenvemy@99",
    port: 5432
});
client.connect();

var latest_block_num = fs.readFileSync("./latest_block_num.txt","utf8");
latest_block_num = parseInt(latest_block_num);

var eventdata = require("./event_data.json")

var updateTable = function(body, table, inputs){
    var json = JSON.parse(body);
    if(json["data"]==null){
        console.log("data is null");
        return;
    }
    var items = json["data"]["items"];
    if(items.length==0){
        console.log("No event data for given topic found in the given block range");
        return;
    }
    
    items.forEach(item=>{
        var raw_data = item["raw_log_data"];
        var topics = item["raw_log_topics"].slice(1);
        var decoded_data = web3.eth.abi.decodeLog(inputs,raw_data,topics);
        var col_names = "block_num, tx_hash";
        var block_num = item["block_height"];
        var tx_hash = item["tx_hash"];
        var values = block_num+",'"+tx_hash+"'";
        
        inputs.forEach(input=>{
            var col = input["name"];
            if(col==="user")
                col = "user1";
            col_names += ","+col;
            if(input["type"]=="address"||input["type"]=="bytes32")
                values += ",'"+decoded_data[input["name"]]+"'";
            else
                values += ","+decoded_data[input["name"]];
        });
        var query = "INSERT INTO "+table+"("+col_names+") VALUES("+values+");";
        client.query(query, (err,res)=>{
            if(err){
                console.log(err.stack);
            } else {
                console.log(res);
            }
        });
    });
}

function update_data(start_block,end_block){
    var url1 = "https://api.covalenthq.com/v1/30/events/topics/";
    var params = "/?starting-block="+start_block+"&ending-block="+end_block+"&key=ckey_233d55702d264a1f948798ab5f7";
    eventdata.forEach((event)=>{
        var topic0 = event["topic0"];
        var inputs = event["inputs"];
        var table = event["name"];
        var req = https.get(url1+topic0+params,(res)=>{
            res.setEncoding("utf8");
            var body="";
            res.on("data",(chunk)=>{
                body += chunk;
            });
            if(body.includes("<html>")){
                console.log(body);
                return;
            }
            res.on("end",()=>updateTable(body, table, inputs))
            })
        req.on("error",(e)=>{
            console.error("error:${e.message}");
        });
    });
}

function writeLatestBlockNum(){
    var buffer = new Buffer.from(""+latest_block_num);
    fs.open("./latest_block_num.txt",'w',function(err,fd){
        if(err){
            console.log("can't open latest_block_num.txt");
        } else {
            fs.write(fd,buffer,0,buffer.length,null,function(err,written){
                if(err){
                    console.log("can't write to latest_block_num.txt");
                } 
            })
        }
    })
}

async function listener(){
    try{
        var current_block_num = await web3.eth.getBlockNumber();
    } catch (err){
        return listener();
    }
    
    console.log(current_block_num);
    if(current_block_num>latest_block_num){
        update_data(latest_block_num+1,current_block_num);
        latest_block_num=current_block_num;
        writeLatestBlockNum();
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
    listener();
}

listener();