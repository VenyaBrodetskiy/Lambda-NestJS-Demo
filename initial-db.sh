#!/bin/bash

# Function to check if a table exists
table_exists() {
    local table_name="$1"
    existing_tables=$(awslocal dynamodb list-tables --output text)
    [[ $existing_tables == *"$table_name"* ]]
}

# Create Plan table
if table_exists "Plan"; then
    echo "Table Plan already exists."
else
    echo "Creating Plans table..."
    output=$(awslocal dynamodb create-table --table-name Plans \
      --attribute-definitions AttributeName=planId,AttributeType=S \
      --key-schema AttributeName=planId,KeyType=HASH \
      --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 2>&1)

    if [[ $? -ne 0 ]]; then
        echo "An error occurred while creating Plans table: $output"
        exit 1
    else
        echo "Plan table was successfully created."
    fi
fi

echo "Tables setup complete!"
