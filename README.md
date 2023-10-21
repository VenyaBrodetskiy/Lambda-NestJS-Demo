# Development Guide

This guide provides instructions for setting up and running the project locally using Docker. It covers the use of LocalStack to simulate AWS services, DynamoDB Viewer for local DynamoDB interaction, and debugging capabilities using VS Code.

## Prerequisites

### Node.js 18 LTS ###
  - **Windows**: Use [nvm for Windows](https://github.com/coreybutler/nvm-windows).
  - **macOS/Linux**: Install `nvm` from [here](https://github.com/nvm-sh/nvm#installing-and-updating).

    ```bash
    nvm install 18
    nvm use 18
    ```

### Docker and Docker-compose ###
  - [Docker Installation Guide](https://www.docker.com/get-started)
  - [Docker-compose Installation Guide](https://docs.docker.com/compose/install/)

## Development Setup

### With Docker Compose (Recommended)

1. **Starting Services**:
    Navigate to the `backend` directory and run:

    ```bash
    docker-compose up
    ```

    This will start the services and display logs in the terminal. If you prefer to run the services in detached mode, use:

    ```bash
    docker-compose up -d
    ```

    **Alternative**: You can also start the services directly from VS Code using the `Run Backend` configuration in the debugger. This will execute `docker-compose -f ./backend/docker-compose.yml up --build`, starting all backend services.

2. **Debugging with VS Code**:
    - First, ensure that the services are running using `docker-compose` as mentioned above.
    - Open the VS Code debugger (the bug icon on the sidebar).
    - Choose the desired debug configuration from the dropdown. For example, `Debug Backend` will attach the debugger to all backend services.
    - Press the green play button to start debugging.

    **Note**: You can also debug individual services by selecting configurations like "Debug Manager.Plan" or "Debug Accessor.Plan".

3. **LocalStack and DynamoDB Viewer**:
    After running `docker-compose`, you can access:
    - DynamoDB Admin at [http://localhost:8001](http://localhost:8001)
    - LocalStack health status at [http://localhost:4566/health](http://localhost:4566/health)
    
    **Note**: Other emulated AWS services like SQS, S3 are also accessible from the same port as DynamoDB.

    **Commandline examples**:
    - Create new table
      ```bash
      aws dynamodb create-table --table-name MyTable --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 --endpoint-url=http://localhost:4566 
      ```
    - Show all tables
      ```bash
      aws dynamodb list-tables --endpoint-url=http://localhost:4566 
      ```



## Additional Information

- **Environment Variables**:
    - `.env`: Used for running lambdas without Docker (rarely used).
    - `.env.dev`: Used for running services inside Docker containers.

- **Health Checks**:
    Health checks are set up to keep the lambda warm. They send requests to the services at regular intervals.

- **API Gateway for Accessors**:
    While API Gateways for accessors exist, they are primarily used in local development for two reasons:
    - Health checks.
    - Directly calling an accessor for debugging purposes (bypassing the manager).
    
    **Note**: In the cloud, we will not use API Gateway for accessors. Instead, we must invoke the lambda directly.

- **Development Server**:
    The command `npm run start` uses `nodemon` to watch for changes in the `src` directory. Upon detecting changes, it will rebuild the application using `nest build` and restart the server using `serverless offline start`.

- **Hot Reloading**:
    Even inside the Docker container, hot reloading is enabled. This means any changes you make to the source code will automatically be reflected in the running service.

- **Production-Like Environment (Using Webpack)**:
    To start the application using the Webpack build, use `npm run start:prod`. This command will first build the application using Webpack with the `nest build --webpack` command and then start the server using `serverless offline`.

    **Note**: The Webpack build is optimized for production and does not generate source maps. This means debugging capabilities are limited when using the Webpack build. For development purposes with debugging, it's recommended to use `npm run start`.

    **Note**: Using the Webpack build significantly improves performance, reducing cold start times by up to three times compared to the regular build.

- **Serverless-compose:**
    The `serverless-compose` configuration in backend root folder is primarily intended for deploying to a personal AWS account for verification or testing purposes in the cloud. It's not meant for production deployments.
    
    If you need to deploy to the cloud for testing, ensure you're deploying to the correct AWS account and region.
