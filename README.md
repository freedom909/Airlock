# an unfinished server backend of the minshuku app

## How to use this unfinished repo

1. before running the subgraph service, please create a database. Navigate to the root directory. In a new terminal window, please run 'cd services'. In the services directory, please run 'npm install'. After finishing the installation, please create an empty database named 'water' on your MySQL and run 'node seeders/seedData.js'. Now you have a MySQL database.

2. create a mongo database in mongo altas. in your Mongo atlas, create a database named 'water' and a collection named 'users'. and configure your Mongo connection string. then in the services directory, you run 'node seeders/seedUser.js', and now you create a Mongo collection named 'users'.

3. navigate to the root directory, please input 'cd subgraph-listings'. Now enter the subgraph, and please run 'Run npm install'. After finishing the installation, you can run 'npm start'. The subgraph-listings will run on the 'localhost:4040/graphql', and you can run some API calls.

4. if you want to run subgraph-users, you need to create a file called '.env' in the root directory, you need to go to the 'neo4j' official website to register an account and retrieve 'username', 'password',' AURA_INSTANCEID' and 'AURA_INSTANCENAME', In a terminal window, to enter 'cd subgraph-users' and please run Run 'npm install'. after finishing the installation, run 'npm start', the subgraph-users will run on the 'localhost:4010/graphql'.
