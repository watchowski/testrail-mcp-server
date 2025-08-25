# TestRails MCP Server Configuration Guide

## For Claude Desktop

Add this to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "testrails": {
      "command": "node",
      "args": ["/absolute/path/to/testrails-mcp-server/build/index.js"],
      "env": {
        "TESTRAILS_URL": "https://your-testrails-instance.testrail.io",
        "TESTRAILS_USERNAME": "your-email@company.com",
        "TESTRAILS_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## For VS Code with GitHub Copilot

The `.vscode/mcp.json` file is already configured. Update the environment variables:

```json
{
  "servers": {
    "testrails-mcp-server": {
      "type": "stdio",
      "command": "node",
      "args": ["build/index.js"],
      "env": {
        "TESTRAILS_URL": "https://your-testrails-instance.testrail.io",
        "TESTRAILS_USERNAME": "your-email@company.com",
        "TESTRAILS_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Environment Variables

Instead of hardcoding in the configuration, you can use a `.env` file:

1. Copy `.env.example` to `.env`
2. Fill in your TestRails details
3. The server will automatically load these variables

## Testing the Server

You can test the server directly:

```bash
# Build the project
npm run build

# Run the server (it will listen on stdio)
npm start
```

For development with auto-rebuild:
```bash
npm run dev
```
