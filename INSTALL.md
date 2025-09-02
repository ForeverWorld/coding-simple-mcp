# Coding Simple MCP

## Installation

```bash
npm install coding-simple-mcp
```

## Global Installation (for command line usage)

```bash
npm install -g coding-simple-mcp
```

## Usage

After installation, you can run the MCP server directly:

```bash
# If installed globally
coding-simple-mcp

# If installed locally
npx coding-simple-mcp

# Or using Node.js directly
node node_modules/coding-simple-mcp/dist/index.js
```

## Claude Desktop Configuration

Configure Claude Desktop to use the installed package:

```json
{
  "mcpServers": {
    "coding-simple-mcp": {
      "command": "npx",
      "args": ["coding-simple-mcp"],
      "env": {
        "API_BASE_URL": "https://your-coding-devops-domain.com/open-api",
        "API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

For more detailed configuration and usage instructions, see the full [README](README.md).