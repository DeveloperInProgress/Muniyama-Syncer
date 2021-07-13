# Muniyama Syncer
Muniyama Syncer is a Component of [Muniyama API](https://github.com/DeveloperInProgress/muniyama-api) that does continous synchronization of chain data in Sovryn network with Muniyama Database.

## How it works
Muniyama Syncer uses the Sovryn public node(https://mainnet.sovryn.app/rpc) to listen for new blocks in the RSK mainnet. When a new block mined, the syncer queries for
sovryn event data through the [Covalent API] using the topic[0] values of the event. 

When a new event data is retrieved, it is inserted into the corresponding table in Muniyama Database.

### hosting

Muniyama Syncer is hosted in an AWS EC2 Instance
